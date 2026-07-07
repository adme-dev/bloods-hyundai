import { DEFAULT_DEALER_SLUG, resolveDealerSlug, resolveTenantCacheKey } from '../utils/tenant';
import { buildTenantCdnUrls } from '../utils/tenant-cdn';

const CACHE_MAX_AGE = 60 * 10;
const CACHE_STALE_MAX_AGE = 60 * 30;

export default defineCachedEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const fallbackSlug = config.public.dealerSlug || process.env.DEALER_SLUG || DEFAULT_DEALER_SLUG;
  const dealerSlug = resolveDealerSlug(event, fallbackSlug);

  if (!config.public.cdnUrl) {
    return null;
  }

  for (const url of buildTenantCdnUrls(config.public.cdnUrl, dealerSlug, 'brand/brand.json')) {
    try {
      return await $fetch(url, {
        headers: { Accept: 'application/json' },
        timeout: 5000,
      });
    } catch (error: any) {
      console.warn('[Brand API] CDN fetch failed for', url, '-', error?.message);
    }
  }

  return null;
}, {
  maxAge: CACHE_MAX_AGE,
  staleMaxAge: CACHE_STALE_MAX_AGE,
  name: 'brand',
  getKey: (event) => resolveTenantCacheKey(event, 'brand'),
  shouldBypassCache: (event) => getQuery(event).refresh === 'true',
});
