<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card
      v-for="kpi in kpis"
      :key="kpi.label"
      class="cursor-pointer transition-shadow hover:shadow-md"
      @click="kpi.go()"
    >
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">{{ kpi.label }}</CardTitle>
        <component :is="kpi.icon" class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-3xl font-bold" :class="kpi.emphasis && Number(kpi.value) > 0 ? 'text-red-600' : ''">
          {{ kpi.value }}
        </div>
        <p class="text-xs text-muted-foreground">{{ kpi.hint }}</p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Inbox, AlertTriangle, Clock, Flame } from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
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
