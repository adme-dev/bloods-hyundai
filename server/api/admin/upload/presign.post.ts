/**
 * Presigned URL API Endpoint
 * POST /api/admin/upload/presign
 *
 * Generates presigned URLs for direct browser-to-R2 uploads
 * Multi-tenant: Files are stored under dealer-specific paths
 */

import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';
import { generatePresignedUploadUrl, isR2Configured } from '../../../utils/r2';

interface PresignRequest {
  filename: string;
  contentType: string;
  category?: 'logos' | 'images' | 'documents';
}

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  // Only admins, dealer_admins, and managers can upload
  if (!['admin', 'dealer_admin', 'manager'].includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: 'Insufficient permissions',
    });
  }

  // Check if R2 is configured
  if (!isR2Configured()) {
    throw createError({
      statusCode: 503,
      message: 'File storage is not configured. Please contact support.',
    });
  }

  const body = await readBody<PresignRequest>(event);

  if (!body.filename || !body.contentType) {
    throw createError({
      statusCode: 400,
      message: 'filename and contentType are required',
    });
  }

  const category = body.category || 'images';

  // Validate category
  if (!['logos', 'images', 'documents'].includes(category)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid category. Must be: logos, images, or documents',
    });
  }

  try {
    // Get dealer slug
    const [dealer] = await db
      .select({ slug: dealers.slug })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!dealer) {
      throw createError({
        statusCode: 404,
        message: 'Dealer not found',
      });
    }

    // Generate presigned URL
    const result = await generatePresignedUploadUrl(
      dealer.slug,
      category,
      body.filename,
      body.contentType,
      3600 // 1 hour expiry
    );

    return {
      success: true,
      uploadUrl: result.uploadUrl,
      key: result.key,
      publicUrl: result.publicUrl,
      expiresIn: 3600,
    };
  } catch (error: any) {
    console.error('Presign URL generation failed:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate upload URL',
    });
  }
});
