import { eq } from 'drizzle-orm';
import { dbHttp as db } from '../utils/db';
import { dealers } from '../database/schema';

/**
 * Public API endpoint to get header settings.
 * Used by the site header (TopBar) to determine whether to show the
 * "Google Reviews" link. Defaults to disabled.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const dealerSlug = config.public.dealerSlug || 'bloods-hyundai';

  try {
    const [dealer] = await db
      .select({ settings: dealers.settings })
      .from(dealers)
      .where(eq(dealers.slug, dealerSlug))
      .limit(1);

    const settings = (dealer?.settings as Record<string, any>) || {};
    const headerReviews = settings.headerReviews || {};

    return {
      success: true,
      settings: {
        // Show the header "Google Reviews" link — disabled by default.
        reviewsEnabled: headerReviews.enabled ?? false,
      },
    };
  } catch (error: any) {
    console.error('Error fetching header settings:', error);
    return {
      success: true,
      settings: {
        reviewsEnabled: false,
      },
    };
  }
});
