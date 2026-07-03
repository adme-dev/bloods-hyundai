<template>
  <section class="featured-accessories py-16 bg-white overflow-hidden">
    <div class="mx-auto container px-4">
      <!-- Section Header -->
      <div class="text-center mb-10">
        <h2 class="section-heading mb-4">
          Hyundai Genuine Accessories
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Personalise your Hyundai with genuine accessories. All backed by a 5-year warranty.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="accessories-loading" aria-busy="true">
        <div uk-spinner></div>
      </div>

      <!-- Error State (silent - just hide section) -->
      <template v-if="!loading && !error && accessories.length > 0">
        <!-- Accessories Carousel -->
        <div class="relative">
          <ClientOnly>
            <swiper
              :modules="modules"
              :slides-per-view="1.15"
              :space-between="16"
              :navigation="{
                nextEl: '.accessories-next',
                prevEl: '.accessories-prev',
              }"
              :pagination="{ clickable: true }"
              :breakpoints="{
                640: { slidesPerView: 2.2, spaceBetween: 20 },
                1024: { slidesPerView: 3.2, spaceBetween: 24 },
                1280: { slidesPerView: 4, spaceBetween: 24 },
              }"
              class="accessories-swiper"
            >
              <swiper-slide
                v-for="accessory in accessories"
                :key="accessory.id"
                class="h-auto pb-2"
              >
                <article
                  class="group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer"
                  @click="navigateToAccessory(accessory)"
                >
                  <!-- Popular Badge -->
                  <div v-if="accessory.isPopular" class="absolute top-3 left-3 z-10">
                    <span class="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Popular
                    </span>
                  </div>

                  <!-- Model Badge - Top Right -->
                  <div class="absolute top-3 right-3 z-10">
                    <span class="inline-flex items-center rounded-md bg-primary/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                      {{ accessory.modelName }}
                    </span>
                  </div>

                  <!-- Image -->
                  <div class="relative aspect-[16/10] w-full overflow-hidden bg-slate-50">
                    <NuxtImg
                      v-if="accessory.image"
                      :src="accessory.image"
                      :alt="accessory.name"
                      class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      width="320"
                      height="200"
                      format="webp"
                      quality="80"
                    />
                    <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
                      <svg class="h-20 w-20 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  <!-- Content -->
                  <div class="flex flex-1 flex-col p-4">
                    <!-- Category -->
                    <span class="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                      {{ accessory.category }}
                    </span>

                    <!-- Name -->
                    <h3 class="m-0 line-clamp-2 text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-primary">
                      {{ accessory.name }}
                    </h3>

                    <!-- Description -->
                    <p v-if="accessory.description" class="mb-3 line-clamp-2 text-sm text-slate-600">
                      {{ accessory.description }}
                    </p>

                    <!-- Price & CTA -->
                    <div class="mt-auto flex items-end justify-between gap-2">
                      <div>
                        <div class="text-2xl font-bold text-primary">
                          ${{ formatPrice(accessory.price) }}
                        </div>
                        <div class="text-xs text-slate-500">Price Inc. GST*</div>
                      </div>

                      <!-- View Button -->
                      <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-all group-hover:bg-primary/90 group-hover:shadow-md">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </article>
              </swiper-slide>
            </swiper>

            <!-- Custom Navigation Arrows -->
            <button
              class="accessories-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 hidden lg:flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous accessories"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              class="accessories-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 hidden lg:flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next accessories"
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
              to="/accessories"
              class="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Shop All Accessories
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface FeaturedAccessory {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string | null;
  isPopular: boolean;
  modelName: string;
  modelSlug: string;
}

// Props
interface Props {
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  limit: 8,
});

// Swiper modules
const modules = [Navigation, Pagination];

// Fetch featured accessories with SSR support using useAsyncData
const { data: accessoriesData, status, error } = await useAsyncData(
  'featured-accessories',
  () => $fetch<{ success: boolean; accessories: FeaturedAccessory[]; error?: string }>('/api/featured-accessories', {
    params: { limit: props.limit },
  }),
  {
    // Cache for 5 minutes to reduce API calls
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] || nuxtApp.static.data[key],
    server: false,
    lazy: true,
    default: () => ({ success: false, accessories: [] }),
  }
);

// Computed state from useAsyncData
const loading = computed(() => status.value === 'idle' || status.value === 'pending');
const accessories = computed(() => accessoriesData.value?.accessories || []);

// Navigate to the accessory's model page
const navigateToAccessory = (accessory: FeaturedAccessory) => {
  navigateTo(`/accessories/${accessory.modelSlug}`);
};

// Format price
const formatPrice = (price: number) => {
  return price.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
</script>

<style scoped>
.accessories-swiper {
  padding: 8px 4px 50px;
  overflow: visible;
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

:deep(.swiper-button-disabled) {
  opacity: 0.4;
  cursor: not-allowed;
}

.accessories-loading {
  min-height: 590px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 1024px) {
  .featured-accessories .container {
    padding-left: 3rem;
    padding-right: 3rem;
  }

  .accessories-loading {
    min-height: 520px;
  }
}
</style>
