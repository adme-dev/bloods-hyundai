<template>
  <div v-if="showQuickLinks" class="quick-links-bar uk-background-primary uk-light">
    <div class="uk-container">
      <div class="uk-flex uk-flex-center uk-flex-wrap uk-grid-small" uk-grid>
        <div v-for="link in quickLinks" :key="link.url">
          <NuxtLink 
            :to="link.url"
            class="quick-link-item"
          >
            <span v-if="link.icon" :uk-icon="link.icon" class="quick-link-icon"></span>
            {{ link.title }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const mainStore = useMainStore();

// Quick links from site config or defaults
const quickLinks = computed(() => {
  const siteLinks = mainStore.site?.quick_links;
  
  if (siteLinks && siteLinks.length > 0) {
    return siteLinks;
  }
  
  // Default quick links
  return [
    { title: 'New Cars', url: '/build-and-price', icon: 'car' },
    { title: 'Used Cars', url: '/car-sales', icon: 'cart' },
    { title: 'Service', url: '/service', icon: 'settings' },
    { title: 'Finance', url: '/finance', icon: 'credit-card' },
    { title: 'Contact', url: '/contact', icon: 'receiver' },
  ];
});

// Only show on certain pages
const route = useRoute();
const showQuickLinks = computed(() => {
  const hideOnRoutes = ['/car-sales', '/build-and-price', '/contact'];
  return !hideOnRoutes.some(r => route.path.startsWith(r));
});
</script>

<style scoped>
.quick-links-bar {
  padding: 12px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.quick-link-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
}

.quick-link-icon {
  opacity: 0.8;
}
</style>







