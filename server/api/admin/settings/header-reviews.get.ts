import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';

export default defineEventHandler(async (event) => {
  // Auth check
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  try {
    const [dealer] = await db
      .select({ settings: dealers.settings })
      .from(dealers)
      .where(eq(dealers.id, user.dealerId))
      .limit(1);

    if (!dealer) {
      throw createError({ statusCode: 404, message: 'Dealer not found' });
    }

    const settings = (dealer.settings as Record<string, any>) || {};
    const headerReviews = settings.headerReviews || { enabled: false };

    return {
      success: true,
      settings: {
        enabled: headerReviews.enabled ?? false,
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error('Error fetching header reviews settings:', error);
    throw createError({ statusCode: 500, message: 'Failed to fetch header reviews settings' });
  }
});
