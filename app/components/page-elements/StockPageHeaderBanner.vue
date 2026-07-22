<template>
  <div v-if="header" class="stock-page-header-banner">
    <component
      :is="wrapperComponent"
      v-bind="wrapperProps"
      class="block"
    >
      <!-- Natural sizing: the artwork renders full-width at its own aspect
           ratio, never cropped, on both desktop and mobile. -->
      <picture class="block">
        <source v-if="header.mobile" media="(max-width: 639px)" :srcset="header.mobile" />
        <img
          :src="header.desktop"
          :alt="header.alt || 'Current promotion'"
          class="block h-auto w-full"
          loading="eager"
          fetchpriority="high"
        />
      </picture>
    </component>
  </div>
</template>

<script setup lang="ts">
const { settings } = useStockCardPromo();

const header = computed(() => {
  const stockHeader = settings.value?.stockHeader;
  return stockHeader?.enabled && stockHeader.desktop ? stockHeader : null;
});

const NuxtLink = resolveComponent('NuxtLink');

const isExternalLink = computed(() => /^https?:\/\//i.test(header.value?.link || ''));

const wrapperComponent = computed(() => {
  if (!header.value?.link) return 'div';
  return isExternalLink.value ? 'a' : NuxtLink;
});

const wrapperProps = computed(() => {
  if (!header.value?.link) return {};
  return isExternalLink.value
    ? { href: header.value.link, target: '_blank', rel: 'noopener noreferrer' }
    : { to: header.value.link };
});
</script>
