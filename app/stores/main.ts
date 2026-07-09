import { defineStore } from 'pinia';
import { getRuntimeTenantCacheKey } from '~/utils/tenantCacheKey';

/**
 * Main store - replaces root Vuex state
 * Handles: site config, loading state, models, meta
 *
 * Site config is hydrated from SSR payload - no client-side fetch needed
 * Uses host-scoped cache key 'site-config-data:v3:<host>' with pages
 */

const SITE_CONFIG_CACHE_KEY = 'site-config-data:v3';

interface SiteConfig {
  name: string;
  promotional: any[];
  websiteUrl?: string;
  siteUrl?: string;
  scripts: {
    google: {
      analytics: string[];
      gtm: string;
    };
    facebook?: {
      pageid: string;
    };
  };
  [key: string]: any;
}

interface Model {
  id: string | number;
  slug: string;
  title: { rendered: string };
  [key: string]: any;
}

interface MainState {
  site: SiteConfig | null;
  loading: boolean;
  models: Model[];
  brand: any | null;
  viewedPages: { name: string; [key: string]: any }[];
}

export const useMainStore = defineStore('main', () => {
  // State
  const site = ref<SiteConfig | null>(null);
  const loading = ref(true);
  const models = ref<Model[]>([]);
  const brand = ref<any>(null);
  const viewedPages = ref<{ name: string }[]>([]);

  // Getters
  const siteName = computed(() => site.value?.name || 'Hyundai Dealer');
  const isLoading = computed(() => loading.value);

  // Actions
  const setLoading = (value: boolean) => {
    loading.value = value;
  };

  /**
   * Hydrate store from SSR payload data
   * This method reads from the Nuxt payload (populated during SSR)
   * No client-side network request is made
   */
  const fetchSiteConfig = async () => {
    const config = useRuntimeConfig();

    // Default config
    const defaultConfig: SiteConfig = {
      name: config.public.siteName || 'Hyundai Dealer',
      promotional: [],
      websiteUrl: config.public.siteUrl || '',
      siteUrl: config.public.siteUrl || '',
      scripts: { google: { analytics: [], gtm: '' } },
    };

    try {
      // Try to get data from Nuxt payload (SSR hydrated data)
      const nuxtApp = useNuxtApp();
      const tenantCacheKey = getRuntimeTenantCacheKey(SITE_CONFIG_CACHE_KEY);
      const cachedData = nuxtApp.payload?.data?.[tenantCacheKey] || nuxtApp.static?.data?.[tenantCacheKey];

      if (cachedData?.config) {
        site.value = cachedData.config;
        return cachedData.config;
      }

      // Fallback: If no SSR data, fetch server-side only (should not happen in normal flow)
      if (import.meta.server) {
        const response = await $fetch<{ config: SiteConfig }>('/api/site-config');
        site.value = response.config;
        return response.config;
      }

      // Client-side without SSR data - use defaults
      site.value = defaultConfig;
      return defaultConfig;
    } catch (error) {
      console.error('Error hydrating site config:', error);
      site.value = defaultConfig;
      return defaultConfig;
    }
  };

  const fetchModels = async () => {
    try {
      // Fetch slim model summaries for global menus/search.
      const response = await $fetch<any>('/api/model-summaries');
      
      if (response.success && (response.models || response.variants)) {
        models.value = response.models || response.variants;
        return models.value;
      }
      
      models.value = [];
      return [];
    } catch (error) {
      console.error('Error fetching models:', error);
      models.value = [];
      return [];
    }
  };

  const fetchBrand = async () => {
    try {
      const data = await $fetch('/api/brand');
      brand.value = data;
      return data;
    } catch (error) {
      console.error('Error fetching brand:', error);
      return null;
    }
  };

  const setViewedPage = (page: { name: string }) => {
    const exists = viewedPages.value.some((p) => p.name === page.name);
    if (!exists) {
      viewedPages.value.push(page);
    }
  };

  return {
    // State
    site,
    loading,
    models,
    brand,
    viewedPages,

    // Getters
    siteName,
    isLoading,

    // Actions
    setLoading,
    fetchSiteConfig,
    fetchModels,
    fetchBrand,
    setViewedPage,
  };
});
