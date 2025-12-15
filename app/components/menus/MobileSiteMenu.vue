<template>
  <Teleport to="body">
    <Transition name="mobile-menu">
      <div 
        v-if="isOpen" 
        class="mobile-site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <!-- Backdrop -->
        <div 
          class="mobile-site-menu__backdrop"
          @click="close"
        />

        <!-- Panel -->
        <div class="mobile-site-menu__panel">
          <!-- Header -->
          <header class="mobile-site-menu__header">
            <NuxtLink to="/" class="mobile-site-menu__logo" @click="close">
              <img 
                src="/assets/logos/logo-white-sm.svg" 
                :alt="siteName"
                width="80"
                height="42"
              />
            </NuxtLink>
            <button 
              class="mobile-site-menu__close"
              @click="close"
              aria-label="Close menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </header>

          <!-- Content -->
          <div class="mobile-site-menu__content">
            <!-- Quick Actions -->
            <div class="mobile-site-menu__quick-actions">
              <NuxtLink 
                to="/car-sales" 
                class="mobile-site-menu__action-btn mobile-site-menu__action-btn--primary"
                @click="close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                Find a Vehicle
              </NuxtLink>
              <a 
                :href="serviceBookingUrl"
                target="_blank"
                class="mobile-site-menu__action-btn"
                @click="close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Book Service
              </a>
            </div>

            <!-- Menu Sections -->
            <nav class="mobile-site-menu__nav">
              <!-- Vehicle Models Section -->
              <div class="mobile-site-menu__section">
                <button 
                  class="mobile-site-menu__section-header"
                  :class="{ 'is-expanded': expandedSections.includes('models') }"
                  @click="toggleSection('models')"
                >
                  <span class="mobile-site-menu__section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10.4V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4.4l-2.5.7A2 2 0 0 0 2 13v3c0 .6.4 1 1 1h2"/>
                      <circle cx="7" cy="17" r="2"/>
                      <circle cx="17" cy="17" r="2"/>
                    </svg>
                    Choose Your Hyundai
                  </span>
                  <svg 
                    class="mobile-site-menu__chevron" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                
                <Transition name="section-expand">
                  <div 
                    v-if="expandedSections.includes('models')" 
                    class="mobile-site-menu__section-content"
                  >
                    <div 
                      v-for="category in vehicleCategories" 
                      :key="category"
                      class="mobile-site-menu__category"
                    >
                      <div class="mobile-site-menu__category-label">{{ category }}</div>
                      <div class="mobile-site-menu__category-items">
                        <NuxtLink
                          v-for="vehicle in getVehiclesByCategory(category)"
                          :key="vehicle.slug"
                          :to="`/vehicle/${vehicle.slug}`"
                          class="mobile-site-menu__vehicle-link"
                          @click="close"
                        >
                          {{ vehicle.name }}
                        </NuxtLink>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Footer Link Sections -->
              <div 
                v-for="(section, index) in footerLinks" 
                :key="index"
                class="mobile-site-menu__section"
              >
                <button 
                  class="mobile-site-menu__section-header"
                  :class="{ 'is-expanded': expandedSections.includes(`section-${index}`) }"
                  @click="toggleSection(`section-${index}`)"
                >
                  <span class="mobile-site-menu__section-title">
                    <component :is="getSectionIcon(section.heading)" />
                    {{ section.heading }}
                  </span>
                  <svg 
                    class="mobile-site-menu__chevron" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                
                <Transition name="section-expand">
                  <div 
                    v-if="expandedSections.includes(`section-${index}`)" 
                    class="mobile-site-menu__section-content"
                  >
                    <div class="mobile-site-menu__links">
                      <a 
                        v-if="isLinkExternal(link.url)"
                        v-for="link in section.links"
                        :key="link.url"
                        :href="link.url"
                        class="mobile-site-menu__link"
                        target="_blank"
                        rel="nofollow"
                        @click="close"
                      >
                        {{ link.title }}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mobile-site-menu__external-icon">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                      <NuxtLink
                        v-else
                        v-for="link in section.links"
                        :key="link.url"
                        :to="link.url"
                        class="mobile-site-menu__link"
                        @click="close"
                      >
                        {{ link.title }}
                      </NuxtLink>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Saved Vehicles -->
              <NuxtLink 
                to="/favorites" 
                class="mobile-site-menu__standalone-link"
                @click="close"
              >
                <span class="mobile-site-menu__section-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  Saved Vehicles
                </span>
                <span v-if="savedVehicleCount > 0" class="mobile-site-menu__badge">
                  {{ savedVehicleCount }}
                </span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </NuxtLink>
            </nav>
          </div>

          <!-- Footer -->
          <footer class="mobile-site-menu__footer">
            <!-- Contact Info -->
            <div class="mobile-site-menu__contact">
              <div class="mobile-site-menu__dealer-name">{{ siteName }}</div>
              <div class="mobile-site-menu__address">{{ showroomAddress }}</div>
              <a :href="`tel:${phoneFormatted}`" class="mobile-site-menu__phone">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {{ phone }}
              </a>
            </div>

            <!-- Social Links -->
            <div v-if="social && Object.keys(social).length > 0" class="mobile-site-menu__social">
              <a 
                v-for="(url, platform) in social" 
                :key="platform"
                :href="url"
                target="_blank"
                rel="noreferrer"
                class="mobile-site-menu__social-link"
                :aria-label="platform"
              >
                <span class="mobile-site-menu__social-icon">{{ platform.charAt(0).toUpperCase() }}</span>
              </a>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { h } from 'vue';

