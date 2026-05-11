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

    // Update popup settings
    const updatedSettings = {
      ...currentSettings,
      popup: {
        enabled: body.enabled ?? false,
        iframeUrl: body.iframeUrl || '',
        title: body.title || 'Apply for Finance',
        displayMode: body.displayMode || 'all',
        specificPages: body.specificPages || [],
        startDate: body.startDate || null,
        endDate: body.endDate || null,
        showOncePerSession: body.showOncePerSession ?? true,
        delaySeconds: body.delaySeconds ?? 3,
      },
    };

    // Save to database
    await db
      .update(dealers)
      .set({ settings: updatedSettings })
      .where(eq(dealers.id, user.dealerId));

    return {
      success: true,
      message: 'Popup settings updated successfully',
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error('Error updating popup settings:', error);
    throw createError({ statusCode: 500, message: 'Failed to update popup settings' });
  }
});
