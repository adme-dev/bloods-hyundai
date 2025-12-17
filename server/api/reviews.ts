/**
 * GET /api/reviews
 * Fetches Google Reviews data from CDN
 * Replaces: src/functions/fetchReviews.js
 */

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // CDN URL for reviews (set via NUXT_PUBLIC_CDN_URL env var)
  const cdnUrl = config.public.cdnUrl;
  
  if (!cdnUrl) {
    // Return empty data if CDN URL not configured
    return {
      reviews: [],
      rating: 0,
      total_reviews: 0,
    };
  }

  try {
    // Fetch reviews from CDN (pre-cached from Google Places API)
    const response = await $fetch<any>(`${cdnUrl}/reviews/hours.json`);

    if (!response?.result) {
      return {
        reviews: [],
        rating: 0,
        total_reviews: 0,
      };
    }

    const dealershipName = response.result.name || '';
    const reviews = (response.result.reviews || []).map((review: any) => ({
      dealership: dealershipName,
      author_name: review.author_name,
      rating: review.rating,
      text: review.text,
      time: review.time,
      relative_time_description: review.relative_time_description,
      profile_photo_url: review.profile_photo_url
    }));

    // Shuffle reviews
    const shuffledReviews = shuffleArray(reviews);

    return {
      reviews: shuffledReviews,
      rating: response.result.rating || 0,
      total_reviews: response.result.user_ratings_total || reviews.length,
    };
  } catch (error: any) {
    console.error('Error fetching reviews:', error);

    return {
      reviews: [],
      rating: 0,
      total_reviews: 0,
    };
  }
});








