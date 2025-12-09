<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { StepperIndicator, type StepperIndicatorProps, useForwardProps } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<StepperIndicatorProps & { class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(props)
</script>

<template>
  <StepperIndicator
    v-bind="forwarded"
    :class="cn(
      'inline-flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium',
      'group-data-[state=active]:border-primary group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground',
      'group-data-[state=completed]:border-primary group-data-[state=completed]:bg-primary group-data-[state=completed]:text-primary-foreground',
      'group-data-[state=inactive]:border-muted group-data-[state=inactive]:bg-muted group-data-[state=inactive]:text-muted-foreground',
      props.class,
    )"
  >
    <slot />
  </StepperIndicator>
</template>
