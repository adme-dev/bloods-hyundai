<template>
  <span hidden data-page-schema></span>
</template>

<script setup lang="ts">
import { buildBreadcrumbSchema, buildDealerSchema, normalizeSiteUrl } from '~~/shared/seo';

const route = useRoute();
const mainStore = useMainStore();
const { siteUrl: resolvedSiteUrl } = useSiteIdentity();

// Site info
const siteUrl = computed(() => normalizeSiteUrl(resolvedSiteUrl.value));

// Build schema.org JSON-LD
const organizationSchema = computed(() => buildDealerSchema({
  siteUrl: siteUrl.value,
  site: mainStore.site,
}));

const breadcrumbSchema = computed(() => buildBreadcrumbSchema({
  siteUrl: siteUrl.value,
  path: route.path,
}));

// Add schema to head
useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(organizationSchema.value),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(breadcrumbSchema.value),
    },
  ],
}));
</script>




