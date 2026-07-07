<template>
  <div class="home-page">
    <!-- Page Schema -->
    <LazyPageSchema />

    <!-- Visually hidden H1 for SEO and accessibility -->
    <h1 class="sr-only">{{ siteName }} - New and Used Hyundai Vehicles</h1>

    <!-- Hero/Slider Section -->
    <FrontSlider v-if="site?.promotional" :slides="site.promotional" />

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
    <LoadWhenVisible min-height="520px" root-margin="700px 0px">
      <LazyFeaturedAccessories />
    </LoadWhenVisible>

    <!-- Stock Special Offers -->
    <LoadWhenVisible min-height="680px" root-margin="700px 0px">
      <LazySpecialOffersVehicles class="overflow-hidden"/>
    </LoadWhenVisible>

    <!-- Vehicle Enquiry Modal (for stock specials cards) -->
    <ClientOnly>
      <LazyVehicleEnquiryModal
        v-if="vehiclesStore.vehicleEnquiryPopUp.show"
        :is-open="vehiclesStore.vehicleEnquiryPopUp.show"
        :vehicle="vehiclesStore.vehicleEnquiryPopUp.item"
        @close="closeEnquiryModal"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { runWhenIdleOrInteraction } from '~/utils/deferThirdParty';

// Get site config from store
const mainStore = useMainStore();
const site = computed(() => mainStore.site);
const config = useRuntimeConfig();
const siteName = computed(() => site.value?.name || config.public.siteName || 'Blood Hyundai');

// Use SEO meta composable
useSiteMeta({
  title: 'Hyundai Dealer Geelong',
  description: () => `${siteName.value} is your Hyundai dealer in Geelong. Browse new, demo and used Hyundai vehicles, current offers, test drives, finance enquiries and service booking.`,
  keywords: () => `${siteName.value}, Hyundai dealer Geelong, new Hyundai, used Hyundai, Hyundai service Geelong, Hyundai special offers`,
});

// Vehicles store for enquiry modal
const vehiclesStore = useVehiclesStore();

// Close enquiry modal
const closeEnquiryModal = () => {
  vehiclesStore.setVehicleEnquiryPopUp(false, null);
};

// Fetch homepage CMS content (client-side)
const pageContent = ref<string | null>(null);

const loadPageContent = async () => {
  try {
    const data = await $fetch<any>('/api/page/home');
    if (data?.content?.rendered) {
      pageContent.value = data.content.rendered;
    }
  } catch (error) {
    // Homepage content is optional
    console.log('No homepage CMS content found');
  }
};

onMounted(() => {
  runWhenIdleOrInteraction(loadPageContent, { delay: 8000 });
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
