<template>
  <div class="hero-slider uk-margin-small-top uk-position-relative uk-overflow-hidden">
    <!-- SSR slides for SEO - all slides rendered server-side, only first visible -->
    <div v-if="!isMounted && homeSlides.length" class="slider-ssr">
      <div
        v-for="(slide, index) in homeSlides"
        :key="`ssr-${index}`"
        class="slide-item"
        :class="{ 'slide-item--hidden': index > 0 }"
      >
        <div class="slide-panel" :class="{ 'is-active': index === 0 }">
          <NuxtPicture
            v-if="slide.desktop"
            :src="slide.desktop"
            :alt="strippedHeadingContent(slide.heading_content)"
            class="slide-image-wrapper"
            :img-attrs="{ class: 'slide-image' }"
            width="1600"
            height="900"
            sizes="sm:100vw md:80vw"
            :loading="index === 0 ? 'eager' : 'lazy'"
            format="webp"
          />

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
              <NuxtLink
                v-if="slide.link"
                :class="[slide.contrast, slide.button_colour]"
                class="slide-button"
                :to="slide.link"
              >
                {{ slide.button_text }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Client-side Swiper slider -->
    <ClientOnly>
      <swiper
        :modules="modules"
        :slides-per-view="1.2"
        :space-between="16"
        :centered-slides="true"
        :loop="homeSlides.length > 2"
        :autoplay="{
          delay: 3500,
          disableOnInteraction: false,
        }"
        :pagination="{
          el: '.hero-pagination',
          clickable: true,
        }"
        :breakpoints="swiperBreakpoints"
        class="hero-swiper"
        @swiper="onSwiper"
        @slideChange="onSlideChange"
      >
        <swiper-slide
          v-for="(slide, index) in homeSlides"
          :key="index"
          v-slot="{ isActive }"
        >
          <div
            :class="['slide-panel', { 'is-active': isActive }]"
            @click="handleSlideClick($event, slide, index, isActive)"
          >
            <!-- Image slide -->
            <div v-if="slide.desktop" class="slide-media">
              <NuxtPicture
                :src="slide.desktop"
                :alt="strippedHeadingContent(slide.heading_content)"
                class="slide-image-wrapper"
                :img-attrs="{ class: 'slide-image' }"
                width="1600"
                height="900"
                sizes="sm:100vw md:80vw"
                :loading="index === 0 ? 'eager' : 'lazy'"
                format="webp"
              />
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
        </swiper-slide>
      </swiper>

      <!-- Pagination -->
      <div class="hero-pagination"></div>

      <template #fallback>
        <!-- Show first slide during hydration - matches SSR output -->
        <div v-if="homeSlides.length" class="slider-ssr">
          <div class="slide-item">
            <div class="slide-panel is-active">
              <NuxtPicture
                v-if="homeSlides[0].desktop"
                :src="homeSlides[0].desktop"
                :alt="strippedHeadingContent(homeSlides[0].heading_content)"
                class="slide-image-wrapper"
                :img-attrs="{ class: 'slide-image' }"
                width="1600"
                height="900"
                sizes="sm:100vw md:80vw"
                loading="eager"
                format="webp"
              />
            </div>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { isDateInRange } from '~/utils/date';

const mainStore = useMainStore();
const activeSlide = ref(0);
const isMounted = ref(false);
const swiperInstance = ref<any>(null);

// Swiper modules
const modules = [Autoplay, Pagination];

// Swiper breakpoints
const swiperBreakpoints = {
  640: {
    slidesPerView: 1.15,
    spaceBetween: 16,
  },
  960: {
    slidesPerView: 1.2,
    spaceBetween: 20,
  },
};

// Site name for fallback
const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');

// Filter slides by date range
const homeSlides = computed(() => {
  const slides = mainStore.site?.promotional?.[0]?.slides || [];
  return slides.filter((slide: any) => isDateInRange(slide.start, slide.end));
});

// Methods
const isLinkExternal = (link: string) => {
  return /^(http|https):\/\//.test(link);
};

const linkComponent = (link: string) => {
  return isLinkExternal(link) ? 'a' : resolveComponent('NuxtLink');
};

const formatLink = (link: string) => {
  if (/^https?:\/\//.test(link)) {
    return link;
  }
  return 'https://' + link;
};

const formatSlideTitle = (link: string) => {
  if (!link) return siteName.value;
  const parts = link.replace('-', ' ').split('/');
  return parts[2] || parts[1] || siteName.value;
};

const strippedHeadingContent = (content: string) => {
  if (!content) return '';
  return content.replace(/<[^>]*>/g, '');
};

const onSwiper = (swiper: any) => {
  swiperInstance.value = swiper;
};

const onSlideChange = (swiper: any) => {
  activeSlide.value = swiper.realIndex;
};

const goToSlide = (index: number) => {
  if (swiperInstance.value) {
    swiperInstance.value.slideToLoop(index);
  }
};

const router = useRouter();

const handleSlideClick = (event: Event, slide: any, index: number, isActive: boolean) => {
  if (!isActive) {
    // Navigate to this slide
    goToSlide(index);
  } else if (slide.link) {
    // Navigate to the route
    if (isLinkExternal(slide.link)) {
      window.open(formatLink(slide.link), '_blank', 'noopener,noreferrer');
    } else {
      router.push(slide.link);
    }
  }
};

onMounted(() => {
  isMounted.value = true;
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

.hero-swiper {
  overflow: visible;
}

/* SSR container - renders all slides for SEO, shows only first */
.slider-ssr {
  display: flex;
  justify-content: center;
  padding: 0 10%;
}

.slide-item {
  width: 83.33%;
  flex-shrink: 0;
}

/* Hidden slides still in DOM for SEO but not visible */
.slide-item--hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.slide-panel {
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  filter: brightness(0.7);
  transition: all 0.3s ease;
  cursor: pointer;
}

.slide-panel.is-active,
.slider-placeholder .slide-panel {
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

.slide-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
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
:deep(.hero-pagination) {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  position: relative;
  z-index: 5;
}

:deep(.hero-pagination .swiper-pagination-bullet) {
  width: 12px;
  height: 12px;
  background-color: rgba(0, 170, 210, 0.3);
  opacity: 1;
  transition: all 0.3s ease;
  border-radius: 50%;
  cursor: pointer;
}

:deep(.hero-pagination .swiper-pagination-bullet-active) {
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
