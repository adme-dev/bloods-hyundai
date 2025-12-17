<template>
  <div class="accessories-shop min-h-screen bg-white text-[#1a1a1a]">
    <!-- Breadcrumb -->
    <AccessoriesBreadcrumb />

    <!-- Hero Section - OEM Style -->
    <section class="accessories-hero-section">
      <div class="hero-content-wrapper">
        <div class="hero-main-content">
          <div class="hero-text">
            <h1 class="hero-title">Hyundai Genuine Accessories.</h1>
            <p class="hero-description">
              Make your new Hyundai vehicle yours and personalise it with Hyundai Genuine Accessories. 
              From roof racks and bike carriers for outdoor adventure, to interior and exterior style upgrades, 
              our accessories range is expertly fitted and designed to enhance your driving experience. 
              Plus, for extra peace of mind, all our accessories come with a 5-year warranty.
            </p>
          </div>
          
          <!-- Cart Button -->
          <ClientOnly>
            <button
              class="cart-button"
              @click="accessoriesStore.toggleCart(true)"
            >
              <div class="relative">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span
                  v-if="accessoriesStore.cartItemCount > 0"
                  class="cart-badge"
                >
                  {{ accessoriesStore.cartItemCount }}
                </span>
              </div>
              <div class="text-left">
                <div class="cart-label">Your Cart</div>
                <div class="cart-summary">
                  {{ accessoriesStore.cartItemCount }} item{{ accessoriesStore.cartItemCount !== 1 ? 's' : '' }} ·
                  ${{ formatPrice(accessoriesStore.cartTotal) }}
                </div>
              </div>
            </button>
            <template #fallback>
              <button
                class="cart-button"
                disabled
              >
                <div class="relative">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div class="text-left">
                  <div class="cart-label">Your Cart</div>
                  <div class="cart-summary">0 items · $0.00</div>
                </div>
              </button>
            </template>
          </ClientOnly>
        </div>
      </div>
    </section>



    <!-- Model Selector Section - Hyundai OEM Style -->
    <section v-if="!accessoriesStore.selectedModel" id="model-selector" class="model-selector-section">
      <div class="model-selector-content">
        <!-- Category Tabs - Hyundai Style -->
        <nav class="category-tabs-nav">
          <button
            class="category-tab"
            :class="{ 'active': selectedModelCategory === null }"
            @click="selectedModelCategory = null"
          >
            All
          </button>
          <button
            v-for="category in modelCategories"
            :key="category.key"
            class="category-tab"
            :class="{ 'active': selectedModelCategory === category.key }"
            @click="selectedModelCategory = category.key"
          >
            {{ category.display }}
          </button>
        </nav>

        <ModelSelector
          :models="filteredModelsByCategory"
          :selected-model="accessoriesStore.selectedModel"
          @select="handleModelSelect"
        />
      </div>
    </section>

    <!-- Step 2: Browse Accessories -->
    <section v-else class="accessories-browse-section">
      <div class="accessories-browse-content">
          <!-- Selected Model Header - OEM Style -->
          <div class="selected-model-header">
            <div class="selected-model-info">
              <div class="model-image-container">
                <NuxtImg
                  v-if="accessoriesStore.selectedModel.image"
                  :src="accessoriesStore.selectedModel.image"
                  :alt="accessoriesStore.selectedModel.name"
                  class="model-header-image"
                  width="80"
                  height="60"
                  format="webp"
                  quality="80"
                />
              </div>
              <div class="model-info-text">
                <h2 class="model-title">{{ accessoriesStore.selectedModel.name }}</h2>
                <p class="model-category-label">{{ accessoriesStore.selectedModel.category }}</p>
              </div>
            </div>
            <button
              class="change-model-button"
              @click="changeModel"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Change Model
            </button>
          </div>

        <!-- Loading State -->
        <div v-if="accessoriesStore.isLoading" class="flex flex-col items-center justify-center py-16">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary"></div>
          <p class="mt-4 text-sm text-slate-500">Loading accessories...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="accessoriesStore.error" class="flex flex-col items-center justify-center rounded-2xl bg-red-50 py-16">
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-slate-900">Unable to load accessories</h3>
          <p class="mt-1 text-sm text-slate-500">{{ accessoriesStore.error }}</p>
          <button
            class="mt-4 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            @click="accessoriesStore.selectModel(accessoriesStore.selectedModel!)"
          >
            Try Again
          </button>
        </div>

        <!-- Accessories Content -->
        <div v-else class="accessories-content-wrapper">
          <!-- Filters Sidebar (Desktop) -->
          <aside class="filters-sidebar desktop-only">
            <div class="filters-panel">
              <!-- Search -->
              <div class="filter-section">
                <label class="filter-label">SEARCH</label>
                <div class="search-input-wrapper">
                  <span class="search-icon">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    :value="accessoriesStore.searchQuery"
                    type="search"
                    class="search-input-field"
                    placeholder="Search accessories..."
                    @input="accessoriesStore.setSearchQuery(($event.target as HTMLInputElement).value)"
                  >
                </div>
              </div>

              <!-- Categories -->
              <div class="filter-section">
                <label class="filter-label">CATEGORY</label>
                <div class="category-list">
                  <button
                    class="category-button"
                    :class="{ 'active': !accessoriesStore.selectedCategory }"
                    @click="accessoriesStore.setCategory(null)"
                  >
                    All Categories
                    <span class="category-count">{{ accessoriesStore.accessories.length }}</span>
                  </button>
                  <button
                    v-for="category in accessoriesStore.categories"
                    :key="category"
                    class="category-button"
                    :class="{ 'active': accessoriesStore.selectedCategory === category }"
                    @click="accessoriesStore.setCategory(category)"
                  >
                    {{ category }}
                    <span class="category-count">
                      ({{ accessoriesStore.categorizedAccessories[category]?.length || 0 }})
                    </span>
                  </button>
                </div>
              </div>

              <!-- Sort -->
              <div class="filter-section">
                <label class="filter-label">SORT BY</label>
                <select
                  :value="accessoriesStore.sortBy"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  @change="accessoriesStore.setSortBy(($event.target as HTMLSelectElement).value as any)"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              <!-- Popular Filter -->
              <div class="filter-section">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    :checked="accessoriesStore.showOnlyPopular"
                    @change="accessoriesStore.togglePopularFilter()"
                    class="checkbox-input"
                  >
                  <span class="checkbox-text">Show popular items only</span>
                </label>
              </div>

              <!-- Clear Filters -->
              <button
                v-if="hasActiveFilters"
                class="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                @click="accessoriesStore.resetFilters()"
              >
                Clear Filters
              </button>
            </div>
          </aside>

          <!-- Main Content -->
          <div class="main-content-area">
            <!-- Results Header with Mobile Filter Button -->
            <div class="results-header">
              <p class="results-count">
                Showing <strong>{{ accessoriesStore.filteredAccessories.length }}</strong> accessories
              </p>
              <button
                class="mobile-filter-button"
                @click="showMobileFilters = true"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
            </div>

            <!-- Value Packs Section -->
            <div v-if="accessoriesStore.accessoryPacks.length > 0 && !accessoriesStore.selectedCategory" class="mb-8">
              <h3 class="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                Value Packs
                <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Save more
                </span>
              </h3>
              <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <AccessoryPackCard
                  v-for="pack in accessoriesStore.accessoryPacks"
                  :key="pack.id"
                  :pack="pack"
                  :is-in-cart="accessoriesStore.isInCart(pack.id)"
                  @add-to-cart="handleAddPack"
                  @view-details="viewPackDetails"
                  @view-cart="accessoriesStore.toggleCart(true)"
                />
              </div>
            </div>

            <!-- Accessories Grid -->
            <div v-if="accessoriesStore.filteredAccessories.length > 0">
              <h3 v-if="accessoriesStore.accessoryPacks.length > 0 && !accessoriesStore.selectedCategory" class="mb-2 flex items-center gap-2 text-base font-bold text-slate-900">
                Individual Accessories
              </h3>
              <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <AccessoryCard
                  v-for="accessory in accessoriesStore.filteredAccessories"
                  :key="accessory.id"
                  :accessory="accessory"
                  :is-in-cart="accessoriesStore.isInCart(accessory.id)"
                  @add-to-cart="handleAddToCart"
                  @view-details="viewAccessoryDetails"
                  @view-cart="accessoriesStore.toggleCart(true)"
                />
              </div>
            </div>

            <!-- No Results -->
            <div v-else class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-slate-900">No accessories found</h3>
              <p class="mt-1 text-sm text-slate-500">Try adjusting your filters or search term</p>
              <button
                class="mt-4 rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                @click="accessoriesStore.resetFilters()"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Cart Sidebar -->
    <AccessoriesCart
      :show="accessoriesStore.showCart"
      :items="accessoriesStore.cartItems"
      :total="accessoriesStore.cartTotal"
      :selected-model="accessoriesStore.selectedModel"
      @close="accessoriesStore.toggleCart(false)"
      @remove="accessoriesStore.removeFromCart"
      @update-quantity="accessoriesStore.updateCartQuantity"
      @clear="accessoriesStore.clearCart()"
      @enquire="handleEnquire"
    />

    <!-- Accessory Detail Modal -->
    <AccessoryDetailModal
      :show="showDetailModal"
      :accessory="selectedAccessory"
      :is-in-cart="selectedAccessory ? accessoriesStore.isInCart(selectedAccessory.id) : false"
      @close="closeDetailModal"
      @add-to-cart="handleAddToCart"
      @view-cart="accessoriesStore.toggleCart(true); closeDetailModal()"
    />

    <!-- Accessories Enquiry Modal -->
    <AccessoriesEnquiryModal
      :show="showEnquiryModal"
      :items="accessoriesStore.cartItems"
      :total="accessoriesStore.cartTotal"
      :selected-model="accessoriesStore.selectedModel"
      @close="showEnquiryModal = false"
      @submitted="handleEnquirySubmitted"
    />

    <!-- Mobile Filters Dialog -->
    <Teleport to="body">
      <div
        v-if="showMobileFilters"
        class="mobile-filters-overlay"
        @click="showMobileFilters = false"
      >
        <div
          class="mobile-filters-dialog"
          @click.stop
        >
          <div class="mobile-filters-header">
            <h2 class="mobile-filters-title">Filter Accessories</h2>
            <button
              class="mobile-filters-close"
              @click="showMobileFilters = false"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="mobile-filters-content">
            <!-- Search -->
            <div class="filter-section">
              <label class="filter-label">SEARCH</label>
              <div class="search-input-wrapper">
                <span class="search-icon">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  :value="accessoriesStore.searchQuery"
                  type="search"
                  class="search-input-field"
                  placeholder="Search accessories..."
                  @input="accessoriesStore.setSearchQuery(($event.target as HTMLInputElement).value)"
                >
              </div>
            </div>

            <!-- Categories -->
            <div class="filter-section">
              <label class="filter-label">CATEGORY</label>
              <div class="category-list">
                <button
                  class="category-button"
                  :class="{ 'active': !accessoriesStore.selectedCategory }"
                  @click="accessoriesStore.setCategory(null)"
                >
                  All Categories
                  <span class="category-count">{{ accessoriesStore.accessories.length }}</span>
                </button>
                <button
                  v-for="category in accessoriesStore.categories"
                  :key="category"
                  class="category-button"
                  :class="{ 'active': accessoriesStore.selectedCategory === category }"
                  @click="accessoriesStore.setCategory(category)"
                >
                  {{ category }}
                  <span class="category-count">
                    ({{ accessoriesStore.categorizedAccessories[category]?.length || 0 }})
                  </span>
                </button>
              </div>
            </div>

            <!-- Sort -->
            <div class="filter-section">
              <label class="filter-label">SORT BY</label>
              <select
                :value="accessoriesStore.sortBy"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                @change="accessoriesStore.setSortBy(($event.target as HTMLSelectElement).value as any)"
              >
                <option value="name">Name (A-Z)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            <!-- Popular Filter -->
            <div class="filter-section">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  :checked="accessoriesStore.showOnlyPopular"
                  @change="accessoriesStore.togglePopularFilter()"
                  class="checkbox-input"
                >
                <span class="checkbox-text">Show popular items only</span>
              </label>
            </div>

            <!-- Clear Filters -->
            <button
              v-if="hasActiveFilters"
              class="mobile-clear-filters"
              @click="accessoriesStore.resetFilters()"
            >
              Clear Filters
            </button>
          </div>

          <div class="mobile-filters-footer">
            <button
              class="mobile-apply-filters"
              @click="showMobileFilters = false"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Accessory, AccessoryPack, HyundaiModel } from '~/stores/accessories';

