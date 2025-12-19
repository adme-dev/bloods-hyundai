<template>
  <div v-html="renderedContent"></div>
</template>

<script setup lang="ts">
interface Props {
  content?: string | { rendered?: string } | null;
}

const props = defineProps<Props>();

// Handle both string and object formats
const renderedContent = computed(() => {
  if (!props.content) return '';
  if (typeof props.content === 'string') return props.content;
  if (typeof props.content === 'object' && props.content.rendered) {
    return props.content.rendered;
  }
  return '';
});
</script>








