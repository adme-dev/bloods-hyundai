<template>
  <div class="build-and-price-page">
    <LazyPageSchema />

    <!-- Header -->
    <div class="uk-section uk-section-primary uk-light uk-text-center">
      <div class="uk-container">
        <h1 class="uk-heading-medium">Build & Price</h1>
        <p class="uk-text-lead">Configure your perfect Hyundai</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="uk-section uk-text-center">
      <div uk-spinner="ratio: 2"></div>
      <p class="uk-margin-top">Loading models...</p>
    </div>

    <!-- Models Grid -->
    <div v-else class="uk-section">
      <div class="uk-container">
        <!-- Category filters -->
        <div class="uk-margin-medium-bottom">
          <ul class="uk-subnav uk-subnav-pill uk-flex-center" uk-switcher>
            <li class="uk-active"><a href="#">All</a></li>
            <li v-for="category in categories" :key="category">
              <a href="#">{{ category }}</a>
            </li>
          </ul>
        </div>

        <!-- Models -->
        <ul class="uk-switcher">
          <!-- All models -->
          <li>
            <div class="uk-grid uk-grid-medium uk-child-width-1-2@s uk-child-width-1-3@m uk-child-width-1-4@l" uk-grid>
              <div v-for="vehicle in vehicles" :key="vehicle.slug">
                <ModelCard :vehicle="vehicle" />
              </div>
            </div>
          </li>
          
          <!-- Filtered by category -->
          <li v-for="category in categories" :key="category">
            <div class="uk-grid uk-grid-medium uk-child-width-1-2@s uk-child-width-1-3@m uk-child-width-1-4@l" uk-grid>
              <div v-for="vehicle in getVehiclesByCategory(category)" :key="vehicle.slug">
                <ModelCard :vehicle="vehicle" />
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// SEO
useSiteMeta({
  title: 'Build & Price',
  description: 'Configure and price your perfect Hyundai vehicle. Explore all models and customize your car.',
});

// Use shared composable to avoid duplicate fetches
const { variants: vehicles, vehicleCategories: categories, pending } = useAllVariants();

const getVehiclesByCategory = (category: string) => {
  return vehicles.value.filter((v: any) => v.category === category);
};
</script>

<script lang="ts">
// Model Card component
const ModelCard = defineComponent({
  props: {
    vehicle: {
      type: Object,
      required: true,
    },
  },
  template: `
    <div class="uk-card uk-card-default uk-card-hover">
      <div class="uk-card-media-top">
        <NuxtLink :to="'/build/' + vehicle.slug">
          <img 
            :src="vehicle.image" 
            :alt="vehicle.name"
            class="uk-width-1-1"
            loading="lazy"
          />
        </NuxtLink>
      </div>
      <div class="uk-card-body uk-text-center">
        <h3 class="uk-card-title uk-margin-small-bottom">{{ vehicle.name }}</h3>
        <p v-if="vehicle.startingPrice" class="uk-text-meta">
          From {{ vehicle.startingPrice }}
        </p>
        <div class="uk-margin-small-top">
          <NuxtLink 
            :to="'/build/' + vehicle.slug"
            class="uk-button uk-button-primary uk-button-small"
          >
            Build & Price
          </NuxtLink>
        </div>
      </div>
    </div>
  `,
});
</script>

<style lang="scss" scoped>
.uk-card-media-top img {
  aspect-ratio: 16/9;
  object-fit: cover;
}

.uk-card-title {
  font-size: 1.125rem;
  margin-bottom: 0.25rem;
}
</style>






