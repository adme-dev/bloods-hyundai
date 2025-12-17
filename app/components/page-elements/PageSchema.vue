<template>
  <!-- Schema markup is rendered server-side via useHead -->
</template>

<script setup lang="ts">
const route = useRoute();
const mainStore = useMainStore();
const config = useRuntimeConfig();

// Site info
const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');
const siteUrl = computed(() => config.public.apiUrl || '');
const logo = computed(() => mainStore.site?.logo || '');
const phone = computed(() => mainStore.site?.phone || '');
const address = computed(() => mainStore.site?.address || '');

// Build schema.org JSON-LD
const organizationSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'AutoDealer',
  name: siteName.value,
  url: siteUrl.value,
  logo: logo.value,
  telephone: phone.value,
  address: {
    '@type': 'PostalAddress',
    streetAddress: address.value,
    addressCountry: 'AU',
  },
  openingHoursSpecification: mainStore.site?.trading_hours ? 
    Object.entries(mainStore.site.trading_hours).map(([day, hours]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: day,
      opens: typeof hours === 'string' ? hours.split('-')[0]?.trim() : '',
      closes: typeof hours === 'string' ? hours.split('-')[1]?.trim() : '',
    })) : [],
}));

const breadcrumbSchema = computed(() => {
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl.value,
    },
  ];

  // Add current page
  const pathSegments = route.path.split('/').filter(Boolean);
  let currentPath = siteUrl.value;

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    items.push({
      '@type': 'ListItem',
      position: index + 2,
      name: segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      item: currentPath,
    });
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
});

// Add schema to head
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(organizationSchema.value),
    },
    {
      type: 'application/ld+json',
      children: JSON.stringify(breadcrumbSchema.value),
    },
  ],
});
</script>







