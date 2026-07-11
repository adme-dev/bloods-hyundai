<template>
  <div :class="cn('grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]', props.class)">
    <AdminDatePicker
      :id="id ? `${id}-date` : undefined"
      :model-value="datePart"
      :label="label"
      :placeholder="placeholder"
      :min="minDate"
      :max="maxDate"
      clearable
      @update:model-value="updateDate"
    />
    <Input
      :id="id ? `${id}-time` : undefined"
      :model-value="timePart"
      type="time"
      :aria-label="`${label || 'Date'} time`"
      :disabled="!datePart"
      @update:model-value="updateTime"
    />
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

const props = withDefaults(defineProps<{
  modelValue?: string
  id?: string
  label?: string
  placeholder?: string
  min?: string
  max?: string
  class?: HTMLAttributes['class']
}>(), { modelValue: '', placeholder: 'Choose date' })

const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()
const datePart = computed(() => props.modelValue.slice(0, 10))
const timePart = computed(() => props.modelValue.length >= 16 ? props.modelValue.slice(11, 16) : '')
const minDate = computed(() => props.min?.slice(0, 10))
const maxDate = computed(() => props.max?.slice(0, 10))

function updateDate(date: string) {
  if (!date) {
    emit('update:modelValue', '')
    return
  }
  emit('update:modelValue', `${date}T${timePart.value || '09:00'}`)
}

function updateTime(time: string | number) {
  if (!datePart.value) return
  emit('update:modelValue', `${datePart.value}T${String(time) || '09:00'}`)
}
</script>
