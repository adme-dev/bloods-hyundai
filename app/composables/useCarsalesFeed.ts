/**
 * SSR-only composable for fetching carsales feed data
 *
 * This composable fetches vehicle data during SSR, meaning:
 * - Data is fetched on the server and hydrated to the client
 * - No network request is visible in browser DevTools
 * - 10-minute server-side cache for performance
 * - Shared cache key across all pages for deduplication
 *
 * Usage:
 * const { vehicles, filters, pending } = await useCarsalesFeed()
 */

interface CarsalesFeedResponse {
  vehiclesData: any[];
  filters: any[];
  _cached?: boolean;
  _timestamp?: number;
}

// Shared cache key - ensures all pages share the same cached data
const CACHE_KEY = 'carsales-feed-data';

export const useCarsalesFeed = async () => {
  const { data, status, refresh } = await useFetch<CarsalesFeedResponse>('/api/carsales-feed', {
    key: CACHE_KEY,
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
    vehicles: computed(() => data.value?.vehiclesData || []),
    filters: computed(() => data.value?.filters || []),
  };
};

/**
 * Force refresh the carsales feed cache (bypasses 10-min server cache)
 * Useful for admin actions after vehicle updates
 * Note: This will be visible in network tab as it's a manual refresh
 */
export const refreshCarsalesFeed = async () => {
  return await $fetch('/api/carsales-feed?refresh=true');
};
