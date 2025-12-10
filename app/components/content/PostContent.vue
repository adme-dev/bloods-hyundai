<template>
  <div v-html="content"></div>
</template>

<script setup lang="ts">
interface Props {
  content?: string;
}

defineProps<Props>();
</script>





