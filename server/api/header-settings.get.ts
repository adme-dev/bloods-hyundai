import { eq } from 'drizzle-orm';
import { dbHttp as db } from '../utils/db';
import { dealers } from '../database/schema';
import { DEFAULT_DEALER_SLUG, resolveDealerSlug, resolveTenantCacheKey } from '../utils/tenant';

/**
 * Public API endpoint to get header settings.
 * Used by the site header (TopBar) to determine whether to show the
 * "Google Reviews" link. Defaults to disabled.
 */
const CACHE_MAX_AGE = 60 * 10;
const CACHE_STALE_MAX_AGE = 60 * 30;

export default defineCachedEventHandler(async (event) => {
  const refreshRequested = getQuery(event).refresh === 'true';

  setResponseHeaders(event, {
    'Cache-Control': refreshRequested
      ? 'no-store, max-age=0'
      : 'public, max-age=600, stale-while-revalidate=1800',
    'Content-Type': 'application/json',
    Vary: 'Host',
  });

  const config = useRuntimeConfig();
  const fallbackSlug = config.public.dealerSlug || process.env.DEALER_SLUG || DEFAULT_DEALER_SLUG;
  const dealerSlug = resolveDealerSlug(event, fallbackSlug);

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
}, {
  maxAge: CACHE_MAX_AGE,
  staleMaxAge: CACHE_STALE_MAX_AGE,
  name: 'header-settings',
  getKey: (event) => resolveTenantCacheKey(event, 'header-settings-v1'),
  shouldBypassCache: (event) => getQuery(event).refresh === 'true',
});
