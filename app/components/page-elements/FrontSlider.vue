<template>
  <div v-if="homeSlides.length" class="hero-slider uk-margin-small-top uk-position-relative uk-overflow-hidden">
    <div class="hero-carousel">
      <div class="hero-viewport" ref="emblaRef">
        <div class="hero-container" :class="{ 'hero-container--single': homeSlides.length === 1 }">
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
                    :srcset="optimizedSlideImage(slide.mobile, 900, 1200)"
                    width="900"
                    height="1200"
                  />
                  <img
                    :src="optimizedSlideImage(slide.desktop || slide.mobile, 1600, 600)"
                    :alt="strippedHeadingContent(slide.heading_content) || siteName"
                    class="slide-image"
                    width="1600"
                    height="600"
                    :loading="index === 0 ? 'eager' : 'lazy'"
                    :fetchpriority="index === 0 ? 'high' : 'auto'"
                    :decoding="index === 0 ? 'sync' : 'async'"
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
import { resolveHomeSlides, shouldFetchOffersHero, type OffersHeroImage } from '~/utils/frontSlides';

const mainStore = useMainStore();
const config = useRuntimeConfig();
const props = defineProps<{
  slides?: unknown;
}>();
const route = useRoute();
const image = useImage();

const selectedIndex = ref(0);
const emblaRef = ref<HTMLElement | null>(null);
let emblaApi: any = null;

// Site name for fallback
const siteName = computed(() => mainStore.site?.name || config.public.siteName || 'Blood Hyundai');
const configuredSlideSource = computed(() => props.slides || mainStore.site?.promotional || []);
const offersHeroData = ref<OffersHeroImage | null>(null);
const shouldRefreshOffersHero = computed(() => route.query.refresh === 'true');
const shouldLoadOffersHero = computed(() =>
  shouldFetchOffersHero(configuredSlideSource.value, siteName.value)
);

const offersHeroRequest = computed(() => {
  if (!shouldLoadOffersHero.value) {
    return null;
  }

  const refresh = shouldRefreshOffersHero.value;
  return {
    key: refresh ? 'hyundai-offers-home-hero-refresh' : 'hyundai-offers-home-hero',
    query: refresh ? { refresh: 'true' } : {},
  };
});

if (offersHeroRequest.value) {
  const { data, error } = useFetch<OffersHeroImage>('/api/hyundai-offers/hero-banner', {
    key: offersHeroRequest.value.key,
    query: offersHeroRequest.value.query,
    server: true,
    default: () => null,
  });

  watch(data, (value) => {
    offersHeroData.value = value || null;
  }, { immediate: true });

  watch(error, (value) => {
    if (value) {
      console.warn('Offers hero banner fetch failed:', value.message || value);
    }
  }, { immediate: true });
}

// Resolve active config slides first, then use a fresh offers hero fallback for
// Blood Hyundai if the DriveAgent config currently has no in-date hero slide.
const homeSlides = computed(() => {
  return resolveHomeSlides(configuredSlideSource.value, {
    siteName: siteName.value,
    offersHero: offersHeroData.value,
  });
});

const optimizedSlideImage = (src: string | undefined, width: number, height: number) => {
  if (!src) return '';
  return image(src, {
    width,
    height,
    fit: 'contain',
    format: 'webp',
    quality: 78,
  });
};

const firstSlidePreloadLinks = computed(() => {
  const firstSlide = homeSlides.value[0];
  if (!firstSlide || firstSlide.video) return [];

  const mobileImage = firstSlide.mobile || firstSlide.tablet;
  const desktopImage = firstSlide.desktop || mobileImage;
  const optimizedMobileImage = mobileImage
    ? optimizedSlideImage(mobileImage, 900, 1200)
    : null;
  const optimizedDesktopImage = desktopImage
    ? optimizedSlideImage(desktopImage, 1600, 600)
    : null;
  const links: Record<string, string>[] = [];

  if (optimizedMobileImage && mobileImage !== desktopImage) {
    links.push({
      rel: 'preload',
      as: 'image',
      href: optimizedMobileImage,
      media: '(max-width: 768px)',
      fetchpriority: 'high',
    });
  }

  if (optimizedDesktopImage) {
    links.push({
      rel: 'preload',
      as: 'image',
      href: optimizedDesktopImage,
      ...(mobileImage && mobileImage !== desktopImage ? { media: '(min-width: 769px)' } : {}),
      fetchpriority: 'high',
    });
  }

  return links;
});

useHead(() => ({
  link: firstSlidePreloadLinks.value,
}));

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

const initEmbla = () => {
  if (emblaApi || !emblaRef.value || homeSlides.value.length === 0) return;

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
};

// Initialize Embla on mount (client-side only)
onMounted(() => {
  nextTick(() => {
    initEmbla();
  });
});

watch(() => homeSlides.value.length, () => {
  if (selectedIndex.value >= homeSlides.value.length) {
    selectedIndex.value = 0;
  }

  nextTick(() => {
    initEmbla();
    emblaApi?.reInit();
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
  letter-spacing: 0;
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
  min-height: calc((83.33vw - 16px) * 0.375 + 20px);
}

.hero-carousel {
  position: relative;
}

.hero-container--single {
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
  .hero-slider {
    min-height: calc((87vw - 16px) * 0.375 + 20px);
  }

  .hero-slide {
    flex: 0 0 87%;
  }
}

@media (max-width: 640px) {
  .hero-slider {
    min-height: calc((92vw - 16px) * 1.3333 + 20px);
  }

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
  aspect-ratio: 8 / 3;
  background-color: #f4f6f8;
}

.slide-image-wrapper {
  display: block;
  width: 100%;
  height: 100%;
}

.slide-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

/* Mobile: Use portrait-friendly aspect ratio for mobile images */
@media (max-width: 768px) {
  .slide-media {
    aspect-ratio: 3 / 4;
  }

  .slide-image {
    object-fit: contain;
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
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

.slide-panel:not(.is-active) .slide-content {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.slide-heading {
  font-size: 1.85rem;
  letter-spacing: 0;
  line-height: 2.2rem;
  margin: 0;
  font-weight: 500;
}

.slide-subheading {
  font-size: 1.85rem;
  letter-spacing: 0;
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
