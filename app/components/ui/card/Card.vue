<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="cn(
      'rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm',
      props.class,
    )"
  >
    <slot />
  </div>
</template>






