<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { PopoverContent, PopoverPortal, type PopoverContentProps } from 'reka-ui'
import { cn } from '~/lib/utils'

const props = withDefaults(defineProps<PopoverContentProps & { class?: HTMLAttributes['class'] }>(), {
  sideOffset: 4,
  align: 'center',
})
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      v-bind="props"
      :class="cn(
        'z-[100] w-auto rounded-md border border-gray-200 bg-white p-4 shadow-lg outline-none',
        props.class,
      )"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>







