<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
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

const props = defineProps<CalendarRootProps & { class?: HTMLAttributes['class']; fluid?: boolean }>()
const emits = defineEmits<CalendarRootEmits>()
const delegatedProps = computed(() => {
  const { class: _class, fluid: _fluid, ...rest } = props
  return rest
})
</script>

<template>
  <CalendarRoot
    data-slot="calendar"
    v-slot="{ grid, weekDays }"
    v-bind="delegatedProps"
    :class="cn('p-3', props.fluid && 'w-full', props.class)"
    @update:model-value="(v) => emits('update:modelValue', v)"
  >
    <CalendarHeader data-slot="calendar-header" class="relative flex w-full items-center justify-between pt-1">
      <CalendarPrev
        data-slot="calendar-prev"
        aria-label="Previous month"
        class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-transparent p-0 text-sm font-medium opacity-50 ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <ChevronLeft class="h-4 w-4" />
      </CalendarPrev>

      <CalendarHeading data-slot="calendar-heading" class="text-sm font-medium" />

      <CalendarNext
        data-slot="calendar-next"
        aria-label="Next month"
        class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-transparent p-0 text-sm font-medium opacity-50 ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <ChevronRight class="h-4 w-4" />
      </CalendarNext>
    </CalendarHeader>

    <div :class="cn('mt-4 flex flex-col gap-y-4', !props.fluid && 'sm:flex-row sm:gap-x-4 sm:gap-y-0')">
      <CalendarGrid v-for="month in grid" :key="month.value.toString()" data-slot="calendar-grid" :class="props.fluid && 'w-full table-fixed'">
        <CalendarGridHead>
          <CalendarGridRow :class="props.fluid ? 'grid grid-cols-7' : 'flex'">
            <CalendarHeadCell
              v-for="day in weekDays"
              :key="day"
              :class="cn('rounded-md font-normal text-muted-foreground', props.fluid ? 'w-full py-2 text-sm' : 'w-8 text-[0.8rem]')"
            >
              {{ day }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>

        <CalendarGridBody>
          <CalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="`weekDate-${index}`"
            :class="props.fluid ? 'mt-1 grid w-full grid-cols-7' : 'mt-2 flex w-full'"
          >
            <CalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :date="weekDate"
              :class="cn('relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([data-selected])]:bg-accent first:[&:has([data-selected])]:rounded-l-md last:[&:has([data-selected])]:rounded-r-md [&:has([data-selected][data-outside-month])]:bg-accent/50', props.fluid && 'w-full')"
            >
              <CalendarCellTrigger
                :day="weekDate"
                :month="month.value"
                :class="cn('inline-flex items-center justify-center rounded-md p-0 font-normal ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-selected:opacity-100 data-[today]:bg-accent data-[today]:text-accent-foreground data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground data-[selected]:focus:bg-primary data-[selected]:focus:text-primary-foreground data-[disabled]:text-muted-foreground data-[disabled]:opacity-50 data-[outside-month]:pointer-events-none data-[outside-month]:text-muted-foreground data-[outside-month]:opacity-50', props.fluid ? 'h-12 w-full text-base font-medium' : 'h-8 w-8 text-sm')"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>






