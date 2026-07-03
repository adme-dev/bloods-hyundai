import { eq } from 'drizzle-orm';
import { dbHttp as db } from '../utils/db';
import { dealers } from '../database/schema';

/**
 * Public API endpoint to get popup settings
 * Used by frontend to determine if/when to show the auto-popup
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const dealerSlug = config.public.dealerSlug || 'blood-hyundai';

  try {
    const [dealer] = await db
      .select({ settings: dealers.settings })
      .from(dealers)
      .where(eq(dealers.slug, dealerSlug))
      .limit(1);

    if (!dealer) {
      return {
        success: true,
        settings: {
          enabled: false,
        },
      };
    }

    const settings = (dealer.settings as Record<string, any>) || {};
    const popupSettings = settings.popup || {
      enabled: false,
    };

    // Check date constraints
    const now = new Date();

    if (popupSettings.startDate) {
      const startDate = new Date(popupSettings.startDate);
      if (now < startDate) {
        return {
          success: true,
          settings: { enabled: false },
        };
      }
    }

    if (popupSettings.endDate) {
      const endDate = new Date(popupSettings.endDate);
      if (now > endDate) {
        return {
          success: true,
          settings: { enabled: false },
        };
      }
    }

    return {
      success: true,
      settings: {
        enabled: popupSettings.enabled ?? false,
        contentType: popupSettings.contentType || 'custom',
        iframeUrl: popupSettings.iframeUrl || null,
        title: popupSettings.title || 'Special Offer',
        htmlContent: popupSettings.htmlContent || null,
        imageUrl: popupSettings.imageUrl || null,
        buttonText: popupSettings.buttonText || null,
        buttonUrl: popupSettings.buttonUrl || null,
        displayMode: popupSettings.displayMode || 'all',
        specificPages: popupSettings.specificPages || [],
        showOncePerSession: popupSettings.showOncePerSession ?? true,
        cooldownMinutes: popupSettings.cooldownMinutes ?? 5,
        delaySeconds: popupSettings.delaySeconds ?? 3,
      },
    };
  } catch (error: any) {
    console.error('Error fetching popup settings:', error);
    return {
      success: true,
      settings: { enabled: false },
    };
  }
});
