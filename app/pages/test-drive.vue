<template>
  <div class="hyundai-cars-page">
    <!-- Page Header -->
    <div v-if="page?.content?.rendered" class="page-header">
      <PostContent :content="page.content.rendered" />
    </div>

    <!-- Main Content -->
    <div class="cars-container uk-margin-medium-top">
      <!-- Category Tabs -->
      <div class="category-tabs-container">
        <div class="category-tabs">
          <button 
            v-for="(category, index) in categoryTabs" 
            :key="index"
            :class="['category-tab', { active: selectedCategory === category.value }]"
            @click="selectCategory(category.value, index)">
            {{ category.label }}
          </button>
          <NuxtLink to="/car-sales?condition=used&make=hyundai" class="category-tab">
            Used Hyundai's
          </NuxtLink>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-section">
      </div>

      <!-- Vehicles Grid -->
      <div class="vehicles-grid-container">
        <!-- Loading State -->
        <div v-if="apiLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading vehicles from Hyundai...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="apiError" class="error-state">
          <p>{{ apiError }}</p>
          <button @click="() => refreshVariants()" class="btn-retry">Retry</button>
        </div>

        <!-- Category Sections -->
        <template v-else>
          <div v-for="(catentry, categoryName, index) in groupedVehicles" :key="index" class="category-section">
            <div class="category-header">
              <h2 class="category-title">{{ categoryName }}</h2>
            </div>

            <div class="vehicles-grid">
              <div 
                v-for="(entry, entryIndex) in catentry" 
                :key="entryIndex"
                class="vehicle-card">
                
                <!-- Offer Badge -->
                <div v-if="entry.hasOffer" class="offer-badge">
                  Offer
                </div>
                
                <!-- New Badge -->
                <div v-if="entry.isNew" class="new-badge">
                  New
                </div>

                <!-- Vehicle Image -->
                <div class="vehicle-image-container">
                  <NuxtLink 
                    :to="`/vehicle/${entry.slug}`" 
                    class="vehicle-image-link">
                    <img 
                      :data-src="entry.image" 
                      :alt="entry.name || entry.model" 
                      class="vehicle-image"
                      width="640"
                      height="331"
                      uk-img />
                  </NuxtLink>
                </div>

                <!-- Vehicle Info -->
                <div class="vehicle-info">
                  <h3 class="vehicle-title">{{ entry.name }}</h3>
                  
                  <!-- Pricing from API -->
                  <div v-if="entry.priceEnabled && entry.lowPrice" class="vehicle-pricing">
                    <div class="price-from">
                      From ${{ formatPrice(entry.lowPrice) }} Drive Away<sup v-if="entry.priceDisclaimer">*</sup>
                    </div>
                  </div>
                  
                  <!-- Specs -->
                  <div class="vehicle-specs">
                    <span v-if="entry.fuelType" class="spec-item">{{ entry.fuelType }}</span>
                    <span v-if="entry.isNPerformance" class="spec-item n-performance">N Performance</span>
                  </div>

                  <!-- Action Buttons -->
                  <div class="vehicle-actions">
                    <NuxtLink 
                      :to="`/vehicle/${entry.slug}`"
                      class="btn-discover">
                      Discover
                    </NuxtLink>
                    
                    <NuxtLink 
                      :to="`/calculator/${getModelSlug(entry.name)}`"
                      class="btn-build">
                      Build
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="!apiLoading && Object.keys(groupedVehicles).length === 0" class="empty-state">
            <p>No vehicles found.</p>
            <button @click="selectedCategory = 'All'" class="btn-clear-filters">Show All</button>
          </div>

          <!-- Price Disclaimers Section -->
          <div v-if="priceDisclaimers.length > 0" class="price-disclaimers-section">
            <div class="disclaimers-content">
              <div v-for="(disclaimer, index) in priceDisclaimers" :key="index" class="disclaimer-item" v-html="disclaimer"></div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// SEO
useSiteMeta({
  title: 'Book a Test Drive',
  description: 'Book a test drive for your favorite Hyundai model at Sale Hyundai. Experience the latest Hyundai vehicles firsthand.',
});