const mainStore = useMainStore();
const eventBus = useEventBus();
const route = useRoute();

// State
const isOpen = ref(false);
const expandedSections = ref<string[]>(['models']); // Models expanded by default

// Site config from store
const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');
const showroomAddress = computed(() => mainStore.site?.showroom_address || '');
const phone = computed(() => mainStore.site?.phone || '');
const phoneFormatted = computed(() => phone.value.replace(/[^0-9]/g, ''));
const serviceBookingUrl = computed(() => mainStore.site?.service_booking_url || '#');

// Social links
const social = computed(() => {
  const socialData = mainStore.site?.social;
  if (!socialData || (Array.isArray(socialData) && socialData.length === 0)) {
    return null;
  }
  return socialData;
});

// Footer links from site config (sitelinks.footer) - same as FooterLinks.vue
const footerLinks = computed(() => {
  return mainStore.site?.sitelinks?.footer || [
    {
      heading: 'Shop',
      links: [
        { title: 'New Cars', url: '/build-and-price' },
        { title: 'Used Cars', url: '/car-sales' },
        { title: 'Special Offers', url: '/special-offers' },
        { title: 'Sell Your Car', url: '/sell-my-car' },
      ],
    },
    {
      heading: 'Services',
      links: [
        { title: 'Book a Service', url: '/service' },
        { title: 'Parts', url: '/parts' },
        { title: 'Finance', url: '/finance' },
        { title: 'Insurance', url: '/insurance' },
      ],
    },
    {
      heading: 'About',
      links: [
        { title: 'Contact Us', url: '/contact' },
        { title: 'About Us', url: '/about' },
        { title: 'Careers', url: '/careers' },
        { title: 'Site Map', url: '/site-map' },
      ],
    },
  ];
});

// Vehicle categories
const vehicles = computed(() => mainStore.models || []);

const vehicleCategories = computed(() => {
  const categories = new Set<string>();
  vehicles.value.forEach((v: any) => {
    if (v.category) categories.add(v.category);
  });
  return Array.from(categories);
});

const getVehiclesByCategory = (category: string) => {
  return vehicles.value.filter((v: any) => v.category === category);
};

// Saved vehicles count
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

