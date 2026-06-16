import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';

export default defineEventHandler(async (event) => {
  // Auth check
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody(event);

  try {
    // Fetch current settings
    const [dealer] = await db
      .select({ settings: dealers.settings })
      .from(dealers)
      .where(eq(dealers.id, user.dealerId))
      .limit(1);

    if (!dealer) {
      throw createError({ statusCode: 404, message: 'Dealer not found' });
    }

    const currentSettings = (dealer.settings as Record<string, any>) || {};

    const updatedSettings = {
      ...currentSettings,
      headerReviews: {
        enabled: body.enabled ?? false,
      },
    };

    await db
      .update(dealers)
      .set({ settings: updatedSettings })
      .where(eq(dealers.id, user.dealerId));

    return {
      success: true,
      message: 'Header reviews settings updated successfully',
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error('Error updating header reviews settings:', error);
    throw createError({ statusCode: 500, message: 'Failed to update header reviews settings' });
  }
});
