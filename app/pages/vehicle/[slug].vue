<template>
  <div class="vehicle-detail-page">
    <LazyPageSchema />

    <!-- Loading -->
    <div v-if="pending" class="uk-flex uk-height-medium uk-background-secondary uk-light" uk-height-viewport="offset-top: true">
      <div class="uk-margin-auto uk-margin-auto-vertical uk-text-center">
        <div uk-spinner="ratio: 2"></div>
        <div class="uk-padding-small">Loading vehicle...</div>
      </div>
    </div>

    <!-- Vehicle Content -->
    <div v-else-if="vehicle">
      <!-- Floating Scraped Data Notice -->
      <div
        v-if="isScrapedData && !isAlertDismissed"
        class="fixed top-24 left-4 z-50 max-w-xs"
      >
        <Alert class="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 pr-10">
          <Info />
          <AlertTitle>Preliminary Information</AlertTitle>
          <AlertDescription>
            Data sourced from Hyundai Australia.
            <a href="#register" uk-scroll="offset: 100" class="underline hover:no-underline font-medium">
              Register your interest
            </a>
          </AlertDescription>
          <button
            type="button"
            class="absolute top-3 right-3 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            @click="isAlertDismissed = true"
          >
            <X class="h-4 w-4" />
            <span class="sr-only">Dismiss</span>
          </button>
        </Alert>
      </div>

      <!-- Hero Section -->
      <div id="top" v-if="vehicle.header?.slides" class="uk-position-relative uk-background-secondary">
        <div class="uk-width-1-1 uk-overflow-hidden uk-inline">
          <!-- Bottom Info Strip -->
          <div class="uk-position-bottom uk-position-z-index uk-light">
            <div class="uk-container uk-container-large">
              <div class="uk-padding spec-strip-grid uk-grid" uk-grid>
                <div class="uk-width-1-1 spec-strip-header uk-margin-medium-bottom">
                  <span class="uk-h1 uk-text-bold">{{ heroSlide.heading }}</span>
                  <div class="uk-h4 uk-margin-remove-top">{{ heroSlide.sub_heading }}</div>
                </div>

                <!-- Spec Strip -->
                <div 
                  v-for="(item, index) in heroSlide.bottom_strip" 
                  :key="index" 
                  class="uk-width-auto spec-strip"
                >
                  <div class="uk-h5 uk-margin-remove-bottom" v-html="item.heading"></div>
                  <div class="uk-text-small uk-text-light uk-margin-small-bottom" v-html="item.sub_heading"></div>
                </div>

                <!-- CTA Button -->
                <div class="uk-width-1-1 uk-width-auto@m uk-margin-auto-left@m">
                  <a
                    v-if="vehicle.form"
                    href="#register"
                    uk-scroll="offset: 100"
                    class="uk-width-1-1 uk-width-auto@s uk-button uk-button-default tm-button-default text-inherit heading-btn"
                  >
                    {{ heroSlide.button || 'Register Your Interest' }}
                  </a>
                  <NuxtLink
                    v-else
                    :to="`/calculator/${vehicleBaseModel}`"
                    class="uk-width-1-1 uk-width-auto@s uk-button uk-button-default tm-button-default text-inherit heading-btn"
                  >
                    {{ heroSlide.button || 'Calculate Repayments' }}
                  </NuxtLink>
                </div>
              </div>
            </div>
            
            <div class="uk-container uk-container-large uk-margin-small-bottom uk-text-center bounce uk-visible@s">
              <a href="#start" uk-scroll="offset:140">
                <span uk-icon="icon: chevron-down; ratio: 1.3"></span>
              </a>
            </div>
          </div>

          <!-- Hero Media -->
          <div class="uk-overflow-hidden" uk-height-viewport>
            <ClientOnly>
              <video 
                v-if="heroSlide.video"
                :src="heroSlide.video" 
                loop 
                muted 
                playsinline 
                :poster="heroSlide.desktop"
                uk-video="autoplay: inview" 
                uk-cover
              ></video>
              <template v-else>
                <NuxtImg
                  :src="heroSlide.desktop"
                  :alt="vehicle.model"
                  class="uk-visible@m uk-width-1-1"
                  uk-cover
                  width="1920"
                  height="1080"
                  format="webp"
                  quality="80"
                />
                <NuxtImg
                  :src="heroSlide.mobile || heroSlide.desktop"
                  :alt="vehicle.model"
                  class="uk-hidden@m uk-width-1-1"
                  uk-cover
                  width="768"
                  height="1024"
                  format="webp"
                  quality="80"
                />
              </template>
            </ClientOnly>
          </div>
          <div class="uk-position-bottom uk-width-1-1 uk-gradient"></div>
        </div>
      </div>

      <!-- Description & Content Sections (for scraped/coming soon vehicles) -->
      <div v-if="isScrapedData && (vehicle.description || vehicle.contentSections?.length)" id="start" class="uk-section uk-section-default">
        <div class="uk-container uk-container-large">
          <!-- Main Description -->
          <div v-if="vehicle.description" class="uk-text-center uk-margin-large-bottom">
            <p class="uk-text-lead uk-text-muted" style="max-width: 800px; margin: 0 auto;">
              {{ vehicle.description }}
            </p>
          </div>

          <!-- Content Sections -->
          <div v-if="vehicle.contentSections?.length" class="uk-margin-large-bottom">
            <div class="uk-grid uk-grid-large uk-child-width-1-1 uk-child-width-1-2@m" uk-grid>
              <div v-for="(section, index) in vehicle.contentSections" :key="index">
                <div class="uk-card uk-card-default uk-card-body">
                  <h3 v-if="section.heading" class="uk-card-title uk-text-bold">{{ section.heading }}</h3>
                  <p v-if="section.text" class="uk-text-muted uk-margin-remove-bottom">{{ section.text }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Features & Highlights Section (for scraped/coming soon vehicles) -->
      <div v-if="isScrapedData && (vehicle.features?.length || vehicle.highlights?.length)" class="uk-section uk-section-muted">
        <div class="uk-container uk-container-large">
          <!-- Highlights -->
          <div v-if="vehicle.highlights?.length" class="uk-margin-large-bottom uk-text-center">
            <h2 class="uk-h2 uk-margin-medium-bottom">What to Expect</h2>
            <div class="uk-grid uk-grid-medium uk-child-width-1-1 uk-child-width-1-2@s uk-child-width-1-4@m uk-flex-center" uk-grid>
              <div v-for="(highlight, index) in vehicle.highlights.slice(0, 4)" :key="index">
                <div class="uk-card uk-card-default uk-card-body uk-card-small uk-border-rounded">
                  <p class="uk-text-bold uk-margin-remove">{{ highlight }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Features -->
          <div v-if="vehicle.features?.length">
            <h2 class="uk-h2 uk-margin-medium-bottom uk-text-center">Key Features</h2>
            <div class="uk-grid uk-grid-small uk-child-width-1-2 uk-child-width-1-3@s uk-child-width-1-4@m uk-child-width-1-5@l" uk-grid>
              <div v-for="(feature, index) in vehicle.features" :key="index">
                <div class="uk-flex uk-flex-middle uk-padding-small uk-background-default uk-border-rounded">
                  <span uk-icon="icon: check; ratio: 0.8" class="uk-text-primary uk-margin-small-right"></span>
                  <span class="uk-text-small">{{ feature }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vehicle Images Gallery (for scraped vehicles with multiple images) -->
      <div v-if="isScrapedData && vehicle.images?.length > 2" class="uk-section uk-section-muted">
        <div class="uk-container uk-container-large">
          <h2 class="uk-h2 uk-margin-medium-bottom uk-text-center">Gallery</h2>
          <div class="uk-grid uk-grid-small uk-child-width-1-2 uk-child-width-1-3@m" uk-grid uk-lightbox="animation: fade">
            <div v-for="(image, index) in vehicle.images.slice(0, 6)" :key="index">
              <a :href="image" :data-caption="`${vehicle.model} - Image ${index + 1}`">
                <NuxtImg
                  :src="image"
                  :alt="`${vehicle.model} gallery image ${index + 1}`"
                  class="uk-width-1-1 uk-border-rounded"
                  width="400"
                  height="300"
                  format="webp"
                  quality="80"
                  style="object-fit: cover; aspect-ratio: 4/3;"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Register Interest Form Section -->
      <div v-if="vehicle.form" id="register" class="py-12 bg-gray-50">
        <div class="container mx-auto px-4">
          <RegisterInterestForm
            :vehicle-model="vehicle.model"
            :vehicle-slug="slug"
            :vehicle-image="heroSlide?.desktop"
            source="vehicle_page"
          />
        </div>
      </div>

      <!-- Variant Slider (if no form) -->
      <div v-else id="start" class="uk-margin-large-top">
        <LazyVariantSlider
          v-if="vehicle.model"
          :model="vehicleBaseModel"
          :model-title="formattedModelName"
          :powertrain-filter="vehiclePowertrainFilter"
        />
      </div>

      <!-- Related Used Cars -->
      <div class="uk-background-muted">
        <LazyRelatedVehicles :model="vehicleSearchModel" title="Available Stock" />
      </div>

      <!-- Page Content (from CMS) -->
      <div v-if="vehicle.content?.rendered" class="uk-section">
        <LazyPostContent :content="vehicle.content.rendered" />
      </div>


    </div>

    <!-- Not Found -->
    <div v-else class="uk-section uk-text-center">
      <div class="uk-container">
        <h2>Vehicle Not Found</h2>
        <p class="uk-text-muted">We couldn't find the vehicle you're looking for.</p>
        <NuxtLink to="/build-and-price" class="uk-button uk-button-primary">
          View All Models
        </NuxtLink>
      </div>
    </div>

    <!-- Vehicle Enquiry Modal (for Related Vehicles cards) -->
    <VehicleEnquiryModal
      :is-open="vehiclesStore.vehicleEnquiryPopUp.show"
      :vehicle="vehiclesStore.vehicleEnquiryPopUp.item"
      @close="closeEnquiryModal"
    />
  </div>
</template>

<script setup lang="ts">
import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay, Controller, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Info, X } from 'lucide-vue-next';
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert';

const route = useRoute();

// State for dismissing the scraped data alert
const isAlertDismissed = ref(false);
const vehiclesStore = useVehiclesStore();

// Close enquiry modal
const closeEnquiryModal = () => {
  vehiclesStore.setVehicleEnquiryPopUp(false, null);
};

const slug = computed(() => route.params.slug as string);

// Fetch vehicle data from the new API endpoint
const { data: apiResponse, pending, error } = await useFetch(() => `/api/vehicle/${slug.value}`, {
  key: `vehicle-${slug.value}`,
  watch: [slug],
});

// Extract vehicle from response
const vehicle = computed(() => apiResponse.value?.vehicle || null);

// Check if this is scraped/placeholder data (not from CDN)
const isScrapedData = computed(() => {
  return apiResponse.value?.source === 'scraped' ||
         apiResponse.value?.source === 'scraped-cache' ||
         vehicle.value?.isScraped === true;
});

// Hero slide data
const heroSlide = computed(() => vehicle.value?.header?.slides?.[0] || {});

// Formatted model name for display (uses header heading or formats the slug)
const formattedModelName = computed(() => {
  // First try to get the proper name from the header heading
  const heading = heroSlide.value?.heading;
  if (heading) {
    // Remove trailing period if present (e.g., "KONA Electric." -> "KONA Electric")
    return heading.replace(/\.$/, '');
  }

  // Fallback: format the slug nicely
  // "kona-electric" -> "Kona Electric"
  return slug.value
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
});

// Extract base model name for API calls and related vehicles search
// Converts slugs like 'kona-electric' to 'kona', 'i30-sedan-n' to 'i30', etc.
const vehicleSearchModel = computed(() => {
  const slugValue = slug.value;
  if (!slugValue) return '';

  // Common model name patterns that should be preserved as-is
  const knownModels = ['santa-fe', 'staria-load', 'palisade', 'tucson', 'venue', 'kona', 'i30', 'inster', 'ioniq'];

  // Check if slug starts with a known model
  for (const model of knownModels) {
    if (slugValue === model || slugValue.startsWith(model + '-')) {
      return model;
    }
  }

  // Fallback: use the first part of the slug (before any variant suffix)
  // This handles cases like 'tucson-n-line' -> 'tucson'
  const parts = slugValue.split('-');
  return parts[0];
});

// Base model name for the calculator API.
// IONIQ slugs need to stay specific; Hyundai's calculator has no generic "ioniq" model.
const vehicleBaseModel = computed(() => {
  const slugValue = slug.value?.toLowerCase() || '';

  const calculatorModelOverrides: Record<string, string> = {
    'ioniq-6-n': 'ioniq-6',
  };

  if (calculatorModelOverrides[slugValue]) {
    return calculatorModelOverrides[slugValue];
  }

  const specificIoniqModels = ['ioniq-5-n', 'ioniq-5', 'ioniq-6', 'ioniq-9'];
  const matchedIoniqModel = specificIoniqModels.find((model) =>
    slugValue === model || slugValue.startsWith(`${model}-`)
  );

  if (matchedIoniqModel) {
    return matchedIoniqModel;
  }

  return vehicleSearchModel.value;
});

// Detect powertrain type from slug for filtering variants
// e.g., 'kona-electric' -> 'Electric', 'kona-hybrid' -> 'Hybrid', 'kona' -> null
const vehiclePowertrainFilter = computed(() => {
  const slugValue = slug.value?.toLowerCase() || '';

  if (slugValue.includes('electric') || slugValue.includes('-ev')) {
    return 'Electric';
  }
  if (slugValue.includes('hybrid')) {
    return 'Hybrid';
  }

  return null; // No filter - show all powertrains
});

// SEO
const { siteName } = useSiteIdentity();

useSiteMeta({
  title: () => vehicle.value?.model || 'Vehicle',
  description: () => vehicle.value?.description || `Explore the ${vehicle.value?.model || 'vehicle'} at ${siteName.value}.`,
  image: () => heroSlide.value?.desktop || '',
});

// Convert legacy swiper-lazy images (data-src) to use native lazy loading (src)
const fixLegacyLazyImages = () => {
  if (!import.meta.client) return;
  
  const lazyImages = document.querySelectorAll('img.swiper-lazy[data-src]');
  lazyImages.forEach((img) => {
    const dataSrc = img.getAttribute('data-src');
    if (dataSrc) {
      img.setAttribute('src', dataSrc);
      img.setAttribute('loading', 'lazy');
      img.removeAttribute('data-src');
    }
  });
};

// Initialize Swiper instances for CMS content
const initSwipers = () => {
  if (!import.meta.client) return;
  
  // Wait for DOM to be ready with content
  nextTick(() => {
    setTimeout(() => {
      // Fix legacy lazy loading images from CMS content
      fixLegacyLazyImages();
      
      // Gallery thumbs slider
      const galleryThumbsEl = document.querySelector('.gallery-thumbs');
      const galleryTopEl = document.querySelector('.gallery-top');
      
      if (galleryThumbsEl && galleryTopEl) {
        const galleryThumbs = new Swiper('.gallery-thumbs', {
          modules: [Pagination, Autoplay, Controller],
          spaceBetween: 10,
          loop: true,
          autoplay: {
            delay: 3000,
          },
          pagination: {
            el: '.swiper-pagination',
            clickable: true,
          },
        });
        
        const galleryTop = new Swiper('.gallery-top', {
          modules: [Navigation, Controller],
          spaceBetween: 10,
          slidesPerView: 1,
          loop: true,
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
        });
        
        // Link the two swipers
        if (galleryThumbs.controller && galleryTop.controller) {
          galleryThumbs.controller.control = galleryTop;
          galleryTop.controller.control = galleryThumbs;
        }
      }
      
      // Gallery icon sliders (for safety features)
      const galleryIconBottomEl = document.querySelector('.gallery-icon-bottom');
      const galleryIconThumbsEl = document.querySelector('.gallery-icon-thumbs');
      
      if (galleryIconBottomEl && galleryIconThumbsEl) {
        const galleryIconThumbs = new Swiper('.gallery-icon-thumbs', {
          modules: [Controller],
          spaceBetween: 0,
          slidesPerView: 4,
          centeredSlides: true,
          slideToClickedSlide: true,
          watchSlidesProgress: true,
          breakpoints: {
            320: { slidesPerView: 2, spaceBetween: 20 },
            480: { slidesPerView: 3, spaceBetween: 30 },
            640: { slidesPerView: 5, spaceBetween: 10 },
          },
        });
        
        const galleryIconBottom = new Swiper('.gallery-icon-bottom', {
          modules: [Navigation, Controller],
          spaceBetween: 0,
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
        });
        
        // Link the two swipers
        if (galleryIconThumbs.controller && galleryIconBottom.controller) {
          galleryIconThumbs.controller.control = galleryIconBottom;
          galleryIconBottom.controller.control = galleryIconThumbs;
        }
      }
    }, 1500); // Delay to ensure content is rendered
  });
};

// Add body class for vehicle page styling
onMounted(() => {
  document.body.classList.add('vehicle-page');
  initSwipers();
});

// Re-initialize swipers when vehicle data changes
watch(vehicle, () => {
  if (vehicle.value) {
    initSwipers();
  }
});

onBeforeUnmount(() => {
  document.body.classList.remove('vehicle-page');
});
</script>

<style lang="scss" scoped>
.uk-gradient {
  height: 50%;
  background: linear-gradient(to top, rgba(0, 0, 0, 1), transparent 68.91%);
  pointer-events: none;
}

.bounce {
  animation: bounce 3s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 70%, 90% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.spec-strip-grid {
  position: relative;
  z-index: 2;
}

.heading-btn {
  @media (max-width: 960px) {
    margin-top: 30px;
  }
}
</style>

<style lang="scss">
/* Swiper styles for CMS content - unscoped to affect v-html content */
.vehicle-detail-page {
  .swiper-container,
  .swiper {
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    overflow: hidden;
  }
  
  .swiper-slide {
    background-size: cover;
    background-position: center;
  }
  
  .gallery-thumbs {
    height: 50%;
    box-sizing: border-box;
    padding: 10px 0;
    overflow: hidden;
    
    .swiper-button-next,
    .swiper-button-prev {
      top: auto;
      bottom: 20px;
    }
  }
  
  .adme-slider__pagination {
    text-align: center;
    margin-top: 30px;
    
    .swiper-pagination-bullet {
      display: inline-block;
      opacity: 0.2;
      margin: 0 5px;
      border-radius: 20px;
      transition: opacity 0.5s, background-color 0.5s, width 0.5s;
      transition-delay: 0.5s, 0.5s, 0s;
    }
    
    .swiper-pagination-bullet-active {
      opacity: 1;
      background: #00aad2;
      width: 100px;
      transition-delay: 0s;
    }
  }
  
  .gallery-icon-thumbs {
    height: 20%;
    box-sizing: border-box;
    padding: 10px 0;
    
    .swiper-slide {
      opacity: 0.4;
      backface-visibility: hidden;
      cursor: pointer;
      opacity: 0.5;
      text-align: center;
      transform: scale(0.9);
      transform-style: preserve-3d;
      transition: opacity 0.3s, transform 0.3s;
      width: 140px;
    }
    
    .swiper-slide-active {
      opacity: 1;
      transform: scale(1);
    }
    
    .swiper-slide:hover {
      transform: scale(1);
    }
    
    .swiper-button-next::after,
    .swiper-button-prev::after {
      color: #222;
      font-size: 20px;
    }
  }
  
  .icon-width-small {
    width: 41px;
  }
  
  .icon-width-medium {
    width: 55px;
  }
  
  .icon-sl-text-small {
    color: #000;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    margin: 5px 0;
  }
  
  .icon-width-wrap {
    background: linear-gradient(4deg, rgba(255, 255, 255, 1) 15.25%, #eef1f4 15.30%, #eef1f4) !important;
    padding-bottom: 100px;
  }
  
  @media (min-width: 960px) {
    .gallery-thumbs {
      left: -90px;
      position: relative;
      z-index: 3;
    }
    
    .height-viewport {
      height: 100vh;
      max-height: 1300px;
    }
    
    .gallery-thumb-card {
      min-width: 400px;
    }
  }
  
  /* Hotspot marker animations */
  .tm-popover-items .uk-marker {
    color: #071446;
  }
  
  .inner-circle {
    color: #222;
    background-color: rgba(255, 255, 255, 0.37);
  }
  
  .outer-circle {
    width: 20px;
    height: 20px;
    position: absolute;
    background-color: #fff;
    border-radius: 50%;
    transform-origin: 50% 50%;
    animation: fadding 1.3s infinite;
  }
  
  .inner-circle.uk-active,
  .inner-circle.uk-active .outer-circle {
    background-color: #00aad2;
  }
  
  .inner-circle.uk-active svg {
    opacity: 0;
  }
  
  @keyframes fadding {
    0% {
      opacity: 1;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @media (min-width: 960px) {
    .maker-overflow {
      overflow-y: visible !important;
    }
    
    .maker-overflow.uk-slider-container {
      overflow: visible;
    }
  }
  
  /* Owning benefits section */
  .owning-benefits {
    .icon img {
      max-height: 21px;
      max-width: 21px;
    }
    
    .uk-card-body {
      box-shadow: 0 5px 35px rgba(0, 0, 0, 0.1);
    }
    
    .icon {
      align-items: center;
      background: #002c5f;
      border-radius: 50%;
      color: #fff;
      display: flex;
      height: 43px;
      justify-content: center;
      left: 50%;
      margin-left: -21.5px;
      position: absolute;
      text-align: center;
      top: -21.5px;
      width: 43px;
    }
    
    @media (min-width: 768px) {
      .icon img {
        max-height: 42px;
        max-width: 42px;
      }
      
      .icon {
        height: 86px;
        margin-left: -43px;
        top: -43px;
        width: 86px;
      }
    }
    
    @media (max-width: 768px) {
      h3 {
        font-size: 16px;
        line-height: 1.25;
        margin-bottom: 0.45em;
      }
      
      .uk-card-body,
      & {
        padding: 10px;
      }
      
      .uk-grid-large {
        margin-left: -10px;
      }
      
      .uk-grid-column-large > *,
      .uk-grid-large > * {
        padding-left: 10px;
      }
    }
  }
}
</style>



