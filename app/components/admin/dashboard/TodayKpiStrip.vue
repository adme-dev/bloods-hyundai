<template>
  <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <Card
      v-for="kpi in kpis"
      :key="kpi.label"
      class="flex cursor-pointer flex-col overflow-hidden transition-all hover:-translate-y-px hover:border-primary/25 hover:shadow-md"
      @click="kpi.go()"
    >
      <CardHeader class="grid flex-1 grid-cols-[1fr_auto] grid-rows-[auto_auto] items-start gap-1.5 p-[.85rem] pb-2 sm:p-6 sm:pb-2">
        <CardDescription class="text-xs font-semibold sm:text-[10.5px] sm:font-bold sm:uppercase sm:tracking-[.06em]">{{ kpi.label }}</CardDescription>
        <CardTitle class="text-[23px] font-bold leading-[1.15] tracking-[-.03em] text-foreground sm:text-[27px]" :class="kpi.emphasis && Number(kpi.value) > 0 ? 'text-red-600' : ''">{{ kpi.value }}</CardTitle>
        <CardAction class="col-start-2 row-span-2 row-start-1">
          <span class="grid size-7 place-items-center rounded-lg border bg-muted text-muted-foreground"><component :is="kpi.icon" class="h-3.5 w-3.5" /></span>
        </CardAction>
      </CardHeader>
      <CardFooter class="mt-auto flex items-end justify-between gap-2 pt-0 text-[11.5px] text-muted-foreground sm:mt-[5px] sm:items-center sm:text-[11px] [&_p]:m-0">
        <p>{{ kpi.hint }}</p>
        <ArrowUpRight class="h-3.5 w-3.5" aria-hidden="true" />
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Inbox, AlertTriangle, Clock, Flame, ArrowUpRight } from 'lucide-vue-next';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import type { DashboardData } from './types';

const props = defineProps<{ data: DashboardData }>();

const kpis = computed(() => [
  {
    label: 'New Today',
    value: props.data?.overview?.newToday ?? 0,
    hint: 'Fresh enquiries',
    icon: Inbox,
    emphasis: false,
    go: () => navigateTo('/admin/enquiries?status=new_lead'),
  },
  {
    label: 'Needs Attention',
    value: props.data?.overview?.pipeline?.unassigned ?? 0,
    hint: 'Unassigned enquiries',
    icon: AlertTriangle,
    emphasis: true,
    go: () => navigateTo('/admin/enquiries?assigned=unassigned'),
  },
  {
    label: 'Overdue Follow-ups',
    value: props.data?.customerRetention?.overdueTasks ?? 0,
    hint: 'Tasks past due',
    icon: Clock,
    emphasis: true,
    go: () => navigateTo('/admin/tasks?dueDate=overdue'),
  },
  {
    label: 'Hot Leads',
    value: props.data?.hotLeads?.length ?? 0,
    hint: 'Negotiating & closing',
    icon: Flame,
    emphasis: false,
    go: () => document.getElementById('hot-leads-card')?.scrollIntoView({ behavior: 'smooth' }),
  },
]);
</script>