const accessoriesStore = useAccessoriesStore();

// Enhanced SEO
const config = useRuntimeConfig();

useSeoMeta({
  title: 'Hyundai Genuine Accessories | Sale Hyundai Victoria',
  description: 'Shop Hyundai Genuine Accessories for your vehicle at Sale Hyundai. Explore interior, exterior, cargo, roof racks, alloy wheels and protection accessories. All backed by a 5-year warranty. Expert fitting available.',
  ogTitle: 'Hyundai Genuine Accessories | Sale Hyundai',
  ogDescription: 'Shop Hyundai Genuine Accessories - roof racks, tow bars, alloy wheels, interior accessories & more. 5-year warranty. Expert fitting.',
  ogImage: 'https://www.hyundai.com/content/dam/hyundai/au/en/owning/accessories/Hyunda_Accessories_KONA_NLine_RoofRack_800x600.jpg',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Hyundai Genuine Accessories | Sale Hyundai',
  twitterDescription: 'Shop Hyundai Genuine Accessories. 5-year warranty on all accessories.',
});

useHead({
  link: [
    {
      rel: 'canonical',
      href: `${config.public.siteUrl}/accessories`,
    },
  ],
});

useSchemaOrg([
  {
    '@type': 'ItemList',
    'name': 'Hyundai Genuine Accessories',
    'description': 'Complete range of Hyundai Genuine Accessories for all models',
    'numberOfItems': () => accessoriesStore.availableModels.length,
    'itemListElement': () => accessoriesStore.availableModels.map((model, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': `${model.name} Accessories`,
      'url': `${config.public.siteUrl}/accessories/${model.slug}`,
    })),
  },
]);

