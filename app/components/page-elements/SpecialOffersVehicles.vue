<template>
  <section class="special-offers-vehicles py-16 bg-white">
    <div class="mx-auto container px-4">
      <!-- Section Header -->
      <div class="text-center mb-10">
        <h2 class="section-heading mb-4">
          Stock Specials
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Don't miss out on these limited-time offers on our current stock
        </p>
      </div>

      <!-- Loading State -->
      <ClientOnly>
        <div v-if="loading" class="flex justify-center py-16">
          <div uk-spinner></div>
        </div>
      </ClientOnly>

      <!-- Error State -->
      <div v-if="!loading && error" class="py-16 text-center">
        <p class="text-red-600 text-lg">{{ error }}</p>
      </div>

      <!-- Vehicles Grid -->
      <div v-if="!loading && !error && vehicles.length > 0">
        <!-- Desktop Grid -->
        <div class="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ModernVehicleCard
            v-for="vehicle in displayedVehicles"
            :key="vehicle.stockid || vehicle.identifier || vehicle.id"
            :vehicle="vehicle"
          />
        </div>

        <!-- Mobile Swiper -->
        <div class="md:hidden">
          <ClientOnly>
            <swiper
              :modules="modules"
              :slides-per-view="1.15"
              :space-between="16"
              :pagination="{ clickable: true }"
              class="special-offers-swiper"
            >
              <swiper-slide
                v-for="vehicle in displayedVehicles"
                :key="vehicle.stockid || vehicle.identifier || vehicle.id"
                class="h-auto pb-2"
              >
                <ModernVehicleCard :vehicle="vehicle" />
              </swiper-slide>
            </swiper>

            <template #fallback>
              <div class="text-center py-8">
                <div uk-spinner></div>
              </div>
            </template>
          </ClientOnly>
        </div>

        <!-- View All Button -->
        <div class="text-center mt-10">
          <NuxtLink
            to="/cars-for-sale"
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
            to="/cars-for-sale"
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
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

// Props
interface Props {
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  limit: 8,
});

// Swiper modules
const modules = [Pagination];

// State
const loading = ref(true);
const error = ref<string | null>(null);
const vehicles = ref<any[]>([]);

// Computed: limit displayed vehicles
const displayedVehicles = computed(() => {
  return vehicles.value.slice(0, props.limit);
});

// Fetch vehicles with stock_special flag
const fetchSpecialOffers = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Fetch from carsales-feed and filter for stock_special vehicles
    const response = await $fetch<{ vehiclesData: any[] }>('/api/carsales-feed');

    if (response?.vehiclesData) {
      // Filter vehicles that have stock_special flag
      const specialVehicles = response.vehiclesData.filter(
        (vehicle: any) => vehicle.stock_special?.value?.includes('stock-special')
      );

      vehicles.value = specialVehicles;
    } else {
      vehicles.value = [];
    }
  } catch (err: any) {
    console.error('Failed to fetch special offers:', err);
    error.value = 'Unable to load special offers';
    vehicles.value = [];
  } finally {
    loading.value = false;
  }
};

// Fetch on mount
onMounted(() => {
  fetchSpecialOffers();
});
</script>

<style scoped>
.special-offers-swiper {
  padding-bottom: 50px;
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
</style>
