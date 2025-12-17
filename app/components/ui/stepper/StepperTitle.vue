<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { StepperTitle, type StepperTitleProps } from 'reka-ui'
import { cn } from '~/lib/utils'

const props = defineProps<StepperTitleProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <StepperTitle
    v-bind="props"
    :class="cn(
      'text-sm font-semibold transition',
      'group-data-[state=active]:text-primary',
      props.class,
    )"
  >
    <slot />
  </StepperTitle>
</template>