// Modal state
const showDetailModal = ref(false);
const selectedAccessory = ref<Accessory | null>(null);
const showMobileFilters = ref(false);
const showEnquiryModal = ref(false);

// Model category filter
const selectedModelCategory = ref<string | null>(null);

// Popular categories for the hero section
const popularCategories = [
  {
    id: 'roof-racks',
    name: 'Roof racks.',
    description: 'Be ready for any adventure with our range of genuine roof racks and carriers, designed to the highest standards and to complement your Hyundai\'s silhouette. Explore surfboard carriers for coastal getaways, bike carriers for two-wheeled exploring, and roof racks for lugging the heavy stuff.',
    image: 'https://www.hyundai.com/content/dam/hyundai/au/en/owning/accessories/Hyunda_Accessories_KONA_NLine_RoofRack_800x600.jpg',
  },
  {
    id: 'interior',
    name: 'Interior accessories.',
    description: 'Tailor your space to suit your lifestyle with custom-designed interior accessories. Discover Hyundai tailored floor mats and cargo boot liners for when you bring the great outdoors inside, seat business suit hangers for when your car doubles as your office, and luxury cargo organisers to keep your groceries or equipment from joining you in the front.',
    image: 'https://www.hyundai.com/content/dam/hyundai/au/en/owning/accessories/Hyundai_Accessories_Interior_800x600_2.jpg',
  },
  {
    id: 'tow-bars',
    name: 'Tow and nudge bars.',
    description: 'Whether you\'re hauling the tools of your trade or the gear for a weekend adventure, you\'ll feel confident in the towing hardware expertly installed by your Hyundai dealer. Explore tow bar and trailer wiring harnesses, load assist kits and nudge bars designed to fit your car perfectly.',
    image: 'https://www.hyundai.com/content/dam/hyundai/au/en/owning/accessories/Hyundai-Accessories-tow-nudge-bars-800x600.jpg',
  },
  {
    id: 'alloy-wheels',
    name: 'Alloy wheels.',
    description: 'Turn heads with 16" to 21" diameter alloy wheels in black gloss, satin and alloy machined finishes, all designed and manufactured to the highest standards.',
    image: 'https://www.hyundai.com/content/dam/hyundai/au/en/owning/accessories/Hyundai_Accessories_TUCSON_Nambu_Black_Rims__adventure_800x600.jpg',
  },
];

