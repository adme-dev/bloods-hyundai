/**
 * GET /api/hyundai-offers/hero-banner
 * Lightweight endpoint for the current Hyundai offers hero creative.
 */
import { extractHeroBanners } from '../../utils/hyundaiOffers';

const HYUNDAI_OFFERS_URL = 'https://www.hyundai.com/au/en/offers';
const CACHE_MAX_AGE = 60 * 15;
const CACHE_STALE_MAX_AGE = 60 * 60;

export default defineCachedEventHandler(async (event) => {
  const refreshRequested = getQuery(event).refresh === 'true';
  const headers = {
    'Cache-Control': refreshRequested
      ? 'no-store, max-age=0'
      : 'public, max-age=900, stale-while-revalidate=3600',
    'Content-Type': 'application/json',
  };

  try {
    const html = await $fetch<string>(HYUNDAI_OFFERS_URL, {
      timeout: 3000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-AU,en;q=0.9',
      },
    });

    const banners = extractHeroBanners(html);

    setResponseHeaders(event, headers);

    return {
      heroBanner: banners.desktop,
      desktop: banners.desktop,
      mobile: banners.mobile,
      _timestamp: Date.now(),
      _cache_bypassed: refreshRequested,
    };
  } catch (error: any) {
    console.warn('[hyundai-offers/hero-banner] fetch error:', error?.message || error);

    setResponseHeaders(event, {
      ...headers,
      'Cache-Control': refreshRequested
        ? 'no-store, max-age=0'
        : 'public, max-age=300, stale-while-revalidate=1800',
    });

    // Keep the route resilient for UI stability even when Hyundai blocks scraping.
    return {
      heroBanner: null,
      desktop: null,
      mobile: null,
      _timestamp: Date.now(),
      _cache_bypassed: refreshRequested,
      _error: true,
    };
  }
}, {
  maxAge: CACHE_MAX_AGE,
  staleMaxAge: CACHE_STALE_MAX_AGE,
  name: 'hyundai-offers-hero-banner',
  getKey: () => 'hyundai-offers-hero-banner',
  shouldBypassCache: (event) => getQuery(event).refresh === 'true',
});
