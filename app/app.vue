<template>
  <div id="app" class="loading-indicator">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ToastContainer />
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

// Populate Pinia store with variants
watch(variants, (newVariants) => {
  if (newVariants && newVariants.length > 0) {
    mainStore.models = newVariants;
  }
}, { immediate: true });

// Fetch initial data on app mount (client-side)
onMounted(async () => {
  try {
    await Promise.all([
      mainStore.fetchSiteConfig(),
      vehiclesStore.fetchVehicles(),
    ]);
  } catch (error) {
    console.error('Failed to fetch initial data:', error);
  } finally {
    mainStore.setLoading(false);
  }
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