// Methods
const open = () => {
  isOpen.value = true;
  if (import.meta.client) {
    document.body.style.overflow = 'hidden';
  }
};

const close = () => {
  isOpen.value = false;
  if (import.meta.client) {
    document.body.style.overflow = '';
  }
};

const toggle = (value?: boolean) => {
  if (value !== undefined) {
    value ? open() : close();
  } else {
    isOpen.value ? close() : open();
  }
};

const toggleSection = (sectionId: string) => {
  const index = expandedSections.value.indexOf(sectionId);
  if (index > -1) {
    expandedSections.value.splice(index, 1);
  } else {
    expandedSections.value.push(sectionId);
  }
};

const isLinkExternal = (url: string) => {
  return /^(http|https):\/\//.test(url);
};

// Get icon for each section heading
const getSectionIcon = (heading: string) => {
  const icons: Record<string, any> = {
    'Shop': h('svg', { 
      width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 
    }, [
      h('path', { d: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z' }),
      h('line', { x1: 3, y1: 6, x2: 21, y2: 6 }),
      h('path', { d: 'M16 10a4 4 0 0 1-8 0' }),
    ]),
    'Services': h('svg', { 
      width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 
    }, [
      h('path', { d: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' }),
    ]),
    'About': h('svg', { 
      width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 
    }, [
      h('circle', { cx: 12, cy: 12, r: 10 }),
      h('line', { x1: 12, y1: 16, x2: 12, y2: 12 }),
      h('line', { x1: 12, y1: 8, x2: 12.01, y2: 8 }),
    ]),
  };
  
  return icons[heading] || h('svg', { 
    width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 
  }, [
    h('circle', { cx: 12, cy: 12, r: 1 }),
    h('circle', { cx: 12, cy: 5, r: 1 }),
    h('circle', { cx: 12, cy: 19, r: 1 }),
  ]);
};

// Event bus listeners
eventBus.useEvent('mobile-nav:toggle', (value) => {
  toggle(value);
});

eventBus.useEvent('mobile-nav:open', () => {
  open();
});

eventBus.useEvent('mobile-nav:close', () => {
  close();
});

// Close on route change
watch(() => route.fullPath, () => {
  close();
});

// Close on escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen.value) {
      close();
    }
  };
  window.addEventListener('keydown', handleEscape);
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape);
    // Ensure body scroll is restored
    if (import.meta.client) {
      document.body.style.overflow = '';
    }
  });
});
</script>

<style lang="scss" scoped>
// Hyundai Brand Colors
$hyundai-blue: #001E50;
$hyundai-light-blue: #00aad2;
$hyundai-sand: rgb(246, 243, 242);

.mobile-site-menu {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.mobile-site-menu__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 30, 80, 0.6);
  backdrop-filter: blur(4px);
}

.mobile-site-menu__panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  max-width: 400px;
  height: 100%;
  background: $hyundai-sand;
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.2);
}

// Header
.mobile-site-menu__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: $hyundai-blue;
  color: white;
}

.mobile-site-menu__logo img {
  height: 36px;
  width: auto;
}

.mobile-site-menu__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

// Content
.mobile-site-menu__content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

// Quick Actions
.mobile-site-menu__quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 20px;
  background: white;
  border-bottom: 1px solid rgba(0, 30, 80, 0.08);
}

.mobile-site-menu__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  background: $hyundai-sand;
  color: $hyundai-blue;
  border: 1px solid rgba(0, 30, 80, 0.12);

  &:hover {
    background: rgba(0, 30, 80, 0.05);
    border-color: $hyundai-blue;
  }

  &--primary {
    background: $hyundai-blue;
    color: white;
    border-color: $hyundai-blue;

    &:hover {
      background: darken($hyundai-blue, 5%);
    }
  }

  svg {
    flex-shrink: 0;
  }
}

