import { defineStore } from 'pinia';

/**
 * Main store - replaces root Vuex state
 * Handles: site config, loading state, models, meta
 */

interface SiteConfig {
  name: string;
  promotional: any[];
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
  const siteName = computed(() => site.value?.name || 'Sale Hyundai');
  const isLoading = computed(() => loading.value);

  // Actions
  const setLoading = (value: boolean) => {
    loading.value = value;
  };

  const fetchSiteConfig = async () => {
    const config = useRuntimeConfig();
    
    // Skip if CDN URL not configured
    if (!config.public.cdnUrl) {
      // Set default site config for development
      site.value = {
        name: config.public.siteName || 'Sale Hyundai',
        promotional: [],
        scripts: { google: { analytics: [], gtm: '' } },
      };
      return site.value;
    }
    
    try {
      const data = await $fetch<SiteConfig>(
        `${config.public.cdnUrl}/config/config.json`
      );
      site.value = data;
      return data;
    } catch (error) {
      console.error('Error fetching site config:', error);
      // Set default config on error
      site.value = {
        name: config.public.siteName || 'Sale Hyundai',
        promotional: [],
        scripts: { google: { analytics: [], gtm: '' } },
      };
      return site.value;
    }
  };

  const fetchModels = async () => {
    try {
      // Fetch models from Hyundai API via our server route
      const response = await $fetch<any>('/api/all-variants');
      
      if (response.success && response.variants) {
        models.value = response.variants;
        return response.variants;
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
    const config = useRuntimeConfig();
    
    // Skip if CDN URL not configured
    if (!config.public.cdnUrl) {
      return null;
    }
    
    try {
      const data = await $fetch(`${config.public.cdnUrl}/brand/brand.json`);
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
