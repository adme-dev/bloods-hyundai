import { defineStore } from 'pinia';
import { useModelSummaries } from '~/composables/useModelSummaries';

/**
 * Models Store
 * Wraps the useAllVariants composable and provides a store interface
 * that adapts Hyundai API data to match component expectations
 */
export const useModelsStore = defineStore('models', () => {
  const { models, pending, error, refresh } = useModelSummaries();

  // Transform Hyundai API models to match component expectations
  const allModels = computed(() => {
    return (models.value || []).map((model: any) => ({
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

  // Get unique categories - sorted with "Coming Soon" always at the end
  const uniqueCategories = computed(() => {
    const categories = new Set<string>();
    allModels.value.forEach((model: any) => {
      if (model.category) {
        categories.add(model.category);
      }
    });
    
    // Define preferred category order (matches Hyundai AU website)
    const categoryOrder = ['Electric', 'Hybrid', 'SUVs and People Movers', 'Performance', 'Hatch and Sedan', 'Vans and Trucks', 'Runout', 'Coming Soon'];
    
    return Array.from(categories).sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);
      
      // If both are in the predefined order, sort by that order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only one is in the order, prioritize the one that's in the order (unless it's Coming Soon)
      if (aIndex !== -1) return a === 'Coming Soon' ? 1 : -1;
      if (bIndex !== -1) return b === 'Coming Soon' ? -1 : 1;
      // Otherwise, sort alphabetically
      return a.localeCompare(b);
    });
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









