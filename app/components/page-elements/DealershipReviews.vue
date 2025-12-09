<template>
  <div class="dealership-reviews">
    <div class="uk-container">
      <h2 class="uk-text-center uk-h1 uk-text-primary uk-text-bold uk-margin-medium-bottom">
        Customer <b>Reviews</b>
      </h2>
      
      <div v-if="positiveReviews.length > 0">
        <div 
          class="uk-position-relative uk-visible-toggle" 
          tabindex="-1" 
          uk-slider="autoplay: true; autoplay-interval: 4000"
        >
          <ul 
            class="uk-slider-items uk-child-width-1-1 uk-child-width-1-2@s uk-child-width-1-3@m uk-grid-small uk-grid uk-grid-match" 
            uk-height-match="target: > li > div > .uk-card"
          >
            <li v-for="review in positiveReviews" :key="review.time">
              <div class="uk-card uk-padding-small uk-flex uk-flex-column">
                <!-- Author Info -->
                <div class="uk-flex uk-flex-middle uk-margin-bottom">
                  <img 
                    v-if="review.profile_photo_url"
                    :src="review.profile_photo_url" 
                    :alt="review.author_name" 
                    class="uk-border-circle review-avatar"
                    width="60" 
                    height="60"
                  />
                  <div 
                    v-else 
                    class="uk-border-circle review-avatar-placeholder uk-flex uk-flex-center uk-flex-middle"
                  >
                    {{ getInitials(review.author_name) }}
                  </div>
                  <div class="uk-margin-left">
                    <h4 class="uk-card-title uk-margin-remove">{{ review.author_name }}</h4>
                    <div v-if="review.dealership" class="uk-text-small uk-text-muted">
                      {{ review.dealership }}
                    </div>
                  </div>
                </div>

                <!-- Review Text -->
                <div class="uk-flex-1 review-text">
                  <p class="uk-text-small uk-margin-remove">
                    {{ truncateText(review.text, 180) }}
                  </p>
                </div>

                <!-- Rating & Date -->
                <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-top">
                  <div class="uk-flex">
                    <span v-for="n in 5" :key="n" class="star">
                      <svg 
                        width="18" 
                        height="18" 
                        viewBox="0 0 20 20" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon 
                          :fill="n <= review.rating ? '#ffc107' : '#e0e0e0'" 
                          points="10 1 12.2 6.2 18 6.8 13.8 10.8 15 16.5 10 13.4 5 16.5 6.2 10.8 2 6.8 7.8 6.2" 
                        />
                      </svg>
                    </span>
                  </div>
                  <span class="uk-text-meta uk-text-small">
                    {{ review.relative_time_description }}
                  </span>
                </div>
              </div>
            </li>
          </ul>

          <!-- Navigation -->
          <a 
            class="uk-position-center-left uk-position-small uk-hidden-hover" 
            href="#" 
            uk-slidenav-previous 
            uk-slider-item="previous"
          ></a>
          <a 
            class="uk-position-center-right uk-position-small uk-hidden-hover" 
            href="#" 
            uk-slidenav-next 
            uk-slider-item="next"
          ></a>
        </div>

        <!-- Dots -->
        <ul class="uk-slider-nav uk-dotnav uk-flex-center uk-margin-top"></ul>

        <!-- Google Badge -->
        <div class="uk-text-center uk-margin-top">
          <a 
            href="https://www.google.com/maps" 
            target="_blank"
            rel="noopener noreferrer"
            class="google-badge"
          >
            <img 
              src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" 
              alt="Google" 
              width="20"
            />
            <span class="uk-margin-small-left">View all reviews on Google</span>
          </a>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="uk-text-center uk-padding">
        <p class="uk-text-muted">Loading reviews...</p>
        <div uk-spinner></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const reviewsStore = useReviewsStore();

// Fetch reviews on mount (client-side only)
onMounted(() => {
  if (!reviewsStore.reviews?.length) {
    reviewsStore.fetchGoogleReviews();
  }
});

// Get positive reviews (4+ stars) - with SSR safety
const positiveReviews = computed(() => {
  const reviews = reviewsStore.reviews || [];
  return reviews
    .filter(review => review.rating >= 4)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 12);
});

// Helper functions
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const getInitials = (name: string) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};
</script>

<style lang="scss" scoped>
.dealership-reviews {
  padding: 40px 0;
}

.uk-card {
  border: 2px solid #e8e8e8;
  border-radius: 15px;
  background-color: #fff;
  height: 100%;
}

.review-avatar {
  width: 60px;
  height: 60px;
  object-fit: cover;
}

.review-avatar-placeholder {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.review-text {
  min-height: 80px;
}

.star {
  margin-right: 2px;
}

.google-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: #f8f8f8;
  border-radius: 20px;
  text-decoration: none;
  color: #333;
  font-size: 14px;
  transition: background 0.2s;

  &:hover {
    background: #eee;
  }
}

:deep(.uk-slider-container) {
  padding: 0 20px 40px;
}
</style>



