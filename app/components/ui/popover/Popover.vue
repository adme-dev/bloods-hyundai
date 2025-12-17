<script setup lang="ts">
import { PopoverRoot, type PopoverRootProps } from 'reka-ui'

const props = defineProps<PopoverRootProps>()
</script>

<template>
  <PopoverRoot v-bind="props">
    <slot />
  </PopoverRoot>
</template>






