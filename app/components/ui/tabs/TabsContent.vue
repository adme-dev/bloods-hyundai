<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TabsContent, type TabsContentProps } from 'reka-ui'
import { cn } from '~/lib/utils'

const props = defineProps<TabsContentProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <TabsContent
    :class="cn(
      'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001E50] focus-visible:ring-offset-2',
      props.class,
    )"
    v-bind="props"
  >
    <slot />
  </TabsContent>
</template>









