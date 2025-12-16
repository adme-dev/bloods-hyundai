<template>
  <ClientOnly>
    <span :class="classes" :uk-icon="iconAttr"></span>
    <template #fallback>
      <span :class="classes"></span>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
interface Props {
  icon: string;
  ratio?: number | string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  ratio: 1,
});

const iconAttr = computed(() => {
  if (props.ratio && props.ratio !== 1) {
    return `icon: ${props.icon}; ratio: ${props.ratio}`;
  }
  return props.icon;
});

const classes = computed(() => props.class || '');
</script>
