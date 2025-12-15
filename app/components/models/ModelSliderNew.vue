<template>
  <div>
    <!-- Header section -->
    <div class="uk-container uk-text-center uk-margin-large-top uk-overflow-hidden">
      <div class="uk-container uk-text-center uk-overflow-hidden">
        <div class="uk-text-light space33">HYUNDAI RANGE</div>
        <h2 class="uk-h2 uk-text-lighter uk-margin-small">
          A uniquely progressive collection of vehicles, each one the product of our
          defining commitment to creating a 
          <span class="uk-text-bold uk-text-uppercase">
            better, smarter, more sustainable future.
          </span>
        </h2>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="uk-text-center uk-padding">
      <div uk-spinner></div>
      <p class="uk-margin-small-top">Loading vehicles...</p>
    </div>

    <div v-else-if="vehicles.length" class="uk-margin-medium-top uk-width-expand@s">
      <div class="showroom-menu uk-margin-medium-bottom">
        <!-- Category tabs -->
        <div class="uk-margin-auto uk-flex uk-flex-center">
          <ul class="uk-subnav models--Category uk-flex-nowrap uk-margin-remove-top uk-overflow-auto" uk-tab>
            <li 
              v-for="(category, index) in filteredCategories" 
              :key="index"
              :class="{ 'uk-active': activeTab === index }"
              @click="switchTab(index)"
            >
              <a href="#" @click.prevent class="uk-text-primary uk-text-capitalize">
                {{ category }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Vehicle grid with Swiper slider -->
        <div class="slider-container">
          <ClientOnly>
            <swiper
              :modules="modules"
              :slides-per-view="1"
              :space-between="20"
              :navigation="{
                nextEl: '.swiper-button-next-model',
                prevEl: '.swiper-button-prev-model',
              }"
              :pagination="{
                el: '.swiper-pagination-model',
                clickable: true,
              }"
              :breakpoints="swiperBreakpoints"
              class="model-swiper"
              @swiper="onSwiper"
            >
              <swiper-slide
                v-for="(vehicle, index) in filteredVehicles"
                :key="`${vehicle.slug}-${index}`"
                class="vehicle-slide"
              >
                <div class="uk-card uk-card-default uk-card-hover uk-height-1-1 uk-flex uk-flex-column">
                  <div class="uk-flex uk-flex-column uk-height-1-1">
                    <div class="uk-card-media-top">
                      <NuxtLink :to="'/vehicle/' + vehicle.slug" class="uk-text-muted">
                        <img 
                          :src="vehicle.image"
                          :alt="vehicle.name"
                          width="357"
                          height="137"
                          class="uk-width-1-1 uk-margin-medium-bottom"
                          loading="lazy"
                        />
                      </NuxtLink>
                    </div>

                    <div class="uk-card-body uk-padding uk-padding-remove-top uk-flex-1">
                      <div class="uk-width-1-1 uk-text-bold uk-text-lead uk-text-secondary uk-text-uppercase">
                        {{ vehicle.name }}
                      </div>
                      <div v-if="vehicle.categoryDescription" class="uk-width-1-1 uk-text-meta uk-text-truncate">
                        {{ vehicle.categoryDescription }}
                      </div>
                    </div>

                    <div class="uk-margin-medium-bottom">
                      <div class="uk-child-width-auto uk-flex uk-flex-center uk-grid-small uk-grid">
                        <div>
                          <NuxtLink 
                            :to="'/vehicle/' + vehicle.slug"
                            class="coloredsvg uk-text-center uk-button uk-button-primary uk-text-light uk-text-capitalize"
                          >
                            Discover <span uk-icon="chevron-right"></span>
                          </NuxtLink>
                        </div>
                        <div>
                          <NuxtLink 
                            :to="'/calculator/' + vehicle.slug"
                            class="coloredsvg uk-text-center uk-button uk-button-primary uk-text-light uk-text-capitalize"
                          >
                            Enquire <span uk-icon="chevron-right"></span>
                          </NuxtLink>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </swiper-slide>
            </swiper>

            <template #fallback>
              <div class="uk-text-center uk-padding">
                <div uk-spinner></div>
              </div>
            </template>
          </ClientOnly>

          <!-- Swiper Pagination -->
          <div class="swiper-pagination-model uk-margin-medium-top"></div>

          <!-- Swiper Navigation -->
          <div class="uk-padding-small uk-flex uk-flex-center">
            <button class="swiper-button-prev-model tm-slidenav uk-padding-small uk-margin-small-right uk-overlay-primary">
              <span uk-icon="chevron-left"></span>
            </button>
            <button class="swiper-button-next-model tm-slidenav uk-padding-small uk-margin-small-left uk-overlay-primary">
              <span uk-icon="chevron-right"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="uk-flex uk-flex-center">
      <button class="uk-button uk-button-large uk-button-primary" title="Explore models" uk-toggle="target: #offcanvas-models">
        Explore all models
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// State
const activeTab = ref(0);
const swiperInstance = ref<any>(null);