// State
const page = ref<any>(null);
const selectedCategory = ref('All');
const itemToShow = ref<number | null>(null);
const categoryTabs = ref([
  { label: 'All', value: 'All' },
  { label: 'Electric', value: 'Electric' },
  { label: 'Hybrid', value: 'Hybrid' },
  { label: 'SUVs & People Movers', value: 'SUVs & People Movers' },
  { label: 'Performance', value: 'Performance' },
  { label: 'Hatch & Sedans', value: 'Hatch & Sedans' },
  { label: 'Vans & Trucks', value: 'Vans & Trucks' },
  { label: 'Runout', value: 'Runout' }
]);

// Methods
const getPage = async () => {
  try {
    const response = await $fetch<any>('/api/page/test-drive');
    page.value = response?.page || response;
  } catch (error) {
    console.error('Failed to fetch test-drive page:', error);
  }
};

const selectCategory = (value: string, index: number) => {
  selectedCategory.value = value;
  itemToShow.value = index;
};

// Use shared composable to avoid duplicate fetches
const { variants: apiVariants, groupedByCategory: apiGroupedVariants, vehicleCategories, pending: apiLoading, error: variantsError, refresh: refreshVariants } = useAllVariants();

// Computed for error state
const apiError = computed(() => {
  if (variantsError.value) {
    return variantsError.value.message || 'Failed to fetch models';
  }
  return null;
});

// Watch for vehicle categories to update tabs
watch(
  vehicleCategories,
  (categories) => {
    if (categories && categories.length > 0) {
      const dynamicTabs = [{ label: 'All', value: 'All' }];
      categories.forEach((cat: string) => {
        if (cat && cat !== 'All') {
          dynamicTabs.push({ label: cat, value: cat });
        }
      });
      categoryTabs.value = dynamicTabs;
      console.warn('[MODELADDITIONAL API] Tabs set to:', categoryTabs.value.map(t => t.label).join(', '));
    }
  },
  { immediate: true }
);

const formatPrice = (price: number) => {
  if (!price) return "0";
  return new Intl.NumberFormat('en-AU').format(price);
};

const getModelSlug = (modelName: string) => {
  if (!modelName) return '';
  // Remove year prefixes and convert to URL-friendly slug
  return modelName
    .replace(/^20\d{2}\s+/, '') // Remove year prefix
    .toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special characters
    .replace(/-+/g, '-')        // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');     // Remove leading/trailing hyphens
};

// Computed
const vehicles = computed(() => apiVariants.value || []);

const groupedVehicles = computed(() => {
  // When "All" is selected, show all grouped by category
  if (selectedCategory.value === "All") {
    // Convert the groupedByCategory format to the format expected by the template
    const result: Record<string, any[]> = {};
    Object.entries(apiGroupedVariants.value).forEach(([categoryName, categoryData]) => {
      // Handle both formats: { name, models } or just array of models
      const data = categoryData as any;
      const models = data?.models || categoryData;
      if (Array.isArray(models) && models.length > 0) {
        result[categoryName] = models;
      }
    });
    return result;
  }
  
  // When a specific category is selected, return just that category's models
  if (apiGroupedVariants.value && apiGroupedVariants.value[selectedCategory.value]) {
    const categoryData = apiGroupedVariants.value[selectedCategory.value];
    const models = categoryData.models || categoryData;
    if (Array.isArray(models) && models.length > 0) {
      return { [selectedCategory.value]: models };
    }
  }
  
  // Fallback: return empty object
  return {};
});

// Collect unique price disclaimers from currently displayed vehicles
const priceDisclaimers = computed(() => {
  const disclaimers = new Set<string>();
  Object.values(groupedVehicles.value).forEach(models => {
    if (Array.isArray(models)) {
      models.forEach(model => {
        if (model.priceDisclaimer) {
          disclaimers.add(model.priceDisclaimer);
        }
      });
    }
  });
  return Array.from(disclaimers);
});

// Lifecycle
onMounted(async () => {
  await getPage();
  
  // Add body class for styling
  if (process.client) {
    document.body.classList.add("test-drive");
  }
});

onUnmounted(() => {
  // Remove body class
  if (process.client) {
    document.body.classList.remove("test-drive");
  }
});
</script>

<style lang="scss" scoped>
.hyundai-cars-page {
  min-height: 100vh;
  background: #fff;
}

.page-header {
  padding: 2rem 0;
  max-width: 1200px;
  margin: 0 auto;
}

.cars-container {
  max-width: 1400px;
  padding: 0 1rem;
  margin: 0 auto;
}

