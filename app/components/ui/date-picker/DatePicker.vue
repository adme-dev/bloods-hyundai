<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ref, computed } from 'vue'
import { type DateValue, parseDate } from '@internationalized/date'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { cn } from '~/lib/utils'

const props = defineProps<{
  modelValue?: string // ISO date string (YYYY-MM-DD)
  placeholder?: string
  minDate?: string // ISO date string (YYYY-MM-DD)
  disabled?: boolean
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)

// Convert ISO string to DateValue
const dateValue = computed<DateValue | undefined>({
  get() {
    if (!props.modelValue) return undefined
    try {
      return parseDate(props.modelValue)
    } catch {
      return undefined
    }
  },
  set(val: DateValue | undefined) {
    if (val) {
      emit('update:modelValue', val.toString())
    }
  }
})

// Convert minDate string to DateValue
const minDateValue = computed<DateValue | undefined>(() => {
  if (!props.minDate) return undefined
  try {
    return parseDate(props.minDate)
  } catch {
    return undefined
  }
})

// Format date for display
const formattedDate = computed(() => {
  if (!props.modelValue) return ''
  try {
    const date = new Date(props.modelValue + 'T00:00:00')
    return date.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return props.modelValue
  }
})

// Handle date selection
const handleSelect = (date: DateValue | undefined) => {
  if (date) {
    emit('update:modelValue', date.toString())
    isOpen.value = false
  }
}

// Check if date is disabled (before minDate or weekend)
const isDateDisabled = (date: DateValue) => {
  // Check if before minDate
  if (minDateValue.value && date.compare(minDateValue.value) < 0) {
    return true
  }
  // Check if weekend (Saturday = 6, Sunday = 0)
  const jsDate = new Date(date.toString())
  const day = jsDate.getDay()
  return day === 0 || day === 6
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :disabled="disabled"
        :class="cn(
          'w-full justify-start text-left font-normal',
          !modelValue && 'text-gray-500',
          props.class
        )"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        <span v-if="modelValue">{{ formattedDate }}</span>
        <span v-else>{{ placeholder || 'Pick a date' }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar
        :model-value="dateValue"
        @update:model-value="handleSelect"
        :is-date-disabled="isDateDisabled"
        initial-focus
      />
    </PopoverContent>
  </Popover>
</template>









