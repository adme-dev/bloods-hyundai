<template>
  <div class="google-reviews">
    <div class="uk-text-center uk-margin-medium-bottom">
      <h2>What Our Customers Say</h2>
      <div v-if="averageRating" class="uk-flex uk-flex-center uk-flex-middle uk-grid-small" uk-grid>
        <div>
          <span class="uk-h3 uk-margin-remove">{{ averageRating.toFixed(1) }}</span>
        </div>
        <div>
          <div class="star-rating">
            <span 
              v-for="star in 5" 
              :key="star" 
              class="star"
              :class="{ 'filled': star <= Math.round(averageRating) }"
            >★</span>
          </div>
          <p v-if="totalReviews" class="uk-text-muted uk-margin-remove">
            Based on {{ totalReviews }} reviews
          </p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="uk-text-center uk-padding">
      <div uk-spinner></div>
    </div>

    <!-- Reviews Slider -->
    <div v-else-if="reviews.length" uk-slider="autoplay: true; autoplay-interval: 5000">
      <div class="uk-position-relative uk-visible-toggle" tabindex="-1">
        <ul class="uk-slider-items uk-child-width-1-1 uk-child-width-1-2@s uk-child-width-1-3@m uk-grid uk-grid-medium">
          <li v-for="review in reviews" :key="review.id || review.author_name">
            <div class="uk-card uk-card-default uk-card-body review-card">
              <div class="review-header uk-flex uk-flex-middle uk-margin-small-bottom">
                <div class="reviewer-avatar">
                  <img 
                    v-if="review.profile_photo_url" 
                    :src="review.profile_photo_url" 
                    :alt="review.author_name"
                    class="uk-border-circle"
                    width="48"
                    height="48"
                  />
                  <span v-else class="avatar-placeholder">
                    {{ getInitials(review.author_name) }}
                  </span>
                </div>
                <div class="reviewer-info uk-margin-small-left">
                  <h4 class="uk-margin-remove">{{ review.author_name }}</h4>
                  <div class="star-rating star-rating-small">
                    <span 
                      v-for="star in 5" 
                      :key="star" 
                      class="star"
                      :class="{ 'filled': star <= review.rating }"
                    >★</span>
                  </div>
                </div>
              </div>
              <p class="review-text">{{ truncateText(review.text, 200) }}</p>
              <p class="review-date uk-text-small uk-text-muted">
                {{ review.relative_time_description || formatDate(review.time) }}
              </p>
            </div>
          </li>
        </ul>

        <a class="uk-position-center-left uk-position-small uk-hidden-hover" href="#" uk-slidenav-previous uk-slider-item="previous"></a>
        <a class="uk-position-center-right uk-position-small uk-hidden-hover" href="#" uk-slidenav-next uk-slider-item="next"></a>
      </div>

      <ul class="uk-slider-nav uk-dotnav uk-flex-center uk-margin"></ul>
    </div>

    <!-- No Reviews -->
    <div v-else class="uk-text-center uk-text-muted">
      <p>No reviews available at this time.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const loading = ref(true);
const reviews = ref<any[]>([]);
const averageRating = ref<number | null>(null);
const totalReviews = ref(0);

const reviewsStore = useReviewsStore();

// Client-side only fetch
onMounted(async () => {
  await fetchReviews();
});

const fetchReviews = async () => {
  loading.value = true;
  
  try {
    await reviewsStore.fetchGoogleReviews();
    reviews.value = (reviewsStore.reviews || []).slice(0, 9); // Show up to 9
    averageRating.value = reviewsStore.rating || null;
    totalReviews.value = reviewsStore.totalReviews || 0;
  } catch (err) {
    console.error('Failed to fetch reviews:', err);
    reviews.value = [];
  } finally {
    loading.value = false;
  }
};

const getInitials = (name: string) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const truncateText = (text: string, maxLength: number) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

const formatDate = (timestamp: number) => {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
  });
};
</script>

<style scoped>
.star-rating {
  display: inline-flex;
  gap: 2px;
}

.star {
  color: #ddd;
  font-size: 1.25rem;
}

.star.filled {
  color: #ffc107;
}

.star-rating-small .star {
  font-size: 0.9rem;
}

.review-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.review-text {
  flex: 1;
  line-height: 1.6;
}

.reviewer-avatar {
  flex-shrink: 0;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #002c5f;
  color: white;
  font-weight: 600;
}
</style>






