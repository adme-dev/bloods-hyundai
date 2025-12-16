import { eq, sql } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  // Only admins, dealer_admins, and managers can update service booking settings
  if (!['admin', 'dealer_admin', 'manager'].includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: 'Insufficient permissions',
    });
  }

  const body = await readBody(event);

  // Validate the input
  const { useExternalBooking, externalBookingIframe, externalBookingProvider } = body;

  // Validate iframe URL if external booking is enabled
  if (useExternalBooking && externalBookingIframe) {
    // Basic iframe src validation - should be a valid URL or contain iframe HTML
    const iframeSrc = externalBookingIframe.trim();

    // Check if it's a URL or contains iframe HTML
    const isUrl = /^https?:\/\//i.test(iframeSrc);
    const isIframeHtml = /<iframe[^>]*src\s*=\s*["'][^"']+["'][^>]*>/i.test(iframeSrc);

    if (!isUrl && !isIframeHtml) {
      throw createError({
        statusCode: 400,
        message: 'Invalid iframe URL or HTML. Please provide a valid URL (starting with https://) or iframe embed code.',
      });
    }

    // Security: Block javascript: and data: URLs
    if (/^(javascript|data):/i.test(iframeSrc)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid URL protocol. Only https:// URLs are allowed.',
      });
    }
  }

  try {
    // Get current settings first
    const [currentDealer] = await db
      .select({ settings: dealers.settings })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!currentDealer) {
      throw createError({
        statusCode: 404,
        message: 'Dealer not found',
      });
    }

    // Merge service booking settings into existing settings
    const currentSettings = (currentDealer.settings as Record<string, any>) || {};
    const updatedSettings = {
      ...currentSettings,
      serviceBooking: {
        useExternalBooking: !!useExternalBooking,
        externalBookingIframe: useExternalBooking ? (externalBookingIframe?.trim() || null) : null,
        externalBookingProvider: externalBookingProvider?.trim() || null,
      },
    };

    // Update the dealer settings
    await db
      .update(dealers)
      .set({
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(dealers.id, dealerId));

    return {
      success: true,
      message: 'Service booking settings updated successfully',
      settings: updatedSettings.serviceBooking,
    };
  } catch (error: any) {
    console.error('Error updating service booking settings:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to update service booking settings',
    });
  }
});
