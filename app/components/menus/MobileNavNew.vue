<template>
  <div class="uk-background-default">
    <!-- Mobile Navigation Drawer -->
    <div 
      id="mobile-nav-drawer"
      uk-offcanvas="mode: slide; overlay: true"
    >
      <div class="uk-offcanvas-bar uk-padding-remove">
        <!-- Header -->
        <div class="uk-padding-small uk-background-primary uk-light uk-flex uk-flex-between uk-flex-middle">
          <span class="uk-h4 uk-margin-remove">{{ siteName }}</span>
          <button class="uk-offcanvas-close uk-icon" type="button" uk-close></button>
        </div>

        <!-- Search -->
        <div class="uk-padding-small">
          <form @submit.prevent="handleSearch">
            <div class="uk-inline uk-width-1-1">
              <span class="uk-form-icon" uk-icon="icon: search"></span>
              <input
                v-model="searchQuery"
                type="text"
                class="uk-input"
                placeholder="Search vehicles..."
              />
            </div>
          </form>

          <!-- Book Service CTA -->
          <a 
            :href="serviceBookingUrl"
            target="_blank"
            class="uk-button uk-button-secondary uk-button-large uk-border-rounded uk-width-1-1 uk-margin-medium-top"
            @click="closeNav"
          >
            Book a Service
          </a>
        </div>

        <!-- Navigation Accordion -->
        <ul class="uk-padding-small uk-overflow-hidden uk-margin-large-bottom" uk-accordion="multiple: true">
          <!-- Stock Search -->
          <li>
            <a 
              href="#" 
              class="uk-accordion-title nav-title uk-text-bold"
              @click.prevent="openSearch"
            >
              Stock Search
              <span class="uk-float-right uk-icon" uk-icon="arrow-right"></span>
            </a>
          </li>

          <!-- Saved Vehicles -->
          <li>
            <NuxtLink 
              to="/favorites" 
              class="uk-accordion-title nav-title uk-text-bold uk-flex uk-flex-middle"
              @click="closeNav"
            >
              <span class="uk-flex-1">Saved Vehicles</span>
              <span 
                v-if="savedVehicleCount > 0" 
                class="uk-badge uk-margin-small-right"
              >
                {{ savedVehicleCount }}
              </span>
              <span class="uk-icon" uk-icon="arrow-right"></span>
            </NuxtLink>
          </li>

          <!-- Models -->
          <li>
            <a 
              href="#offcanvas-models" 
              uk-toggle
              class="uk-accordion-title nav-title uk-text-bold"
              @click="closeNav"
            >
              Models
              <span class="uk-float-right uk-icon" uk-icon="arrow-right"></span>
            </a>
          </li>

          <!-- Footer Sections (expandable) -->
          <li v-for="(section, index) in footerLinks" :key="index" class="uk-open">
            <a class="uk-accordion-title nav-title toggle uk-text-bold" href="#">
              {{ section.heading }}
              <span class="uk-float-right uk-icon" uk-icon="chevron-down"></span>
            </a>
            <div class="uk-accordion-content nav-content">
              <ul class="uk-list uk-h4 uk-link-text uk-margin-small-left">
                <li v-if="index === 0">
                  <a href="#" @click.prevent="openSearch" class="mb-link">Stock Search</a>
                </li>
                <li v-for="link in section.links" :key="link.url" class="el-content uk-panel">
                  <a 
                    v-if="isLinkExternal(link.url)" 
                    :href="link.url" 
                    class="mb-link" 
                    rel="nofollow" 
                    target="_blank"
                  >
                    {{ link.title }}
                  </a>
                  <NuxtLink 
                    v-else 
                    :to="link.url" 
                    :title="link.title"
                    class="mb-link"
                    @click="closeNav"
                  >
                    {{ link.title }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </li>

          <!-- Trading Hours -->
          <li>
            <a class="uk-accordion-title nav-title toggle uk-text-bold" href="#">
              Trading Hours
              <span class="uk-float-right uk-icon" uk-icon="chevron-down"></span>
            </a>
            <div class="uk-accordion-content nav-content">
              <ClientOnly>
                <div class="uk-padding-small">
                  <div v-for="(dept, key) in tradingHours" :key="key" class="uk-margin-bottom">
                    <div class="uk-text-bold uk-text-capitalize">{{ key }}</div>
                    <table class="uk-table uk-table-small uk-margin-remove">
                      <tr v-for="(hours, day) in dept" :key="day">
                        <td>{{ day }}</td>
                        <td class="uk-text-right">{{ hours }}</td>
                      </tr>
                    </table>
                  </div>
                </div>
                <template #fallback>
                  <div class="uk-padding-small uk-text-muted">Loading hours...</div>
                </template>
              </ClientOnly>
            </div>
          </li>

          <li class="uk-nav-divider"></li>

          <!-- Social Links -->
          <li>
            <div v-if="social" class="uk-child-width-auto uk-grid-small uk-flex-inline uk-margin-small-top uk-margin-small-left uk-grid" uk-grid>
              <div v-for="(url, platform) in social" :key="platform">
                <a 
                  class="el-link uk-icon-button uk-icon" 
                  target="_blank" 
                  rel="noreferrer" 
                  :href="url"
                  :uk-icon="`icon:${platform}`"
                ></a>
              </div>
            </div>
          </li>

          <!-- Contact Info -->
          <li>
            <div class="uk-padding-small">
              <div class="uk-text-bold nav-title">Showroom:</div>
              <div class="uk-margin-small-left">
                <p>{{ showroomAddress }}</p>
                <a 
                  :href="`tel:${phoneSalesFormatted}`" 
                  class="forcelink uk-display-block"
                >
                  <span class="uk-link-heading uk-text-secondary">
                    Sales: <b>{{ phoneSales }}</b>
                  </span>
                </a>
              </div>
            </div>
          </li>

          <li>
            <div class="uk-padding-small">
              <div class="uk-text-bold nav-title">Service / Parts:</div>
              <div class="uk-margin-small-left">
                <p>{{ serviceAddress }}</p>
                <a 
                  :href="`tel:${phoneServiceFormatted}`" 
                  class="forcelink uk-display-block"
                >
                  <span class="uk-link-heading uk-text-secondary">
                    Service / Parts: <b>{{ phoneService }}</b>
                  </span>
                </a>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $uikit } = useNuxtApp();
