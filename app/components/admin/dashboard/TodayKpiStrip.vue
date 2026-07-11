<template>
  <div class="crm-kpi-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <Card
      v-for="kpi in kpis"
      :key="kpi.label"
      class="crm-kpi cursor-pointer transition-all hover:-translate-y-px hover:border-primary/25 hover:shadow-md"
      @click="kpi.go()"
    >
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-1.5">
        <CardTitle class="crm-kpi__label">{{ kpi.label }}</CardTitle>
        <span class="crm-kpi__icon"><component :is="kpi.icon" class="h-3.5 w-3.5" /></span>
      </CardHeader>
      <CardContent>
        <div class="crm-kpi__value" :class="kpi.emphasis && Number(kpi.value) > 0 ? 'text-red-600' : ''">
          {{ kpi.value }}
        </div>
        <div class="crm-kpi__footer">
          <p>{{ kpi.hint }}</p>
          <ArrowUpRight class="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Inbox, AlertTriangle, Clock, Flame, ArrowUpRight } from 'lucide-vue-next';
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

<style scoped>
.crm-kpi {
  overflow: hidden;
}

.crm-kpi__label {
  color: var(--dashboard-muted, hsl(var(--muted-foreground)));
  font-size: 10.5px;
  font-weight: 750;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.crm-kpi__icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--dashboard-line, hsl(var(--border)));
  border-radius: 8px;
  background: var(--dashboard-surface-2, hsl(var(--muted)));
  color: var(--dashboard-muted, hsl(var(--muted-foreground)));
}

.crm-kpi__value {
  color: var(--dashboard-ink, hsl(var(--foreground)));
  font-size: 27px;
  font-weight: 750;
  letter-spacing: -.03em;
  line-height: 1.15;
}

.crm-kpi__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 5px;
  color: var(--dashboard-muted, hsl(var(--muted-foreground)));
  font-size: 11px;
}

.crm-kpi__footer p {
  margin: 0;
}

@media (max-width: 639px) {
  .crm-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .crm-kpi :deep([data-slot="card-header"]),
  .crm-kpi :deep([data-slot="card-content"]) {
    padding: .85rem;
  }

  .crm-kpi__value {
    font-size: 23px;
  }
}
</style>
