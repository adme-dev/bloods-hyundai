/**
 * GET /api/reviews
 * Fetches Google Reviews data from CDN with local fallback
 * Replaces: src/functions/fetchReviews.js
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Try to load local fallback reviews data for development
function loadLocalReviewsFallback(): any | null {
  try {
    const fallbackPath = join(process.cwd(), 'server/data/reviews/hours.json');
    if (existsSync(fallbackPath)) {
      const data = readFileSync(fallbackPath, 'utf-8');
      console.log('[Reviews API] Loaded local fallback');
      return JSON.parse(data);
    }
    return null;
  } catch (error: any) {
    console.warn('[Reviews API] Could not load local fallback:', error.message);
    return null;
  }
}

// Process reviews response into formatted output
function processReviewsResponse(response: any) {
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

  const reviews = (response.result.reviews || []).map((review: any) => ({
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
    rating: response.result.rating || 0,
    total_reviews: response.result.user_ratings_total || reviews.length,
    place_id: placeId,
    place_url: placeUrl,
  };
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // CDN URL for reviews (set via NUXT_PUBLIC_CDN_URL env var)
  const cdnUrl = config.public.cdnUrl;

  // Try CDN first
  if (cdnUrl) {
    try {
      // Fetch reviews from CDN (pre-cached from Google Places API)
      const response = await $fetch<any>(`${cdnUrl}/reviews/hours.json`, {
        timeout: 5000, // 5 second timeout for faster fallback
      });

      return processReviewsResponse(response);
    } catch (error: any) {
      console.warn('[Reviews API] CDN fetch failed, trying fallback:', error.message);
    }
  }

  // Try local fallback for development
  const localData = loadLocalReviewsFallback();
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
});









