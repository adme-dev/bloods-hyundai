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
    const popupSettings = settings.popup || {
      enabled: false,
      iframeUrl: '',
      title: 'Apply for Finance',
      displayMode: 'all', // 'all' | 'specific'
      specificPages: [], // Array of page paths
      startDate: null,
      endDate: null,
      showOncePerSession: true,
      delaySeconds: 3,
    };

    return {
      success: true,
      settings: popupSettings,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error('Error fetching popup settings:', error);
    throw createError({ statusCode: 500, message: 'Failed to fetch popup settings' });
  }
});
