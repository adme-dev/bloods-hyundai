<template>
  <div class="admin-banner-marquee" :style="{ backgroundColor: color }">
    <div class="admin-banner-marquee__track">
      <span v-for="n in 8" :key="n" class="admin-banner-marquee__item">{{ text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text: string;
  color: string;
}>();
</script>
