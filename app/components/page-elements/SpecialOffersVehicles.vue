<template>
  <section class="special-offers-vehicles bg-slate-50 overflow-hidden relative z-0">
    <div class="mx-auto container px-4">
      <!-- Section Header -->
      <div class="special-offers-header text-center">
        <h2 class="section-heading mb-4">
          Stock Specials
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Don't miss out on these limited-time offers on our current stock
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="special-offers-loading" aria-busy="true">
        <div uk-spinner></div>
      </div>

      <!-- Error State -->
      <div v-if="!loading && error" class="py-16 text-center">
        <p class="text-red-600 text-lg">{{ error }}</p>
      </div>

      <!-- Vehicles Carousel -->
      <div v-if="!loading && !error && vehicles.length > 0" class="relative">
        <ClientOnly>
          <swiper
            :modules="modules"
            :slides-per-view="1.15"
            :space-between="16"
            :navigation="{
              nextEl: '.special-offers-next',
              prevEl: '.special-offers-prev',
            }"
            :pagination="{ clickable: true }"
            :breakpoints="{
              640: { slidesPerView: 2.2, spaceBetween: 20 },
              1024: { slidesPerView: 3.2, spaceBetween: 24 },
              1280: { slidesPerView: 4, spaceBetween: 24 },
            }"
            class="special-offers-swiper"
          >
            <swiper-slide
              v-for="vehicle in displayedVehicles"
              :key="vehicle.stockid || vehicle.identifier || vehicle.id"
              class="h-auto pb-2"
            >
              <!-- Wrapper with badges -->
              <div class="relative h-full">
                <!-- Special Tags - Top Left -->
                <div class="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                  <span class="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                    <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Special
                  </span>
                  <span class="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Stock Special
                  </span>
                </div>
                <ModernVehicleCard :vehicle="vehicle" />
              </div>
            </swiper-slide>
          </swiper>

          <!-- Custom Navigation Arrows -->
          <button
            class="special-offers-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 hidden lg:flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous vehicles"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            class="special-offers-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 hidden lg:flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next vehicles"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <template #fallback>
            <div class="text-center py-8">
              <div uk-spinner></div>
            </div>
          </template>
        </ClientOnly>

        <!-- View All Button -->
        <div class="text-center mt-10">
          <NuxtLink
            to="/car-sales"
            class="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            View All Vehicles
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !error && vehicles.length === 0" class="py-16 text-center">
        <div class="max-w-md mx-auto">
          <div class="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-gray-500 text-lg">No special offers available at the moment</p>
          <NuxtLink
            to="/car-sales"
            class="inline-block mt-4 text-primary font-medium hover:underline"
          >
            Browse all vehicles
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Props
interface Props {
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  limit: 10,
});

// Swiper modules
const modules = [Navigation, Pagination];

// Fetch vehicles with SSR support using useAsyncData
const specialOffersVehiclesKey = getRuntimeTenantCacheKey('special-offers-vehicles');
const { data: vehiclesData, status, error } = await useAsyncData(
  specialOffersVehiclesKey,
  async () => {
    const response = await $fetch<{ vehiclesData: any[] }>('/api/carsales-feed');
    if (response?.vehiclesData) {
      // Filter vehicles that have stock_special flag
      return response.vehiclesData.filter(
        (vehicle: any) => vehicle.stock_special?.value?.includes('stock-special')
      );
    }
    return [];
  },
  {
    // Cache for 5 minutes to reduce API calls
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] || nuxtApp.static.data[key],
    server: false,
    lazy: true,
    default: () => [],
  }
);

// Computed state from useAsyncData
const loading = computed(() => status.value === 'idle' || status.value === 'pending');
const vehicles = computed(() => vehiclesData.value || []);

// Computed: limit displayed vehicles
const displayedVehicles = computed(() => {
  return vehicles.value.slice(0, props.limit);
});
</script>

<style scoped>
.special-offers-vehicles {
  isolation: isolate; /* Create new stacking context */
  padding-top: clamp(72px, 8vw, 112px);
  padding-bottom: clamp(72px, 8vw, 112px);
}

.special-offers-header {
  margin-bottom: clamp(36px, 4vw, 48px);
  padding-top: 8px;
}

.special-offers-swiper {
  padding: 8px 4px 50px;
  overflow: visible;
}

.special-offers-loading {
  min-height: 640px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.swiper-pagination) {
  position: relative;
  margin-top: 16px;
}

:deep(.swiper-pagination-bullet) {
  width: 10px;
  height: 10px;
  background-color: rgba(0, 44, 95, 0.3);
  opacity: 1;
  transition: all 0.3s ease;
}

:deep(.swiper-pagination-bullet-active) {
  background-color: #002c5f;
  transform: scale(1.2);
}

/* Ensure navigation buttons are styled correctly when disabled */
:deep(.swiper-button-disabled) {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 639px) {
  .special-offers-vehicles {
    padding-top: 64px;
    padding-bottom: 80px;
  }
}

/* Container needs relative positioning for absolute arrows */
@media (min-width: 1024px) {
  .special-offers-vehicles .container {
    padding-left: 3rem;
    padding-right: 3rem;
  }
}
</style>
