/**
 * Search Store
 * Manages search/filter state for car listings
 */
import { defineStore } from 'pinia';

interface FilterOption {
  value: string;
  displayValue: string;
  count?: number;
}

interface FilterState {
  makes: FilterOption[];
  models: FilterOption[];
  years: FilterOption[];
  bodyTypes: FilterOption[];
  fuelTypes: FilterOption[];
  transmissions: FilterOption[];
  colours: FilterOption[];
  priceRange: { min: number; max: number };
  kmRange: { min: number; max: number };
}

interface SelectedFilters {
  make: string[];
  model: string[];
  year: string[];
  bodyType: string[];
  fuelType: string[];
  transmission: string[];
  colour: string[];
  priceMin: number | null;
  priceMax: number | null;
  kmMin: number | null;
  kmMax: number | null;
  condition: string[];
  keywords: string;
}

export const useSearchStore = defineStore('search', {
  state: () => ({
    // Available filter options (from API)
    filterOptions: {
      makes: [],
      models: [],
      years: [],
      bodyTypes: [],
      fuelTypes: [],
      transmissions: [],
      colours: [],
      priceRange: { min: 0, max: 200000 },
      kmRange: { min: 0, max: 300000 },
    } as FilterState,

    // Currently selected filters
    selectedFilters: {
      make: [],
      model: [],
      year: [],
      bodyType: [],
      fuelType: [],
      transmission: [],
      colour: [],
      priceMin: null,
      priceMax: null,
      kmMin: null,
      kmMax: null,
      condition: [],
      keywords: '',
    } as SelectedFilters,

    // Sort
    sortBy: 'price-asc',

    // View mode
    viewMode: 'grid' as 'grid' | 'list',

    // Pagination
    currentPage: 1,
    pageSize: 12,

    // Loading state
    loading: false,
  }),

  getters: {
    // Check if any filters are active
    hasActiveFilters: (state) => {
      const f = state.selectedFilters;
      return (
        f.make.length > 0 ||
        f.model.length > 0 ||
        f.year.length > 0 ||
        f.bodyType.length > 0 ||
        f.fuelType.length > 0 ||
        f.transmission.length > 0 ||
        f.colour.length > 0 ||
        f.condition.length > 0 ||
        f.priceMin !== null ||
        f.priceMax !== null ||
        f.kmMin !== null ||
        f.kmMax !== null ||
        f.keywords !== ''
      );
    },

    // Count of active filters
    activeFilterCount: (state) => {
      const f = state.selectedFilters;
      let count = 0;
      
      if (f.make.length > 0) count += f.make.length;
      if (f.model.length > 0) count += f.model.length;
      if (f.year.length > 0) count += f.year.length;
      if (f.bodyType.length > 0) count += f.bodyType.length;
      if (f.fuelType.length > 0) count += f.fuelType.length;
      if (f.transmission.length > 0) count += f.transmission.length;
      if (f.colour.length > 0) count += f.colour.length;
      if (f.condition.length > 0) count += f.condition.length;
      if (f.priceMin !== null || f.priceMax !== null) count++;
      if (f.kmMin !== null || f.kmMax !== null) count++;
      if (f.keywords) count++;
      
      return count;
    },

    // Build query string from current filters
    queryString: (state) => {
      const params = new URLSearchParams();
      const f = state.selectedFilters;

      if (f.make.length > 0) params.set('make', f.make.join(','));
      if (f.model.length > 0) params.set('model', f.model.join(','));
      if (f.year.length > 0) params.set('year', f.year.join(','));
      if (f.bodyType.length > 0) params.set('body', f.bodyType.join(','));
      if (f.fuelType.length > 0) params.set('fuel', f.fuelType.join(','));
      if (f.transmission.length > 0) params.set('trans', f.transmission.join(','));
      if (f.colour.length > 0) params.set('colour', f.colour.join(','));
      if (f.condition.length > 0) params.set('condition', f.condition.join(','));
      if (f.priceMin !== null) params.set('price_min', String(f.priceMin));
      if (f.priceMax !== null) params.set('price_max', String(f.priceMax));
      if (f.kmMin !== null) params.set('km_min', String(f.kmMin));
      if (f.kmMax !== null) params.set('km_max', String(f.kmMax));
      if (f.keywords) params.set('q', f.keywords);
      if (state.sortBy !== 'price-asc') params.set('sort', state.sortBy);

      return params.toString();
    },
  },

  actions: {
    // Set filter options from API
    setFilterOptions(options: Partial<FilterState>) {
      this.filterOptions = { ...this.filterOptions, ...options };
    },

    // Update a single filter
    setFilter<K extends keyof SelectedFilters>(
      key: K,
      value: SelectedFilters[K]
    ) {
      this.selectedFilters[key] = value;
      this.currentPage = 1; // Reset to first page
    },

    // Toggle an array filter value
    toggleFilter(
      key: 'make' | 'model' | 'year' | 'bodyType' | 'fuelType' | 'transmission' | 'colour' | 'condition',
      value: string
    ) {
      const arr = this.selectedFilters[key];
      const index = arr.indexOf(value);
      
      if (index === -1) {
        arr.push(value);
      } else {
        arr.splice(index, 1);
      }
      
      this.currentPage = 1;
    },

    // Clear a specific filter
    clearFilter(key: keyof SelectedFilters) {
      if (Array.isArray(this.selectedFilters[key])) {
        (this.selectedFilters[key] as string[]) = [];
      } else if (typeof this.selectedFilters[key] === 'string') {
        (this.selectedFilters[key] as string) = '';
      } else {
        (this.selectedFilters[key] as any) = null;
      }
      this.currentPage = 1;
    },

    // Clear all filters
    clearAllFilters() {
      this.selectedFilters = {
        make: [],
        model: [],
        year: [],
        bodyType: [],
        fuelType: [],
        transmission: [],
        colour: [],
        priceMin: null,
        priceMax: null,
        kmMin: null,
        kmMax: null,
        condition: [],
        keywords: '',
      };
      this.currentPage = 1;
    },

    // Parse filters from URL query
    parseFromQuery(query: Record<string, string>) {
      if (query.make) this.selectedFilters.make = query.make.split(',');
      if (query.model) this.selectedFilters.model = query.model.split(',');
      if (query.year) this.selectedFilters.year = query.year.split(',');
      if (query.body) this.selectedFilters.bodyType = query.body.split(',');
      if (query.fuel) this.selectedFilters.fuelType = query.fuel.split(',');
      if (query.trans) this.selectedFilters.transmission = query.trans.split(',');
      if (query.colour) this.selectedFilters.colour = query.colour.split(',');
      if (query.condition) this.selectedFilters.condition = query.condition.split(',');
      if (query.price_min) this.selectedFilters.priceMin = parseInt(query.price_min);
      if (query.price_max) this.selectedFilters.priceMax = parseInt(query.price_max);
      if (query.km_min) this.selectedFilters.kmMin = parseInt(query.km_min);
      if (query.km_max) this.selectedFilters.kmMax = parseInt(query.km_max);
      if (query.q) this.selectedFilters.keywords = query.q;
      if (query.sort) this.sortBy = query.sort;
    },

    // Set sort
    setSort(sortBy: string) {
      this.sortBy = sortBy;
      this.currentPage = 1;
    },

    // Set view mode
    setViewMode(mode: 'grid' | 'list') {
      this.viewMode = mode;
    },

    // Set page
    setPage(page: number) {
      this.currentPage = page;
    },

    // Set loading state
    setLoading(loading: boolean) {
      this.loading = loading;
    },
  },
});
