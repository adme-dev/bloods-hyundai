<template>
  <ClientOnly>
    <div class="primary-nav">
      <!-- Loading indicator -->
      <div v-if="loading" class="fixed top-0 left-0 right-0 h-0.5 bg-gray-200 z-[10000]">
        <div class="h-full bg-primary-light animate-pulse" style="animation: loading 1.5s ease-in-out infinite;"></div>
      </div>

      <!-- Top Bar with Reviews, Address, Phone -->
      <TopBar class="hidden md:block" />

      <!-- Main Navigation -->
      <nav ref="navRef" class="bg-white border-b border-gray-200 relative">
        <div class="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div class="flex items-center h-16">
            <!-- Logo + Menu Group (Left Side) -->
            <div class="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
              <!-- Logo -->
              <NuxtLink to="/" class="flex items-center flex-shrink-0">
                <img 
                  src="/assets/logos/logo-black.svg" 
                  width="160" 
                  height="22"
                  class="hidden md:block" 
                  :alt="siteName" 
                />
                <img 
                  src="/assets/logos/logo-black-sm.svg" 
                  width="50" 
                  height="26"
                  class="block md:hidden" 
                  :alt="siteName" 
                />
              </NuxtLink>

              <!-- Desktop Navigation Links -->
              <ul class="hidden lg:flex items-center gap-2 list-none m-0 p-0">
              <!-- Models Dropdown -->
              <li class="relative" id="models-nav-item">
                <a 
                  href="#" 
                  class="flex items-center gap-1 px-4 py-2 text-black font-semibold text-sm hover:text-gray-700 transition-colors cursor-pointer"
                  id="models-nav-link" 
                  @mouseenter="showModelsMenu" 
                  @mouseleave="hideModelsMenu"
                >
                  Models
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
              </li>

              <!-- Dynamic Nav Items -->
              <li 
                v-for="(item, index) in menu" 
                :key="index" 
                class="relative"
                @mouseenter="hasDropdown(item) ? showItemDropdown(index) : null"
                @mouseleave="hasDropdown(item) ? hideItemDropdown(index) : null"
              >
                <!-- Item with dropdown - use anchor to prevent navigation -->
                <a 
                  v-if="hasDropdown(item)"
                  :href="item.url"
                  class="flex items-center gap-1 px-4 py-2 text-black font-semibold text-sm hover:text-gray-700 transition-colors cursor-pointer"
                  @click.prevent="toggleItemDropdown(index)"
                >
                  {{ item.name }}
                  <svg 
                    class="w-3 h-3 transition-transform duration-200" 
                    :class="{ 'rotate-180': activeDropdown === index }"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
                <!-- Item without dropdown - use NuxtLink for navigation -->
                <NuxtLink 
                  v-else
                  :to="item.url" 
                  class="flex items-center gap-1 px-4 py-2 text-black font-semibold text-sm hover:text-gray-700 transition-colors"
                >
                  {{ item.name }}
                </NuxtLink>

                <!-- Dropdown for submenu HTML content -->
                <div 
                  v-if="hasDropdown(item) && item.submenuHtml"
                  :id="`nav-dropdown-${index}`"
                  class="nav-dropdown fixed left-0 right-0 w-screen bg-white shadow-lg z-[1000] border-t border-gray-200 transition-all duration-200 ease-in-out"
                  :class="activeDropdown === index ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'"
                  @mouseenter="keepItemDropdownOpen(index)"
                  @mouseleave="hideItemDropdown(index)"
                >
                  <div class="max-w-[1400px] mx-auto px-4 lg:px-8 py-6" v-html="item.submenuHtml"></div>
                </div>
              </li>
              </ul>
            </div>

            <!-- Desktop Right: Utility Icons -->
            <div class="hidden lg:flex items-center gap-6 ml-auto">
              <!-- Location -->
              <a 
                :href="mapDirections" 
                target="_blank" 
                class="flex items-center gap-2 text-black hover:text-gray-700 transition-colors"
              >
                <svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="text-base font-bold text-black">{{ siteName }}</span>
              </a>

              <!-- Saved Vehicles / Favorites -->
              <NuxtLink 
                to="/favorites" 
                class="relative text-black hover:text-gray-700 transition-colors"
                title="Saved Vehicles"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span 
                  v-if="savedVehicleCount > 0"
                  class="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white"
                >
                  {{ savedVehicleCount }}
                </span>
              </NuxtLink>

              <!-- Support -->
              <a 
                href="/contact" 
                class="text-black hover:text-gray-700 transition-colors"
                title="Support"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </a>

              <!-- Global Search -->
              <button 
                @click="openSearch" 
                class="text-black hover:text-gray-700 transition-colors"
                title="Search"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

            </div>

            <!-- Mobile: Site Name -->
            <div class="lg:hidden flex items-center mr-4">
              <a 
                :href="mapDirections" 
                target="_blank" 
                class="flex items-center gap-2 text-black hover:text-gray-700 transition-colors"
              >
                <svg class="w-5 h-5 flex-shrink-0 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="text-base font-bold text-black truncate max-w-[160px]">{{ siteName }}</span>
              </a>
            </div>

            <!-- Mobile Right: Icons -->
            <div class="lg:hidden flex items-center gap-4 ml-auto">
              <button 
                @click="openSearch" 
                class="p-2 text-black hover:text-gray-700 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button 
                @click="openDrawer" 
                class="p-2 text-black hover:text-gray-700 transition-colors"
                title="Menu"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Full-width Models Dropdown -->
        <div 
          id="vehicle-nav-dropdown"
          class="nav-dropdown fixed left-0 right-0 w-screen max-w-none overflow-y-auto m-0 p-0 bg-white shadow-lg z-[1000] border-t border-gray-200 pointer-events-auto hidden opacity-0 -translate-y-2.5 transition-all duration-200 ease-in-out"
          @mouseenter="keepModelsMenuOpen"
          @mouseleave="hideModelsMenu"
        >
          <LazyNavModels />
        </div>
      </nav>
    </div>
    
    <template #fallback>
      <div class="hidden md:block h-10 bg-[#1a1a1a]"></div>
      <div class="h-16 bg-white"></div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
