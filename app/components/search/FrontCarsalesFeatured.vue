<template>
  <div class="featured-vehicles">
    <h2 class="uk-text-center uk-margin-medium-bottom">Featured Vehicles</h2>

    <!-- Loading -->
    <div v-if="loading" class="uk-text-center uk-padding">
      <div uk-spinner></div>
    </div>

    <!-- Vehicle Grid -->
    <div v-else-if="vehicles.length" uk-slider="finite: true">
      <div class="uk-position-relative uk-visible-toggle" tabindex="-1">
        <ul class="uk-slider-items uk-child-width-1-1 uk-child-width-1-2@s uk-child-width-1-3@m uk-child-width-1-4@l uk-grid uk-grid-medium">
          <li v-for="vehicle in vehicles" :key="vehicle.id || vehicle.stockNumber">
            <div class="uk-card uk-card-default uk-card-hover">
              <div class="uk-card-media-top uk-position-relative">
                <NuxtLink :to="`/vehicle-for-sale/${vehicle.id}/${vehicle.slug}`">
                  <img 
                    :src="vehicle.images?.[0] || vehicle.image"
                    :alt="vehicle.title"
                    class="uk-width-1-1"
                    loading="lazy"
                  />
                </NuxtLink>
                <span v-if="vehicle.condition" class="condition-badge" :class="vehicle.condition.toLowerCase()">
                  {{ vehicle.condition }}
                </span>
              </div>
              <div class="uk-card-body uk-padding-small">
                <h3 class="uk-card-title uk-margin-small-bottom">
                  <NuxtLink :to="`/vehicle-for-sale/${vehicle.id}/${vehicle.slug}`" class="uk-link-reset">
                    {{ vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}` }}
                  </NuxtLink>
                </h3>
                <div class="uk-h4 uk-text-primary uk-margin-remove">
                  {{ vehicle.price ? `$${vehicle.price.toLocaleString()}` : 'POA' }}
                </div>
                <ul class="uk-list uk-text-small uk-text-muted uk-margin-small-top">
                  <li v-if="vehicle.year">{{ vehicle.year }}</li>
                  <li v-if="vehicle.odometer">{{ vehicle.odometer.toLocaleString() }} km</li>
                </ul>
              </div>
            </div>
          </li>
        </ul>

        <a class="uk-position-center-left uk-position-small uk-hidden-hover" href="#" uk-slidenav-previous uk-slider-item="previous"></a>
        <a class="uk-position-center-right uk-position-small uk-hidden-hover" href="#" uk-slidenav-next uk-slider-item="next"></a>
      </div>

      <ul class="uk-slider-nav uk-dotnav uk-flex-center uk-margin"></ul>
    </div>

    <!-- No Vehicles -->
    <div v-else class="uk-text-center uk-text-muted">
      <p>No featured vehicles at this time.</p>
    </div>

    <!-- View All Button -->
    <div class="uk-text-center uk-margin-medium-top">
      <NuxtLink to="/car-sales" class="uk-button uk-button-primary">
        View All Vehicles
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();

const loading = ref(true);
const vehicles = ref<any[]>([]);

onMounted(async () => {
  await fetchFeaturedVehicles();
});

const fetchFeaturedVehicles = async () => {
  loading.value = true;
  
  try {
    const response = await $fetch<any>(`${config.public.apiUrl}/search`, {
      params: {
        featured: true,
        limit: 8,
      },
    });
    
    vehicles.value = response.vehicles || [];
  } catch (err) {
    console.error('Failed to fetch featured vehicles:', err);
    vehicles.value = [];
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.uk-card-media-top {
  position: relative;
}

.uk-card-media-top img {
  aspect-ratio: 4/3;
  object-fit: cover;
}

.condition-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 4px;
  color: white;
}

.condition-badge.new {
  background: #32d296;
}

.condition-badge.demo {
  background: #faa05a;
}

.condition-badge.used {
  background: #666;
}

.uk-card-title {
  font-size: 0.95rem;
  line-height: 1.3;
}
</style>







