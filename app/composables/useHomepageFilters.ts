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

interface FilterVehicle {
  condition: string;
  make: string;
  model: string;
  perweek: number;
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
  vehicles?: FilterVehicle[];
  totalCount: number;
  priceRange: { min: number; max: number };
  perweekRange: { min: number; max: number };
  error?: string;
}

export function useHomepageFilters() {
  const filters = ref<FilterData[]>([]);
  const makes = ref<FilterOption[]>([]);
  const vehicles = ref<FilterVehicle[]>([]);
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
    if (vehicles.value.length === 0) {
      if (selectedModels.length > 0) {
        const selected = new Set(selectedModels.map((model) => model.toLowerCase()));
        return modelOptions.value
          .filter((model) => selected.has(model.value.toLowerCase()))
          .reduce((sum, model) => sum + (model.count || 0), 0);
      }

      if (selectedMakes.length > 0) {
        const selected = new Set(selectedMakes.map((make) => make.toLowerCase()));
        return makes.value
          .filter((make) => selected.has(make.value.toLowerCase()) || selected.has(make.displayValue.toLowerCase()))
          .reduce((sum, make) => sum + (make.count || 0), 0);
      }

      return totalCount.value;
    }

    const conditionSet = new Set(selectedConditions.map((condition) => condition.toLowerCase()));
    const makeSet = new Set(selectedMakes.map((make) => make.toLowerCase()));
    const modelSet = new Set(selectedModels.map((model) => model.toLowerCase()));

    return vehicles.value.filter((vehicle) => {
      if (conditionSet.size > 0 && !conditionSet.has(vehicle.condition.toLowerCase())) return false;
      if (makeSet.size > 0 && !makeSet.has(vehicle.make.toLowerCase())) return false;
      if (modelSet.size > 0 && !modelSet.has(vehicle.model.toLowerCase())) return false;
      if (budgetRange && vehicle.perweek > 0) {
        if (vehicle.perweek < budgetRange.min || vehicle.perweek > budgetRange.max) return false;
      }
      return true;
    }).length;
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
      vehicles.value = response.vehicles || [];
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
    vehicles,
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