const mainStore = useMainStore();
const eventBus = useEventBus();
const route = useRoute();

// Computed values from store
const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');
const address = computed(() => mainStore.site?.showroom_address || '36/38 Foster St, Sale VIC 3850');
const mapDirections = computed(() => mainStore.site?.map_directions || '#');
const loading = computed(() => mainStore.loading);

// Saved vehicles count for badge
const comparisonIds = useLocalStorage<any>('comparisonVehicles', []);
const savedVehicleCount = computed(() => {
  const raw = comparisonIds.value;
  if (Array.isArray(raw)) return raw.length;
  if (raw && typeof raw === 'object') {
    if (raw instanceof Set) return raw.size;
    const maybeValues = raw._set || Object.values(raw);
    if (Array.isArray(maybeValues)) return maybeValues.length;
  }
  return 0;
});

// Menu from site config
const menu = computed(() => {
  const site = mainStore.site;
  
  if (!site) {
    return [];
  }
  
  let navItems: any[] = [];
  
  if (site.navigation?.main && Array.isArray(site.navigation.main)) {
    navItems = site.navigation.main;
  } else if (site.sitelinks?.mainnav && Array.isArray(site.sitelinks.mainnav)) {
    navItems = site.sitelinks.mainnav;
  }
  
  return navItems
    .filter((item: any) => item && (item.url || item.link))
    .map((item: any) => ({
      name: item.title || item.name || item.label || 'Menu Item',
      url: item.url || item.link || '#',
      // Check for children array OR submenu with rendered content
      hasDropdown: (item.children && item.children.length > 0) || 
                   (item.submenu?.rendered && item.submenu.rendered.trim() !== ''),
      submenuHtml: item.submenu?.rendered || null,
      children: item.children || [],
    }));
});

// Check if menu item has dropdown
const hasDropdown = (item: any) => {
  return item.hasDropdown;
};

// Active dropdown state
const activeDropdown = ref<number | null>(null);
let itemHideTimeout: ReturnType<typeof setTimeout> | null = null;
let itemShowTimeout: ReturnType<typeof setTimeout> | null = null;

// Models menu state
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
let showTimeout: ReturnType<typeof setTimeout> | null = null;

// Nav element ref for calculating dropdown position
const navRef = ref<HTMLElement | null>(null);
const dropdownTop = ref('64px');

// Calculate dropdown position based on nav element
const updateDropdownPosition = () => {
  if (navRef.value) {
    const navRect = navRef.value.getBoundingClientRect();
    const top = navRect.bottom;
    dropdownTop.value = `${top}px`;
    
    // Update CSS custom property for all dropdowns
    document.documentElement.style.setProperty('--dropdown-top', `${top}px`);
    document.documentElement.style.setProperty('--dropdown-max-height', `calc(100vh - ${top}px)`);
  }
};

// Update position on mount and resize
onMounted(() => {
  updateDropdownPosition();
  window.addEventListener('resize', updateDropdownPosition);
  window.addEventListener('scroll', updateDropdownPosition);
});


// Close all dropdowns on route change
watch(() => route.fullPath, () => {
  // Close Models dropdown
  if (import.meta.client) {
    const dropdown = document.getElementById('vehicle-nav-dropdown');
    if (dropdown) {
      dropdown.classList.add('hidden', 'opacity-0', '-translate-y-2.5');
      dropdown.classList.remove('opacity-100', 'translate-y-0');
      dropdown.style.display = 'none';
    }
  }
  // Close any active item dropdown
  activeDropdown.value = null;
  // Clear any pending timeouts
  if (hideTimeout) clearTimeout(hideTimeout);
  if (showTimeout) clearTimeout(showTimeout);
  if (itemHideTimeout) clearTimeout(itemHideTimeout);
  if (itemShowTimeout) clearTimeout(itemShowTimeout);
  hideTimeout = null;
  showTimeout = null;
  itemHideTimeout = null;
  itemShowTimeout = null;
});

