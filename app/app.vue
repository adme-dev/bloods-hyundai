<template>
  <div id="app" class="loading-indicator">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <ToastContainer />
      <AutoPopup />
      <LazyHyundaiChatAssistant />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { runWhenIdleOrInteraction } from '~/utils/deferThirdParty';
import { getRuntimeTenantCacheKey } from '~/utils/tenantCacheKey';

// Stores are auto-imported from /stores directory
// Initialize stores and fetch initial data
const mainStore = useMainStore();
const vehiclesStore = useVehiclesStore();

const loadGlobalModelSummaries = async () => {
  if (mainStore.models.length) return;

  try {
    const response = await $fetch<any>('/api/model-summaries');
    mainStore.models = response?.models || response?.variants || [];
  } catch (error) {
    console.error('Error loading model summaries:', error);
  }
};

// Mark loading as complete on mount
// Model summaries are loaded after first render so global menus/search do not
// inflate the initial HTML payload on routes that do not need model data.
onMounted(() => {
  mainStore.setLoading(false);
  runWhenIdleOrInteraction(loadGlobalModelSummaries, { delay: 7000 });
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
      const drop = ($uikit as any)?.drop(dropdown);
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

// Fetch site config during SSR - hidden from browser network tab
// Uses host-scoped cache key with 10-min server cache
const route = useRoute();
const shouldRefreshSiteConfig = computed(() => route.query.refresh === 'true');
const siteConfigCacheKey = getRuntimeTenantCacheKey('site-config-data');

const { data: siteConfigData } = await useFetch<{ config: any }>('/api/site-config', {
  key: computed(() => shouldRefreshSiteConfig.value ? `${siteConfigCacheKey}:refresh` : siteConfigCacheKey),
  query: computed(() => shouldRefreshSiteConfig.value ? { refresh: 'true' } : {}),
  dedupe: 'defer',
  getCachedData: (key, nuxtApp) => {
    if (shouldRefreshSiteConfig.value) return undefined;
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
  },
});

// Populate Pinia store with site config from SSR data
if (siteConfigData.value?.config) {
  mainStore.site = siteConfigData.value.config;
}
</script>

<style lang="scss">
// UIkit and custom styles are imported via nuxt.config.ts css array
</style>
