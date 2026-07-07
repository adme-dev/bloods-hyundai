import { eq } from 'drizzle-orm';
import { dbHttp as db } from '../utils/db';
import { dealers } from '../database/schema';
import { resolveDealerSlug } from '../utils/tenant';

/**
 * Public API endpoint to get service booking settings
 * Used by the frontend ServiceForm component to determine
 * whether to show internal form or external iframe
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Get dealer slug from the current host, falling back to config/env defaults
  const dealerSlug = resolveDealerSlug(event, config.public.dealerSlug || process.env.DEALER_SLUG || 'blood-hyundai');

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
          useExternalBooking: false,
          externalBookingIframe: null,
          externalBookingProvider: null,
        },
      };
    }

    // Extract service booking settings
    const settings = dealer.settings as Record<string, any> || {};
    const serviceBookingSettings = {
      useExternalBooking: settings.serviceBooking?.useExternalBooking ?? false,
      externalBookingIframe: settings.serviceBooking?.externalBookingIframe ?? null,
      externalBookingProvider: settings.serviceBooking?.externalBookingProvider ?? null,
    };

    return {
      success: true,
      settings: serviceBookingSettings,
    };
  } catch (error: any) {
    console.error('Error fetching service booking settings:', error);
    // Return default settings on error
    return {
      success: true,
      settings: {
        useExternalBooking: false,
        externalBookingIframe: null,
        externalBookingProvider: null,
      },
    };
  }
});
