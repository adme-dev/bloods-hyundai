/**
 * GET /api/site-config
 * Fetches site configuration from CDN
 *
 * Features:
 * - 10-minute server-side cache (hidden from browser network tab when using SSR)
 * - Automatic cache invalidation with ?refresh=true
 * - Stale-while-revalidate for better performance
 */

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

// Cache configuration
const CACHE_MAX_AGE = 60 * 10; // 10 minutes
const CACHE_STALE_MAX_AGE = 60 * 30; // Serve stale for 30 minutes while revalidating

export default defineCachedEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Default config for when CDN is not available
  const defaultConfig: SiteConfig = {
    name: config.public.siteName || 'Sale Hyundai',
    promotional: [],
    scripts: { google: { analytics: [], gtm: '' } },
  };

  // Skip if CDN URL not configured
  if (!config.public.cdnUrl) {
    console.log('[Site Config] No CDN URL configured, using defaults');
    return {
      config: defaultConfig,
      _cached: false,
      _timestamp: Date.now(),
    };
  }

  try {
    const cdnUrl = `${config.public.cdnUrl}/config/config.json`;
    console.log('[Site Config] Fetching from:', cdnUrl);

    const data = await $fetch<SiteConfig>(cdnUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[Site Config] Successfully fetched config for:', data?.name || 'unknown');

    return {
      config: data,
      _cached: false,
      _timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error('[Site Config] Error fetching config:', error.message);
    return {
      config: defaultConfig,
      _cached: false,
      _timestamp: Date.now(),
    };
  }
}, {
  maxAge: CACHE_MAX_AGE,
  staleMaxAge: CACHE_STALE_MAX_AGE,
  name: 'site-config',
  getKey: () => 'site-config-data',
  shouldBypassCache: (event) => {
    // Allow cache bypass with ?refresh=true query param (for admin use)
    const query = getQuery(event);
    return query.refresh === 'true';
  },
});
