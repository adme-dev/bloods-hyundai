/**
 * Server-side plugin to preload vehicle data into Nuxt payload
 * This ensures vehicle data is always available globally via SSR hydration
 * and never exposed via client-side network requests
 */

const CACHE_KEY = 'carsales-feed-data';

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only run on server
  if (!import.meta.server) return;

  // Skip if data already exists in payload
  if (nuxtApp.payload?.data?.[CACHE_KEY]) return;

  try {
    // Fetch vehicle data server-side
    const response = await $fetch<{ vehiclesData: any[]; filters: any }>('/api/carsales-feed');

    // Store in Nuxt payload for client hydration
    nuxtApp.payload.data = nuxtApp.payload.data || {};
    nuxtApp.payload.data[CACHE_KEY] = {
      vehiclesData: response.vehiclesData || [],
      filters: response.filters || [],
    };
  } catch (error) {
    console.error('[vehicles-data.server] Failed to preload vehicle data:', error);
  }
});
