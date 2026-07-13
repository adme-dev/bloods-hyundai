<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CheckboxIndicator, CheckboxRoot, type CheckboxRootProps } from 'reka-ui'
import { Check } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

type CheckedState = boolean | 'indeterminate'

const props = defineProps<CheckboxRootProps & {
  class?: HTMLAttributes['class']
  checked?: CheckedState | null
}>()

const emits = defineEmits<{
  'update:modelValue': [value: CheckedState]
  'update:checked': [value: CheckedState]
}>()

const delegatedProps = computed(() => {
  const { class: _class, checked, modelValue, ...delegated } = props

  return {
    ...delegated,
    modelValue: checked ?? modelValue,
  }
})

const handleUpdate = (value: CheckedState) => {
  emits('update:modelValue', value)
  emits('update:checked', value)
}
</script>

<template>
  <CheckboxRoot
    data-slot="checkbox"
    v-bind="delegatedProps"
    :class="cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 bg-white transition-colors hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001E50] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#001E50] data-[state=checked]:border-[#001E50] data-[state=checked]:text-white',
      props.class,
    )"
    @update:model-value="handleUpdate"
  >
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <Check class="h-3.5 w-3.5" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>








