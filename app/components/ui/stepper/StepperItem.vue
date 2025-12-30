<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { StepperItem, type StepperItemProps, useForwardProps } from 'reka-ui'
import { cn } from '~/lib/utils'

const props = defineProps<StepperItemProps & { class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(props)
</script>

<template>
  <StepperItem v-bind="forwarded" :class="cn('group', props.class)">
    <slot />
  </StepperItem>
</template>










