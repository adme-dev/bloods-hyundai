<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { StepperRoot, type StepperRootEmits, type StepperRootProps, useForwardPropsEmits } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = withDefaults(defineProps<StepperRootProps & { class?: HTMLAttributes['class'] }>(), {
  orientation: 'horizontal',
})

const emits = defineEmits<StepperRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <StepperRoot v-bind="forwarded" :class="cn('flex gap-2', props.class)">
    <slot />
  </StepperRoot>
</template>
