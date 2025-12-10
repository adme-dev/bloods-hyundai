<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { StepperDescription, type StepperDescriptionProps } from 'reka-ui'
import { cn } from '~/lib/utils'

const props = defineProps<StepperDescriptionProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <StepperDescription
    v-bind="props"
    :class="cn(
      'text-xs text-muted-foreground transition',
      'group-data-[state=active]:text-primary',
      props.class,
    )"
  >
    <slot />
  </StepperDescription>
</template>

