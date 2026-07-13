<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue';
import { cn } from '~/lib/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <div data-slot="alert-dialog-header" :class="cn('flex flex-col space-y-2 text-center sm:text-left', props.class)">
    <slot />
  </div>
</template>
