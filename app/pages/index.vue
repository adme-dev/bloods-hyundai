<template>
  <div class="home-page">
    <!-- Page Schema -->
    <LazyPageSchema />

    <!-- Visually hidden H1 for SEO and accessibility -->
    <h1 class="sr-only">Sale Hyundai - New and Used Hyundai Vehicles in Sale, Victoria</h1>

    <!-- Hero/Slider Section -->
    <LazyFrontSlider v-if="site?.promotional" :slides="site.promotional" />

    <!-- Promotional Thumbs -->
    <LazyFrontSliderThumbs />

    <!-- Quick Links & Search -->
    <LazyFrontSearch />

    <!-- CMS Content -->
    <section v-if="pageContent" class="uk-section">
      <div class="uk-container">
        <LazyPostContent :content="pageContent" />
      </div>
    </section>

    <!-- Homepage Models Section -->
    <LazyHomepageModelsSection />

    <!-- Featured Accessories -->
    <LazyFeaturedAccessories />

    <!-- Stock Special Offers -->
    <LazySpecialOffersVehicles class="overflow-hidden"/>

    <!-- Vehicle Enquiry Modal (for stock specials cards) -->
    <LazyVehicleEnquiryModal
      :is-open="vehiclesStore.vehicleEnquiryPopUp.show"
      :vehicle="vehiclesStore.vehicleEnquiryPopUp.item"
      @close="closeEnquiryModal"
    />
  </div>
</template>

<script setup lang="ts">
// Use SEO meta composable
useSiteMeta({
  title: 'Home',
  description: 'Welcome to Sale Hyundai - Your trusted Hyundai dealer in Sale, Victoria. Browse new and used Hyundai vehicles, special offers, and book a service.',
});

// Get site config from store
const mainStore = useMainStore();
const site = computed(() => mainStore.site);

// Vehicles store for enquiry modal
const vehiclesStore = useVehiclesStore();

// Close enquiry modal
const closeEnquiryModal = () => {
  vehiclesStore.setVehicleEnquiryPopUp(false, null);
};

// Fetch homepage CMS content (client-side)
const pageContent = ref<string | null>(null);

onMounted(async () => {
  try {
    const data = await $fetch<any>('/api/page/home');
    if (data?.content?.rendered) {
      pageContent.value = data.content.rendered;
    }
  } catch (error) {
    // Homepage content is optional
    console.log('No homepage CMS content found');
  }
});
</script>

<style lang="scss" scoped>
.home-page {
  section {
    &:first-of-type {
      padding-top: 0;
    }
  }
}

// Screen reader only utility (also defined globally but scoped here for clarity)
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>







