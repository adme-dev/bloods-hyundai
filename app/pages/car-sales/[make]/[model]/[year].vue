<template>
  <div></div>
</template>

<script setup lang="ts">
// SEO-friendly redirect page for /car-sales/[make]/[model]/[year]
// This page exists for clean URLs but redirects to the main car-sales page with query params
// to provide the full filtering experience

const route = useRoute();
const make = route.params.make as string;
const model = route.params.model as string;
const year = route.params.year as string;

const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// SEO metadata for this clean URL (important for search engines)
useSeoMeta({
  title: `${year} ${capitalizeFirst(make)} ${capitalizeFirst(model)} Cars for Sale | Sale Hyundai`,
  description: `Browse ${year} ${capitalizeFirst(make)} ${capitalizeFirst(model)} cars for sale at Sale Hyundai, Victoria.`,
});

// Redirect to main car-sales page with all filters applied
await navigateTo(`/car-sales?make=${encodeURIComponent(make.toLowerCase())}&model=${encodeURIComponent(model.toLowerCase())}&year_min=${year}&year_max=${year}`, { replace: true });
</script>


