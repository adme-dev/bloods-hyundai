/**
 * Server-side plugin to preload vehicle data into Nuxt payload
 *
 * PERFORMANCE OPTIMIZATION:
 * - Only preloads on routes that need full vehicle data (car-sales, vehicle pages)
 * - Homepage uses lightweight /api/homepage-filters endpoint instead (~5KB vs 700KB)
 * - This reduces homepage SSR payload by 99%
 */

import { useRequestHeaders } from '#app';
import { getRuntimeTenantCacheKey } from '~/utils/tenantCacheKey';

const CACHE_KEY = 'carsales-feed-data';

// Routes that need full vehicle data preloaded
const ROUTES_NEEDING_FULL_DATA = [
  '/car-sales',
  '/vehicle-for-sale',
  '/cars-for-sale',
  '/favorites',
];

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only run on server
  if (!import.meta.server) return;

  const tenantCacheKey = getRuntimeTenantCacheKey(CACHE_KEY);

  // Skip if data already exists in payload
  if (nuxtApp.payload?.data?.[tenantCacheKey]) return;

  // Check if current route needs full vehicle data
  const route = nuxtApp.ssrContext?.url || '';
  const needsFullData = ROUTES_NEEDING_FULL_DATA.some(prefix => route.startsWith(prefix));

  if (!needsFullData) {
    // Skip preloading for homepage and other pages - they use /api/homepage-filters
    return;
  }

  try {
    // Fetch vehicle data server-side
    const headers = useRequestHeaders(['host', 'x-forwarded-host', 'x-forwarded-proto']);
    const response = await $fetch<{ vehiclesData: any[]; filters: any }>('/api/carsales-feed', {
      headers: {
        ...headers,
        Accept: 'application/json',
      },
    });

    // Store in Nuxt payload for client hydration
    nuxtApp.payload.data = nuxtApp.payload.data || {};
    nuxtApp.payload.data[tenantCacheKey] = {
      vehiclesData: response.vehiclesData || [],
      filters: response.filters || [],
    };
  } catch (error) {
    console.error('[vehicles-data.server] Failed to preload vehicle data:', error);
  }
});
