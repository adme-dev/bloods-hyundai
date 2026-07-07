<template>
  <div class="site-map-page">
    <LazyPageSchema />

    <!-- Header -->
    <div class="uk-section uk-section-primary uk-light uk-text-center">
      <div class="uk-container">
        <h1 class="uk-heading-medium">Site Map</h1>
        <p class="uk-text-lead">Find what you're looking for</p>
      </div>
    </div>

    <!-- Site Map Content -->
    <div class="uk-section">
      <div class="uk-container">
        <div class="uk-grid uk-grid-medium uk-child-width-1-2@s uk-child-width-1-3@m" uk-grid>
          <!-- New Vehicles -->
          <div>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-card-title">
                <span uk-icon="car" class="uk-margin-small-right"></span>
                New Vehicles
              </h3>
              <ul class="uk-list uk-list-divider">
                <li><NuxtLink to="/build-and-price">Build & Price</NuxtLink></li>
                <li v-for="model in models" :key="model.slug">
                  <NuxtLink :to="`/vehicle/${model.slug}`">{{ model.name }}</NuxtLink>
                </li>
              </ul>
            </div>
          </div>

          <!-- Used Vehicles -->
          <div>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-card-title">
                <span uk-icon="tag" class="uk-margin-small-right"></span>
                Used Vehicles
              </h3>
              <ul class="uk-list uk-list-divider">
                <li><NuxtLink to="/car-sales">All Used Cars</NuxtLink></li>
                <li><NuxtLink to="/car-sales?condition=new">New Cars</NuxtLink></li>
                <li><NuxtLink to="/car-sales?condition=demo">Demo Cars</NuxtLink></li>
                <li><NuxtLink to="/car-sales?condition=used">Used Cars</NuxtLink></li>
              </ul>
            </div>
          </div>

          <!-- Offers -->
          <div>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-card-title">
                <span uk-icon="bolt" class="uk-margin-small-right"></span>
                Special Offers
              </h3>
              <ul class="uk-list uk-list-divider">
                <li><NuxtLink to="/special-offers">Current Offers</NuxtLink></li>
              </ul>
            </div>
          </div>

          <!-- Services -->
          <div>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-card-title">
                <span uk-icon="settings" class="uk-margin-small-right"></span>
                Services
              </h3>
              <ul class="uk-list uk-list-divider">
                <li><NuxtLink to="/service">Service Centre</NuxtLink></li>
                <li><NuxtLink to="/parts">Parts</NuxtLink></li>
                <li><NuxtLink to="/finance">Finance</NuxtLink></li>
                <li><NuxtLink to="/insurance">Insurance</NuxtLink></li>
              </ul>
            </div>
          </div>

          <!-- Quick Actions -->
          <div>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-card-title">
                <span uk-icon="play-circle" class="uk-margin-small-right"></span>
                Quick Actions
              </h3>
              <ul class="uk-list uk-list-divider">
                <li><NuxtLink to="/test-drive">Book Test Drive</NuxtLink></li>
                <li><NuxtLink to="/sell-my-car">Sell My Car</NuxtLink></li>
                <li><NuxtLink to="/service-booking">Book Service</NuxtLink></li>
              </ul>
            </div>
          </div>

          <!-- Contact -->
          <div>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-card-title">
                <span uk-icon="receiver" class="uk-margin-small-right"></span>
                Contact
              </h3>
              <ul class="uk-list uk-list-divider">
                <li><NuxtLink to="/contact">Contact Us</NuxtLink></li>
                <li><NuxtLink to="/about">About Us</NuxtLink></li>
                <li><NuxtLink to="/privacy-policy">Privacy Policy</NuxtLink></li>
                <li><NuxtLink to="/terms-conditions">Terms & Conditions</NuxtLink></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteIdentity();

// SEO
useSiteMeta({
  title: 'Site Map',
  description: () => `Navigate the ${siteName.value} website with our complete site map.`,
});

// Get models from store
const mainStore = useMainStore();
const { models: modelSummaries } = useModelSummaries();
const models = computed(() => modelSummaries.value?.length ? modelSummaries.value : (mainStore.models || []));

watch(modelSummaries, (models) => {
  if (models?.length) {
    mainStore.models = models;
  }
}, { immediate: true });
</script>

<style lang="scss" scoped>
.site-map-page {
  min-height: 100vh;
}

.uk-card-title {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
}

.uk-list a {
  color: #333;
  text-decoration: none;
  
  &:hover {
    color: var(--color-primary);
  }
}
</style>







