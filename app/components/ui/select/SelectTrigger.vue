<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SelectIcon, SelectTrigger, type SelectTriggerProps } from 'reka-ui'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

const props = defineProps<SelectTriggerProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <SelectTrigger
    v-bind="props"
    :class="cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#001E50] focus:ring-offset-2 focus:border-[#001E50] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 [&>span]:line-clamp-1 data-[placeholder]:text-gray-500',
      props.class,
    )"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="h-4 w-4 text-gray-500 shrink-0" />
    </SelectIcon>
  </SelectTrigger>
</template>


