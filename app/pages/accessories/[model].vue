<template>
  <div class="accessories-model min-h-screen bg-slate-50 text-slate-900">
    <!-- Breadcrumb -->
    <AccessoriesBreadcrumb :model="modelData?.name" />

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-[#001E50] via-[#002A6B] to-[#003580]">
      <div class="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div class="relative mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-5">
            <div class="flex h-20 w-28 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <span class="text-4xl">{{ getCategoryEmoji(modelData?.category || '') }}</span>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white md:text-4xl">
                {{ modelData?.name }} Accessories
              </h1>
              <p class="mt-1 text-lg text-white/80">
                Genuine Hyundai accessories for your {{ modelData?.name }}
              </p>
            </div>
          </div>
          
          <!-- Cart Button -->
          <ClientOnly>
            <button
              class="flex items-center gap-3 rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm transition-all hover:bg-white/20"
              @click="accessoriesStore.toggleCart(true)"
            >
              <div class="relative">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span
                  v-if="accessoriesStore.cartItemCount > 0"
                  class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white"
                >
                  {{ accessoriesStore.cartItemCount }}
                </span>
              </div>
              <div class="text-left">
                <div class="text-sm font-semibold text-white">Your Cart</div>
                <div class="text-xs text-white/70">
                  {{ accessoriesStore.cartItemCount }} item{{ accessoriesStore.cartItemCount !== 1 ? 's' : '' }} ·
                  ${{ formatPrice(accessoriesStore.cartTotal) }}
                </div>
              </div>
            </button>
            <template #fallback>
              <button
                class="flex items-center gap-3 rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm transition-all hover:bg-white/20"
                disabled
              >
                <div class="relative">
                  <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div class="text-left">
                  <div class="text-sm font-semibold text-white">Your Cart</div>
                  <div class="text-xs text-white/70">0 items · $0.00</div>
                </div>
              </button>
            </template>
          </ClientOnly>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <!-- Loading State -->
      <div v-if="accessoriesStore.isLoading" class="flex flex-col items-center justify-center py-16">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary"></div>
        <p class="mt-4 text-sm text-slate-500">Loading accessories for {{ modelData?.name }}...</p>
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
        <div class="mt-4 flex gap-3">
          <button
            class="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            @click="loadAccessories"
          >
            Try Again
          </button>
          <NuxtLink
            to="/accessories"
            class="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            Browse All Models
          </NuxtLink>
        </div>
      </div>

      <!-- Accessories Content -->
      <div v-else class="flex flex-col gap-6 lg:flex-row">
        <!-- Filters Sidebar -->
        <aside class="w-full lg:w-64 lg:flex-shrink-0">
          <div class="sticky top-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <!-- Search -->
            <div class="mb-4">
              <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
              <div class="relative">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  :value="accessoriesStore.searchQuery"
                  type="search"
                  class="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Search accessories..."
                  @input="accessoriesStore.setSearchQuery(($event.target as HTMLInputElement).value)"
                >
              </div>
            </div>

            <!-- Categories -->
            <div class="mb-4">
              <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
              <div class="space-y-1">
                <button
                  class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors"
                  :class="[
                    !accessoriesStore.selectedCategory
                      ? 'bg-primary text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  ]"
                  @click="accessoriesStore.setCategory(null)"
                >
                  All Categories
                  <span class="float-right text-xs opacity-70">{{ accessoriesStore.accessories.length }}</span>
                </button>
                <button
                  v-for="category in accessoriesStore.categories"
                  :key="category"
                  class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors"
                  :class="[
                    accessoriesStore.selectedCategory === category
                      ? 'bg-primary text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  ]"
                  @click="accessoriesStore.setCategory(category)"
                >
                  {{ category }}
                  <span class="float-right text-xs opacity-70">
                    {{ accessoriesStore.categorizedAccessories[category]?.length || 0 }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Sort -->
            <div class="mb-4">
              <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Sort By</label>
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
            <div class="flex items-center gap-3">
              <button
                class="flex h-6 w-6 items-center justify-center rounded border transition-all"
                :class="[
                  accessoriesStore.showOnlyPopular
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-300 bg-white text-transparent'
                ]"
                @click="accessoriesStore.togglePopularFilter()"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <span class="text-sm text-slate-700">Popular items only</span>
            </div>

            <!-- Clear Filters -->
            <button
              v-if="hasActiveFilters"
              class="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
              @click="accessoriesStore.resetFilters()"
            >
              Clear Filters
            </button>

            <!-- Change Model Link -->
            <NuxtLink
              to="/accessories"
              class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Change Model
            </NuxtLink>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="flex-1">
          <!-- Results Header -->
          <div class="mb-4 flex items-center justify-between">
            <p class="text-sm text-slate-500">
              Showing <strong class="text-slate-900">{{ accessoriesStore.filteredAccessories.length }}</strong> accessories
            </p>
          </div>

          <!-- Value Packs Section -->
          <div v-if="accessoriesStore.accessoryPacks.length > 0 && !accessoriesStore.selectedCategory" class="mb-8">
            <h3 class="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <span class="text-xl">💰</span>
              Value Packs for {{ modelData?.name }}
              <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Save more
              </span>
            </h3>
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
            <h3 v-if="accessoriesStore.accessoryPacks.length > 0 && !accessoriesStore.selectedCategory" class="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <span class="text-xl">🛒</span>
              Individual Accessories
            </h3>
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
  </div>
</template>

<script setup lang="ts">
import type { Accessory, AccessoryPack } from '~/stores/accessories';
import { HYUNDAI_MODELS } from '~/stores/accessories';

const route = useRoute();
const accessoriesStore = useAccessoriesStore();
const config = useRuntimeConfig();

// Get model from route
const modelSlug = computed(() => route.params.model as string);
const modelData = computed(() => HYUNDAI_MODELS.find(m => m.slug === modelSlug.value));

// Enhanced SEO
useSeoMeta({
  title: () => `${modelData.value?.name || 'Hyundai'} Accessories | Genuine Parts | Sale Hyundai`,
  description: () => `Shop genuine Hyundai ${modelData.value?.name || ''} accessories at Sale Hyundai Victoria. Interior, exterior, cargo, roof racks, tow bars & protection accessories. 5-year warranty. Expert fitting available.`,
  ogTitle: () => `${modelData.value?.name || 'Hyundai'} Accessories | Sale Hyundai`,
  ogDescription: () => `Genuine ${modelData.value?.name || 'Hyundai'} accessories - roof racks, tow bars, alloy wheels & more. 5-year warranty.`,
  ogImage: () => modelData.value?.image || 'https://www.hyundai.com/content/dam/hyundai/au/en/owning/accessories/Hyunda_Accessories_KONA_NLine_RoofRack_800x600.jpg',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => `${modelData.value?.name || 'Hyundai'} Accessories | Sale Hyundai`,
  twitterDescription: () => `Shop genuine ${modelData.value?.name || 'Hyundai'} accessories. 5-year warranty.`,
});

useHead({
  link: [
    {
      rel: 'canonical',
      href: () => `${config.public.siteUrl}/accessories/${modelSlug.value}`,
    },
  ],
});

// Structured Data
useSchemaOrg([
  {
    '@type': 'Product',
    'name': () => `${modelData.value?.name} Accessories`,
    'description': () => `Genuine Hyundai accessories for ${modelData.value?.name}`,
    'brand': {
      '@type': 'Brand',
      'name': 'Hyundai',
    },
    'offers': {
      '@type': 'AggregateOffer',
      'priceCurrency': 'AUD',
      'availability': 'https://schema.org/InStock',
      'seller': {
        '@type': 'AutoDealer',
        'name': 'Sale Hyundai',
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': 'Sale',
          'addressRegion': 'VIC',
          'addressCountry': 'AU',
        },
      },
    },
  },
]);

