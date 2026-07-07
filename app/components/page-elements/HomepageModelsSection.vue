<template>
  <section class="homepage-models-section bg-[#f6f3f2]">
    <div class="mx-auto container">
      <!-- Section Header -->
      <div class="text-center mb-12">
        <h2 class="section-heading mb-4">
          {{ sectionTitle }}
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          {{ sectionDescription }}
        </p>
      </div>

      <!-- Loading State - Only show on client to prevent hydration mismatch -->
      <ClientOnly>
        <div v-if="modelsStore.loading" class="flex justify-center py-16">
          <div uk-spinner></div>
        </div>
      </ClientOnly>

      <!-- Error State -->
      <div v-if="!modelsStore.loading && modelsStore.error" class="py-16 text-center">
        <p class="text-red-600 text-lg">
          {{ modelsStore.error }}
        </p>
        <button
          class="mt-4 px-6 py-2 bg-[#001E50] text-white rounded-lg hover:bg-[#002d6d] transition-colors"
          @click="retryLoad"
        >
          Try Again
        </button>
      </div>

      <!-- Content -->
      <div v-if="!modelsStore.loading && !modelsStore.error">
        <!-- Desktop Layout -->
        <div class="hidden lg:flex lg:flex-row gap-12">
          <!-- Left Sidebar: Categories -->
          <div class="lg:w-80 lg:max-w-[400px] flex flex-col flex-shrink-0">
            <h3 class="text-sm font-semibold text-gray-500 tracking-wider mb-6">
              CATEGORIES
            </h3>
            <nav class="flex flex-col space-y-4">
              <button
                v-for="category in modelsStore.uniqueCategories"
                :key="category"
                class="text-left text-lg font-medium transition-colors py-2 px-4 rounded-lg"
                :class="
                  activeCategory === category
                    ? 'text-[#00aad2] bg-[#00aad2]/10 font-semibold'
                    : 'text-[#001E50] hover:text-[#00aad2] hover:bg-gray-100'
                "
                @click="activeCategory = category"
              >
                {{ category }}
              </button>
            </nav>

          </div>

          <!-- Right Content: Desktop Models Grid -->
          <div class="flex-1">
            <!-- Empty State -->
            <div v-if="filteredModels.length === 0" class="py-16 text-center">
              <div class="max-w-md mx-auto">
                <div
                  class="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center"
                >
                  <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p class="text-gray-500 text-lg">Select a category to view models</p>
              </div>
            </div>

            <!-- Models Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              <!-- Loop through models -->
              <div
                v-for="model in filteredModels"
                :key="model.id"
                class="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#00aad2]/30 flex flex-col"
              >
                <!-- Image Area -->
                <div class="model-image-frame relative overflow-hidden">
                  <!-- Badge -->
                  <div
                    class="absolute top-4 left-4 flex items-center bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium shadow-sm z-10"
                  >
                    <span class="w-2 h-2 bg-[#00aad2] rounded-full mr-2" />
                    <span>{{ model.vehiclecat || model.title.rendered }}</span>
                  </div>
                  <!-- Image Link -->
                  <NuxtLink
                    :to="`/vehicle/${model.slug}`"
                    class="block"
                  >
                    <NuxtImg
                      :src="model.model_image"
                      :alt="model.title.rendered"
                      width="550"
                      height="300"
                      loading="lazy"
                      class="model-card-image transition-transform duration-500 group-hover:scale-105"
                      format="webp"
                      quality="80"
                    />
                  </NuxtLink>
                </div>

                <!-- Text Content Area -->
                <div class="p-6 flex flex-col flex-1">
                  <h3
                    class="card-title mb-3 group-hover:text-[#00aad2] transition-colors"
                  >
                    {{ model.title.rendered }}
                  </h3>
                  <!-- Description -->
                  <p
                    v-if="model.caption"
                    class="text-sm text-gray-600 mb-6 line-clamp-3 flex-1"
                  >
                    {{ sanitizeCaption(model.caption) }}
                  </p>

                  <!-- Action Links - Pinned to Bottom -->
                  <div class="flex flex-wrap gap-4 pt-4 border-t border-gray-200 mt-auto">
                    <NuxtLink
                      :to="`/vehicle/${model.slug}`"
                      class="flex items-center text-sm font-medium text-[#00aad2] hover:text-[#001E50] transition-colors group/link"
                    >
                      <span>Explore</span>
                      <svg class="h-4 w-4 ml-1 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </NuxtLink>

                    <NuxtLink
                      v-if="!model.isComingSoon"
                      :to="`/calculator/${getCalculatorSlug(model.slug)}`"
                      class="flex items-center text-sm font-medium text-[#00aad2] hover:text-[#001E50] transition-colors group/link"
                    >
                      <span>Range / Build</span>
                      <svg class="h-4 w-4 ml-1 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </NuxtLink>

                    <span
                      v-if="model.isComingSoon"
                      class="text-sm font-medium text-gray-500"
                    >
                      Register Interest
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Layout with Swiper -->
        <div class="lg:hidden">
          <!-- Mobile Category Selector -->
          <div class="mb-6">
            <div class="relative">
              <button
                class="w-full flex items-center justify-between px-4 py-3 bg-gray-100 rounded-lg text-gray-900"
                @click="showCategoryDropdown = !showCategoryDropdown"
              >
                <span class="font-medium">{{ activeCategory || 'Select Category' }}</span>
                <svg
                  class="h-5 w-5 text-gray-500 transition-transform duration-200"
                  :class="{ 'rotate-180': showCategoryDropdown }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="opacity-0 translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 translate-y-1"
              >
                <div
                  v-if="showCategoryDropdown"
                  ref="categoryDropdownRef"
                  class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  <div class="py-1">
                    <button
                      v-for="category in modelsStore.uniqueCategories"
                      :key="category"
                      class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                      :class="
                        activeCategory === category ? 'text-[#00aad2] font-medium' : 'text-[#001E50]'
                      "
                      @click="selectCategory(category)"
                    >
                      {{ category }}
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <!-- Mobile Models Swiper -->
          <div v-if="filteredModels.length > 0" class="relative">
            <ClientOnly>
              <swiper
                :modules="modules"
                :slides-per-view="1"
                :space-between="20"
                :pagination="{ clickable: true }"
                :navigation="true"
                class="mobile-models-swiper"
                @swiper="onSwiper"
              >
                <swiper-slide
                  v-for="model in filteredModels"
                  :key="model.id"
                  class="h-auto"
                >
                  <div
                    class="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-[#00aad2]/30 hover:shadow-lg transition-all duration-300 group"
                  >
                    <!-- Image Section -->
                    <div class="model-image-frame relative w-full overflow-hidden">
                      <NuxtImg
                        :src="model.model_image"
                        :alt="model.title.rendered"
                        width="550"
                        height="300"
                        loading="lazy"
                        class="model-card-image transition-transform duration-500 group-hover:scale-105"
                        format="webp"
                        quality="80"
                      />
                      <!-- Badge -->
                      <div
                        class="absolute top-4 left-4 flex items-center bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium shadow-sm z-10"
                      >
                        <span class="w-2 h-2 bg-[#00aad2] rounded-full mr-2" />
                        <span>{{ model.vehiclecat || model.title.rendered }}</span>
                      </div>
                    </div>

                    <!-- Content Section -->
                    <div class="p-5">
                      <div class="flex flex-col h-full">
                        <div class="flex-1">
                          <h3
                            class="card-title mb-2 group-hover:text-[#00aad2] transition-colors"
                          >
                            {{ model.title.rendered }}
                          </h3>
                          <p
                            v-if="model.caption"
                            class="text-sm text-gray-600 line-clamp-3 mb-4"
                          >
                            {{ sanitizeCaption(model.caption) }}
                          </p>
                        </div>
                        <!-- Action Links - Mobile Version -->
                        <div
                          class="flex justify-between items-center pt-4 border-t border-gray-200 mt-auto"
                        >
                          <NuxtLink
                            :to="`/vehicle/${model.slug}`"
                            class="flex items-center text-sm font-medium text-[#00aad2] hover:text-[#001E50] transition-colors group/link"
                          >
                            <span>Explore</span>
                            <svg class="h-4 w-4 ml-1 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </NuxtLink>

                          <NuxtLink
                            v-if="!model.isComingSoon"
                            :to="`/calculator/${getCalculatorSlug(model.slug)}`"
                            class="flex items-center text-sm font-medium text-[#00aad2] hover:text-[#001E50] transition-colors group/link"
                          >
                            <span>Range / Build</span>
                            <svg class="h-4 w-4 ml-1 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </NuxtLink>

                          <span
                            v-if="model.isComingSoon"
                            class="text-sm font-medium text-gray-500"
                          >
                            Register Interest
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </swiper-slide>
              </swiper>

              <template #fallback>
                <div class="mobile-models-fallback">
                  <div uk-spinner></div>
                </div>
              </template>
            </ClientOnly>
          </div>

          <!-- Mobile Empty State -->
          <div v-else class="py-16 text-center">
            <div class="max-w-md mx-auto">
              <div
                class="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center"
              >
                <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p class="text-gray-500 text-lg">Select a category to view models</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useModelsStore } from '~/stores/models';