// Model categories in specific order matching Hyundai website
// Note: 'Hatch' and 'Sedan' are combined into one "Hatch & Sedans" tab
const modelCategories = computed(() => {
  const cats = new Set(accessoriesStore.availableModels.map(m => m.category));
  
  // Define display order with combined categories
  const categories: { key: string; display: string; matches: string[] }[] = [
    { key: 'SUV', display: 'SUVs & People Movers', matches: ['SUV'] },
    { key: 'Electric', display: 'Electric', matches: ['Electric'] },
    { key: 'HatchSedan', display: 'Hatch & Sedans', matches: ['Hatch', 'Sedan'] },
    { key: 'Performance', display: 'Performance', matches: ['Performance'] },
    { key: 'Van', display: 'Vans & Trucks', matches: ['Van'] },
    { key: 'Hybrid', display: 'Hybrid', matches: ['Hybrid'] },
  ];
  
  // Only return categories that have models
  return categories.filter(cat => cat.matches.some(m => cats.has(m as any)));
});

// Category display names
const getCategoryDisplayName = (category: { key: string; display: string }): string => {
  return category.display;
};

// Filtered models by category
const filteredModelsByCategory = computed(() => {
  if (!selectedModelCategory.value) {
    return accessoriesStore.availableModels;
  }
  
  // Get the category matches
  const category = modelCategories.value.find(c => c.key === selectedModelCategory.value);
  if (!category) {
    return accessoriesStore.availableModels;
  }
  
  return accessoriesStore.availableModels.filter(m => category.matches.includes(m.category));
});

