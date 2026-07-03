<template>
  <!-- CLS prevention: min-height reserves space before content loads -->
  <div v-if="homeSlides.length" class="hero-slider uk-margin-small-top uk-position-relative uk-overflow-hidden" style="min-height: 300px;">
    <!-- SSR placeholder - shows first slide while JS loads -->
    <div v-if="!isMounted && homeSlides.length" class="hero-carousel hero-carousel--ssr">
      <div class="hero-viewport">
        <div class="hero-container hero-container--ssr">
          <div class="hero-slide">
            <div class="slide-panel is-active">
              <div v-if="homeSlides[0].desktop || homeSlides[0].mobile" class="slide-media">
                <picture class="slide-image-wrapper">
                  <source
                    v-if="homeSlides[0].mobile"
                    media="(max-width: 768px)"
                    :srcset="homeSlides[0].mobile"
                  />
                  <img
                    :src="homeSlides[0].desktop || homeSlides[0].mobile"
                    :alt="strippedHeadingContent(homeSlides[0].heading_content) || siteName"
                    class="slide-image"
                    width="1600"
                    height="600"
                    loading="eager"
                    fetchpriority="high"
                  />
                </picture>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Embla Carousel - client only -->
    <div v-else class="hero-carousel">
      <div class="hero-viewport" ref="emblaRef">
        <div class="hero-container">
          <div
            v-for="(slide, index) in homeSlides"
            :key="index"
            class="hero-slide"
          >
            <div
              :class="['slide-panel', { 'is-active': selectedIndex === index }]"
              @click="handleSlideClick($event, slide, index)"
            >
              <!-- Image slide with art direction -->
              <div v-if="slide.desktop || slide.mobile" class="slide-media">
                <picture class="slide-image-wrapper">
                  <source
                    v-if="slide.mobile"
                    media="(max-width: 768px)"
                    :srcset="slide.mobile"
                  />
                  <img
                    :src="slide.desktop || slide.mobile"
                    :alt="strippedHeadingContent(slide.heading_content) || siteName"
                    class="slide-image"
                    width="1600"
                    height="600"
                    :loading="index === 0 ? 'eager' : 'lazy'"
                    :fetchpriority="index === 0 ? 'high' : 'auto'"
                  />
                </picture>
              </div>

              <!-- Video slide -->
              <div v-if="slide.video" class="slide-media slide-video">
                <video
                  :src="slide.video"
                  loop
                  muted
                  playsinline
                  autoplay
                  :poster="slide.video_poster"
                ></video>
              </div>

              <!-- Slide content overlay -->
              <div v-if="slide.button_text" class="slide-content">
                <h2
                  :class="slide.contrast"
                  class="slide-heading"
                  v-html="slide.heading_content"
                ></h2>
                <p
                  :class="slide.contrast"
                  class="slide-subheading"
                  v-html="slide.sub_heading"
                ></p>
                <div v-if="slide.button_text" class="slide-cta">
                  <span
                    :class="[slide.contrast, slide.button_colour]"
                    class="slide-button"
                  >
                    {{ slide.button_text }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination dots -->
      <div v-if="homeSlides.length > 1" class="hero-pagination">
        <button
          v-for="(_, index) in homeSlides"
          :key="index"
          :class="['pagination-dot', { 'is-active': selectedIndex === index }]"
          @click="scrollTo(index)"
          :aria-label="`Go to slide ${index + 1}`"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import EmblaCarousel from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';
import { isDateInRange } from '~/utils/date';

const mainStore = useMainStore();
const isMounted = ref(false);
const selectedIndex = ref(0);
const emblaRef = ref<HTMLElement | null>(null);
let emblaApi: any = null;

// Site name for fallback
const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');

// Filter slides by date range before rendering so expired campaigns do not
// server-render briefly and then disappear into an empty hydrated carousel.
const homeSlides = computed(() => {
  const slides = mainStore.site?.promotional?.[0]?.slides || [];
  return slides.filter((slide: any) => isDateInRange(slide.start, slide.end));
});

// Navigation methods
const scrollTo = (index: number) => {
  emblaApi?.scrollTo(index);
};

// Update selected index on slide change
const onSelect = () => {
  if (!emblaApi) return;
  selectedIndex.value = emblaApi.selectedScrollSnap();
};

// Helper methods
const isLinkExternal = (link: string) => {
  return /^(http|https):\/\//.test(link);
};

const formatLink = (link: string) => {
  if (/^https?:\/\//.test(link)) {
    return link;
  }
  return 'https://' + link;
};

const strippedHeadingContent = (content: string) => {
  if (!content) return '';
  return content.replace(/<[^>]*>/g, '');
};

const router = useRouter();

const handleSlideClick = (event: Event, slide: any, index: number) => {
  const isActive = selectedIndex.value === index;

  if (!isActive) {
    scrollTo(index);
  } else if (slide.link) {
    if (isLinkExternal(slide.link)) {
      window.open(formatLink(slide.link), '_blank', 'noopener,noreferrer');
    } else {
      router.push(slide.link);
    }
  }
};

// Initialize Embla on mount (client-side only)
onMounted(() => {
  isMounted.value = true;

  nextTick(() => {
    if (emblaRef.value && homeSlides.value.length > 0) {
      emblaApi = EmblaCarousel(
        emblaRef.value,
        {
          loop: true,
          align: 'center',
          containScroll: false,
          slidesToScroll: 1,
        },
        [Autoplay({ delay: 3500, stopOnInteraction: false })]
      );

      emblaApi.on('select', onSelect);
      emblaApi.on('reInit', onSelect);
      onSelect();
    }
  });
});

// Cleanup
onUnmounted(() => {
  if (emblaApi) {
    emblaApi.destroy();
  }
});
</script>

<style>
.hero-slider h2,
.hero-slider h1,
.hero-slider h3,
.hero-slider h4 {
  margin: 0;
  font-family: 'Hyundai Sans Head', 'Hyundai Sans', sans-serif;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.hero-slider p {
  margin: 0;
  font-family: 'Hyundai Sans Text', 'Hyundai Sans', sans-serif;
}

.hero-slider .uk-light {
  color: #fff;
}
</style>

<style scoped>
.hero-slider {
  padding: 10px 0;
}

.hero-carousel {
  position: relative;
}

/* SSR placeholder - center single slide */
.hero-carousel--ssr .hero-container--ssr {
  justify-content: center;
}

.hero-viewport {
  overflow: hidden;
}

.hero-container {
  display: flex;
  backface-visibility: hidden;
  touch-action: pan-y pinch-zoom;
}

.hero-slide {
  flex: 0 0 83.33%;
  min-width: 0;
  padding: 0 8px;
}

@media (max-width: 960px) {
  .hero-slide {
    flex: 0 0 87%;
  }
}

@media (max-width: 640px) {
  .hero-slide {
    flex: 0 0 92%;
  }
}

.slide-panel {
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  filter: brightness(0.7);
  transition: all 0.3s ease;
  cursor: pointer;
}

.slide-panel.is-active {
  filter: brightness(1);
  box-shadow: 0 14px 25px rgba(0, 0, 0, 0.16);
  cursor: default;
}

.slide-panel:hover {
  transform: translateY(-5px);
}

.slide-media {
  position: relative;
}

.slide-image-wrapper {
  display: block;
  width: 100%;
}

.slide-image {
  width: 100%;
  height: auto;
  display: block;
  /* Maintain aspect ratio to prevent CLS */
  aspect-ratio: 16 / 6;
  object-fit: cover;
}

/* Mobile: Use portrait-friendly aspect ratio for mobile images */
@media (max-width: 768px) {
  .slide-image {
    aspect-ratio: 3 / 4;
  }
}

.slide-video video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-content {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 2rem 2rem 4rem 4rem;
  width: 400px;
  text-align: left;
  z-index: 1;
}

.slide-heading {
  font-size: 1.85rem;
  letter-spacing: -0.0525rem;
  line-height: 2.2rem;
  margin: 0;
  font-weight: 500;
}

.slide-subheading {
  font-size: 1.85rem;
  letter-spacing: -0.0525rem;
  line-height: 2.2rem;
  margin-top: 0.5rem;
}

.slide-cta {
  margin-top: 1rem;
}

.slide-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-family: 'Hyundai Sans Text', 'Hyundai Sans', sans-serif;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

/* Pagination styling */
.hero-pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  position: relative;
  z-index: 5;
}

.pagination-dot {
  width: 12px;
  height: 12px;
  background-color: rgba(0, 170, 210, 0.3);
  border: none;
  padding: 0;
  opacity: 1;
  transition: all 0.3s ease;
  border-radius: 50%;
  cursor: pointer;
}

.pagination-dot:hover {
  background-color: rgba(0, 170, 210, 0.5);
}

.pagination-dot.is-active {
  background-color: #00aad2;
  transform: scale(1.2);
}

@media (max-width: 960px) {
  .slide-content {
    padding: 1rem 1rem 2rem 2rem;
    width: 70%;
  }

  .slide-heading,
  .slide-subheading {
    font-size: 1.25rem;
    line-height: 1.6rem;
  }
}
</style>
