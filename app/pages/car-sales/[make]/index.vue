<template>
  <div></div>
</template>

<script setup lang="ts">
// SEO-friendly redirect page for /car-sales/[make]/
// This page exists for clean URLs but redirects to the main car-sales page with query params
// to provide the full filtering experience

const route = useRoute();
const make = route.params.make as string;

const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// SEO metadata for this clean URL (important for search engines)
useSeoMeta({
  title: `${capitalizeFirst(make)} Cars for Sale | Sale Hyundai`,
  description: `Browse ${capitalizeFirst(make)} cars for sale at Sale Hyundai, Victoria. Quality new, demo and used vehicles.`,
});

// Redirect to main car-sales page with make filter applied
// This gives users the full filter experience while maintaining SEO-friendly URLs
await navigateTo(`/car-sales?make=${encodeURIComponent(make.toLowerCase())}`, { replace: true });
</script>