// Computed
const hasActiveFilters = computed(() => {
  return accessoriesStore.selectedCategory !== null ||
    accessoriesStore.searchQuery !== '' ||
    accessoriesStore.showOnlyPopular ||
    accessoriesStore.sortBy !== 'name';
});

// Methods
const scrollToModelSelector = () => {
  const element = document.getElementById('model-selector');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Methods
const handleModelSelect = async (model: HyundaiModel) => {
  // Navigate to the model-specific page using slugged title
  // Model slug is already normalized from model name in the store
  await navigateTo(`/accessories/${model.slug}`);
};

const changeModel = async () => {
  accessoriesStore.selectedModel = null;
  accessoriesStore.accessories = [];
  accessoriesStore.accessoryPacks = [];
  accessoriesStore.resetFilters();
  
  // Navigate back to the main accessories page
  await navigateTo('/accessories');
};

const handleAddToCart = (accessory: Accessory) => {
  accessoriesStore.addToCart(accessory, 'accessory');
};

const handleAddPack = (pack: AccessoryPack) => {
  accessoriesStore.addToCart(pack, 'pack');
};

const viewAccessoryDetails = (accessory: Accessory) => {
  selectedAccessory.value = accessory;
  showDetailModal.value = true;
};

const viewPackDetails = (pack: AccessoryPack) => {
  // For now, treat packs similarly to accessories
  selectedAccessory.value = pack as unknown as Accessory;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedAccessory.value = null;
};

const handleEnquire = () => {
  // Close cart and show enquiry modal
  accessoriesStore.toggleCart(false);
  showEnquiryModal.value = true;
};

const handleEnquirySubmitted = () => {
  // Close the enquiry modal after successful submission
  showEnquiryModal.value = false;
};

const formatPrice = (price: number) => {
  return price.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// Fetch OEM model images on mount
onMounted(async () => {
  // Fetch OEM model images for the selector
  await accessoriesStore.fetchOEMModels();
});
</script>

<style scoped>
/* OEM Style - Matching Hyundai Official Design */

.accessories-shop {
  font-family: 'HyundaiSansHead', 'Helvetica Neue', Arial, sans-serif;
  color: #1a1a1a;
}

/* Hero Section */
.accessories-hero-section {
  background: #fff;
  padding: 40px 20px 60px;
}

.hero-content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-main-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 40px;
}

.hero-text {
  flex: 1;
  max-width: 800px;
}

.hero-title {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 20px;
  line-height: 1.2;
}

.hero-description {
  font-size: 16px;
  line-height: 1.7;
  color: #333;
  margin: 0;
}

.cart-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.cart-button:hover {
  background: #e8e8e8;
  border-color: #ccc;
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #e85d00;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}

.cart-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.cart-summary {
  font-size: 12px;
  color: #666;
}

/* Popular Accessories Section */
.popular-accessories-section {
  background: #fff;
  padding: 60px 20px;
}

.popular-accessories-content {
  max-width: 1200px;
  margin: 0 auto;
}

.popular-accessories-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 16px;
  line-height: 1.3;
}

.popular-accessories-description {
  font-size: 16px;
  line-height: 1.7;
  color: #555;
  margin: 0 0 40px;
  max-width: 900px;
}

.popular-categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.popular-category-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.popular-category-card:hover {
  transform: translateY(-4px);
}

.category-image-wrapper {
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-radius: 4px;
  margin-bottom: 16px;
}

.category-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-name {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 12px;
  line-height: 1.3;
}

.category-description {
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  margin: 0 0 16px;
}

.category-link {
  display: inline-block;
  font-size: 14px;
  font-weight: 600;
  color: #002c5f;
  text-decoration: none;
  transition: color 0.2s;
}

.category-link:hover {
  color: #004080;
  text-decoration: underline;
}

/* Model Selector Section */
.model-selector-section {
  background: #fff;
  padding: 40px 20px 80px;
}

.model-selector-content {
  max-width: 1200px;
  margin: 0 auto;
}

.category-tabs-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin-bottom: 40px;
  justify-content: center;
  border-bottom: 2px solid #e0e0e0;
}

