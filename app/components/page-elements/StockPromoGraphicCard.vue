<template>
  <component
    :is="wrapperComponent"
    v-bind="wrapperProps"
    class="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-xl"
  >
    <picture class="absolute inset-0 h-full w-full">
      <source v-if="graphic.mobileImage" media="(max-width: 639px)" :srcset="graphic.mobileImage" />
      <img
        :src="graphic.image"
        :alt="graphic.heading || 'Promotion'"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </picture>

    <div
      v-if="graphic.heading || graphic.subheading"
      class="relative z-10 mt-auto bg-gradient-to-t from-black/75 via-black/40 to-transparent px-4 pb-4 pt-10 text-white"
    >
      <p v-if="graphic.heading" class="m-0 text-lg font-bold leading-snug">{{ graphic.heading }}</p>
      <p v-if="graphic.subheading" class="m-0 mt-1 text-sm leading-snug text-white/85">{{ graphic.subheading }}</p>
    </div>
  </component>
</template>

<script setup lang="ts">
import type { StockPromoGraphic } from '~~/shared/stockCardPromo';

const props = defineProps<{ graphic: StockPromoGraphic }>();

const NuxtLink = resolveComponent('NuxtLink');

const isExternalLink = computed(() => /^https?:\/\//i.test(props.graphic.link));

const wrapperComponent = computed(() => {
  if (!props.graphic.link) return 'div';
  return isExternalLink.value ? 'a' : NuxtLink;
});

const wrapperProps = computed(() => {
  if (!props.graphic.link) return {};
  return isExternalLink.value
    ? { href: props.graphic.link, target: '_blank', rel: 'noopener noreferrer' }
    : { to: props.graphic.link };
});
</script>
