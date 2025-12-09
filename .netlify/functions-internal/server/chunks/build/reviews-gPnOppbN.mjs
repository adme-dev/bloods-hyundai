import { l as defineStore } from './server.mjs';
import { ref, computed } from 'vue';

const useReviewsStore = defineStore("reviews", () => {
  const reviews = ref([]);
  const rating = ref(0);
  const totalReviews = ref(0);
  const businessHours = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const averageRating = computed(() => rating.value.toFixed(1));
  const fiveStarReviews = computed(
    () => reviews.value.filter((r) => r.rating === 5)
  );
  const recentReviews = computed(
    () => [...reviews.value].sort((a, b) => b.time - a.time).slice(0, 5)
  );
  const fetchGoogleReviews = async () => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $fetch("/api/reviews");
      reviews.value = data.reviews || [];
      rating.value = data.rating || 0;
      totalReviews.value = data.total_reviews || 0;
      businessHours.value = data.business_hours || null;
      return data;
    } catch (e) {
      error.value = e.message || "Failed to fetch reviews";
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
    fetchGoogleReviews
  };
});

export { useReviewsStore as u };
//# sourceMappingURL=reviews-gPnOppbN.mjs.map
