/**
 * Media Delete API
 * DELETE /api/admin/media/:key
 *
 * Deletes a file from the media library
 */

import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';
import { deleteFromR2, isR2Configured } from '../../../utils/r2';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  // Only admins, dealer_admins, and managers can delete
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

    // Get the key from route params (URL encoded)
    const encodedKey = getRouterParam(event, 'key');
    if (!encodedKey) {
      throw createError({
        statusCode: 400,
        message: 'File key is required',
      });
    }

    // Decode the key (it may contain slashes which are encoded)
    const key = decodeURIComponent(encodedKey);

    // Security check: ensure the key belongs to this dealer
    if (!key.startsWith(`${dealer.slug}/`)) {
      throw createError({
        statusCode: 403,
        message: 'You can only delete files from your own media library',
      });
    }

    // Delete from R2
    const deleted = await deleteFromR2(key);

    if (!deleted) {
      throw createError({
        statusCode: 500,
        message: 'Failed to delete file',
      });
    }

    return {
      success: true,
      message: 'File deleted successfully',
      key,
    };
  } catch (error: any) {
    console.error('Media delete failed:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to delete file',
    });
  }
});