// Item dropdown methods
const showItemDropdown = (index: number) => {
  if (itemHideTimeout) {
    clearTimeout(itemHideTimeout);
    itemHideTimeout = null;
  }
  
  if (itemShowTimeout) {
    clearTimeout(itemShowTimeout);
  }
  
  itemShowTimeout = setTimeout(() => {
    // Update position before showing
    updateDropdownPosition();
    activeDropdown.value = index;
    itemShowTimeout = null;
  }, 100);
};

const hideItemDropdown = (index: number) => {
  if (itemShowTimeout) {
    clearTimeout(itemShowTimeout);
    itemShowTimeout = null;
  }
  
  if (itemHideTimeout) {
    clearTimeout(itemHideTimeout);
  }
  
  itemHideTimeout = setTimeout(() => {
    if (activeDropdown.value === index) {
      activeDropdown.value = null;
    }
    itemHideTimeout = null;
  }, 200);
};

const keepItemDropdownOpen = (index: number) => {
  if (itemHideTimeout) {
    clearTimeout(itemHideTimeout);
    itemHideTimeout = null;
  }
};

const toggleItemDropdown = (index: number) => {
  if (activeDropdown.value === index) {
    activeDropdown.value = null;
  } else {
    activeDropdown.value = index;
  }
};

// Methods
const openDrawer = () => {
  eventBus.emit('mobile-nav:toggle', true);
};

const openSearch = () => {
  eventBus.emit('search:open');
};

const showModelsMenu = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
  
  if (showTimeout) {
    clearTimeout(showTimeout);
  }
  
  showTimeout = setTimeout(() => {
    if (import.meta.client) {
      // Update position before showing
      updateDropdownPosition();
      
      const dropdown = document.getElementById('vehicle-nav-dropdown');
      if (dropdown) {
        dropdown.classList.remove('hidden', 'opacity-0', '-translate-y-2.5');
        dropdown.classList.add('opacity-100', 'translate-y-0');
        dropdown.style.display = 'block';
      }
    }
    showTimeout = null;
  }, 100);
};

const hideModelsMenu = () => {
  if (showTimeout) {
    clearTimeout(showTimeout);
    showTimeout = null;
  }
  
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
  
  hideTimeout = setTimeout(() => {
    if (import.meta.client) {
      const dropdown = document.getElementById('vehicle-nav-dropdown');
      if (dropdown) {
        dropdown.classList.add('hidden', 'opacity-0', '-translate-y-2.5');
        dropdown.classList.remove('opacity-100', 'translate-y-0');
        dropdown.style.display = 'none';
      }
    }
    hideTimeout = null;
  }, 200);
};

const keepModelsMenuOpen = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
};

onUnmounted(() => {
  if (showTimeout) clearTimeout(showTimeout);
  if (hideTimeout) clearTimeout(hideTimeout);
  if (itemShowTimeout) clearTimeout(itemShowTimeout);
  if (itemHideTimeout) clearTimeout(itemHideTimeout);
  window.removeEventListener('resize', updateDropdownPosition);
  window.removeEventListener('scroll', updateDropdownPosition);
});
</script>

<style scoped>
@keyframes loading {
  0% { width: 0; margin-left: 0; }
  50% { width: 70%; margin-left: 15%; }
  100% { width: 0; margin-left: 100%; }
}

/* Dropdown positioning - dynamically calculated via JS */
.nav-dropdown {
  top: var(--dropdown-top, 64px);
  max-height: var(--dropdown-max-height, calc(100vh - 64px));
}

/* Smooth scrollbar styling for dropdown */
#vehicle-nav-dropdown::-webkit-scrollbar {
  width: 8px;
}

#vehicle-nav-dropdown::-webkit-scrollbar-track {
  background: #f1f1f1;
}

#vehicle-nav-dropdown::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

#vehicle-nav-dropdown::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>

<style>
/* Global styles for rendered submenu HTML (not scoped) */
[id^="nav-dropdown-"] .icontag {
  margin-bottom: 0.5rem;
}

[id^="nav-dropdown-"] .icon-link-text {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

[id^="nav-dropdown-"] .icon-link-text:hover {
  background-color: #f5f5f5;
}

[id^="nav-dropdown-"] h5 {
  margin: 0;
  font-size: 0.95rem;
}

[id^="nav-dropdown-"] h3 {
  font-size: 1.25rem;
  font-weight: 600;
}

[id^="nav-dropdown-"] hr {
  border-color: #e5e5e5;
  margin: 1rem 0;
}

[id^="nav-dropdown-"] img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}
</style>



