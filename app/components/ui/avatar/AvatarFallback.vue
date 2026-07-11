<script setup lang="ts">
import type { AvatarFallbackProps } from "reka-ui"
import { AvatarFallback } from "reka-ui"

const props = defineProps<AvatarFallbackProps>()
</script>

<template>
  <AvatarFallback data-slot="avatar-fallback" v-bind="props">
    <slot />
  </AvatarFallback>
</template>
