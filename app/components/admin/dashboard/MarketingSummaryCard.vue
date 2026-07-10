<!-- app/components/admin/dashboard/MarketingSummaryCard.vue -->
<template>
  <Card class="overflow-hidden shadow-sm">
    <CardHeader class="space-y-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0">
          <CardTitle class="flex items-center gap-2 text-2xl">
            <BarChart3 class="h-5 w-5 text-sky-600" />
            Marketing Performance
          </CardTitle>
          <CardDescription class="mt-1">
            Paid media and admin CRM lead matching for {{ rangeLabel }}
          </CardDescription>
        </div>

        <Button size="sm" variant="outline" as-child>
          <NuxtLink to="/admin/marketing-report">
            <FileBarChart2 class="h-3.5 w-3.5" />
            View full report
          </NuxtLink>
        </Button>
      </div>
    </CardHeader>

    <CardContent>
      <div v-if="pending" class="py-8 text-center text-sm text-muted-foreground">Loading marketing report...</div>

      <div v-else-if="data" class="grid gap-3 sm:grid-cols-2" :class="hasRoas ? 'lg:grid-cols-4' : 'lg:grid-cols-3'">
        <div class="rounded-md border bg-background p-4">
          <div class="text-xs font-medium uppercase text-muted-foreground">Paid spend</div>
          <div class="mt-1 text-xl font-semibold leading-tight">{{ money(data.professionalMetrics.paidMedia.spend) }}</div>
        </div>
        <div class="rounded-md border bg-background p-4">
          <div class="text-xs font-medium uppercase text-muted-foreground">Admin CRM leads</div>
          <div class="mt-1 text-xl font-semibold leading-tight">{{ n(data.summary.totalCrmLeads) }}</div>
        </div>
        <div class="rounded-md border bg-background p-4">
          <div class="text-xs font-medium uppercase text-muted-foreground">True CPL</div>
          <div class="mt-1 text-xl font-semibold leading-tight">{{ moneyOrDash(data.professionalMetrics.paidMedia.cpl) }}</div>
        </div>
        <div v-if="hasRoas" class="rounded-md border bg-background p-4">
          <div class="text-xs font-medium uppercase text-muted-foreground">ROAS</div>
          <div class="mt-1 text-xl font-semibold leading-tight">{{ roas(data.professionalMetrics.paidMedia.roas) }}</div>
        </div>
      </div>

      <p v-else class="py-8 text-center text-sm text-muted-foreground">
        Couldn't load the marketing report. Try refreshing.
      </p>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { BarChart3, FileBarChart2 } from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';

interface MarketingReportSummary {
  period: { from: string; to: string };
  summary: {
    totalCrmLeads: number;
  };
  professionalMetrics: {
    paidMedia: {
      spend: number;
      cpl: number | null;
      roas: number | null;
    };
  };
}

const { data, pending } = useFetch<MarketingReportSummary>('/api/admin/analytics/marketing-report', {
  lazy: true,
});

const hasRoas = computed(() => data.value?.professionalMetrics.paidMedia.roas != null);

const rangeLabel = computed(() => {
  if (!data.value?.period) return 'this month';
  return `${displayDate(data.value.period.from)} to ${displayDate(data.value.period.to)}`;
});

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00Z`));
}

const n = (v: number) => new Intl.NumberFormat('en-AU').format(v || 0);
const money = (v: number) => formatCurrency(v || 0, true);
const moneyOrDash = (v: number | null) => (v == null ? '—' : money(v));
const roas = (v: number | null) => (v == null ? '—' : `${new Intl.NumberFormat('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}×`);
</script>
