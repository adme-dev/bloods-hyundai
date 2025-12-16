import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';

export interface ServiceBookingSettings {
  useExternalBooking: boolean;
  externalBookingIframe: string | null;
  externalBookingProvider: string | null; // e.g., 'xtime', 'custom'
}

const DEFAULT_SETTINGS: ServiceBookingSettings = {
  useExternalBooking: false,
  externalBookingIframe: null,
  externalBookingProvider: null,
};

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

    // Extract service booking settings from the general settings JSON
    const settings = dealer.settings as Record<string, any> || {};
    const serviceBookingSettings: ServiceBookingSettings = {
      useExternalBooking: settings.serviceBooking?.useExternalBooking ?? DEFAULT_SETTINGS.useExternalBooking,
      externalBookingIframe: settings.serviceBooking?.externalBookingIframe ?? DEFAULT_SETTINGS.externalBookingIframe,
      externalBookingProvider: settings.serviceBooking?.externalBookingProvider ?? DEFAULT_SETTINGS.externalBookingProvider,
    };

    return {
      success: true,
      settings: serviceBookingSettings,
    };
  } catch (error: any) {
    console.error('Error fetching service booking settings:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch service booking settings',
    });
  }
});
