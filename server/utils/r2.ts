/**
 * Cloudflare R2 Storage Utility
 * Multi-tenant file storage with S3-compatible API
 *
 * Bucket structure:
 * - {bucket}/{dealer-slug}/logos/{filename}
 * - {bucket}/{dealer-slug}/images/{filename}
 * - {bucket}/{dealer-slug}/documents/{filename}
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Initialize R2 client
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (r2Client) return r2Client;

  const config = useRuntimeConfig();

  const accountId = config.cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = config.r2AccessKeyId || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = config.r2SecretAccessKey || process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 credentials not configured. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY');
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  console.log('✅ Cloudflare R2 client initialized');
  return r2Client;
}

function getBucketName(): string {
  const config = useRuntimeConfig();
  return config.r2BucketName || process.env.R2_BUCKET_NAME || 'dealer-assets';
}

function getPublicUrl(): string {
  const config = useRuntimeConfig();
  // R2 public URL can be custom domain or the R2.dev URL
  return config.r2PublicUrl || process.env.R2_PUBLIC_URL || '';
}

/**
 * Generate a unique filename with hash prefix
 */
function generateUniqueFilename(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'png';
  const hash = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  const sanitizedName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars
    .toLowerCase()
    .slice(0, 50); // Limit length

  return `${timestamp}-${hash}-${sanitizedName}.${ext}`;
}

/**
 * Get the storage key for a file
 */
function getStorageKey(dealerSlug: string, category: 'logos' | 'images' | 'documents', filename: string): string {
  return `${dealerSlug}/${category}/${filename}`;
}

/**
 * Allowed MIME types for different categories
 */
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  logos: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'],
  images: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  documents: ['application/pdf', 'image/png', 'image/jpeg'],
};

/**
 * Max file sizes in bytes for different categories
 */
const MAX_FILE_SIZES: Record<string, number> = {
  logos: 2 * 1024 * 1024, // 2MB
  images: 10 * 1024 * 1024, // 10MB
  documents: 20 * 1024 * 1024, // 20MB
};

export interface UploadOptions {
  dealerSlug: string;
  category: 'logos' | 'images' | 'documents';
  filename: string;
  contentType: string;
  data: Buffer | Uint8Array;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  success: boolean;
  key: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
}

/**
 * Upload a file to R2
 */
