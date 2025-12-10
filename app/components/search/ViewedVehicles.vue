<template>
  <div v-if="recentVehicles.length > 0" class="viewed-vehicles uk-margin-top">
    <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
      <h4 class="uk-margin-remove">Recently Viewed</h4>
      <button 
        v-if="recentVehicles.length > 3" 
        class="uk-button uk-button-text uk-text-small"
        @click="showAll = !showAll"
      >
        {{ showAll ? 'Show Less' : 'View All' }}
      </button>
    </div>

    <div class="uk-grid-small uk-child-width-1-1" uk-grid>
      <div 
        v-for="vehicle in displayedVehicles" 
        :key="vehicle.stockid"
        class="viewed-item"
      >
        <NuxtLink 
          :to="getVehicleLink(vehicle)"
          class="uk-link-reset"
        >
          <div class="uk-grid-small uk-flex-middle" uk-grid>
            <div class="uk-width-auto">
              <div class="viewed-image">
                <img 
                  v-if="vehicle.thumb || vehicle.photos?.[0]" 
                  :src="vehicle.thumb || vehicle.photos[0]" 
                  :alt="vehicle.title"
                />
                <div v-else class="placeholder-image">
                  <span uk-icon="image"></span>
                </div>
              </div>
            </div>
            <div class="uk-width-expand">
              <div class="uk-text-small uk-text-bold uk-text-truncate">
                {{ vehicle.title }}
              </div>
              <div class="uk-text-meta uk-text-small">
                <span v-if="vehicle.price">
                  ${{ formatNumber(vehicle.price) }}
                </span>
                <span v-else>POA</span>
                <span v-if="vehicle.kms" class="uk-margin-small-left">
                  {{ formatNumber(vehicle.kms) }} km
                </span>
              </div>
            </div>
            <div class="uk-width-auto">
              <span uk-icon="icon: chevron-right; ratio: 0.8" class="uk-text-muted"></span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <div v-if="recentVehicles.length > 0" class="uk-margin-top">
      <button 
        class="uk-button uk-button-text uk-button-small uk-text-danger"
        @click="clearHistory"
      >
        Clear History
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const vehiclesStore = useVehiclesStore();

const showAll = ref(false);

// Get recently viewed vehicles from store
const recentVehicles = computed(() => {
  const recentIds = vehiclesStore.recentlyViewed;
  if (!recentIds.length || !vehiclesStore.vehicles.length) return [];
  
  return recentIds
    .map(id => vehiclesStore.vehicles.find(v => v.stockid === id || v.id === id))
    .filter(Boolean)
    .slice(0, 10);
});

const displayedVehicles = computed(() => {
  return showAll.value ? recentVehicles.value : recentVehicles.value.slice(0, 3);
});

// Helpers
const getVehicleLink = (vehicle: any) => {
  const slug = (vehicle.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-');
  return `/vehicle-for-sale/${vehicle.stockid}/${slug}`;
};

const formatNumber = (num: number) => {
  return num.toLocaleString('en-AU');
};

const clearHistory = () => {
  if (process.client) {
    localStorage.removeItem('recentlyViewed');
    vehiclesStore.recentlyViewed = [];
  }
};
</script>

<style lang="scss" scoped>
.viewed-vehicles {
  padding: 16px;
  background: #f8f8f8;
  border-radius: 8px;
}

.viewed-item {
  padding: 8px;
  background: white;
  border-radius: 4px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.viewed-image {
  width: 60px;
  height: 45px;
  border-radius: 4px;
  overflow: hidden;
  background: #eee;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ccc;
  }
}
</style>