.category-tab {
  padding: 16px 24px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  position: relative;
  margin-bottom: -2px;
}

.category-tab:hover {
  color: #002c5f;
}

.category-tab.active {
  color: #002c5f;
  border-bottom-color: #002c5f;
}

/* Responsive */
/* Accessories Browse Section */
.accessories-browse-section {
  background: #fff;
  padding: 40px 20px;
}

.accessories-browse-content {
  max-width: 1200px;
  margin: 0 auto;
}

.selected-model-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 30px;
}

.selected-model-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.model-image-container {
  width: 80px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fff;
  border-radius: 4px;
}

.model-header-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.model-header-placeholder {
  font-size: 32px;
}

.model-info-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.2;
}

.model-category-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.change-model-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #002c5f;
  background: #fff;
  border: 1px solid #002c5f;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.change-model-button:hover {
  background: #002c5f;
  color: #fff;
}

.accessories-content-wrapper {
  display: flex;
  flex-direction: row;
  gap: 30px;
  align-items: flex-start;
}

.filters-sidebar {
  width: 280px;
  flex-shrink: 0;
}

.desktop-only {
  display: block;
}

.filters-panel {
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.main-content-area {
  flex: 1;
  min-width: 0;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.results-count {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.results-count strong {
  color: #1a1a1a;
  font-weight: 600;
}

.mobile-filter-button {
  display: none;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #002c5f;
  background: #fff;
  border: 1px solid #002c5f;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-filter-button:hover {
  background: #002c5f;
  color: #fff;
}

/* Filter Panel Styles */
.filter-section {
  margin-bottom: 24px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #666;
  margin-bottom: 12px;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-button {
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  font-size: 14px;
  font-weight: 400;
  color: #666;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-button:hover {
  background: #f5f5f5;
  color: #1a1a1a;
}

.category-button.active {
  background: #002c5f;
  color: #fff;
}

.category-button.active:hover {
  background: #001a3a;
}

.category-count {
  font-size: 13px;
  opacity: 0.8;
}

.category-button.active .category-count {
  opacity: 1;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #002c5f;
}

.checkbox-text {
  user-select: none;
}

.filter-section select {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fff;
  color: #1a1a1a;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.filter-section select:focus {
  border-color: #002c5f;
}

.search-input-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

.search-input-field {
  width: 100%;
  padding: 10px 12px 10px 36px;
  font-size: 14px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input-field:focus {
  border-color: #002c5f;
}

/* Mobile Filters Dialog */
.mobile-filters-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.2s ease-out;
}

.mobile-filters-dialog {
  width: 100%;
  max-height: 90vh;
  background: #fff;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  overflow: hidden;
}

.mobile-filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.mobile-filters-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.mobile-filters-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
}

.mobile-filters-close:hover {
  background: #f5f5f5;
  color: #1a1a1a;
}

.mobile-filters-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.mobile-clear-filters {
  width: 100%;
  padding: 12px;
  margin-top: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-clear-filters:hover {
  border-color: #002c5f;
  color: #002c5f;
}

.mobile-filters-footer {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  background: #fff;
}

.mobile-apply-filters {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: #002c5f;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-apply-filters:hover {
  background: #001a3a;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .hero-main-content {
    flex-direction: column;
  }

  .hero-title {
    font-size: 28px;
  }

  .popular-categories-grid {
    grid-template-columns: 1fr;
  }

  .category-tabs-nav {
    justify-content: flex-start;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .category-tabs-nav::-webkit-scrollbar {
    display: none;
  }

  .category-tab {
    padding: 14px 20px;
    font-size: 14px;
  }

  .selected-model-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .change-model-button {
    width: 100%;
    justify-content: center;
  }

  .accessories-content-wrapper {
    flex-direction: column;
  }

  .desktop-only {
    display: none;
  }

  .mobile-filter-button {
    display: flex;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .mobile-filter-button {
    width: 100%;
    justify-content: center;
  }
}
</style>

