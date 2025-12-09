import { d as defineEventHandler, u as useRuntimeConfig } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue';
import 'consola';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
const reviews = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const cdnUrl = config.public.cdnUrl;
  if (!cdnUrl) {
    return {
      reviews: [],
      rating: 0,
      total_reviews: 0
    };
  }
  try {
    const response = await $fetch(`${cdnUrl}/reviews/hours.json`);
    if (!(response == null ? void 0 : response.result)) {
      return {
        reviews: [],
        rating: 0,
        total_reviews: 0
      };
    }
    const dealershipName = response.result.name || "";
    const reviews = (response.result.reviews || []).map((review) => ({
      dealership: dealershipName,
      author_name: review.author_name,
      rating: review.rating,
      text: review.text,
      time: review.time,
      relative_time_description: review.relative_time_description,
      profile_photo_url: review.profile_photo_url
    }));
    const shuffledReviews = shuffleArray(reviews);
    return {
      reviews: shuffledReviews,
      rating: response.result.rating || 0,
      total_reviews: response.result.user_ratings_total || reviews.length
    };
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return {
      reviews: [],
      rating: 0,
      total_reviews: 0
    };
  }
});

export { reviews as default };
//# sourceMappingURL=reviews.mjs.map
