/**
 * Lightweight composable for homepage filter data
 *
 * Uses /api/homepage-filters endpoint (~6KB) instead of full vehicle data (~700KB)
 * Provides all the filter counts needed for FrontSearch component
 */

interface FilterOption {
  value: string;
  displayValue: string;
  displayMake?: string;
  count: number;
}

interface FilterData {
  name: string;
  displayName: string;
  type: string;
  data: FilterOption[] | { min: number; max: number; step?: number };
}

interface HomepageFiltersResponse {
  filters: FilterData[];
  makes: FilterOption[];
  totalCount: number;
  priceRange: { min: number; max: number };
  perweekRange: { min: number; max: number };
  error?: string;
}

export function useHomepageFilters() {
  const filters = ref<FilterData[]>([]);
  const makes = ref<FilterOption[]>([]);
  const totalCount = ref(0);
  const perweekRange = ref({ min: 0, max: 1000 });
  const priceRange = ref({ min: 0, max: 100000 });
  const isLoading = ref(false);
  const isLoaded = ref(false);
  const error = ref<string | null>(null);

  // Get condition filter options with counts
  const conditionOptions = computed(() => {
    const conditionFilter = filters.value.find(f => f.name === 'condition');
    if (!conditionFilter || !Array.isArray(conditionFilter.data)) return [];
    return conditionFilter.data as FilterOption[];
  });

  // Get model filter options grouped by make
  const modelOptions = computed(() => {
    const modelFilter = filters.value.find(f => f.name === 'model');
    if (!modelFilter || !Array.isArray(modelFilter.data)) return [];
    return modelFilter.data as FilterOption[];
  });

  // Group models by make for the dialog
  const groupedModels = computed(() => {
    const grouped: Record<string, FilterOption[]> = {};

    for (const model of modelOptions.value) {
      const makeName = model.displayMake || 'Other';
      if (!grouped[makeName]) {
        grouped[makeName] = [];
      }
      grouped[makeName].push(model);
    }

    // Sort models within each make by count (descending)
    for (const make of Object.keys(grouped)) {
      grouped[make]?.sort((a, b) => (b.count || 0) - (a.count || 0));
    }

    // Sort makes by total count
    const sortedEntries = Object.entries(grouped).sort((a, b) => {
      const aTotal = a[1].reduce((sum, m) => sum + (m.count || 0), 0);
      const bTotal = b[1].reduce((sum, m) => sum + (m.count || 0), 0);
      return bTotal - aTotal;
    });

    return Object.fromEntries(sortedEntries);
  });

  // Get make count
  const getMakeCount = (makeName: string): number => {
    const make = makes.value.find(
      m => m.displayValue.toLowerCase() === makeName.toLowerCase()
    );
    return make?.count || 0;
  };

  // Calculate filtered counts based on current selections
  const getFilteredCount = (
    selectedConditions: string[],
    selectedMakes: string[],
    selectedModels: string[],
    budgetRange?: { min: number; max: number }
  ): number => {
    // For now, return total count
    // Full faceted filtering would require the vehicles array
    // But for initial display, total count is fine
    return totalCount.value;
  };

  async function fetchFilters() {
    if (isLoaded.value || isLoading.value) return;

    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch<HomepageFiltersResponse>('/api/homepage-filters');

      if (response.error) {
        error.value = response.error;
        return;
      }

      filters.value = response.filters || [];
      makes.value = response.makes || [];
      totalCount.value = response.totalCount || 0;
      perweekRange.value = response.perweekRange || { min: 0, max: 1000 };
      priceRange.value = response.priceRange || { min: 0, max: 100000 };
      isLoaded.value = true;
    } catch (err: any) {
      console.error('[useHomepageFilters] Error fetching filters:', err);
      error.value = err.message || 'Failed to fetch filters';
    } finally {
      isLoading.value = false;
    }
  }

  return {
    // State
    filters,
    makes,
    totalCount,
    perweekRange,
    priceRange,
    isLoading,
    isLoaded,
    error,

    // Computed
    conditionOptions,
    modelOptions,
    groupedModels,

    // Methods
    fetchFilters,
    getMakeCount,
    getFilteredCount,
  };
}
