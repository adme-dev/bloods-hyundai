/**
 * Logo Upload API Endpoint
 * POST /api/admin/upload/logo
 *
 * Handles dealer logo uploads to Cloudflare R2
 * Multi-tenant: Files are stored under dealer-specific paths
 */

import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';
import { uploadToR2, isR2Configured, deleteFromR2, extractKeyFromUrl } from '../../../utils/r2';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  // Only admins, dealer_admins, and managers can upload logos
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

  try {
    // Get dealer info for the slug
    const [dealer] = await db
      .select({ slug: dealers.slug, logoUrl: dealers.logoUrl })
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

    // Find the file in the form data
    const fileField = formData.find((field) => field.name === 'file' || field.name === 'logo');

    if (!fileField || !fileField.data) {
      throw createError({
        statusCode: 400,
        message: 'No file found in upload',
      });
    }

    const filename = fileField.filename || 'logo.png';
    const contentType = fileField.type || 'image/png';

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowedTypes.includes(contentType)) {
      throw createError({
        statusCode: 400,
        message: `Invalid file type: ${contentType}. Allowed: PNG, JPEG, WebP, SVG, GIF`,
      });
    }

    // Validate file size (2MB max for logos)
    const maxSize = 2 * 1024 * 1024;
    if (fileField.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        message: `File too large: ${(fileField.data.length / 1024 / 1024).toFixed(2)}MB. Maximum: 2MB`,
      });
    }

    // Delete old logo if exists
    if (dealer.logoUrl) {
      const oldKey = extractKeyFromUrl(dealer.logoUrl);
      if (oldKey) {
        await deleteFromR2(oldKey).catch((err) => {
          console.warn('Failed to delete old logo:', err);
        });
      }
    }

    // Upload new logo
    const result = await uploadToR2({
      dealerSlug: dealer.slug,
      category: 'logos',
      filename,
      contentType,
      data: fileField.data,
      metadata: {
        'uploaded-by': user.id,
        'uploaded-by-email': user.email,
      },
    });

    // Update dealer's logoUrl in database
    await db
      .update(dealers)
      .set({
        logoUrl: result.url,
        updatedAt: new Date(),
      })
      .where(eq(dealers.id, dealerId));

    return {
      success: true,
      message: 'Logo uploaded successfully',
      logoUrl: result.url,
      filename: result.filename,
      size: result.size,
    };
  } catch (error: any) {
    console.error('Logo upload failed:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to upload logo',
    });
  }
});
