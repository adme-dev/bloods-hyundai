<template>
  <div class="hyundai-cars-page">
    <LazyPageSchema />

    <!-- Page Header -->
    <div class="page-header-section">
      <div class="page-header-content">
        <h1 class="page-title">Build & Price</h1>
        <p class="page-subtitle">Configure your perfect Hyundai and get an instant quote</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="cars-container">
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
        </div>
      </div>

      <!-- Vehicles Grid -->
      <div class="vehicles-grid-container">
        <!-- Loading State -->
        <div v-if="pending" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading models from Hyundai...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="variantsError" class="error-state">
          <p>{{ variantsError.message || 'Failed to load models' }}</p>
          <button @click="() => refresh()" class="btn-retry">Retry</button>
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
                    :to="`/calculator/${getModelSlug(entry.name)}`"
                    class="vehicle-image-link">
                    <NuxtImg
                      :src="entry.image"
                      :alt="entry.name || entry.model"
                      class="vehicle-image"
                      width="640"
                      height="331"
                      loading="lazy"
                      format="webp"
                      quality="80"
                    />
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
                      Build & Price
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="!pending && Object.keys(groupedVehicles).length === 0" class="empty-state">
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
  title: 'Build & Price',
  description: 'Configure and price your perfect Hyundai vehicle. Explore all models, compare variants, and get an instant quote at Sale Hyundai.',
});

// State
const selectedCategory = ref('All');
const categoryTabs = ref([
  { label: 'All', value: 'All' },
  { label: 'Electric', value: 'Electric' },
  { label: 'Hybrid', value: 'Hybrid' },
  { label: 'SUVs & People Movers', value: 'SUVs & People Movers' },
  { label: 'Performance', value: 'Performance' },
  { label: 'Hatch & Sedans', value: 'Hatch & Sedans' },
  { label: 'Vans & Trucks', value: 'Vans & Trucks' },
]);

// Use shared composable to avoid duplicate fetches
const {
  variants: apiVariants,
  groupedByCategory: apiGroupedVariants,
  vehicleCategories,
  pending,
  error: variantsError,
  refresh
} = useAllVariants();

// Methods
const selectCategory = (value: string, _index: number) => {
  selectedCategory.value = value;
};

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
  return modelName
    .replace(/^20\d{2}\s+/, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Computed
const groupedVehicles = computed(() => {
  if (selectedCategory.value === "All") {
    const result: Record<string, any[]> = {};
    Object.entries(apiGroupedVariants.value).forEach(([categoryName, categoryData]) => {
      const data = categoryData as any;
      const models = data?.models || categoryData;
      if (Array.isArray(models) && models.length > 0) {
        result[categoryName] = models;
      }
    });
    return result;
  }

  if (apiGroupedVariants.value && apiGroupedVariants.value[selectedCategory.value]) {
    const categoryData = apiGroupedVariants.value[selectedCategory.value];
    const models = categoryData.models || categoryData;
    if (Array.isArray(models) && models.length > 0) {
      return { [selectedCategory.value]: models };
    }
  }

  return {};
});

// Collect unique price disclaimers
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
</script>

<style lang="scss" scoped>
.hyundai-cars-page {
  min-height: 100vh;
  background: #fff;
}

// Page Header - Hyundai Brand Styling
.page-header-section {
  background: linear-gradient(135deg, $hyundai-navy 0%, color.adjust($hyundai-navy, $lightness: 10%) 100%);
  padding: 4rem 1rem;
  text-align: center;

  .page-header-content {
    max-width: 800px;
    margin: 0 auto;
  }

  .page-title {
    font-family: $font-family-head;
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 500;
    color: #fff;
    margin: 0 0 1rem 0;
    letter-spacing: -0.02em;
  }

  .page-subtitle {
    font-family: $font-family-base;
    font-size: 1.125rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
  }
}

.cars-container {
  max-width: 1400px;
  padding: 0 1rem;
  margin: 0 auto;
}

// Category Tabs - Hyundai Brand Colors
.category-tabs-container {
  border-bottom: 2px solid #e5e5e5;
  margin-bottom: 2rem;
  margin-top: 2rem;
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
      font-family: $font-family-base;
      font-weight: 500;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;

      &:hover {
        color: $hyundai-navy;
        background: $hyundai-sand;
      }

      &.active {
        color: $hyundai-navy;
        border-bottom-color: $hyundai-active-blue;
        font-weight: 600;
      }
    }
  }
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
      font-family: $font-family-head;
      font-size: 2rem;
      font-weight: 500;
      color: $hyundai-navy;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.01em;
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
  border: 1px solid #e5e5e5;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    border-color: rgba($hyundai-active-blue, 0.3);
  }

  .offer-badge,
  .new-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    padding: 0.5rem 1rem;
    background: $hyundai-navy;
    color: #fff;
    font-family: $font-family-base;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    z-index: 10;
    border-radius: 4px;
  }

  .new-badge {
    background: $hyundai-active-blue;
  }

  .vehicle-image-container {
    width: 100%;
    padding-top: 51.56%;
    position: relative;
    background: $hyundai-sand;
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
      font-family: $font-family-head;
      font-size: 1.25rem;
      font-weight: 500;
      color: $hyundai-navy;
      margin: 0 0 0.5rem 0;
      text-transform: uppercase;
      letter-spacing: -0.01em;
    }

    .vehicle-pricing {
      margin-bottom: 1rem;

      .price-from {
        font-family: $font-family-base;
        font-size: 1.1rem;
        font-weight: 600;
        color: $hyundai-navy;
      }
    }

    .vehicle-actions {
      display: flex;
      gap: 0.75rem;

      .btn-discover,
      .btn-build {
        flex: 1;
        padding: 0.75rem 1.5rem;
        border: 2px solid $hyundai-navy;
        background: transparent;
        color: $hyundai-navy;
        font-family: $font-family-base;
        font-weight: 600;
        text-decoration: none;
        text-align: center;
        border-radius: 4px;
        transition: all 0.3s ease;
        cursor: pointer;
        display: inline-block;

        &:hover {
          background: $hyundai-navy;
          color: #fff;
        }
      }

      .btn-build {
        background: $hyundai-navy;
        color: #fff;

        &:hover {
          background: $hyundai-navy-light;
          border-color: $hyundai-navy-light;
        }
      }
    }
  }
}

.vehicle-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;

  .spec-item {
    font-family: $font-family-base;
    font-size: 0.85rem;
    color: #666;
    background: $hyundai-sand;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;

    &.n-performance {
      background: $hyundai-active-blue;
      color: #fff;
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
    border-top-color: $hyundai-active-blue;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  .btn-retry {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: $hyundai-navy;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-family: $font-family-base;
    font-weight: 500;
    cursor: pointer;

    &:hover {
      background: $hyundai-navy-light;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;

  .btn-clear-filters {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: $hyundai-navy;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-family: $font-family-base;
    font-weight: 500;
    cursor: pointer;

    &:hover {
      background: $hyundai-navy-light;
    }
  }
}

// Price Disclaimers Section
.price-disclaimers-section {
  margin-top: 3rem;
  padding: 2rem;
  background: $hyundai-sand;
  border-top: 1px solid #e5e5e5;

  .disclaimers-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .disclaimer-item {
    font-family: $font-family-base;
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
  .page-header-section {
    padding: 3rem 1rem;
  }

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
