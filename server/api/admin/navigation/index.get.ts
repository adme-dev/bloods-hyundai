import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';
import { buildAdminNavigationResponse, dealerNavigationDefaults } from '../../../utils/adminNavigation';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  try {
    const [dealer] = await db
      .select({
        id: dealers.id,
        websiteUrl: dealers.websiteUrl,
        settings: dealers.settings,
      })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!dealer) {
      throw createError({ statusCode: 404, message: 'Dealer not found' });
    }

    const settings = (dealer.settings as Record<string, any>) || {};
    return buildAdminNavigationResponse(settings.navigation, dealerNavigationDefaults(dealer));
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error('Error fetching navigation settings:', error);
    throw createError({ statusCode: 500, message: 'Failed to fetch navigation settings' });
  }
});
