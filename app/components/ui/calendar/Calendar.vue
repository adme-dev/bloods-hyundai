<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import {
  CalendarRoot,
  CalendarHeader,
  CalendarHeading,
  CalendarGrid,
  CalendarGridHead,
  CalendarGridBody,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarCell,
  CalendarCellTrigger,
  CalendarPrev,
  CalendarNext,
  type CalendarRootProps,
  type CalendarRootEmits,
} from 'reka-ui'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

const props = defineProps<CalendarRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<CalendarRootEmits>()
</script>

<template>
  <CalendarRoot
    v-slot="{ grid, weekDays }"
    v-bind="props"
    :class="cn('p-3', props.class)"
    @update:model-value="(v) => emits('update:modelValue', v)"
  >
    <CalendarHeader class="relative flex w-full items-center justify-between pt-1">
      <CalendarPrev
        class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001E50] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
      >
        <ChevronLeft class="h-4 w-4" />
      </CalendarPrev>

      <CalendarHeading class="text-sm font-medium" />

      <CalendarNext
        class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001E50] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
      >
        <ChevronRight class="h-4 w-4" />
      </CalendarNext>
    </CalendarHeader>

    <div class="flex flex-col gap-y-4 mt-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
      <CalendarGrid v-for="month in grid" :key="month.value.toString()">
        <CalendarGridHead>
          <CalendarGridRow class="flex">
            <CalendarHeadCell
              v-for="day in weekDays"
              :key="day"
              class="w-8 rounded-md text-[0.8rem] font-normal text-gray-500"
            >
              {{ day }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>

        <CalendarGridBody>
          <CalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="`weekDate-${index}`"
            class="flex w-full mt-2"
          >
            <CalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :date="weekDate"
              class="relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([data-selected])]:bg-gray-100 first:[&:has([data-selected])]:rounded-l-md last:[&:has([data-selected])]:rounded-r-md [&:has([data-selected][data-outside-month])]:bg-gray-100/50"
            >
              <CalendarCellTrigger
                :day="weekDate"
                :month="month.value"
                class="inline-flex items-center justify-center rounded-md text-sm ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#001E50] focus-visible:ring-offset-2 h-8 w-8 p-0 font-normal aria-selected:opacity-100 data-[today]:bg-gray-100 data-[today]:text-gray-900 data-[selected]:bg-[#001E50] data-[selected]:text-white data-[selected]:hover:bg-[#001E50] data-[selected]:hover:text-white data-[selected]:focus:bg-[#001E50] data-[selected]:focus:text-white data-[disabled]:text-gray-400 data-[disabled]:opacity-50 data-[outside-month]:text-gray-400 data-[outside-month]:opacity-50 data-[outside-month]:pointer-events-none hover:bg-gray-100 hover:text-gray-900"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>

