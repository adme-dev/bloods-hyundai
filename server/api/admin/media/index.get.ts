/**
 * Media Library List API
 * GET /api/admin/media
 *
 * Lists all media files for the current dealer
 */

import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';
import { listMediaFromR2, isR2Configured } from '../../../utils/r2';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
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

    // Get query parameters
    const query = getQuery(event);
    const category = query.category as 'logos' | 'images' | 'documents' | undefined;
    const maxKeys = parseInt(query.limit as string) || 100;
    const continuationToken = query.cursor as string | undefined;

    // List files from R2
    const result = await listMediaFromR2({
      dealerSlug: dealer.slug,
      category,
      maxKeys,
      continuationToken,
    });

    return {
      success: true,
      files: result.files,
      pagination: {
        nextCursor: result.nextContinuationToken,
        hasMore: result.isTruncated,
        count: result.totalCount,
      },
    };
  } catch (error: any) {
    console.error('Failed to list media:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to list media files',
    });
  }
});
