import { defineStore } from 'pinia';

/**
 * Reviews store - handles Google Reviews data
 * Replaces: Vuex GoogleReviews + fetchReviews modules
 */

interface Review {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description?: string;
}

interface ReviewsData {
  rating: number;
  total_reviews: number;
  reviews: Review[];
  place_id?: string;
  business_hours?: any;
}

export const useReviewsStore = defineStore('reviews', () => {
  // State
  const reviews = ref<Review[]>([]);
  const rating = ref<number>(0);
  const totalReviews = ref<number>(0);
  const businessHours = ref<any>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const averageRating = computed(() => rating.value.toFixed(1));

  const fiveStarReviews = computed(() =>
    reviews.value.filter((r) => r.rating === 5)
  );

  const recentReviews = computed(() =>
    [...reviews.value].sort((a, b) => b.time - a.time).slice(0, 5)
  );

  // Actions
  const fetchGoogleReviews = async () => {
    loading.value = true;
    error.value = null;

    try {
      const data = await $fetch<ReviewsData>('/api/reviews');
      reviews.value = data.reviews || [];
      rating.value = data.rating || 0;
      totalReviews.value = data.total_reviews || 0;
      businessHours.value = data.business_hours || null;
      return data;
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch reviews';
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    reviews,
    rating,
    totalReviews,
    businessHours,
    loading,
    error,

    // Getters
    averageRating,
    fiveStarReviews,
    recentReviews,

    // Actions
    fetchGoogleReviews,
  };
});
