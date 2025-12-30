/**
 * GET /api/site-config
 * Fetches site configuration from CDN with local fallback for development
 *
 * Features:
 * - 10-minute server-side cache (hidden from browser network tab when using SSR)
 * - Automatic cache invalidation with ?refresh=true
 * - Stale-while-revalidate for better performance
 * - Local fallback for development when CDN is unreachable
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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

// Try to load local fallback config for development
function loadLocalFallback(): SiteConfig | null {
  try {
    // Try multiple possible locations for the fallback file
    const possiblePaths = [
      join(process.cwd(), 'server/data/site-config.json'),
      join(process.cwd(), '.nuxt/dev/server/data/site-config.json'),
    ];

    for (const fallbackPath of possiblePaths) {
      if (existsSync(fallbackPath)) {
        const data = readFileSync(fallbackPath, 'utf-8');
        const config = JSON.parse(data);
        console.log('[Site Config] Loaded local fallback from:', fallbackPath);
        return config;
      }
    }
    return null;
  } catch (error: any) {
    console.warn('[Site Config] Could not load local fallback:', error.message);
    return null;
  }
}

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
    // Try local fallback first
    const localConfig = loadLocalFallback();
    return {
      config: localConfig || defaultConfig,
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
      timeout: 5000, // 5 second timeout for faster fallback
    });

    console.log('[Site Config] Successfully fetched config for:', data?.name || 'unknown');

    return {
      config: data,
      _cached: false,
      _timestamp: Date.now(),
    };
  } catch (error: any) {
    console.warn('[Site Config] CDN fetch failed:', error.message);

    // Try local fallback for development
    const localConfig = loadLocalFallback();
    if (localConfig) {
      console.log('[Site Config] Using local fallback config');
      return {
        config: localConfig,
        _cached: false,
        _timestamp: Date.now(),
        _source: 'local-fallback',
      };
    }

    console.error('[Site Config] No fallback available, using defaults');
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
