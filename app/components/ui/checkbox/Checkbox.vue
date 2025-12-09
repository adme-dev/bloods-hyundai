<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CheckboxIndicator, CheckboxRoot, type CheckboxRootEmits, type CheckboxRootProps } from 'radix-vue'
import { Check } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<CheckboxRootEmits>()
</script>

<template>
  <CheckboxRoot
    v-bind="props"
    :class="cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 bg-white transition-colors hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001E50] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#001E50] data-[state=checked]:border-[#001E50] data-[state=checked]:text-white',
      props.class,
    )"
    @update:checked="emits('update:checked', $event)"
  >
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <Check class="h-3.5 w-3.5" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
