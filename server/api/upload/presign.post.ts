/**
 * Public Presigned URL API Endpoint
 * POST /api/upload/presign
 *
 * Generates presigned URLs for direct browser-to-R2 uploads
 * Used by public forms like sell-my-car
 *
 * Authentication: X-Dealer-Key header (API key)
 */

import { eq } from 'drizzle-orm';
import { db } from '../../utils/db';
import { dealers } from '../../database/schema';
import { generatePresignedUploadUrl, isR2Configured } from '../../utils/r2';

interface PresignRequest {
  filename: string;
  contentType: string;
  category?: 'images' | 'documents';
}

export default defineEventHandler(async (event) => {
  // Validate API key from header
  const apiKey = getHeader(event, 'x-dealer-key');

  if (!apiKey) {
    throw createError({
      statusCode: 401,
      message: 'Missing API key. Please provide X-Dealer-Key header.',
    });
  }

  // Find dealer by API key
  const [dealer] = await db
    .select({ id: dealers.id, slug: dealers.slug, isActive: dealers.isActive })
    .from(dealers)
    .where(eq(dealers.apiKey, apiKey))
    .limit(1);

  if (!dealer) {
    throw createError({
      statusCode: 401,
      message: 'Invalid API key.',
    });
  }

  if (!dealer.isActive) {
    throw createError({
      statusCode: 403,
      message: 'Dealer account is inactive.',
    });
  }

  // Check if R2 is configured
  if (!isR2Configured()) {
    throw createError({
      statusCode: 503,
      message: 'File storage is not configured.',
    });
  }

  const body = await readBody<PresignRequest>(event);

  if (!body.filename || !body.contentType) {
    throw createError({
      statusCode: 400,
      message: 'filename and contentType are required',
    });
  }

  // Only allow images and documents for public uploads
  const category = body.category || 'images';

  if (!['images', 'documents'].includes(category)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid category. Must be: images or documents',
    });
  }

  // Validate content type for images
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedDocTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  const allowedTypes = category === 'images' ? allowedImageTypes : allowedDocTypes;

  if (!allowedTypes.includes(body.contentType)) {
    throw createError({
      statusCode: 400,
      message: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    });
  }

  try {
    // Generate presigned URL
    const result = await generatePresignedUploadUrl(
      dealer.slug,
      category,
      body.filename,
      body.contentType,
      900 // 15 minute expiry for public uploads
    );

    return {
      success: true,
      uploadUrl: result.uploadUrl,
      key: result.key,
      publicUrl: result.publicUrl,
      expiresIn: 900,
    };
  } catch (error: any) {
    console.error('[Public Presign] URL generation failed:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate upload URL',
    });
  }
});
