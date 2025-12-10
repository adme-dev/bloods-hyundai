<template>
  <div v-if="reviewData">
    <div class="aggregate-rating">
      <div class="uk-text-center" itemprop="aggregateRating" itemscope itemtype="http://schema.org/AggregateRating">
        <div itemprop="itemReviewed" itemscope itemtype="http://schema.org/AutoDealer">
          <meta itemprop="name" :content="siteName" />
        </div>

        <meta itemprop="ratingValue" :content="rating" />
        <meta itemprop="ratingCount" :content="totalReviews" />

        <div class="uk-flex uk-flex-middle uk-grid-collapse uk-grid">
          <div>
            <svg class="hd-gr" viewBox="0 0 512 512" height="14" width="14">
              <g fill="none" fill-rule="evenodd">
                <path
                  d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z"
                  fill="#4285f4"
                />
                <path
                  d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z"
                  fill="#34a853"
                />
                <path
                  d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z"
                  fill="#fbbc05"
                />
                <path
                  d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z"
                  fill="#ea4335"
                />
                <path d="M20 20h472v472H20V20z" />
              </g>
            </svg>
            <span itemprop="ratingValue" class="rating-text uk-width-1-1 rating-text-small">
              {{ rating }}
            </span>
            <div class="stars-outer" role="img" :aria-label="'Rating: ' + rating + ' out of 5'">
              <div class="stars-inner" :style="{ width: (rating / 5) * 100 + '%' }">
                {{ rating }}
              </div>
            </div>
          </div>
          <div class="uk-text-xsmall uk-margin-small-left uk-light">
            <a 
              :href="reviewUrl"
              target="_blank" 
              rel="noreferrer" 
              class="uk-text-emphasis"
            >
              Based on <span itemprop="ratingCount">{{ totalReviews }}</span> reviews
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const reviewsStore = useReviewsStore();
const mainStore = useMainStore();

const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');

const reviewData = computed(() => {
  return reviewsStore.rating > 0;
});

const rating = computed(() => reviewsStore.rating || 4.8);
const totalReviews = computed(() => reviewsStore.totalReviews || 0);

const reviewUrl = computed(() => {
  // You can add a place_id from the config if available
  return 'https://search.google.com/local/reviews?placeid=ChIJH0WBYgh_LmsR5TrfIC2NPJw';
});
</script>

<style scoped>
.hd-gr {
  margin-top: -2px;
}

.rating-text-small {
  font-size: 14px;
}

.stars-outer {
  display: inline-block;
  position: relative;
  unicode-bidi: bidi-override;
}

.stars-inner {
  position: absolute;
  top: 0;
  left: 0;
  white-space: nowrap;
  overflow: hidden;
  width: 0;
}

.stars-inner::before,
.widget-stars-inner::before {
  content: "★ ★ ★ ★ ★";
  color: #ffbc14;
  font-size: 12px;
}

.stars-outer::before,
.widget-stars-outer::before {
  content: "★ ★ ★ ★ ★";
  color: rgba(229, 229, 229, 0.399);
  font-size: 12px;
}

.background-white .uk-text-meta.uk-text-xsmall.based,
.pnd .uk-text-meta.uk-text-xsmall.based,
.nav-main.uk-background-default .uk-text-meta.uk-text-xsmall.based,
.pnd .aggregate-rating .uk-text-emphasis {
  color: #333 !important;
}

.uk-text-meta.uk-text-xsmall.based,
.pn .uk-text-meta.uk-text-xsmall.based {
  color: #fff;
}
</style>