// Navigation
.mobile-site-menu__nav {
  padding: 8px 0;
}

.mobile-site-menu__section {
  border-bottom: 1px solid rgba(0, 30, 80, 0.06);
}

.mobile-site-menu__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 30, 80, 0.03);
  }

  &.is-expanded {
    background: white;

    .mobile-site-menu__chevron {
      transform: rotate(180deg);
    }
  }
}

.mobile-site-menu__section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 600;
  color: $hyundai-blue;

  svg {
    flex-shrink: 0;
    opacity: 0.7;
  }
}

.mobile-site-menu__chevron {
  color: rgba(0, 30, 80, 0.4);
  transition: transform 0.3s ease;
}

.mobile-site-menu__section-content {
  background: white;
  padding: 0 20px 16px;
}

// Vehicle Categories
.mobile-site-menu__category {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.mobile-site-menu__category-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 30, 80, 0.5);
  margin-bottom: 8px;
  padding-left: 32px;
}

.mobile-site-menu__category-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 32px;
}

.mobile-site-menu__vehicle-link {
  display: inline-block;
  padding: 6px 12px;
  background: $hyundai-sand;
  border-radius: 20px;
  font-size: 13px;
  color: $hyundai-blue;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: $hyundai-blue;
    color: white;
  }
}

// Links
.mobile-site-menu__links {
  padding-left: 32px;
}

.mobile-site-menu__link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  font-size: 14px;
  color: rgba(0, 30, 80, 0.8);
  text-decoration: none;
  border-bottom: 1px solid rgba(0, 30, 80, 0.05);
  transition: color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    color: $hyundai-light-blue;
  }
}

.mobile-site-menu__external-icon {
  opacity: 0.4;
  flex-shrink: 0;
}

// Standalone Link (Saved Vehicles)
.mobile-site-menu__standalone-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  text-decoration: none;
  border-bottom: 1px solid rgba(0, 30, 80, 0.06);
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 30, 80, 0.03);
  }

  .mobile-site-menu__section-title {
    flex: 1;
  }

  > svg:last-child {
    color: rgba(0, 30, 80, 0.3);
  }
}

.mobile-site-menu__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: $hyundai-light-blue;
  border-radius: 11px;
  font-size: 12px;
  font-weight: 700;
  color: white;
}

// Footer
.mobile-site-menu__footer {
  padding: 20px;
  background: white;
  border-top: 1px solid rgba(0, 30, 80, 0.08);
}

.mobile-site-menu__contact {
  margin-bottom: 16px;
}

.mobile-site-menu__dealer-name {
  font-size: 16px;
  font-weight: 700;
  color: $hyundai-blue;
  margin-bottom: 4px;
}

.mobile-site-menu__address {
  font-size: 13px;
  color: rgba(0, 30, 80, 0.6);
  margin-bottom: 8px;
}

.mobile-site-menu__phone {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: $hyundai-blue;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: white;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: darken($hyundai-blue, 5%);
  }

  svg {
    flex-shrink: 0;
  }
}

// Social Links
.mobile-site-menu__social {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 30, 80, 0.08);
}

.mobile-site-menu__social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: $hyundai-sand;
  border-radius: 50%;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: $hyundai-blue;

    .mobile-site-menu__social-icon {
      color: white;
    }
  }
}

.mobile-site-menu__social-icon {
  font-size: 14px;
  font-weight: 700;
  color: $hyundai-blue;
}

// Transitions
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.3s ease;

  .mobile-site-menu__panel {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;

  .mobile-site-menu__panel {
    transform: translateX(100%);
  }
}

.section-expand-enter-active,
.section-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.section-expand-enter-from,
.section-expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.section-expand-enter-to,
.section-expand-leave-from {
  opacity: 1;
  max-height: 500px;
}

// Scrollbar styling
.mobile-site-menu__content {
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 30, 80, 0.2);
    border-radius: 2px;
  }
}
</style>






