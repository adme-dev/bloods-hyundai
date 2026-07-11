<template>
  <div :class="cn('min-w-0', props.class)">
    <Popover v-model:open="popoverOpen">
      <PopoverTrigger as-child>
        <Button
          :id="id"
          type="button"
          variant="outline"
          class="hidden w-full justify-start font-normal md:flex"
          :class="!modelValue && 'text-muted-foreground'"
          :disabled="disabled"
          :aria-label="ariaLabel"
        >
          <CalendarDays class="h-4 w-4 shrink-0" />
          <span class="truncate">{{ displayValue }}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="start">
        <Calendar
          :model-value="dateValue"
          :is-date-disabled="isDateDisabled"
          initial-focus
          @update:model-value="selectDate"
        />
      </PopoverContent>
    </Popover>

    <Button
      :id="id ? `${id}-mobile` : undefined"
      type="button"
      variant="outline"
      class="w-full justify-start font-normal md:hidden"
      :class="!modelValue && 'text-muted-foreground'"
      :disabled="disabled"
      :aria-label="ariaLabel"
      @click="sheetOpen = true"
    >
      <CalendarDays class="h-4 w-4 shrink-0" />
      <span class="truncate">{{ displayValue }}</span>
    </Button>

    <Sheet v-model:open="sheetOpen">
      <SheetContent
        side="bottom"
        class="max-h-[88dvh] overflow-y-auto rounded-t-2xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5"
      >
        <SheetHeader class="pr-8 text-left">
          <SheetTitle>{{ label || 'Choose a date' }}</SheetTitle>
          <SheetDescription>{{ description || 'Select a date from the calendar.' }}</SheetDescription>
        </SheetHeader>
        <div class="mt-5">
          <div class="w-full rounded-xl border bg-background shadow-sm">
            <Calendar
              fluid
              :model-value="dateValue"
              :is-date-disabled="isDateDisabled"
              initial-focus
              @update:model-value="selectDate"
            />
          </div>
          <Button v-if="clearable && modelValue" type="button" variant="ghost" class="mt-3 w-full" @click="clearDate">
            Clear date
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, ref } from 'vue'
import { parseDate, type DateValue } from '@internationalized/date'
import { CalendarDays } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { cn } from '~/lib/utils'
import { formatAdminDate } from '~/utils/dashboardFormat'

const props = withDefaults(defineProps<{
  modelValue?: string
  id?: string
  label?: string
  description?: string
  placeholder?: string
  min?: string
  max?: string
  disabled?: boolean
  clearable?: boolean
  class?: HTMLAttributes['class']
}>(), {
  modelValue: '',
  placeholder: 'Choose date',
})

const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()
const popoverOpen = ref(false)
const sheetOpen = ref(false)

const dateValue = computed<DateValue | undefined>(() => {
  try { return props.modelValue ? parseDate(props.modelValue) : undefined }
  catch { return undefined }
})
const displayValue = computed(() => props.modelValue ? formatAdminDate(props.modelValue) : props.placeholder)
const ariaLabel = computed(() => `${props.label || 'Date'}: ${displayValue.value}`)

function isDateDisabled(date: DateValue) {
  const value = date.toString()
  return Boolean((props.min && value < props.min) || (props.max && value > props.max))
}

function selectDate(value: DateValue | undefined) {
  if (!value) return
  emit('update:modelValue', value.toString())
  popoverOpen.value = false
  sheetOpen.value = false
}

function clearDate() {
  emit('update:modelValue', '')
  sheetOpen.value = false
}
</script>
