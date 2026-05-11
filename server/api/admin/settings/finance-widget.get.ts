import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';

export interface FinanceWidgetSettings {
  useFinanceWidget: boolean;
  financeWidgetIframe: string | null;
  financeWidgetProvider: string | null;
}

/**
 * Admin API endpoint to get finance widget settings
 * GET /api/admin/settings/finance-widget
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  try {
    const [dealer] = await db
      .select({
        settings: dealers.settings,
      })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!dealer) {
      throw createError({
        statusCode: 404,
        message: 'Dealer not found',
      });
    }

    // Extract finance widget settings from dealer settings
    const settings = dealer.settings as Record<string, any> || {};
    const financeWidgetSettings: FinanceWidgetSettings = {
      useFinanceWidget: settings.financeWidget?.useFinanceWidget ?? false,
      financeWidgetIframe: settings.financeWidget?.financeWidgetIframe ?? null,
      financeWidgetProvider: settings.financeWidget?.financeWidgetProvider ?? null,
    };

    return {
      success: true,
      settings: financeWidgetSettings,
    };
  } catch (error: any) {
    console.error('Error fetching finance widget settings:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch finance widget settings',
    });
  }
});