import { onClickOutside } from '@vueuse/core';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const modelsStore = useModelsStore();
const activeCategory = ref('');
const showCategoryDropdown = ref(false);
const categoryDropdownRef = ref<HTMLElement | null>(null);
const swiperInstance = ref<any>(null);

// Swiper modules
const modules = [Navigation, Pagination];

// Dynamic section content based on available data
const {
  public: { siteName, siteDescription },
} = useRuntimeConfig();

const sectionTitle = computed(() => {
  const totalModels = modelsStore.allModels?.length || 0;
  if (totalModels > 0) {
    return `Explore Our ${totalModels} Models`;
  }
  return 'Explore Our Models';
});

const sectionDescription = computed(() => {
  const categories = modelsStore.uniqueCategories;
  if (categories.length > 0) {
    const categoryList = categories.slice(0, 3).join(', ');
    const remaining = categories.length > 3 ? ` and ${categories.length - 3} more` : '';
    return `Discover our complete range of vehicles across ${categoryList}${remaining} categories.`;
  }
  return `Discover the complete range of vehicles available through ${siteName || 'our dealership'}.`;
});

// Sanitize caption text to prevent hydration mismatches
const sanitizeCaption = (caption: string): string => {
  if (!caption) return '';
  // Normalize whitespace and remove any invisible characters
  return caption
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '') // Remove zero-width characters
    .trim();
};

