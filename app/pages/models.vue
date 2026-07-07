<template>
  <div class="models-page min-h-screen">
    <!-- SEO-optimized heading -->
    <section class="py-8 bg-gray-100">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="text-3xl font-bold text-gray-900 m-0">Hyundai Models</h1>
        <p class="text-lg text-gray-600 m-0">
          Explore the complete range of Hyundai vehicles
        </p>
      </div>
    </section>

    <!-- Models Grid -->
    <section class="py-8">
      <div class="max-w-7xl mx-auto px-4">
        <ModelsPageGrid />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteIdentity();

// SEO meta
useSiteMeta({
  title: 'Hyundai Models',
  description: () => `Browse the complete range of Hyundai vehicles including Electric, Hybrid, SUVs, Performance, and more. Find your perfect Hyundai at ${siteName.value}.`,
});

// Define page meta for breadcrumbs
definePageMeta({
  title: 'Models',
});
</script>