// Category Tabs
.category-tabs-container {
  border-bottom: 2px solid #e5e5e5;
  margin-bottom: 2rem;
  overflow-x: auto;
  
  .category-tabs {
    display: flex;
    gap: 0;
    white-space: nowrap;
    
    .category-tab {
      padding: 1rem 1.5rem;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      color: #333;
      font-weight: 500;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
      
      &:hover {
        color: #002c5f;
        background: #f5f5f5;
      }
      
      &.active {
        color: #002c5f;
        border-bottom-color: #002c5f;
        font-weight: 600;
      }
    }
  }
}

// Filters Section
.filters-section {
  margin-bottom: 2rem;
  position: relative;
  
}

// Vehicles Grid
.vehicles-grid-container {
  padding-bottom: 4rem;
}

.category-section {
  margin-bottom: 4rem;
  
  .category-header {
    margin-bottom: 2rem;
    
    .category-title {
      font-size: 2rem;
      font-weight: 600;
      color: #002c5f;
      margin: 0 0 0.5rem 0;
    }
    
    .category-description {
      color: #666;
      font-size: 1rem;
      margin: 0;
    }
  }
}

.vehicles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
}

.vehicle-card {
  position: relative;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  
  .offer-badge,
  .new-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    padding: 0.5rem 1rem;
    background: #002c5f;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    z-index: 10;
    border-radius: 4px;
  }
  
  .new-badge {
    background: #00a8e6;
  }
  
  .vehicle-image-container {
    width: 100%;
    padding-top: 51.56%; // 331/640 aspect ratio
    position: relative;
    background: #f5f5f5;
    overflow: hidden;
    
    .vehicle-image-link {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      
      .vehicle-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }
    }
    
    &:hover .vehicle-image {
      transform: scale(1.05);
    }
  }
  
  .vehicle-info {
    padding: 1.5rem;
    
    .vehicle-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #002c5f;
      margin: 0 0 0.5rem 0;
      text-transform: uppercase;
    }
    
    .vehicle-description {
      font-size: 0.9rem;
      color: #666;
      margin: 0 0 1rem 0;
      line-height: 1.4;
    }
    
    .vehicle-pricing {
      margin-bottom: 1rem;
      
      .price-from {
        font-size: 1.1rem;
        font-weight: 600;
        color: #002c5f;
      }
    }
    
    .vehicle-actions {
      display: flex;
      gap: 0.75rem;
      
      .btn-discover,
      .btn-build {
        flex: 1;
        padding: 0.75rem 1.5rem;
        border: 2px solid #002c5f;
        background: transparent;
        color: #002c5f;
        font-weight: 600;
        text-decoration: none;
        text-align: center;
        border-radius: 4px;
        transition: all 0.3s ease;
        cursor: pointer;
        display: inline-block;
        
        &:hover {
          background: #002c5f;
          color: #fff;
        }
      }
      
      .btn-build {
        background: #002c5f;
        color: #fff;
        
        &:hover {
          background: #004080;
          border-color: #004080;
        }
      }
    }
  }
}

// Loading and Error States
.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
  
  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e5e5e5;
    border-top-color: #002c5f;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
  
  .btn-retry {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #002c5f;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    
    &:hover {
      background: #004080;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.vehicle-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  .spec-item {
    font-size: 0.85rem;
    color: #666;
    background: #f5f5f5;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
  
  .btn-clear-filters {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #002c5f;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    
    &:hover {
      background: #004080;
    }
  }
}

// Price Disclaimers Section
.price-disclaimers-section {
  margin-top: 3rem;
  padding: 2rem;
  background: #f8f9fa;
  border-top: 1px solid #e5e5e5;
  
  .disclaimers-content {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .disclaimer-item {
    font-size: 0.75rem;
    color: #666;
    line-height: 1.6;
    margin-bottom: 1rem;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    :deep(b), :deep(strong) {
      color: #333;
      font-weight: 600;
    }
    
    :deep(p) {
      margin: 0;
    }
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .category-tabs-container {
    .category-tabs {
      .category-tab {
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
      }
    }
  }
  
  .vehicles-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .price-disclaimers-section {
    padding: 1.5rem 1rem;
    
    .disclaimer-item {
      font-size: 0.7rem;
    }
  }
}
</style>