const syncInitialCategory = () => {
  const [firstCategory] = modelsStore.uniqueCategories;
  if (firstCategory && !activeCategory.value) {
    activeCategory.value = firstCategory;
  }
};

watch(
  () => modelsStore.uniqueCategories,
  () => {
    syncInitialCategory();
  },
  { immediate: true }
);

// Filter models by active category
const filteredModels = computed(() => {
  if (!activeCategory.value) return [];
  return modelsStore.modelsByCategory(activeCategory.value);
});

// Select a category and close dropdown
const selectCategory = (category: string) => {
  activeCategory.value = category;
  showCategoryDropdown.value = false;
};

// Handle Swiper initialization
const onSwiper = (swiper: any) => {
  swiperInstance.value = swiper;
};

// Retry loading function
const retryLoad = async () => {
  try {
    await modelsStore.fetchModels();
  } catch (err) {
    console.error('Failed to retry loading models:', err);
  }
};

// Models are fetched via SSR in the store (useAllVariants with server: true, lazy: false)
// No onMounted fetch needed - data arrives with the HTML payload

// Close dropdown when clicking outside
onClickOutside(categoryDropdownRef, () => {
  showCategoryDropdown.value = false;
});
</script>

<style scoped>
.homepage-models-section {
  margin-top: clamp(32px, 5vw, 64px);
  padding-top: clamp(64px, 7vw, 96px);
  padding-bottom: clamp(72px, 8vw, 112px);
  overflow: hidden;
}

.homepage-models-section .container {
  width: min(100% - 32px, 1400px);
}

.section-heading {
  line-height: 1.1;
}

.model-image-frame {
  aspect-ratio: 11 / 6;
  background: #fff;
}

.model-card-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Line clamp utility for description text */
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Mobile swiper styles */
.mobile-models-swiper {
  padding-bottom: 50px;
}

.mobile-models-fallback {
  min-height: 470px;
  padding-bottom: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.swiper-pagination) {
  position: relative;
  margin-top: 20px;
}

:deep(.swiper-pagination-bullet) {
  width: 12px;
  height: 12px;
  background-color: rgba(37, 99, 235, 0.3);
  opacity: 1;
  transition: all 0.3s ease;
}

:deep(.swiper-pagination-bullet-active) {
  background-color: #2563eb;
  transform: scale(1.2);
}

:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  color: #2563eb;
}

/* Mobile scroller specific styles */
@media (max-width: 1023px) {
  .homepage-models-section .container {
    width: min(100% - 24px, 720px);
  }

  .homepage-models-section {
    margin-top: 28px;
    padding-top: 56px;
    padding-bottom: 80px;
  }
}
</style>
