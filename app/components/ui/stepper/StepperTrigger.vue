<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { StepperTrigger, type StepperTriggerProps } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<StepperTriggerProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <StepperTrigger
    v-bind="props"
    :class="cn(
      'inline-flex items-center justify-center',
      props.class,
    )"
  >
    <slot />
  </StepperTrigger>
</template>