// Swiper modules
const modules = [Navigation, Pagination];

// Swiper breakpoints for responsive design
const swiperBreakpoints = {
  640: {
    slidesPerView: 2,
    spaceBetween: 20,
  },
  960: {
    slidesPerView: 3,
    spaceBetween: 30,
  },
  1200: {
    slidesPerView: 4,
    spaceBetween: 30,
  },
};

// Use shared composable to avoid duplicate fetches
const { variants: vehicles, pending } = useAllVariants();

const filteredCategories = computed(() => {
  const categories = ['All'];
  const vehicleList = vehicles.value || [];
  
  vehicleList.forEach((vehicle: any) => {
    if (vehicle.category && !categories.includes(vehicle.category)) {
      categories.push(vehicle.category);
    }
  });

  return categories;
});

const filteredVehicles = computed(() => {
  const vehicleList = vehicles.value || [];
  const activeCategory = filteredCategories.value[activeTab.value];
  
  if (activeCategory === 'All') {
    return vehicleList;
  }

  return vehicleList.filter((vehicle: any) => vehicle.category === activeCategory);
});

// Methods
const switchTab = (index: number) => {
  activeTab.value = index;
  // Reset swiper to first slide when tab changes
  nextTick(() => {
    if (swiperInstance.value) {
      swiperInstance.value.slideTo(0);
    }
  });
};

const onSwiper = (swiper: any) => {
  swiperInstance.value = swiper;
};

// Watch for filtered vehicles changes and reset swiper
watch(filteredVehicles, () => {
  nextTick(() => {
    if (swiperInstance.value) {
      swiperInstance.value.update();
      swiperInstance.value.slideTo(0);
    }
  });
});
</script>

<style scoped>
.models--Category {
  padding: 20px;
}

.slider-container {
  padding: 20px 0;
  position: relative;
}

.model-swiper {
  padding-bottom: 50px;
}

.vehicle-slide {
  height: auto;
  display: flex;
}

.vehicle-slide .uk-card {
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
}

.uk-tab > .uk-active > a {
  color: #00aad2 !important;
  border-color: #00aad2;
  border-width: 5px;
}

.uk-card {
  display: flex;
  flex-direction: column;
}

.uk-card-body {
  flex: 1 0 auto;
}

/* Swiper Navigation Buttons */
.swiper-button-prev-model,
.swiper-button-next-model {
  position: relative;
  width: auto;
  height: auto;
  margin: 0;
  background: rgba(0, 170, 210, 0.1);
  border-radius: 50%;
  color: #00aad2;
  transition: all 0.3s ease;
}

.swiper-button-prev-model:hover,
.swiper-button-next-model:hover {
  background: rgba(0, 170, 210, 0.2);
}

.swiper-button-prev-model::after,
.swiper-button-next-model::after {
  display: none;
}

.swiper-button-prev-model.swiper-button-disabled,
.swiper-button-next-model.swiper-button-disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Swiper Pagination */
:deep(.swiper-pagination-model) {
  position: relative;
  bottom: 0;
  margin-top: 20px;
}

:deep(.swiper-pagination-model .swiper-pagination-bullet) {
  width: 12px;
  height: 12px;
  background-color: rgba(0, 170, 210, 0.3);
  opacity: 1;
  transition: all 0.3s ease;
}

:deep(.swiper-pagination-model .swiper-pagination-bullet-active) {
  background-color: #00aad2;
  transform: scale(1.2);
}
</style>






