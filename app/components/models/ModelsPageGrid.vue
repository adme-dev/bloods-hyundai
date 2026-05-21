<template>
  <div class="models-grid">
    <!-- Loading State -->
    <div v-if="pending" class="py-16 text-center">
      <div class="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
      <p class="mt-4 text-gray-500">Loading vehicles...</p>
    </div>

    <div v-else-if="vehicleCategories && vehicleCategories.length > 0">
      <!-- Category Filter Tabs -->
      <div class="mb-8">
        <!-- Mobile filter toggle -->
        <div class="lg:hidden">
          <button
            @click="showMobileFilter = !showMobileFilter"
            class="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg font-semibold"
          >
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Filter: {{ selectedCategory }}
            </span>
            <svg
              class="w-5 h-5 transition-transform"
              :class="{ 'rotate-180': showMobileFilter }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            v-show="showMobileFilter"
            class="mt-2 bg-gray-50 rounded-lg p-2 space-y-1"
          >
            <button
              @click="selectCategory('All')"
              class="w-full text-left px-4 py-2 rounded-lg font-medium transition-colors"
              :class="selectedCategory === 'All' ? 'bg-primary text-white' : 'hover:bg-gray-200'"
            >
              All Models
            </button>
            <button
              v-for="category in vehicleCategories"
              :key="category"
              @click="selectCategory(category)"
              class="w-full text-left px-4 py-2 rounded-lg font-medium transition-colors"
              :class="selectedCategory === category ? 'bg-primary text-white' : 'hover:bg-gray-200'"
            >
              {{ category }}
            </button>
          </div>
        </div>

        <!-- Desktop tabs -->
        <div class="hidden lg:flex flex-wrap justify-center gap-2 bg-gray-100 p-3 rounded-xl">
          <button
            @click="selectCategory('All')"
            class="px-5 py-2.5 rounded-lg font-semibold transition-colors"
            :class="selectedCategory === 'All' ? 'bg-primary text-white shadow-md' : 'hover:bg-gray-200'"
          >
            All Models
          </button>
          <button
            v-for="category in vehicleCategories"
            :key="category"
            @click="selectCategory(category)"
            class="px-5 py-2.5 rounded-lg font-semibold transition-colors"
            :class="selectedCategory === category ? 'bg-primary text-white shadow-md' : 'hover:bg-gray-200'"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <!-- Vehicle Grid by Category -->
      <div
        v-for="(vehicles, categoryName) in groupedVehicles"
        :key="categoryName"
        class="mb-12"
      >
        <div class="mb-6">
          <h2
            :id="slugify(String(categoryName))"
            class="text-2xl font-bold text-gray-900"
          >
            {{ categoryName }}
          </h2>
          <div
            v-if="vehicles[0]?.categoryDescription"
            v-html="vehicles[0].categoryDescription"
            class="text-gray-600 mt-1 category-description"
          ></div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
          <div
            v-for="vehicle in vehicles"
            :key="vehicle.slug"
            class="group"
          >
            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
              <NuxtLink :to="'/vehicle/' + vehicle.slug" class="block">
                <NuxtImg
                  :src="vehicle.image"
                  :alt="vehicle.name"
                  class="w-full aspect-[16/9] object-cover"
                  width="357"
                  height="185"
                  loading="lazy"
                  format="webp"
                  quality="80"
                />
              </NuxtLink>
              <div class="p-3 lg:p-4">
                <h3 class="font-bold text-gray-900 text-sm lg:text-base leading-tight">
                  {{ vehicle.name }}
                </h3>

                <div
                  v-if="vehicle.priceEnabled && vehicle.lowPrice"
                  class="text-gray-500 text-xs lg:text-sm mt-1"
                >
                  From ${{ vehicle.lowPrice.toLocaleString() }}
                </div>

                <div class="mt-3 flex flex-wrap gap-2">
                  <NuxtLink
                    :to="'/vehicle/' + vehicle.slug"
                    class="inline-block px-3 py-1.5 text-xs font-semibold uppercase tracking-wide border-2 border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors"
                  >
                    Details
                  </NuxtLink>
                  <NuxtLink
                    :to="'/calculator/' + getCalculatorSlug(vehicle.slug)"
                    class="inline-block px-3 py-1.5 text-xs font-semibold uppercase tracking-wide bg-primary border-2 border-primary text-white rounded hover:bg-primary-dark hover:border-primary-dark transition-colors"
                  >
                    Enquire
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Links Section -->
      <div class="mt-16 bg-gray-100 rounded-xl p-6 lg:p-8">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Explore More</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <NuxtLink to="/special-offers" class="text-primary font-semibold hover:underline">
            Latest Offers
          </NuxtLink>
          <NuxtLink to="/car-sales?condition=used" class="text-primary font-semibold hover:underline">
            Used Cars
          </NuxtLink>
          <NuxtLink to="/build-and-price" class="text-primary font-semibold hover:underline">
            Build & Price
          </NuxtLink>
          <NuxtLink to="/car-sales?search_keywords=hyundai" class="text-primary font-semibold hover:underline">
            In Stock
          </NuxtLink>
          <NuxtLink to="/finance" class="text-primary font-semibold hover:underline">
            Finance Options
          </NuxtLink>
          <NuxtLink to="/test-drive" class="text-primary font-semibold hover:underline">
            Book a Test Drive
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="py-16 text-center">
      <svg class="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p class="mt-4 text-gray-500">No vehicles available at this time.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// State
const selectedCategory = ref('All');
const showMobileFilter = ref(false);

// Use shared composable to avoid duplicate fetches
const { groupedByCategory, vehicleCategories, pending } = useAllVariants();

// Computed
const groupedVehicles = computed(() => {
  const grouped = groupedByCategory.value || {};

  // When "All" is selected, show all grouped by category
  if (selectedCategory.value === 'All') {
    const result: Record<string, any[]> = {};
    Object.entries(grouped).forEach(([categoryName, categoryData]: [string, any]) => {
      const models = categoryData.models || categoryData;
      if (Array.isArray(models) && models.length > 0) {
        result[categoryName] = models;
      }
    });
    return result;
  }

  // When a specific category is selected
  if (grouped[selectedCategory.value]) {
    const categoryData = grouped[selectedCategory.value];
    const models = categoryData.models || categoryData;
    if (Array.isArray(models) && models.length > 0) {
      return { [selectedCategory.value]: models };
    }
  }

  return {};
});

// Methods
const selectCategory = (category: string) => {
  selectedCategory.value = category;
  showMobileFilter.value = false;

  // Scroll to top of grid when category changes
  if (import.meta.client) {
    window.scrollTo({ top: 200, behavior: 'smooth' });
  }
};

const slugify = (text: string) => {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

// getCalculatorSlug is auto-imported from ~/utils
</script>

<style scoped>
.category-description :deep(p) {
  margin: 0;
}
</style>
