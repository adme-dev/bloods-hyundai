<template>
  <div class="multi-select-search uk-container">
    <div class="uk-card uk-card-default uk-card-body uk-border-rounded search-card">
      <h3 class="uk-text-center uk-margin-bottom">Find Your Perfect Vehicle</h3>
      
      <form @submit.prevent="handleSearch" class="uk-grid-small" uk-grid>
        <!-- Condition -->
        <div class="uk-width-1-2 uk-width-1-5@m">
          <label class="uk-form-label">Condition</label>
          <select v-model="filters.condition" class="uk-select">
            <option value="">All</option>
            <option value="new">New</option>
            <option value="demo">Demo</option>
            <option value="used">Used</option>
          </select>
        </div>

        <!-- Make -->
        <div class="uk-width-1-2 uk-width-1-5@m">
          <label class="uk-form-label">Make</label>
          <select v-model="filters.make" class="uk-select" @change="onMakeChange">
            <option value="">All Makes</option>
            <option v-for="make in availableMakes" :key="make" :value="make">
              {{ make }}
            </option>
          </select>
        </div>

        <!-- Model -->
        <div class="uk-width-1-2 uk-width-1-5@m">
          <label class="uk-form-label">Model</label>
          <select v-model="filters.model" class="uk-select">
            <option value="">All Models</option>
            <option v-for="model in availableModels" :key="model" :value="model">
              {{ model }}
            </option>
          </select>
        </div>

        <!-- Body Type -->
        <div class="uk-width-1-2 uk-width-1-5@m">
          <label class="uk-form-label">Body Type</label>
          <select v-model="filters.body" class="uk-select">
            <option value="">All Types</option>
            <option v-for="body in availableBodies" :key="body" :value="body">
              {{ body }}
            </option>
          </select>
        </div>

        <!-- Search Button -->
        <div class="uk-width-1-1 uk-width-1-5@m uk-flex uk-flex-bottom">
          <button type="submit" class="uk-button uk-button-primary uk-width-1-1">
            <span uk-icon="search"></span>
            Search
          </button>
        </div>
      </form>

      <!-- Price Range -->
      <div class="uk-margin-top">
        <div class="uk-grid-small uk-child-width-1-2@s" uk-grid>
          <div>
            <label class="uk-form-label">Min Price</label>
            <select v-model="filters.priceMin" class="uk-select">
              <option value="">No Min</option>
              <option v-for="price in priceOptions" :key="`min-${price}`" :value="price">
                ${{ formatNumber(price) }}
              </option>
            </select>
          </div>
          <div>
            <label class="uk-form-label">Max Price</label>
            <select v-model="filters.priceMax" class="uk-select">
              <option value="">No Max</option>
              <option v-for="price in priceOptions" :key="`max-${price}`" :value="price">
                ${{ formatNumber(price) }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="uk-margin-top uk-text-center uk-text-muted">
        <span v-if="vehicleCount > 0">
          {{ vehicleCount }} vehicles available
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const vehiclesStore = useVehiclesStore();

// Filter state
const filters = reactive({
  condition: '',
  make: '',
  model: '',
  body: '',
  priceMin: '',
  priceMax: ''
});

// Price options
const priceOptions = [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 70000, 80000, 100000];

// Computed values from store
const vehicleCount = computed(() => vehiclesStore.vehicleCount);
const storeFilters = computed(() => vehiclesStore.filters);

const availableMakes = computed(() => {
  return storeFilters.value?.make?.map((m: any) => m.displayValue || m) || ['Hyundai'];
});

const availableModels = computed(() => {
  if (!filters.make) {
    return storeFilters.value?.model?.map((m: any) => m.displayValue || m) || [];
  }
  // Filter models by selected make if we have that data
  return storeFilters.value?.model?.map((m: any) => m.displayValue || m) || [];
});

const availableBodies = computed(() => {
  return storeFilters.value?.body?.map((b: any) => b.displayValue || b) || 
    ['Sedan', 'SUV', 'Hatchback', 'Wagon', 'Ute', 'Van'];
});

// Handlers
const onMakeChange = () => {
  filters.model = ''; // Reset model when make changes
};

const handleSearch = () => {
  const query: Record<string, string> = {};
  
  if (filters.condition) query.condition = filters.condition.toLowerCase();
  if (filters.make) query.make = filters.make.toLowerCase().replace(/\s+/g, '-');
  if (filters.model) query.model = filters.model.toLowerCase().replace(/\s+/g, '-');
  if (filters.body) query.body = filters.body.toLowerCase().replace(/\s+/g, '-');
  if (filters.priceMin) query.priceMin = filters.priceMin.toString();
  if (filters.priceMax) query.priceMax = filters.priceMax.toString();

  router.push({
    path: '/car-sales',
    query
  });
};

const formatNumber = (num: number) => {
  return num.toLocaleString('en-AU');
};

// Fetch vehicles on mount if not already loaded
onMounted(() => {
  if (!vehiclesStore.isDataLoaded) {
    vehiclesStore.fetchVehicles();
  }
});
</script>

<style lang="scss" scoped>
.multi-select-search {
  .search-card {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .uk-form-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #666;
    margin-bottom: 4px;
  }

  .uk-select {
    border-radius: 6px;
  }

  .uk-button-primary {
    border-radius: 6px;
    height: 40px;
  }
}
</style>







