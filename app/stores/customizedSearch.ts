import { defineStore } from 'pinia';
import { calculateWeeklyPayment } from '~/utils/finance';

export interface CustomizedSearchFilters {
  condition: string[];
  make: string[];
  model: string[];
  modelBadges: Record<string, string[]>;
  perweek?: { min: number; max: number };
}

interface FilterOption {
  value: string;
  displayValue: string;
  displayMake?: string;
  displayBody?: string;
  count?: number;
}

export const useCustomizedSearchStore = defineStore('customizedSearch', () => {
  const vehiclesStore = useVehiclesStore();

  // Filter state
  const filters = ref<CustomizedSearchFilters>({
    condition: [],
    make: [],
    model: [],
    modelBadges: {},
  });

  const modelSearchQuery = ref('');

  // Available filters from vehicles store (object format)
  const availableFilters = computed(() => vehiclesStore.availableFilters || {
    condition: [],
    make: [],
    model: [],
    badge: [],
    perweekRange: { min: 0, max: 1000 },
  });

  // Get perweek range from available filters
  const perweekRange = computed(() => {
    return availableFilters.value.perweekRange || { min: 0, max: 1000 };
  });

  // Original perweek range (never changes)
  const originalPerweekRange = computed(() => perweekRange.value);

  // All makes and models from vehicles store
  const allMakesAndModels = computed(() => {
    // Get makes from availableFilters
    const makes = (availableFilters.value.make || []).map((make: string) => ({
      value: make.toLowerCase(),
      displayValue: make,
      count: 0,
    }));

    // Build models from vehicles (vehicles have flat make/model strings)
    const allVehicles = vehiclesStore.vehicles || [];
    const modelMap = new Map<string, FilterOption>();
    
    allVehicles.forEach((vehicle: any) => {
      // Handle both flat string format and object format
      const vehicleMake = typeof vehicle.make === 'string' 
        ? vehicle.make 
        : vehicle.make?.displayValue?.[0] || vehicle.model?.displayMake?.[0]?.displayValue?.[0] || '';
      const vehicleModel = typeof vehicle.model === 'string'
        ? vehicle.model
        : vehicle.model?.displayValue?.[0] || vehicle.model?.value?.[0] || '';
      
      if (vehicleMake && vehicleModel) {
        const modelKey = `${vehicleMake.toLowerCase()}_${vehicleModel.toLowerCase()}`;
        if (!modelMap.has(modelKey)) {
          modelMap.set(modelKey, {
            value: modelKey,
            displayValue: vehicleModel,
            displayMake: vehicleMake,
            displayBody: vehicle.body_style || '',
            count: 0,
          });
        }
      }
    });

    return {
      makes,
      models: Array.from(modelMap.values()),
    };
  });

  // Filtered makes and models (with counts based on current filters EXCLUDING make/model)
  // This implements faceted search - each facet shows counts independent of its own selections
  const filteredMakesAndModels = computed(() => {
    const allVehicles = vehiclesStore.vehicles || [];

    // Filter vehicles by condition and perweek only (not by make/model)
    // This way make/model counts show what's available given condition selection
    const filtered = filterVehiclesExcluding(allVehicles, ['make', 'model']);

    // Count vehicles by make and model
    const makeCounts = new Map<string, number>();
    const modelCounts = new Map<string, number>();

    filtered.forEach((vehicle: any) => {
      // Handle both flat string format and object format
      const vehicleMake = typeof vehicle.make === 'string'
        ? vehicle.make
        : vehicle.make?.displayValue?.[0] || vehicle.model?.displayMake?.[0]?.displayValue?.[0] || '';
      const vehicleModel = typeof vehicle.model === 'string'
        ? vehicle.model
        : vehicle.model?.displayValue?.[0] || vehicle.model?.value?.[0] || '';

      if (vehicleMake) {
        const makeLower = vehicleMake.toLowerCase();
        makeCounts.set(makeLower, (makeCounts.get(makeLower) || 0) + 1);
      }

      if (vehicleMake && vehicleModel) {
        const modelKey = `${vehicleMake.toLowerCase()}_${vehicleModel.toLowerCase()}`;
        modelCounts.set(modelKey, (modelCounts.get(modelKey) || 0) + 1);
      }
    });

    const makes = allMakesAndModels.value.makes.map((make) => ({
      ...make,
      count: makeCounts.get(make.value.toLowerCase()) || makeCounts.get(make.displayValue.toLowerCase()) || 0,
    }));

    const models = allMakesAndModels.value.models.map((model) => ({
      ...model,
      count: modelCounts.get(model.value) || 0,
    }));

    return { makes, models };
  });

  // Filter vehicles based on current filters, optionally excluding certain filter types
  // Used for faceted search where each facet shows counts independent of its own selections
  function filterVehiclesExcluding(vehicles: any[], excludeFilters: string[] = []) {
    return vehicles.filter((vehicle: any) => {
      // Condition filter - handle flat string format
      if (!excludeFilters.includes('condition') && filters.value.condition.length > 0) {
        const vehicleCondition = typeof vehicle.condition === 'string'
          ? vehicle.condition
          : vehicle.condition?.value?.[0] || '';
        if (!vehicleCondition || !filters.value.condition.some((c) =>
          vehicleCondition.toLowerCase() === c.toLowerCase()
        )) {
          return false;
        }
      }

      // Make filter - handle flat string format
      if (!excludeFilters.includes('make') && filters.value.make.length > 0) {
        const vehicleMake = typeof vehicle.make === 'string'
          ? vehicle.make
          : vehicle.make?.displayValue?.[0] || vehicle.model?.displayMake?.[0]?.displayValue?.[0] || '';
        if (!vehicleMake || !filters.value.make.some((make) =>
          vehicleMake.toLowerCase() === make.toLowerCase()
        )) {
          return false;
        }
      }

      // Model filter - handle flat string format
      if (!excludeFilters.includes('model') && filters.value.model.length > 0) {
        const vehicleMake = typeof vehicle.make === 'string'
          ? vehicle.make
          : vehicle.make?.displayValue?.[0] || vehicle.model?.displayMake?.[0]?.displayValue?.[0] || '';
        const vehicleModel = typeof vehicle.model === 'string'
          ? vehicle.model
          : vehicle.model?.displayValue?.[0] || vehicle.model?.value?.[0] || '';

        const matches = filters.value.model.some((selectedModel) => {
          const [makePart, ...modelParts] = selectedModel.toLowerCase().split('_');
          const modelPart = modelParts.join('_');
          return vehicleMake.toLowerCase() === makePart && vehicleModel.toLowerCase() === modelPart;
        });
        if (!matches) return false;
      }

      // Perweek filter
      if (!excludeFilters.includes('perweek') && filters.value.perweek) {
        const price = vehicle.egc_price || vehicle.dap_price || vehicle.price || 0;
        if (price > 0) {
          const weeklyPayment = calculateWeeklyPayment(price);
          if (weeklyPayment < filters.value.perweek.min || weeklyPayment > filters.value.perweek.max) {
            return false;
          }
        } else {
          return false; // Exclude vehicles without price
        }
      }

      // Model badges filter - handle flat string format
      if (!excludeFilters.includes('modelBadges') && Object.keys(filters.value.modelBadges).length > 0) {
        const vehicleModel = typeof vehicle.model === 'string'
          ? vehicle.model.toLowerCase()
          : vehicle.model?.value?.[0]?.toLowerCase() || '';
        const vehicleBadge = typeof vehicle.badge === 'string'
          ? vehicle.badge.toLowerCase()
          : vehicle.badge?.value?.[0]?.toLowerCase() || '';
        const modelBadges = filters.value.modelBadges[vehicleModel];
        if (modelBadges && modelBadges.length > 0) {
          if (!modelBadges.some((b) => b.toLowerCase() === vehicleBadge)) {
            return false;
          }
        }
      }

      return true;
    });
  }

  // Filter vehicles based on ALL current filters (for final count)
  function filterVehicles(vehicles: any[]) {
    return filterVehiclesExcluding(vehicles, []);
  }

  // Filtered vehicle count
  const filteredVehicleCount = computed(() => {
    const allVehicles = vehiclesStore.vehicles || [];
    return filterVehicles(allVehicles).length;
  });

  // Faceted condition counts - shows counts excluding condition filter
  // This allows each condition option to show "how many if I select this"
  const facetedConditionCounts = computed(() => {
    const allVehicles = vehiclesStore.vehicles || [];
    const allConditions = availableFilters.value.condition || [];

    // Filter vehicles excluding condition filter (faceted approach)
    const vehiclesForConditionFacet = filterVehiclesExcluding(allVehicles, ['condition']);

    // Count vehicles for each condition
    const counts: Record<string, number> = {};
    allConditions.forEach((condition: string) => {
      counts[condition.toLowerCase()] = vehiclesForConditionFacet.filter((vehicle: any) => {
        const vehicleCondition = typeof vehicle.condition === 'string'
          ? vehicle.condition
          : vehicle.condition?.value?.[0] || '';
        return vehicleCondition.toLowerCase() === condition.toLowerCase();
      }).length;
    });

    return counts;
  });

  // Selected makes
  const selectedMakes = computed(() => {
    return filters.value.make
      .map((makeValue) => {
        const make = allMakesAndModels.value.makes.find(
          (m) => m.value.toLowerCase() === makeValue.toLowerCase()
        );
        return make ? { value: make.value, displayValue: make.displayValue } : null;
      })
      .filter(Boolean) as Array<{ value: string; displayValue: string }>;
  });

  // Selected models
  const selectedModels = computed(() => {
    return filters.value.model
      .map((modelValue) => {
        const model = allMakesAndModels.value.models.find((m) => m.value === modelValue);
        return model
          ? {
              value: model.value,
              displayValue: model.displayValue,
              displayMake: model.displayMake,
            }
          : null;
      })
      .filter(Boolean) as Array<{ value: string; displayValue: string; displayMake?: string }>;
  });

  // Actions
  function updateFilter<K extends keyof CustomizedSearchFilters>(
    filterName: K,
    value: CustomizedSearchFilters[K]
  ) {
    filters.value[filterName] = value as any;
  }

  function clearFilter(filterName: keyof CustomizedSearchFilters) {
    if (filterName === 'modelBadges') {
      filters.value.modelBadges = {};
    } else if (filterName === 'perweek') {
      filters.value.perweek = undefined;
    } else {
      (filters.value[filterName] as any) = filterName === 'condition' || filterName === 'make' || filterName === 'model' ? [] : undefined;
    }
  }

  function clearAllFilters() {
    filters.value = {
      condition: [],
      make: [],
      model: [],
      modelBadges: {},
    };
  }

  function removeFilterItem(filterName: keyof CustomizedSearchFilters, itemValue: string) {
    if (filterName === 'condition' || filterName === 'make' || filterName === 'model') {
      const arr = filters.value[filterName] as string[];
      const index = arr.indexOf(itemValue);
      if (index > -1) {
        arr.splice(index, 1);
      }
    }
  }

  function toggleMake(make: string) {
    const makeLower = make.toLowerCase();
    const index = filters.value.make.findIndex((m) => m.toLowerCase() === makeLower);
    if (index > -1) {
      filters.value.make.splice(index, 1);
    } else {
      filters.value.make.push(makeLower);
    }
  }

  function toggleModel(modelValue: string) {
    const index = filters.value.model.indexOf(modelValue);
    if (index > -1) {
      filters.value.model.splice(index, 1);
    } else {
      filters.value.model.push(modelValue);
    }
  }

  function isMakeSelected(make: string): boolean {
    return filters.value.make.some((m) => m.toLowerCase() === make.toLowerCase());
  }

  function setModelSearchQuery(query: string) {
    modelSearchQuery.value = query;
  }

  function clearModelSearch() {
    modelSearchQuery.value = '';
  }

  // Badge helpers
  function badgesForModel(modelFilterValue: string): Array<{ value: string; display: string; count: number }> {
    // Extract model key from filter value (e.g., "hyundai_i30" -> "i30")
    const parts = modelFilterValue.split('_');
    const modelKey = parts.length > 1 ? parts.slice(1).join('_') : modelFilterValue;

    const allVehicles = vehiclesStore.vehicles || [];
    const filtered = filterVehicles(allVehicles);

    const badgeCounts = new Map<string, number>();
    filtered.forEach((vehicle: any) => {
      const vehicleModel = typeof vehicle.model === 'string'
        ? vehicle.model.toLowerCase()
        : vehicle.model?.value?.[0]?.toLowerCase() || '';
      if (vehicleModel === modelKey.toLowerCase()) {
        const badge = typeof vehicle.badge === 'string'
          ? vehicle.badge
          : vehicle.badge?.value?.[0] || '';
        if (badge) {
          badgeCounts.set(badge.toLowerCase(), (badgeCounts.get(badge.toLowerCase()) || 0) + 1);
        }
      }
    });

    return Array.from(badgeCounts.entries()).map(([value, count]) => ({
      value,
      display: value.charAt(0).toUpperCase() + value.slice(1),
      count,
    }));
  }

  function isBadgeSelectedForModel(modelFilterValue: string, rawBadgeValue: string): boolean {
    const parts = modelFilterValue.split('_');
    const modelKey = parts.length > 1 ? parts.slice(1).join('_') : modelFilterValue;
    const badges = filters.value.modelBadges[modelKey] || [];
    return badges.some((b) => b.toLowerCase() === rawBadgeValue.toLowerCase());
  }

  function toggleBadgeForModel(modelFilterValue: string, rawBadgeValue: string) {
    const parts = modelFilterValue.split('_');
    const modelKey = parts.length > 1 ? parts.slice(1).join('_') : modelFilterValue;
    const badges = filters.value.modelBadges[modelKey] || [];
    const index = badges.findIndex((b) => b.toLowerCase() === rawBadgeValue.toLowerCase());
    if (index > -1) {
      badges.splice(index, 1);
      if (badges.length === 0) {
        delete filters.value.modelBadges[modelKey];
      } else {
        filters.value.modelBadges[modelKey] = badges;
      }
    } else {
      filters.value.modelBadges[modelKey] = [...badges, rawBadgeValue];
    }
  }

  function getModelBodyType(modelValue: string): string {
    const model = allMakesAndModels.value.models.find((m) => m.value === modelValue);
    return model?.displayBody || '';
  }

  // Grouped models by make (includes all models, sorted by count)
  const filteredGroupedModels = computed(() => {
    const grouped: Record<string, FilterOption[]> = {};

    // Include all models, sorted by count (highest first)
    const sortedModels = [...filteredMakesAndModels.value.models].sort(
      (a, b) => (b.count ?? 0) - (a.count ?? 0)
    );

    sortedModels.forEach((model) => {
      const makeName = model.displayMake || 'Other';
      if (!grouped[makeName]) {
        grouped[makeName] = [];
      }
      grouped[makeName].push(model);
    });

    // Sort makes by total count (highest first)
    const sortedGrouped: Record<string, FilterOption[]> = {};
    const makeEntries = Object.entries(grouped).sort((a, b) => {
      const aTotal = a[1].reduce((sum, m) => sum + (m.count ?? 0), 0);
      const bTotal = b[1].reduce((sum, m) => sum + (m.count ?? 0), 0);
      return bTotal - aTotal;
    });

    makeEntries.forEach(([make, models]) => {
      sortedGrouped[make] = models;
    });

    return sortedGrouped;
  });

  return {
    filters,
    modelSearchQuery,
    availableFilters,
    perweekRange,
    originalPerweekRange,
    allMakesAndModels,
    filteredMakesAndModels,
    filteredVehicleCount,
    facetedConditionCounts,
    selectedMakes,
    selectedModels,
    filteredGroupedModels,
    updateFilter,
    clearFilter,
    clearAllFilters,
    removeFilterItem,
    toggleMake,
    toggleModel,
    isMakeSelected,
    setModelSearchQuery,
    clearModelSearch,
    badgesForModel,
    isBadgeSelectedForModel,
    toggleBadgeForModel,
    getModelBodyType,
  };
});











