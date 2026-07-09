/**
 * SSR-only composable for fetching dealer/site configuration
 *
 * This composable fetches site config during SSR, meaning:
 * - Data is fetched on the server and hydrated to the client
 * - No network request is visible in browser DevTools
 * - 10-minute server-side cache for performance
 * - Host-scoped cache key across all pages for deduplication
 *
 * Usage:
 * const { config, pending } = await useDealerConfig()
 */

import { getRuntimeTenantCacheKey } from '~/utils/tenantCacheKey';

interface SiteConfig {
  name: string;
  promotional: any[];
  scripts: {
    google: {
      analytics: string[];
      gtm: string;
    };
    facebook?: {
      pageid: string;
    };
  };
  [key: string]: any;
}

interface SiteConfigResponse {
  config: SiteConfig;
  _cached?: boolean;
  _timestamp?: number;
}

// Shared base cache key - host suffix prevents cross-tenant payload reuse.
const CACHE_KEY = 'site-config-data:v3';

export const useDealerConfig = async () => {
  const cacheKey = getRuntimeTenantCacheKey(CACHE_KEY);
  const { data, status, refresh } = await useFetch<SiteConfigResponse>('/api/site-config', {
    key: cacheKey,
    dedupe: 'defer',
    // Return cached data on client - prevents network request
    getCachedData: (key, nuxtApp) => {
      return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
    },
  });

  return {
    data,
    refresh,
    pending: computed(() => status.value === 'pending'),
    error: computed(() => status.value === 'error'),
    config: computed(() => data.value?.config || null),
  };
};

/**
 * Force refresh the dealer config cache (bypasses 10-min server cache)
 * Useful for admin actions after config updates
 * Note: This will be visible in network tab as it's a manual refresh
 */
export const refreshDealerConfig = async () => {
  return await $fetch('/api/site-config?refresh=true');
};
