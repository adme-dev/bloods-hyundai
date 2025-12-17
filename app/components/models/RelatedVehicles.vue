<template>
  <!-- Hide entire section if no vehicles and not loading -->
  <div v-if="loading || vehicles.length" class="related-vehicles uk-section">
    <div class="uk-container">
      <h2 class="uk-text-center uk-margin-medium-bottom">
        {{ title || 'Related Vehicles' }}
      </h2>

      <!-- Loading -->
      <div v-if="loading" class="uk-text-center uk-padding">
        <div uk-spinner></div>
      </div>

      <!-- Vehicles Carousel -->
      <div v-else-if="vehicles.length" class="vehicles-carousel">
        <!-- Previous Button -->
        <button
          v-if="vehicles.length > 1"
          class="carousel-nav carousel-nav--prev"
          :disabled="!canScrollPrev"
          @click="scrollPrev"
          aria-label="Previous"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Carousel Viewport -->
        <div class="carousel-viewport" ref="emblaRef">
          <div class="carousel-container">
            <div
              v-for="vehicle in vehicles"
              :key="vehicle.stockid || vehicle.identifier"
              class="carousel-slide"
            >
              <ModernVehicleCard :vehicle="vehicle" />
            </div>
          </div>
        </div>

        <!-- Next Button -->
        <button
          v-if="vehicles.length > 1"
          class="carousel-nav carousel-nav--next"
          :disabled="!canScrollNext"
          @click="scrollNext"
          aria-label="Next"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- View All Button -->
      <div v-if="vehicles.length" class="flex justify-center mt-8">
        <NuxtLink 
          :to="viewAllLink"
          class="inline-flex items-center gap-2 rounded-xl border-2 border-slate-800 bg-slate-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          Explore Our Stock
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import emblaCarouselVue from 'embla-carousel-vue';

interface Props {
  model?: string;
  title?: string;
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  limit: 8,
});

const loading = ref(true);
const vehicles = ref<any[]>([]);

// Embla Carousel setup
const [emblaRef, emblaApi] = emblaCarouselVue({
  loop: false,
  align: 'start',
  containScroll: 'trimSnaps',
  slidesToScroll: 1,
  breakpoints: {
    '(min-width: 640px)': { slidesToScroll: 2 },
    '(min-width: 960px)': { slidesToScroll: 3 },
    '(min-width: 1200px)': { slidesToScroll: 4 },
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

// Watch for embla API initialization
watch(() => emblaApi.value, (api) => {
  if (!api) return;
  
  updateButtons();
  api.on('select', updateButtons);
  api.on('reInit', updateButtons);
});

// Reinitialize carousel when vehicles change
watch(vehicles, () => {
  nextTick(() => {
    emblaApi.value?.reInit();
    updateButtons();
  });
});

const viewAllLink = computed(() => {
  if (props.model) {
    return `/car-sales?make=hyundai&model=${props.model}&makeModels=hyundai:${props.model}`;
  }
  return '/car-sales';
});

onMounted(async () => {
  await fetchVehicles();
});

watch(() => props.model, () => {
  fetchVehicles();
});

const fetchVehicles = async () => {
  loading.value = true;
  
  try {
    const params: Record<string, any> = {
      make: 'hyundai',
      limit: props.limit,
    };
    
    if (props.model) {
      params.model = props.model;
      // Add makeModels association for proper faceted filtering
      params.makeModels = `hyundai:${props.model}`;
    }
    
    // Use the internal /api/search endpoint
    const response = await $fetch<any>('/api/search', { params });
    vehicles.value = response.vehicles || [];
  } catch (err) {
    console.error('Failed to fetch related vehicles:', err);
    vehicles.value = [];
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.vehicles-carousel {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.carousel-viewport {
  overflow: hidden;
  flex: 1;
}

.carousel-container {
  display: flex;
  gap: 1rem;
}

.carousel-slide {
  flex: 0 0 100%;
  min-width: 0;
}

@media (min-width: 640px) {
  .carousel-slide {
    flex: 0 0 calc(50% - 0.5rem);
  }
}

@media (min-width: 960px) {
  .carousel-slide {
    flex: 0 0 calc(33.333% - 0.667rem);
  }
}

@media (min-width: 1200px) {
  .carousel-slide {
    flex: 0 0 calc(25% - 0.75rem);
    min-width: 300px;
  }
}

.carousel-nav {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid #e5e5e5;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.carousel-nav:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #ccc;
}

.carousel-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Hide nav buttons on mobile */
@media (max-width: 639px) {
  .carousel-nav {
    display: none;
  }
  
  .vehicles-carousel {
    gap: 0;
  }
}
</style>