const router = useRouter();
const mainStore = useMainStore();

// Search
const searchQuery = ref('');

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

// Computed values from store
const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');
const showroomAddress = computed(() => mainStore.site?.showroom_address || '');
const serviceAddress = computed(() => mainStore.site?.service_address || mainStore.site?.showroom_address || '');
const phoneSales = computed(() => mainStore.site?.phone || '');
const phoneService = computed(() => mainStore.site?.phone_service || mainStore.site?.phone || '');
const phoneSalesFormatted = computed(() => phoneSales.value.replace(/[^0-9]/g, ''));
const phoneServiceFormatted = computed(() => phoneService.value.replace(/[^0-9]/g, ''));
const social = computed(() => mainStore.site?.social || {});
const serviceBookingUrl = computed(() => mainStore.site?.service_booking_url || '#');

// Footer links
const footerLinks = computed(() => {
  return mainStore.site?.footer || [
    { heading: 'Shop', links: [{ title: 'New Cars', url: '/build-and-price' }, { title: 'Used Cars', url: '/car-sales' }] },
    { heading: 'Services', links: [{ title: 'Service', url: '/service' }, { title: 'Finance', url: '/finance' }] },
    { heading: 'Contact', links: [{ title: 'Contact Us', url: '/contact' }] },
  ];
});

// Trading hours
const tradingHours = computed(() => {
  return mainStore.site?.trading_hours || {
    sales: { 'Mon-Fri': '8:30am - 5:30pm', Saturday: '8:30am - 4pm', Sunday: 'Closed' },
    service: { 'Mon-Fri': '7:30am - 5:00pm', Saturday: '8:00am - 12pm', Sunday: 'Closed' },
  };
});

// Methods
const closeNav = () => {
  if (process.client && $uikit) {
    const drawer = document.getElementById('mobile-nav-drawer');
    if (drawer) {
      $uikit.offcanvas(drawer)?.hide();
    }
  }
};

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    closeNav();
    router.push(`/car-sales?q=${encodeURIComponent(searchQuery.value)}`);
    searchQuery.value = '';
  }
};

const openSearch = () => {
  closeNav();
  // Open global search modal
  if (process.client && $uikit) {
    const modal = document.getElementById('global-search-modal');
    if (modal) {
      $uikit.modal(modal)?.show();
    }
  }
};

const isLinkExternal = (url: string) => {
  return /^(http|https):\/\//.test(url);
};
</script>

<style scoped>
.nav-title {
  padding: 12px 0;
  border-bottom: 1px solid #e5e5e5;
}

.nav-content {
  padding: 8px 0;
}

.mb-link {
  display: block;
  padding: 8px 0;
  color: #333;
  font-size: 0.95rem;
}

.mb-link:hover {
  color: var(--color-primary);
}

.uk-accordion-title::before {
  display: none;
}

.uk-icon-button {
  background: #f5f5f5;
  color: #333;
}

.uk-icon-button:hover {
  background: var(--color-primary);
  color: #fff;
}
</style>




