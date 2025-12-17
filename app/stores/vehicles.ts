import { defineStore } from 'pinia';
import { findIndex } from 'lodash-es';

/**
 * Vehicles store - handles car sales data
 * Replaces: Vuex root state (vehicles, filters) + searchData module
 *
 * Data is hydrated from SSR payload - no client-side fetch needed
 * Uses shared cache key 'carsales-feed-data' with pages
 */

const CACHE_KEY = 'carsales-feed-data';

interface Vehicle {
  id: string | number;
  stockid: string | number;
  make: { displayValue: string[] };
  model: { displayValue: string[] };
  [key: string]: any;
}

interface Filters {
  [key: string]: any[];
}

interface Selection {
  key: string;
  value: any;
  multiple?: boolean;
}

export const useVehiclesStore = defineStore('vehicles', () => {
  // State
  const vehicles = ref<Vehicle[]>([]);
  const filters = ref<Filters>({});
  const isDataLoaded = ref(false);
  const savedVehicles = useLocalStorage<(string | number)[]>('savedVehicles', []);
  const recentlyViewed = useLocalStorage<(string | number)[]>('recentlyViewed', []);

  // Selection state for filtering
  const selectedFilters = ref<Record<string, any>>({});

  // Pagination
  const currentPage = ref(1);
  const pageSize = ref(12);

  // Sorting
  const sortBy = ref('price');
  const sortDirection = ref<'asc' | 'desc'>('asc');

  // UI State
  const showSavesList = ref(false);
  const vehicleEnquiryPopUp = ref<{ show: boolean; item: Vehicle | null }>({
    show: false,
    item: null,
  });

  // Getters
  const vehicleCount = computed(() => vehicles.value.length);

  // Available filters computed from filters array/object
  const availableFilters = computed(() => {
    if (!filters.value || (Array.isArray(filters.value) && filters.value.length === 0)) {
      return {
        condition: [],
        make: [],
        model: [],
        badge: [],
        perweekRange: { min: 0, max: 1000 },
      };
    }

    // If filters is an array, transform it to object format
    if (Array.isArray(filters.value)) {
      const result: any = {
        condition: [],
        make: [],
        model: [],
        badge: [],
        perweekRange: { min: 0, max: 1000 },
      };

      filters.value.forEach((filter: any) => {
        if (filter.name === 'condition' && Array.isArray(filter.data)) {
          result.condition = filter.data.map((item: any) => 
            typeof item === 'string' ? item : item.value
          );
        } else if (filter.name === 'model' && Array.isArray(filter.data)) {
          result.model = filter.data;
          // Extract unique makes from models
          const makesSet = new Set<string>();
          filter.data.forEach((model: any) => {
            if (model.displayMake) {
              makesSet.add(model.displayMake);
            }
          });
          result.make = Array.from(makesSet);
        } else if (filter.name === 'badge' && Array.isArray(filter.data)) {
          result.badge = filter.data.map((item: any) => 
            typeof item === 'string' ? item : item.value
          );
        } else if (filter.name === 'perweek' && filter.data) {
          result.perweekRange = {
            min: filter.data.min || 0,
            max: filter.data.max || 1000,
          };
        }
      });

      return result;
    }

    // If filters is already an object, return it as-is
    return filters.value;
  });

  const filteredVehicles = computed(() => {
    let result = [...vehicles.value];

    // Apply filters
    Object.entries(selectedFilters.value).forEach(([key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        result = result.filter((vehicle) => {
          const vehicleValue = vehicle[key];
          if (Array.isArray(value)) {
            return value.some((v) =>
              Array.isArray(vehicleValue?.displayValue)
                ? vehicleValue.displayValue.includes(v)
                : vehicleValue === v
            );
          }
          return vehicleValue === value;
        });
      }
    });

    return result;
  });

  const paginatedVehicles = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredVehicles.value.slice(start, end);
  });

  const savedVehiclesList = computed(() => {
    return vehicles.value.filter((v) =>
      savedVehicles.value.includes(v.stockid)
    );
  });

  // Actions
  /**
   * Hydrate vehicles data from Nuxt payload
   * Data is preloaded server-side via vehicles-data.server.ts plugin
   * No client-side API calls are made - data is always in SSR payload
   */
  const fetchVehicles = async () => {
    if (isDataLoaded.value) return;

    try {
      // Get data from Nuxt payload (populated by vehicles-data.server.ts plugin)
      const nuxtApp = useNuxtApp();
      const cachedData = nuxtApp.payload?.data?.[CACHE_KEY] || nuxtApp.static?.data?.[CACHE_KEY];

      if (cachedData) {
        vehicles.value = cachedData.vehiclesData || [];
        filters.value = cachedData.filters || [];
        isDataLoaded.value = true;
      } else {
        console.warn('[vehicles store] No vehicle data in payload - check vehicles-data.server.ts plugin');
      }
    } catch (error) {
      console.error('Error hydrating vehicles store:', error);
    }
  };

  const select = (payload: Selection) => {
    if (payload.multiple) {
      const current = selectedFilters.value[payload.key] || [];
      if (!current.includes(payload.value)) {
        selectedFilters.value[payload.key] = [...current, payload.value];
      }
    } else {
      selectedFilters.value[payload.key] = payload.value;
    }
  };

  const deselect = (payload: Selection) => {
    if (payload.multiple) {
      const current = selectedFilters.value[payload.key] || [];
      selectedFilters.value[payload.key] = current.filter(
        (v: any) => v !== payload.value
      );
    } else {
      delete selectedFilters.value[payload.key];
    }
  };

  const resetFilters = () => {
    selectedFilters.value = {};
    currentPage.value = 1;
  };

  const setCurrentPage = (page: number) => {
    currentPage.value = page;
  };

  const setPageSize = (size: number) => {
    pageSize.value = size;
    currentPage.value = 1;
  };

  const setSortBy = (key: string) => {
    sortBy.value = key;
  };

  const setSortDirection = (dir: 'asc' | 'desc') => {
    sortDirection.value = dir;
  };

  const toggleSavedVehicle = (vehicle: Vehicle) => {
    const index = findIndex(savedVehicles.value, (id) => id === vehicle.stockid);
    if (index !== -1) {
      savedVehicles.value.splice(index, 1);
    } else {
      savedVehicles.value.push(vehicle.stockid);
    }
  };

  const addToRecentlyViewed = (vehicleId: string | number) => {
    const index = recentlyViewed.value.indexOf(vehicleId);
    if (index !== -1) {
      recentlyViewed.value.splice(index, 1);
    }
    recentlyViewed.value.unshift(vehicleId);
    if (recentlyViewed.value.length > 10) {
      recentlyViewed.value.length = 10;
    }
  };

  const setVehicleEnquiryPopUp = (show: boolean, item: Vehicle | null = null) => {
    vehicleEnquiryPopUp.value = { show, item };

    // Update URL with stock parameter
    if (process.client) {
      const params = new URLSearchParams(window.location.search);
      if (show && item?.stockid) {
        params.set('stock', String(item.stockid));
      } else {
        params.delete('stock');
      }
      const newUrl = `${window.location.pathname}${
        params.toString() ? '?' + params.toString() : ''
      }`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  };

  const toggleSavesList = (show: boolean) => {
    showSavesList.value = show;
  };

  return {
    // State
    vehicles,
    filters,
    isDataLoaded,
    savedVehicles,
    recentlyViewed,
    selectedFilters,
    currentPage,
    pageSize,
    sortBy,
    sortDirection,
    showSavesList,
    vehicleEnquiryPopUp,

    // Getters
    vehicleCount,
    filteredVehicles,
    paginatedVehicles,
    savedVehiclesList,
    availableFilters,

    // Actions
    fetchVehicles,
    select,
    deselect,
    resetFilters,
    setCurrentPage,
    setPageSize,
    setSortBy,
    setSortDirection,
    toggleSavedVehicle,
    addToRecentlyViewed,
    setVehicleEnquiryPopUp,
    toggleSavesList,
  };
});
