<template>
  <Teleport to="body">
    <Transition name="search">
      <div v-if="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] flex items-start justify-center pt-[10vh] px-4 pb-4" @click.self="close">
        <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <!-- Search Input -->
          <div class="flex items-center gap-3 p-4 border-b border-gray-100">
            <div class="flex-1 flex items-center gap-3">
              <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Search vehicles, models, pages..."
                class="flex-1 text-lg text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none"
                @keydown.esc="close"
                @keydown.enter="handleEnter"
              />
              <button 
                v-if="searchQuery" 
                class="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                @click="clearSearch"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button 
              class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              @click="close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Results -->
          <div class="max-h-[60vh] overflow-y-auto">
            <!-- Loading -->
            <div v-if="isSearching" class="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
              <div class="w-8 h-8 border-2 border-gray-200 border-t-[#00aad2] rounded-full animate-spin"></div>
              <span class="text-sm">Searching...</span>
            </div>

            <!-- No Results -->
            <div v-else-if="searchQuery && !hasResults" class="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
              <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p class="text-sm">No results found for "<span class="font-medium text-gray-700">{{ searchQuery }}</span>"</p>
            </div>

            <!-- Results -->
            <div v-else-if="hasResults">
              <!-- Vehicles -->
              <div v-if="results.vehicles?.length" class="p-4 border-b border-gray-50">
                <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Vehicles</h3>
                <div class="space-y-1">
                  <NuxtLink
                    v-for="vehicle in results.vehicles.slice(0, 5)"
                    :key="vehicle.stockid"
                    :to="getVehicleLink(vehicle)"
                    class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    @click="close"
                  >
                    <div class="relative w-20 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        v-if="vehicle.thumb"
                        :src="vehicle.thumb"
                        :alt="vehicle.title"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="block text-sm font-medium text-gray-900 truncate group-hover:text-[#001E50] transition-colors">
                        {{ vehicle.title }}
                      </span>
                      <span class="block text-sm font-semibold text-[#00aad2]">
                        {{ getVehiclePrice(vehicle) }}
                      </span>
                    </div>
                    <svg class="w-4 h-4 text-gray-300 group-hover:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </NuxtLink>
                </div>
              </div>

              <!-- Models -->
              <div v-if="results.models?.length" class="p-4 border-b border-gray-50">
                <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Models</h3>
                <div class="space-y-1">
                  <NuxtLink
                    v-for="model in results.models.slice(0, 5)"
                    :key="model.slug"
                    :to="`/vehicle/${model.slug}`"
                    class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    @click="close"
                  >
                    <div class="w-10 h-10 bg-gradient-to-br from-[#001E50] to-[#00aad2] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <span class="flex-1 text-sm font-medium text-gray-900 group-hover:text-[#001E50] transition-colors">
                      {{ model.title?.rendered || model.name }}
                    </span>
                    <svg class="w-4 h-4 text-gray-300 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </NuxtLink>
                </div>
              </div>

              <!-- Pages -->
              <div v-if="results.pages?.length" class="p-4">
                <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pages</h3>
                <div class="space-y-1">
                  <NuxtLink
                    v-for="page in results.pages.slice(0, 5)"
                    :key="page.slug"
                    :to="`/${page.slug}`"
                    class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    @click="close"
                  >
                    <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span class="flex-1 text-sm font-medium text-gray-900 group-hover:text-[#001E50] transition-colors">
                      {{ page.title }}
                    </span>
                    <svg class="w-4 h-4 text-gray-300 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </NuxtLink>
                </div>
              </div>
            </div>

            <!-- Quick Links -->
            <div v-else class="p-4">
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Links</h3>
              <div class="grid grid-cols-2 gap-2">
                <NuxtLink 
                  to="/car-sales" 
                  class="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                  @click="close"
                >
                  <div class="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:shadow transition-shadow">
                    <svg class="w-5 h-5 text-[#001E50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <span class="text-sm font-medium text-gray-700 group-hover:text-[#001E50] transition-colors">Used Cars</span>
                </NuxtLink>
                <NuxtLink 
                  to="/special-offers" 
                  class="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                  @click="close"
                >
                  <div class="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:shadow transition-shadow">
                    <svg class="w-5 h-5 text-[#00aad2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <span class="text-sm font-medium text-gray-700 group-hover:text-[#001E50] transition-colors">Special Offers</span>
                </NuxtLink>
                <NuxtLink 
                  to="/test-drive" 
                  class="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                  @click="close"
                >
                  <div class="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:shadow transition-shadow">
                    <svg class="w-5 h-5 text-[#001E50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span class="text-sm font-medium text-gray-700 group-hover:text-[#001E50] transition-colors">Test Drive</span>
                </NuxtLink>
                <NuxtLink 
                  to="/contact" 
                  class="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                  @click="close"
                >
                  <div class="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:shadow transition-shadow">
                    <svg class="w-5 h-5 text-[#00aad2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span class="text-sm font-medium text-gray-700 group-hover:text-[#001E50] transition-colors">Contact Us</span>
                </NuxtLink>
              </div>
              
              <!-- Keyboard shortcut hint -->
              <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
                <span>Press</span>
                <kbd class="px-2 py-1 bg-gray-100 rounded text-gray-500 font-mono">⌘K</kbd>
                <span>to open search anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import Fuse from 'fuse.js';

const eventBus = useEventBus();
const mainStore = useMainStore();
const vehiclesStore = useVehiclesStore();

// State
const isOpen = ref(false);
const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const isSearching = ref(false);

// Fuse.js instances
const vehicleFuse = computed(() => {
  return new Fuse(vehiclesStore.vehicles, {
    keys: ['title', 'make.displayValue', 'model.displayValue'],
    threshold: 0.3,
  });
});

const modelFuse = computed(() => {
  return new Fuse(mainStore.models, {
    keys: ['name', 'title.rendered', 'slug'],
    threshold: 0.3,
  });
});

// Search results
const results = ref<{
  vehicles: any[];
  models: any[];
  pages: any[];
}>({
  vehicles: [],
  models: [],
  pages: [],
});

const hasResults = computed(() => {
  return results.value.vehicles.length > 0 ||
         results.value.models.length > 0 ||
         results.value.pages.length > 0;
});

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  if (!searchQuery.value.trim()) {
    results.value = { vehicles: [], models: [], pages: [] };
    return;
  }

  isSearching.value = true;

  // Search vehicles
  const vehicleResults = vehicleFuse.value.search(searchQuery.value);
  results.value.vehicles = vehicleResults.map(r => r.item);

  // Search models
  const modelResults = modelFuse.value.search(searchQuery.value);
  results.value.models = modelResults.map(r => r.item);

  // Pages could be static or from CMS
  results.value.pages = []; // Add page search if needed

  isSearching.value = false;
}, 300);

// Watch search query
watch(searchQuery, () => {
  debouncedSearch();
});

// Methods
const open = () => {
  isOpen.value = true;
  nextTick(() => {
    searchInput.value?.focus();
  });
  if (process.client) {
    document.body.style.overflow = 'hidden';
  }
};

const close = () => {
  isOpen.value = false;
  searchQuery.value = '';
  results.value = { vehicles: [], models: [], pages: [] };
  if (process.client) {
    document.body.style.overflow = '';
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  searchInput.value?.focus();
};

const handleEnter = () => {
  if (results.value.vehicles.length > 0) {
    close();
    navigateTo(getVehicleLink(results.value.vehicles[0]));
  } else if (results.value.models.length > 0) {
    close();
    navigateTo(`/vehicle/${results.value.models[0].slug}`);
  }
};

const getVehicleLink = (vehicle: any) => {
  const slug = (vehicle.title || '').toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-');
  return `/vehicle-for-sale/${vehicle.stockid}/${slug}`;
};

// Format vehicle price correctly - price is stored in price.value, not price.displayValue
const getVehiclePrice = (vehicle: any) => {
  const price = vehicle.price?.value;
  if (price && price > 0) {
    return `$${price.toLocaleString()}`;
  }
  return 'Price on Application';
};

// Event listeners
eventBus.useEvent('search:open', () => {
  open();
});

eventBus.useEvent('search:close', () => {
  close();
});

// Keyboard shortcut
if (process.client) {
  onMounted(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen.value ? close() : open();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown);
    });
  });
}
</script>

<style scoped>
/* Transition animations */
.search-enter-active,
.search-leave-active {
  transition: opacity 0.2s ease;
}

.search-enter-from,
.search-leave-to {
  opacity: 0;
}

/* Custom animation classes */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: slideInFromTop 0.2s ease-out;
}
</style>







