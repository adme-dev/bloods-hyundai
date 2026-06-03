import { eq } from 'drizzle-orm';
import { dbHttp as db } from '../utils/db';
import { dealers } from '../database/schema';

type VehicleCondition = 'new' | 'used' | 'demo';
const DEFAULT_CONDITIONS: VehicleCondition[] = ['new', 'used', 'demo'];

/**
 * Public API endpoint to get finance widget settings
 * Used by frontend components (VehicleEnquiryForm, Finance page) to determine
 * whether to show internal form or external finance widget iframe
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const dealerSlug = config.public.dealerSlug || 'bloods-hyundai';

  const fallback = {
    success: true as const,
    settings: {
      useFinanceWidget: false,
      financeWidgetIframe: null as string | null,
      financeWidgetProvider: null as string | null,
      enabledConditions: DEFAULT_CONDITIONS,
    },
  };

  try {
    const [dealer] = await db
      .select({
        settings: dealers.settings,
      })
      .from(dealers)
      .where(eq(dealers.slug, dealerSlug))
      .limit(1);

    if (!dealer) return fallback;

    const settings = (dealer.settings as Record<string, any>) || {};
    const stored = settings.financeWidget ?? {};
    const storedConditions: unknown = stored.enabledConditions;
    const enabledConditions: VehicleCondition[] = Array.isArray(storedConditions)
      ? storedConditions.filter((c): c is VehicleCondition =>
          c === 'new' || c === 'used' || c === 'demo'
        )
      : DEFAULT_CONDITIONS;

    return {
      success: true,
      settings: {
        useFinanceWidget: stored.useFinanceWidget ?? false,
        financeWidgetIframe: stored.financeWidgetIframe ?? null,
        financeWidgetProvider: stored.financeWidgetProvider ?? null,
        enabledConditions: enabledConditions.length > 0 ? enabledConditions : DEFAULT_CONDITIONS,
      },
    };
  } catch (error: any) {
    console.error('Error fetching finance widget settings:', error);
    return fallback;
  }
});
