<template>
  <div class="space-y-2">
    <Label :for="id">{{ label }}</Label>
    <div class="relative">
      <div
        class="flex h-10 w-full items-center gap-2.5 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors"
        :class="disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent'"
      >
        <span
          class="h-5 w-5 shrink-0 rounded-md border border-black/10"
          :style="{ backgroundColor: modelValue }"
          aria-hidden="true"
        />
        <span class="font-mono text-xs uppercase text-muted-foreground">{{ modelValue }}</span>
      </div>
      <input
        :id="id"
        type="color"
        class="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        :value="modelValue"
        :disabled="disabled"
        :aria-label="label"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Label } from '~/components/ui/label';

defineProps<{
  id: string;
  label: string;
  modelValue: string;
  disabled?: boolean;
}>();
defineEmits<{ (event: 'update:modelValue', value: string): void }>();
</script>
