<template>
  <nav class="uk-navbar-container uk-navbar-transparent" uk-navbar>
    <div class="uk-container uk-container-expand">
      <div class="uk-navbar-left">
        <NuxtLink to="/" class="uk-navbar-item uk-logo">
          <img 
            :src="logo" 
            :alt="siteName" 
            class="logo-image"
          />
        </NuxtLink>
      </div>

      <div class="uk-navbar-center uk-visible@m">
        <ul class="uk-navbar-nav">
          <li v-for="item in mainNav" :key="item.url">
            <NuxtLink :to="item.url" :class="{ 'uk-active': isActiveRoute(item.url) }">
              {{ item.title }}
            </NuxtLink>
            <div v-if="item.children?.length" class="uk-navbar-dropdown">
              <ul class="uk-nav uk-navbar-dropdown-nav">
                <li v-for="child in item.children" :key="child.url">
                  <NuxtLink :to="child.url">{{ child.title }}</NuxtLink>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>

      <div class="uk-navbar-right">
        <!-- Search Toggle -->
        <button 
          class="uk-navbar-toggle uk-hidden@m" 
          uk-navbar-toggle-icon
          @click="toggleSearch"
        ></button>

        <!-- CTA Button -->
        <NuxtLink 
          to="/contact" 
          class="uk-button uk-button-primary uk-visible@m"
        >
          Contact Us
        </NuxtLink>

        <!-- Mobile Menu Toggle -->
        <button 
          class="uk-navbar-toggle uk-hidden@m"
          uk-navbar-toggle-icon
          @click="toggleMobileNav"
        ></button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute();
const mainStore = useMainStore();
const eventBus = useEventBus();

// Site config
const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');
const logo = computed(() => mainStore.site?.logo || '/assets/logos/logo-black.svg');

// Navigation items
const mainNav = computed(() => {
  const site = mainStore.site;
  if (!site?.navigation) {
    return [
      { title: 'New Cars', url: '/build-and-price' },
      { title: 'Used Cars', url: '/car-sales' },
      { title: 'Special Offers', url: '/special-offers' },
      { title: 'Service', url: '/service' },
      { title: 'Parts', url: '/parts' },
      { title: 'Finance', url: '/finance' },
      { title: 'Contact', url: '/contact' },
    ];
  }
  return site.navigation.main || [];
});

// Check if route is active
const isActiveRoute = (url: string) => {
  return route.path === url || route.path.startsWith(url + '/');
};

// Toggle handlers
const toggleSearch = () => {
  eventBus.emit('search:open');
};

const toggleMobileNav = () => {
  eventBus.emit('mobile-nav:toggle', true);
};
</script>

<style lang="scss" scoped>
.uk-navbar-container {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.logo-image {
  height: 40px;
  width: auto;
}

.uk-navbar-nav > li > a {
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.02em;

  &.uk-active,
  &:hover {
    color: var(--color-primary);
  }
}

.uk-button-primary {
  background: var(--color-primary);
  border-radius: 4px;
  text-transform: uppercase;
  font-size: 0.875rem;
  font-weight: 600;
}
</style>



