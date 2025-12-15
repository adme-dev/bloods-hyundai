/**
 * Media Upload API
 * POST /api/admin/media/upload
 *
 * Uploads a file to the media library
 */

import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';
import { uploadToR2, isR2Configured } from '../../../utils/r2';

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
      message: 'File storage is not configured',
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

    // Parse multipart form data
    const formData = await readMultipartFormData(event);

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No file uploaded',
      });
    }

    // Find the file and category in the form data
    const fileField = formData.find((field) => field.name === 'file');
    const categoryField = formData.find((field) => field.name === 'category');

    if (!fileField || !fileField.data) {
      throw createError({
        statusCode: 400,
        message: 'No file found in upload',
      });
    }

    const filename = fileField.filename || 'file';
    const contentType = fileField.type || 'application/octet-stream';
    const category = (categoryField?.data?.toString() || 'images') as 'logos' | 'images' | 'documents';

    // Validate category
    if (!['logos', 'images', 'documents'].includes(category)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid category. Must be: logos, images, or documents',
      });
    }

    // Upload to R2
    const result = await uploadToR2({
      dealerSlug: dealer.slug,
      category,
      filename,
      contentType,
      data: fileField.data,
      metadata: {
        'uploaded-by': user.id,
        'uploaded-by-email': user.email,
      },
    });

    return {
      success: true,
      message: 'File uploaded successfully',
      file: {
        key: result.key,
        url: result.url,
        filename: result.filename,
        size: result.size,
        contentType: result.contentType,
        category,
      },
    };
  } catch (error: any) {
    console.error('Media upload failed:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to upload file',
    });
  }
});
