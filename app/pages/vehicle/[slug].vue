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
                  <NuxtLink 
                    :to="`/calculator/${slug}`" 
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
                <img 
                  :src="heroSlide.desktop"
                  :alt="vehicle.model"
                  class="uk-visible@m uk-width-1-1" 
                  uk-cover
                />
                <img 
                  :src="heroSlide.mobile || heroSlide.desktop"
                  :alt="vehicle.model"
                  class="uk-hidden@m uk-width-1-1" 
                  uk-cover
                />
              </template>
            </ClientOnly>
          </div>
          <div class="uk-position-bottom uk-width-1-1 uk-gradient"></div>
        </div>
      </div>

      <!-- Form Section (if vehicle has form) -->
      <div v-if="vehicle.form" :class="[vehicle.formbg === 'uk-light' ? 'uk-background-secondary uk-light' : '']">
        <div class="uk-container form-wrap" :class="[vehicle.form === 'Contact' ? 'uk-container-large' : 'uk-container-xsmall']">
          <component 
            :is="dynamicFormComponent" 
            activeHoursTab="register" 
            class="uk-margin-large-bottom uk-margin-large-top" 
            id="register"
          />
        </div>
      </div>

      <!-- Variant Slider (if no form) -->
      <div v-else id="start" class="uk-margin-large-top">
        <LazyVariantSlider 
          v-if="vehicle.model" 
          :model="vehicle.model" 
          :model-title="slug" 
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

      <!-- CTA Section -->
      <div v-if="!vehicle.form" class="uk-section uk-section-primary uk-light uk-text-center">
        <div class="uk-container">
          <h2>Ready to Experience the {{ vehicle.model }}?</h2>
          <p class="uk-text-lead">Book a test drive today and discover what makes it special.</p>
          <div class="uk-margin-medium-top uk-grid-small uk-flex-center" uk-grid>
            <div>
              <NuxtLink to="/test-drive" class="uk-button uk-button-default uk-button-large">
                Book Test Drive
              </NuxtLink>
            </div>
            <div>
              <NuxtLink :to="`/variant/${slug}`" class="uk-button uk-button-secondary uk-button-large">
                Enquire Now
              </NuxtLink>
            </div>
          </div>
        </div>
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
import { defineAsyncComponent } from 'vue';
import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay, Controller, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const route = useRoute();
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

// Hero slide data
const heroSlide = computed(() => vehicle.value?.header?.slides?.[0] || {});

// Extract base model name for related vehicles search
// Converts slugs like 'i30-sedan-n' to 'i30', 'santa-fe' to 'santa-fe', etc.
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

// Dynamic form component - only ContactForm is available in Nuxt
const dynamicFormComponent = computed(() => {
  if (!vehicle.value?.form) return null;
  
  // Both Register and Contact use ContactForm in Nuxt (RegisterForm not ported)
  if (vehicle.value.form === 'Register' || vehicle.value.form === 'Contact') {
    return defineAsyncComponent(() => import('~/components/page-elements/ContactForm.vue'));
  }
  return null;
});

// SEO
useSiteMeta({
  title: () => vehicle.value?.model || 'Vehicle',
  description: () => vehicle.value?.description || `Explore the ${vehicle.value?.model || 'vehicle'} at Sale Hyundai.`,
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

