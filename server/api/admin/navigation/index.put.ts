import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';
import {
  buildAdminNavigationResponse,
  canManageHyundaiNavigation,
  dealerNavigationDefaults,
  mergeDealerNavigationSettings,
} from '../../../utils/adminNavigation';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  if (!canManageHyundaiNavigation(user.role)) {
    throw createError({ statusCode: 403, message: 'Only admins and managers can publish navigation' });
  }

  const body = await readBody(event);
  if (!body?.navigation || typeof body.navigation !== 'object') {
    throw createError({ statusCode: 400, message: 'Navigation payload is required' });
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

    const updatedSettings = mergeDealerNavigationSettings(
      dealer.settings,
      body.navigation,
      user.userId || user.id || null,
    );

    await db
      .update(dealers)
      .set({
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(dealers.id, dealerId));

    return {
      success: true,
      ...buildAdminNavigationResponse(updatedSettings.navigation, dealerNavigationDefaults({
        ...dealer,
        settings: updatedSettings,
      })),
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error('Error updating navigation settings:', error);
    throw createError({ statusCode: 500, message: 'Failed to update navigation settings' });
  }
});