// Modal state
const showDetailModal = ref(false);
const selectedAccessory = ref<Accessory | null>(null);

// Computed
const hasActiveFilters = computed(() => {
  return accessoriesStore.selectedCategory !== null ||
    accessoriesStore.searchQuery !== '' ||
    accessoriesStore.showOnlyPopular ||
    accessoriesStore.sortBy !== 'name';
});

// Methods
const loadAccessories = async () => {
  if (modelData.value) {
    await accessoriesStore.selectModel(modelData.value);
  }
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
  selectedAccessory.value = pack as unknown as Accessory;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedAccessory.value = null;
};

const handleEnquire = () => {
  navigateTo({
    path: '/contact',
    query: {
      subject: 'Accessories Enquiry',
      model: modelData.value?.name,
      items: accessoriesStore.cartItemCount.toString(),
    },
  });
};

const formatPrice = (price: number) => {
  return price.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const getCategoryEmoji = (category: string): string => {
  const emojis: Record<string, string> = {
    'SUV': '🚙',
    'Electric': '⚡',
    'Hatch': '🚗',
    'Sedan': '🚘',
    'Performance': '🏎️',
    'Van': '🚐',
    'Hybrid': '🌿',
  };
  return emojis[category] || '🚗';
};

// Load accessories on mount
onMounted(() => {
  if (modelData.value) {
    loadAccessories();
  } else {
    // Invalid model slug, redirect to accessories index
    navigateTo('/accessories');
  }
});

// Watch for model changes
watch(modelSlug, () => {
  if (modelData.value) {
    loadAccessories();
  }
});
</script>

<style scoped>
.bg-grid-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>

