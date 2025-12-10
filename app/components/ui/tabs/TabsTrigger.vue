<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TabsTrigger, type TabsTriggerProps } from 'reka-ui'
import { cn } from '~/lib/utils'

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <TabsTrigger
    v-bind="props"
    :class="cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001E50] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-[#001E50] data-[state=active]:shadow-sm',
      props.class,
    )"
  >
    <slot />
  </TabsTrigger>
</template>



