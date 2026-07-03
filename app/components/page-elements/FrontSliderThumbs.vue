<template>
  <section v-if="homeThumbs.length" class="front-thumbs uk-section uk-section-default">
    <div class="uk-container">
      <div class="thumbs-carousel">
        <!-- Previous Button -->
        <button
          v-if="homeThumbs.length > 4"
          class="thumbs-nav thumbs-nav--prev"
          :disabled="!canScrollPrev"
          @click="scrollPrev"
          aria-label="Previous"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Carousel Viewport -->
        <div class="thumbs-viewport" ref="emblaRef">
          <div class="thumbs-container">
            <div
              v-for="(thumb, index) in homeThumbs"
              :key="index"
              class="thumb-slide"
            >
              <component
                :is="linkComponent(thumb.link)"
                :href="isLinkExternal(thumb.link) ? thumb.link : undefined"
                :to="!isLinkExternal(thumb.link) ? normalizedThumbLink(thumb.link) : undefined"
                :target="isLinkExternal(thumb.link) ? '_blank' : undefined"
                :rel="isLinkExternal(thumb.link) ? 'noopener noreferrer' : undefined"
                class="thumb-card"
              >
                <div class="thumb-image-wrapper">
                  <img
                    :src="thumb.image"
                    :alt="thumb.button_text || siteName"
                    width="640"
                    height="360"
                    class="thumb-image"
                    loading="lazy"
                  />
                  <div class="thumb-overlay">
                    <div v-if="thumb.content" class="thumb-content">
                      <h3 class="thumb-title">{{ thumb.content }}</h3>
                    </div>
                    <span v-if="thumb.button_text" class="thumb-button">
                      {{ thumb.button_text }}
                    </span>
                  </div>
                </div>
              </component>
            </div>
          </div>
        </div>

        <!-- Next Button -->
        <button
          v-if="homeThumbs.length > 4"
          class="thumbs-nav thumbs-nav--next"
          :disabled="!canScrollNext"
          @click="scrollNext"
          aria-label="Next"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import emblaCarouselVue from 'embla-carousel-vue';
import { isDateInRange } from '~/utils/date';
import { getConfiguredFrontThumbs } from '~/utils/frontSlides';

const mainStore = useMainStore();

// Site name for fallback alt text
const siteName = computed(() => mainStore.site?.name || 'Blood Hyundai');

// Filter thumbs by date range
const homeThumbs = computed(() => {
  return getConfiguredFrontThumbs(mainStore.site?.promotional)
    .filter((thumb: any) => isDateInRange(thumb.start, thumb.end));
});

// Embla Carousel setup
const [emblaRef, emblaApi] = emblaCarouselVue({
  loop: false,
  align: 'start',
  containScroll: 'trimSnaps',
  slidesToScroll: 1,
  breakpoints: {
    '(min-width: 640px)': { slidesToScroll: 2 },
    '(min-width: 960px)': { slidesToScroll: 3 },
  },
});

// Navigation state
const canScrollPrev = ref(false);
const canScrollNext = ref(false);

// Navigation methods
const scrollPrev = () => emblaApi.value?.scrollPrev();
const scrollNext = () => emblaApi.value?.scrollNext();

// Update button states
const updateButtons = () => {
  if (!emblaApi.value) return;
  canScrollPrev.value = emblaApi.value.canScrollPrev();
  canScrollNext.value = emblaApi.value.canScrollNext();
};

// Link helpers
const isLinkExternal = (link?: string) => {
  return typeof link === 'string' && /^https?:\/\//.test(link);
};

const normalizedThumbLink = (link?: string) => {
  return link || '#';
};

const linkComponent = (link?: string) => {
  return isLinkExternal(link) ? 'a' : resolveComponent('NuxtLink');
};

// Watch for embla API initialization
watch(() => emblaApi.value, (api) => {
  if (!api) return;
  
  updateButtons();
  api.on('select', updateButtons);
  api.on('reInit', updateButtons);
});

// Cleanup
onUnmounted(() => {
  if (emblaApi.value) {
    emblaApi.value.off('select', updateButtons);
    emblaApi.value.off('reInit', updateButtons);
  }
});
</script>

<style scoped>
.front-thumbs {
  padding-top: 0;
  padding-bottom: 40px;
}

.thumbs-carousel {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}

.thumbs-viewport {
  overflow: hidden;
  flex: 1;
}

.thumbs-container {
  display: flex;
  gap: 16px;
  backface-visibility: hidden;
  touch-action: pan-y pinch-zoom;
}

.thumb-slide {
  flex: 0 0 calc(50% - 8px);
  min-width: 0;
}

@media (min-width: 640px) {
  .thumb-slide {
    flex: 0 0 calc(33.333% - 11px);
  }
}

@media (min-width: 960px) {
  .thumb-slide {
    flex: 0 0 calc(25% - 12px);
  }
}

.thumb-card {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.thumb-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.thumb-image-wrapper {
  position: relative;
  overflow: hidden;
  background-color: #f3f4f6;
  border-radius: 8px;
}

.thumb-image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 8px;
  transition: transform 0.4s ease;
}

.thumb-image-wrapper :deep(img) {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 8px;
}

.thumb-card:hover .thumb-image {
  transform: scale(1.05);
}

.thumb-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.thumb-card:hover .thumb-overlay {
  opacity: 1;
}

.thumb-content {
  margin-bottom: 8px;
}

.thumb-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.thumb-button {
  display: inline-block;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background-color: var(--uk-primary, #002c5f);
  border-radius: 20px;
  text-align: center;
  transition: background-color 0.2s ease;
  width: fit-content;
}

.thumb-card:hover .thumb-button {
  background-color: var(--uk-primary-dark, #001e3c);
}

/* Navigation Buttons */
.thumbs-nav {
  flex-shrink: 0;
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  background-color: #fff;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

@media (min-width: 960px) {
  .thumbs-nav {
    display: flex;
  }
}

.thumbs-nav:hover:not(:disabled) {
  background-color: var(--uk-primary, #002c5f);
  border-color: var(--uk-primary, #002c5f);
  color: #fff;
}

.thumbs-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.thumbs-nav--prev {
  margin-right: 8px;
}

.thumbs-nav--next {
  margin-left: 8px;
}
</style>
