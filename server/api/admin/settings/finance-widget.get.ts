import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';

export type VehicleCondition = 'new' | 'used' | 'demo';

export interface FinanceWidgetSettings {
  useFinanceWidget: boolean;
  financeWidgetIframe: string | null;
  financeWidgetProvider: string | null;
  enabledConditions: VehicleCondition[];
}

const DEFAULT_CONDITIONS: VehicleCondition[] = ['new', 'used', 'demo'];

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

    const settings = (dealer.settings as Record<string, any>) || {};
    const stored = settings.financeWidget ?? {};
    const storedConditions: unknown = stored.enabledConditions;
    const enabledConditions: VehicleCondition[] = Array.isArray(storedConditions)
      ? storedConditions.filter((c): c is VehicleCondition =>
          c === 'new' || c === 'used' || c === 'demo'
        )
      : DEFAULT_CONDITIONS;

    const financeWidgetSettings: FinanceWidgetSettings = {
      useFinanceWidget: stored.useFinanceWidget ?? false,
      financeWidgetIframe: stored.financeWidgetIframe ?? null,
      financeWidgetProvider: stored.financeWidgetProvider ?? null,
      enabledConditions: enabledConditions.length > 0 ? enabledConditions : DEFAULT_CONDITIONS,
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
