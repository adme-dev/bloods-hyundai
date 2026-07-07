/**
 * GET /api/reviews
 * Fetches Google Reviews data from CDN with local fallback
 * Replaces: src/functions/fetchReviews.js
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DEFAULT_DEALER_SLUG, resolveDealerSlug, resolveTenantCacheKey } from '../utils/tenant';
import { buildTenantCdnUrls } from '../utils/tenant-cdn';

const REVIEWS_CACHE_MAX_AGE = 60 * 10; // 10 minutes
const REVIEWS_CACHE_STALE_MAX_AGE = 60 * 30; // 30 minutes

interface ProcessedReviewsResponse {
  reviews: Record<string, unknown>[];
  rating: number;
  total_reviews: number;
  place_id?: string;
  place_url?: string;
  _source?: string;
}

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = current;
  }
  return shuffled;
}

// Try to load local fallback reviews data for development
function localReviewsFallbackMatchesDealer(localData: any, dealerSlug: string): boolean {
  const name = String(localData?.result?.name || '').toLowerCase();
  if (name.includes('sale hyundai')) {
    return dealerSlug === 'sale-hyundai';
  }

  if (name.includes('blood hyundai')) {
    return dealerSlug === 'blood-hyundai';
  }

  return true;
}

function loadLocalReviewsFallback(dealerSlug: string): any | null {
  try {
    const fallbackPath = join(process.cwd(), 'server/data/reviews/hours.json');
    if (existsSync(fallbackPath)) {
      const data = readFileSync(fallbackPath, 'utf-8');
      const parsed = JSON.parse(data);
      if (!localReviewsFallbackMatchesDealer(parsed, dealerSlug)) {
        return null;
      }

      console.log('[Reviews API] Loaded local fallback');
      return parsed;
    }
    return null;
  } catch (error: any) {
    console.warn('[Reviews API] Could not load local fallback:', error.message);
    return null;
  }
}

// Process reviews response into formatted output
function processReviewsResponse(response: any): ProcessedReviewsResponse {
  if (!response?.result) {
    return {
      reviews: [],
      rating: 0,
      total_reviews: 0,
    };
  }

  const dealershipName = response.result.name || '';
  const placeId = response.result.place_id || '';

  // Google Maps URL that opens the dealership's place page (with reviews visible).
  // Uses Google's official Maps URL API (https://developers.google.com/maps/documentation/urls/get-started)
  // built from place_id — this reliably lands on the business listing and never
  // resolves to a directions/route view. Falls back to the place's `url` (a
  // `cid` link), then a bare maps URL.
  const placeUrl = placeId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        dealershipName || 'dealership'
      )}&query_place_id=${placeId}`
    : response.result.url || 'https://www.google.com/maps';

  const reviews: ProcessedReviewsResponse['reviews'] = ((response.result.reviews || []) as any[])
    // Only surface positive reviews (4 stars and above). Filtering here at the
    // source guarantees no consumer (homepage cards, footer, header, etc.) can
    // ever display a sub-4-star review.
    .filter((review: any) => (review.rating ?? 0) >= 4)
    .map((review: any) => ({
      dealership: dealershipName,
      author_name: review.author_name,
      author_url: review.author_url,
      rating: review.rating,
      text: review.text,
      time: review.time,
      relative_time_description: review.relative_time_description,
      profile_photo_url: review.profile_photo_url,
    }));

  // Shuffle reviews
  const shuffledReviews = shuffleArray(reviews);

  return {
    reviews: shuffledReviews,
    // Aggregate rating & count reflect Google's official listing (computed from
    // ALL reviews), independent of the 4-star+ display filter above.
    rating: response.result.rating || 0,
    total_reviews: response.result.user_ratings_total || 0,
    place_id: placeId,
    place_url: placeUrl,
  };
}

export default defineCachedEventHandler(async (event): Promise<ProcessedReviewsResponse> => {
  const config = useRuntimeConfig();
  const fallbackSlug = config.public.dealerSlug || process.env.DEALER_SLUG || DEFAULT_DEALER_SLUG;
  const dealerSlug = resolveDealerSlug(event, fallbackSlug);

  // CDN URL for reviews (set via NUXT_PUBLIC_CDN_URL env var)
  const cdnUrl = config.public.cdnUrl;

  // Try CDN first
  if (cdnUrl) {
    for (const url of buildTenantCdnUrls(cdnUrl, dealerSlug, 'reviews/hours.json')) {
      try {
        // Fetch reviews from CDN (pre-cached from Google Places API)
        const response = await $fetch<any>(url, {
          timeout: 5000, // 5 second timeout for faster fallback
        });

        return processReviewsResponse(response);
      } catch (error: any) {
        console.warn('[Reviews API] CDN fetch failed, trying fallback:', error.message);
      }
    }
  }

  // Try local fallback for development
  const localData = loadLocalReviewsFallback(dealerSlug);
  if (localData) {
    return {
      ...processReviewsResponse(localData),
      _source: 'local-fallback',
    };
  }

  // Return empty data if neither CDN nor fallback worked
  return {
    reviews: [],
    rating: 0,
    total_reviews: 0,
  };
}, {
  maxAge: REVIEWS_CACHE_MAX_AGE,
  staleMaxAge: REVIEWS_CACHE_STALE_MAX_AGE,
  name: 'reviews',
  getKey: (event) => resolveTenantCacheKey(event, 'google-reviews'),
});



