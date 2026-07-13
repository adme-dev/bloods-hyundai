<script setup lang="ts">
import { TabsRoot, type TabsRootProps } from 'reka-ui'

const props = defineProps<TabsRootProps>()

const emits = defineEmits<{
  'update:modelValue': [payload: string]
}>()
</script>

<template>
  <TabsRoot
    data-slot="tabs"
    v-bind="props"
    @update:model-value="emits('update:modelValue', String($event))"
  >
    <slot />
  </TabsRoot>
</template>









