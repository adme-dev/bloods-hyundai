import { eq } from 'drizzle-orm';
import { db } from '../utils/db';
import { dealers } from '../database/schema';

/**
 * Public API endpoint to get finance widget settings
 * Used by frontend components (VehicleEnquiryForm, Finance page) to determine
 * whether to show internal form or external finance widget iframe
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Get dealer slug from config or default
  const dealerSlug = config.public.dealerSlug || 'bloods-hyundai';

  try {
    const [dealer] = await db
      .select({
        settings: dealers.settings,
      })
      .from(dealers)
      .where(eq(dealers.slug, dealerSlug))
      .limit(1);

    if (!dealer) {
      // Return default settings if dealer not found
      return {
        success: true,
        settings: {
          useFinanceWidget: false,
          financeWidgetIframe: null,
          financeWidgetProvider: null,
        },
      };
    }

    // Extract finance widget settings
    const settings = dealer.settings as Record<string, any> || {};
    const financeWidgetSettings = {
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
    // Return default settings on error
    return {
      success: true,
      settings: {
        useFinanceWidget: false,
        financeWidgetIframe: null,
        financeWidgetProvider: null,
      },
    };
  }
});
