<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, type SliderRootProps } from 'reka-ui'
import { cn } from '~/lib/utils'

const props = defineProps<SliderRootProps & { class?: HTMLAttributes['class'] }>()

const emits = defineEmits<{
  'update:modelValue': [payload: number[]]
}>()
</script>

<template>
  <SliderRoot
    :class="cn(
      'relative flex w-full touch-none select-none items-center',
      props.class,
    )"
    v-bind="props"
    @update:model-value="emits('update:modelValue', $event ?? [])"
  >
    <SliderTrack class="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
      <SliderRange class="absolute h-full bg-[#001E50]" />
    </SliderTrack>
    <SliderThumb
      v-for="(_, key) in modelValue"
      :key="key"
      class="block h-5 w-5 rounded-full border-2 border-[#001E50] bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001E50] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderRoot>
</template>










