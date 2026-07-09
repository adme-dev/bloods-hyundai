<template>
  <div v-if="homeSlides.length" class="hero-slider uk-position-relative uk-overflow-hidden">
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
const props = defineProps<{
  slides?: unknown;
}>();
const route = useRoute();
const image = useImage();

const selectedIndex = ref(0);
const emblaRef = ref<HTMLElement | null>(null);
let emblaApi: any = null;

const { siteName } = useSiteIdentity();
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
  const { data, error } = useFetch<OffersHeroImage | null>('/api/hyundai-offers/hero-banner', {
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

// Resolve active config slides first, then use a fresh offers hero fallback if
// the DriveAgent config currently has no in-date hero slide.
const homeSlides = computed(() => {
  return resolveHomeSlides(configuredSlideSource.value, {
    siteName: siteName.value,
    offersHero: offersHeroData.value,
  });
});

const optimizedSlideImage = (src: string | undefined, width: number, _height: number) => {
  if (!src) return '';
  return image(src, {
    width,
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

const strippedHeadingContent = (content?: string | null) => {
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
  padding: 0;
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
  flex: 0 0 100%;
  min-width: 0;
  padding: 0;
}

.slide-panel {
  border-radius: 0;
  overflow: hidden;
  position: relative;
  filter: none;
  transition: none;
  cursor: pointer;
}

.slide-panel.is-active {
  filter: none;
  box-shadow: none;
  cursor: default;
}

.slide-panel:hover {
  transform: none;
}

.slide-media {
  position: relative;
  background-color: #fff;
}

.slide-image-wrapper {
  display: block;
  width: 100%;
}

.slide-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  object-position: center center;
}

@media (max-width: 768px) {
  .slide-image {
    object-fit: contain;
    object-position: center center;
  }
}

.slide-video video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-content {
  position: absolute;
  top: 50%;
  left: 50%;
  bottom: auto;
  transform: translate(-50%, -50%);
  width: min(1200px, calc(100vw - 294px));
  min-width: 0;
  padding: 0;
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
  font-size: clamp(2.5rem, 3.88vw, 3.625rem);
  letter-spacing: 0;
  line-height: 1.25;
  margin: 0;
  font-weight: 500;
  max-width: 760px;
}

.slide-subheading {
  font-size: clamp(1.125rem, 1.34vw, 1.25rem);
  letter-spacing: 0;
  line-height: 1;
  margin-top: 10px;
  font-weight: 500;
  max-width: 760px;
}

.slide-cta {
  margin-top: 35px;
}

.slide-button {
  display: inline-block;
  min-width: 180px;
  height: 52px;
  padding: 0 20px;
  border-radius: 0;
  color: #fff;
  background: var(--color-primary, #002c5f);
  font-family: 'Hyundai Sans Head', 'Hyundai Sans', sans-serif;
  font-size: 16px;
  line-height: 52px;
  font-weight: 400;
  letter-spacing: 0.5px;
  text-align: center;
  text-decoration: none;
  transition: all 0.3s ease;
}

.slide-button:hover {
  color: #fff;
  background: var(--color-primary-dark, #001e3c);
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
    width: min(720px, calc(100vw - 64px));
  }

  .slide-heading {
    font-size: clamp(2rem, 5vw, 3rem);
  }

  .slide-subheading {
    font-size: clamp(1rem, 2vw, 1.25rem);
  }
}

@media (max-width: 640px) {
  .slide-content {
    top: 32px;
    left: 24px;
    right: 24px;
    transform: none;
    width: auto;
  }

  .slide-heading {
    font-size: 2rem;
    line-height: 1.15;
  }

  .slide-subheading {
    font-size: 1rem;
    line-height: 1.25;
  }

  .slide-cta {
    margin-top: 24px;
  }

  .slide-button {
    min-width: 152px;
    height: 48px;
    font-size: 15px;
    line-height: 48px;
  }
}
</style>
