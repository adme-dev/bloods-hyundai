<template>
  <div class="home-page">
    <!-- Page Schema -->
    <LazyPageSchema />

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

    <!-- Dealership Reviews -->
    <section class="uk-section">
      <LazyDealershipReviews />
    </section>


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
</style>






