<template>
  <div class="space-y-2">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <Label>{{ label }}</Label>
      <span class="text-xs text-muted-foreground">Required</span>
    </div>
    <div :class="['slider-image', `slider-image--${variant}`]">
      <img v-if="src" :src="src" :alt="`${label} preview`" />
      <div v-else class="slider-image__empty">
        <ImageIcon class="h-6 w-6" />
        <span>No image selected</span>
      </div>
    </div>
    <p class="min-h-8 text-xs leading-relaxed text-muted-foreground">{{ help }}</p>
    <Button type="button" variant="outline" size="sm" :disabled="disabled" @click="$emit('choose')">
      <Upload class="mr-2 h-4 w-4" /> Upload or choose image
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Image as ImageIcon, Upload } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';

defineProps<{
  label: string;
  help: string;
  src: string;
  variant: 'desktop' | 'mobile';
  disabled?: boolean;
}>();
defineEmits<{ (event: 'choose'): void }>();
</script>

<style scoped>
.slider-image {
  display: grid;
  overflow: hidden;
  place-items: center;
  border: 1px solid var(--admin-line);
  border-radius: 12px;
  background: var(--admin-surface-2);
}
.slider-image--desktop { aspect-ratio: 8 / 3; }
.slider-image--mobile { aspect-ratio: 767 / 975; max-width: 210px; }
.slider-image img { width: 100%; height: 100%; object-fit: cover; }
.slider-image__empty {
  display: grid;
  gap: 8px;
  place-items: center;
  color: var(--admin-muted);
  font-size: 12px;
}
</style>