export async function uploadToR2(options: UploadOptions): Promise<UploadResult> {
  const { dealerSlug, category, filename, contentType, data, metadata } = options;

  // Validate MIME type
  const allowedTypes = ALLOWED_MIME_TYPES[category] || [];
  if (!allowedTypes.includes(contentType)) {
    throw new Error(`Invalid file type: ${contentType}. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Validate file size
  const maxSize = MAX_FILE_SIZES[category] || 10 * 1024 * 1024; // Default 10MB
  if (data.length > maxSize) {
    throw new Error(`File too large: ${(data.length / 1024 / 1024).toFixed(2)}MB. Maximum: ${maxSize / 1024 / 1024}MB`);
  }

  const client = getR2Client();
  const bucket = getBucketName();
  const uniqueFilename = generateUniqueFilename(filename);
  const key = getStorageKey(dealerSlug, category, uniqueFilename);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: contentType,
    Metadata: {
      'dealer-slug': dealerSlug,
      'original-filename': filename,
      'upload-timestamp': new Date().toISOString(),
      ...metadata,
    },
    // Cache for 1 year (logos don't change often)
    CacheControl: category === 'logos' ? 'public, max-age=31536000' : 'public, max-age=86400',
  });

  await client.send(command);

  // Construct public URL
  const publicBaseUrl = getPublicUrl();
  const url = publicBaseUrl ? `${publicBaseUrl}/${key}` : key;

  console.log(`✅ [R2] Uploaded: ${key} (${(data.length / 1024).toFixed(2)}KB)`);

  return {
    success: true,
    key,
    url,
    filename: uniqueFilename,
    size: data.length,
    contentType,
  };
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    const bucket = getBucketName();

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
    console.log(`✅ [R2] Deleted: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ [R2] Failed to delete: ${key}`, error);
    return false;
  }
}

/**
 * Check if a file exists in R2
 */
export async function existsInR2(key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    const bucket = getBucketName();

    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a presigned URL for direct browser upload
 * Useful for larger files to upload directly without going through the server
 */
export async function generatePresignedUploadUrl(
  dealerSlug: string,
  category: 'logos' | 'images' | 'documents',
  filename: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  // Validate MIME type
  const allowedTypes = ALLOWED_MIME_TYPES[category] || [];
  if (!allowedTypes.includes(contentType)) {
    throw new Error(`Invalid file type: ${contentType}. Allowed: ${allowedTypes.join(', ')}`);
  }

  const client = getR2Client();
  const bucket = getBucketName();
  const uniqueFilename = generateUniqueFilename(filename);
  const key = getStorageKey(dealerSlug, category, uniqueFilename);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    Metadata: {
      'dealer-slug': dealerSlug,
      'original-filename': filename,
      'upload-timestamp': new Date().toISOString(),
    },
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  const publicBaseUrl = getPublicUrl();
  const publicUrl = publicBaseUrl ? `${publicBaseUrl}/${key}` : key;

  return {
    uploadUrl,
    key,
    publicUrl,
  };
}

/**
 * Generate a presigned URL for reading a private file
 */
export async function generatePresignedReadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Extract the key from a full R2 URL
 */
export function extractKeyFromUrl(url: string): string | null {
  const publicBaseUrl = getPublicUrl();
  if (publicBaseUrl && url.startsWith(publicBaseUrl)) {
    return url.replace(`${publicBaseUrl}/`, '');
  }
  // If it's already just a key, return it
  if (url.includes('/') && !url.startsWith('http')) {
    return url;
  }
  return null;
}

/**
 * Check if R2 is configured and available
 */
export function isR2Configured(): boolean {
  try {
    const config = useRuntimeConfig();
    const accountId = config.cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = config.r2AccessKeyId || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = config.r2SecretAccessKey || process.env.R2_SECRET_ACCESS_KEY;

    return !!(accountId && accessKeyId && secretAccessKey);
  } catch {
    return false;
  }
}

export interface MediaFile {
  key: string;
  url: string;
  filename: string;
  size: number;
  lastModified: Date;
  category: 'logos' | 'images' | 'documents' | 'unknown';
  contentType?: string;
}

export interface ListMediaOptions {
  dealerSlug: string;
  category?: 'logos' | 'images' | 'documents';
  maxKeys?: number;
  continuationToken?: string;
}

export interface ListMediaResult {
  files: MediaFile[];
  nextContinuationToken?: string;
  isTruncated: boolean;
  totalCount: number;
}

/**
 * List files in R2 for a dealer
 */
export async function listMediaFromR2(options: ListMediaOptions): Promise<ListMediaResult> {
  const { dealerSlug, category, maxKeys = 100, continuationToken } = options;

  const client = getR2Client();
  const bucket = getBucketName();
  const publicBaseUrl = getPublicUrl();

  // Build prefix based on dealer and optional category
  const prefix = category ? `${dealerSlug}/${category}/` : `${dealerSlug}/`;

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
    MaxKeys: maxKeys,
    ContinuationToken: continuationToken,
  });

  const response = await client.send(command);

  const files: MediaFile[] = (response.Contents || []).map((obj) => {
    const key = obj.Key || '';
    const parts = key.split('/');
    const filename = parts[parts.length - 1] || '';
    const categoryFromKey = parts[1] as 'logos' | 'images' | 'documents' | 'unknown';

    // Determine content type from extension
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const contentTypeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
    };

    return {
      key,
      url: publicBaseUrl ? `${publicBaseUrl}/${key}` : key,
      filename,
      size: obj.Size || 0,
      lastModified: obj.LastModified || new Date(),
      category: ['logos', 'images', 'documents'].includes(categoryFromKey) ? categoryFromKey : 'unknown',
      contentType: contentTypeMap[ext],
    };
  });

  return {
    files,
    nextContinuationToken: response.NextContinuationToken,
    isTruncated: response.IsTruncated || false,
    totalCount: response.KeyCount || 0,
  };
}

/**
 * Get file metadata from R2
 */
export async function getFileMetadata(key: string): Promise<{ size: number; contentType: string; lastModified: Date; metadata: Record<string, string> } | null> {
  try {
    const client = getR2Client();
    const bucket = getBucketName();

    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await client.send(command);

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      lastModified: response.LastModified || new Date(),
      metadata: response.Metadata || {},
    };
  } catch {
    return null;
  }
}
