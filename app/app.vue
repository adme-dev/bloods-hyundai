<template>
  <div id="app" class="loading-indicator">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <ToastContainer />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// Stores are auto-imported from /stores directory
// Initialize stores and fetch initial data
const mainStore = useMainStore();
const vehiclesStore = useVehiclesStore();

// Fetch all variants once server-side and populate store
// This ensures data is available for all components without duplicate fetches
const { variants } = useAllVariants();

// Fetch site config during SSR - hidden from browser network tab
// Uses shared cache key 'site-config-data' with 10-min server cache
const { data: siteConfigData } = await useFetch<{ config: any }>('/api/site-config', {
  key: 'site-config-data',
  dedupe: 'defer',
  getCachedData: (key, nuxtApp) => {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
  },
});

// Populate Pinia store with site config from SSR data
if (siteConfigData.value?.config) {
  mainStore.site = siteConfigData.value.config;
}

// Populate Pinia store with variants
watch(variants, (newVariants) => {
  if (newVariants && newVariants.length > 0) {
    mainStore.models = newVariants;
  }
}, { immediate: true });

// Mark loading as complete on mount
// Note: Both site config and vehicles data are hydrated from SSR payload, no client fetch needed
onMounted(() => {
  mainStore.setLoading(false);
});

// Global link handler for SPA navigation
if (process.client) {
  const router = useRouter();
  const { $uikit } = useNuxtApp();

  const handleLink = (event: MouseEvent) => {
    const target = (event.target as HTMLElement)?.closest('a');
    if (!target || !target.hasAttribute('href')) return;

    const href = target.getAttribute('href');
    if (!href) return;

    // Skip external links, tel:, javascript:, etc.
    if (
      !href.startsWith('/') ||
      target.classList.contains('forcelink') ||
      target.getAttribute('target') === '_blank' ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    // Skip if same page
    if (window.location.pathname === href) return;

    event.preventDefault();

    // Hide any open dropdowns
    const dropdowns = document.querySelectorAll('.uk-navbar-dropdown.uk-open');
    dropdowns.forEach((dropdown) => {
      const drop = $uikit?.drop(dropdown);
      if (drop) drop.hide(0);
    });

    // Navigate
    router.push(href);
  };

  onMounted(() => {
    document.addEventListener('click', handleLink);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleLink);
  });
}
</script>

<style lang="scss">
// UIkit and custom styles are imported via nuxt.config.ts css array
</style>








