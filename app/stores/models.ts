import { defineStore } from 'pinia';
import { useAllVariants } from '~/composables/useAllVariants';

/**
 * Models Store
 * Wraps the useAllVariants composable and provides a store interface
 * that adapts Hyundai API data to match component expectations
 */
export const useModelsStore = defineStore('models', () => {
  const { variants, pending, error, refresh, vehicleCategories, groupedByCategory } = useAllVariants();

  // Transform Hyundai API models to match component expectations
  const allModels = computed(() => {
    return (variants.value || []).map((model: any) => ({
      ...model,
      // Adapt fields for component compatibility
      'title': {
        rendered: model.name || '',
      },
      'model_image': model.image || model.desktopImage || model.mobileImage,
      'caption': model.categoryDescription || '',
      'vehiclecat': model.category || '',
      'slug': model.slug || model.name?.toLowerCase().replace(/\s+/g, '-'),
    }));
  });

  // Get unique categories
  const uniqueCategories = computed(() => {
    const categories = new Set<string>();
    allModels.value.forEach((model: any) => {
      if (model.category) {
        categories.add(model.category);
      }
    });
    return Array.from(categories).sort();
  });

  // Get models by category
  const modelsByCategory = (category: string) => {
    if (!category) return [];
    return allModels.value.filter((model: any) => model.category === category);
  };

  // Check if store is initialized
  const isInitialized = computed(() => {
    return !pending.value && allModels.value.length > 0;
  });

  // Fetch models (wrapper around refresh)
  const fetchModels = async () => {
    await refresh();
  };

  return {
    // State
    loading: pending,
    error: computed(() => {
      if (!error.value) return null;
      if (typeof error.value === 'string') return error.value;
      if (error.value instanceof Error) return error.value.message;
      return 'An error occurred while loading models';
    }),
    allModels,
    uniqueCategories,
    isInitialized,

    // Methods
    modelsByCategory,
    fetchModels,
    refresh,
  };
});
