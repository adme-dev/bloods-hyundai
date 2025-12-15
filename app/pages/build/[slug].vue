<template>
  <div class="build-page">
    <LazyPageSchema />

    <!-- Loading -->
    <div v-if="pending" class="uk-section uk-text-center">
      <div uk-spinner="ratio: 2"></div>
      <p class="uk-margin-top">Loading configurator...</p>
    </div>

    <!-- Content -->
    <div v-else-if="variants?.length">
      <!-- Header -->
      <div class="uk-section uk-section-secondary uk-light">
        <div class="uk-container">
          <h1 class="uk-heading-small">Build Your {{ modelName }}</h1>
          <p class="uk-text-lead">Choose your variant and customize your vehicle.</p>
        </div>
      </div>

      <!-- Variant Selector -->
      <div class="uk-section">
        <div class="uk-container">
          <h2>Select Your Variant</h2>
          
          <div class="uk-grid uk-grid-medium uk-child-width-1-2@s uk-child-width-1-3@m" uk-grid>
            <div v-for="variant in variants" :key="variant.id">
              <div 
                class="uk-card uk-card-default uk-card-hover"
                :class="{ 'uk-card-primary': selectedVariant?.id === variant.id }"
                @click="selectVariant(variant)"
                style="cursor: pointer;"
              >
                <div class="uk-card-media-top">
                  <img 
                    :src="variant.image"
                    :alt="variant.name"
                    class="uk-width-1-1"
                    loading="lazy"
                  />
                </div>
                <div class="uk-card-body">
                  <h3 class="uk-card-title">{{ variant.name }}</h3>
                  <p class="uk-h4">{{ variant.formattedPrice || formatPrice(variant.price) }}</p>
                  <ul v-if="variant.highlights" class="uk-list uk-list-disc uk-text-small">
                    <li v-for="(h, i) in variant.highlights?.slice(0, 3)" :key="i">{{ h }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Variant Details -->
      <div v-if="selectedVariant" class="uk-section uk-section-muted">
        <div class="uk-container">
          <div class="uk-grid uk-grid-large" uk-grid>
            <div class="uk-width-2-3@m">
              <h2>{{ selectedVariant.name }}</h2>
              
              <div v-if="selectedVariant.features" class="uk-margin-medium-top">
                <h3>Standard Features</h3>
                <ul class="uk-list uk-list-disc uk-column-1-2@m">
                  <li v-for="(feature, index) in selectedVariant.features" :key="index">
                    {{ feature }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="uk-width-1-3@m">
              <div class="uk-card uk-card-default uk-card-body uk-position-sticky" style="top: 100px;">
                <h3 class="uk-card-title">Your Build</h3>
                
                <dl class="uk-description-list">
                  <dt>Variant</dt>
                  <dd class="uk-text-bold">{{ selectedVariant.name }}</dd>
                  
                  <dt>Price</dt>
                  <dd class="uk-h3">{{ selectedVariant.formattedPrice || formatPrice(selectedVariant.price) }}</dd>
                </dl>

                <div class="uk-margin-medium-top">
                  <NuxtLink 
                    :to="`/variant/${slug}`"
                    class="uk-button uk-button-primary uk-width-1-1"
                  >
                    Enquire Now
                  </NuxtLink>
                  <NuxtLink 
                    to="/test-drive"
                    class="uk-button uk-button-default uk-width-1-1 uk-margin-small-top"
                  >
                    Book Test Drive
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="uk-section uk-text-center">
      <h2>Model Not Found</h2>
      <NuxtLink to="/build-and-price" class="uk-button uk-button-primary">View All Models</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const slug = computed(() => route.params.slug as string);

// Fetch variant data
const { data, pending } = await useFetch('/api/variant-details', {
  params: { variantId: slug },
  lazy: true,
});

const variants = computed(() => data.value?.variants || []);
const modelName = computed(() => data.value?.variant?.name || slug.value);

// Selected variant
const selectedVariant = ref<any>(null);

watch(variants, (newVariants) => {
  if (newVariants?.length && !selectedVariant.value) {
    selectedVariant.value = newVariants[0];
  }
}, { immediate: true });

const selectVariant = (variant: any) => {
  selectedVariant.value = variant;
};

// SEO
useSiteMeta({
  title: () => `Build Your ${modelName.value}`,
  description: () => `Configure and price your ${modelName.value}. Choose from available variants and options.`,
});

// Price formatter
const formatPrice = (price: number) => {
  if (!price) return 'POA';
  return `$${price.toLocaleString()}`;
};
</script>

<style lang="scss" scoped>
.uk-card-hover {
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  }
}

.uk-card-primary {
  border: 3px solid var(--color-primary);
}
</style>







