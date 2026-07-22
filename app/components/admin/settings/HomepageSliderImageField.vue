<template>
  <div class="space-y-2">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <Label>{{ label }}</Label>
      <span class="text-xs text-muted-foreground">Required</span>
    </div>
    <div
      class="grid place-items-center overflow-hidden rounded-xl border bg-muted"
      :class="variant === 'desktop' ? 'aspect-[8/3]' : 'aspect-[767/975] max-w-[210px]'"
    >
      <img v-if="src" :src="src" :alt="`${label} preview`" class="h-full w-full object-cover" />
      <div v-else class="grid place-items-center gap-2 text-xs text-muted-foreground">
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
