<template>
  <div class="space-y-6 max-[700px]:[&_.sales-panel_[data-slot=card-content]]:px-3.5 max-[700px]:[&_.sales-panel_[data-slot=card-header]]:px-3.5">
    <!-- Volume overview -->
    <div class="dashboard-compact-kpis grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <CompactKpiCard>
        <template #label>Total Enquiries</template>
        <template #value>{{ data?.overview?.total || 0 }}</template>
        <template #action><Inbox class="h-4 w-4 text-muted-foreground" /></template>
        <template #footer><p class="font-medium text-foreground">All enquiries recorded</p><p>All-time total</p></template>
      </CompactKpiCard>

      <CompactKpiCard>
        <template #label>This Week</template>
        <template #value>{{ data?.overview?.thisWeek || 0 }}</template>
        <template #action><Calendar class="h-4 w-4 text-muted-foreground" /></template>
        <template #footer>
          <div class="flex items-center gap-1 text-xs">
            <TrendingUp v-if="(data?.overview?.weeklyChange || 0) > 0" class="h-3 w-3 text-green-500" />
            <TrendingDown v-else-if="(data?.overview?.weeklyChange || 0) < 0" class="h-3 w-3 text-red-500" />
            <Minus v-else class="h-3 w-3 text-muted-foreground" />
            <span :class="getTrendClass(data?.overview?.weeklyChange)">
              {{ formatTrend(data?.overview?.weeklyChange) }} vs last week
            </span>
          </div>
          <p>Current seven-day period</p>
        </template>
      </CompactKpiCard>

      <CompactKpiCard>
        <template #label>Conversion Rate</template>
        <template #value>{{ data?.salesPerformance?.thisMonth?.conversionRate || 0 }}%</template>
        <template #action><Percent class="h-4 w-4 text-purple-500" /></template>
        <template #footer>
          <div class="flex items-center gap-1 text-xs mt-1">
            <TrendingUp v-if="(data?.salesPerformance?.monthOverMonthChange || 0) > 0" class="h-3 w-3 text-green-500" />
            <TrendingDown v-else-if="(data?.salesPerformance?.monthOverMonthChange || 0) < 0" class="h-3 w-3 text-red-500" />
            <Minus v-else class="h-3 w-3 text-muted-foreground" />
            <span :class="getTrendClass(data?.salesPerformance?.monthOverMonthChange)">
              {{ formatTrend(data?.salesPerformance?.monthOverMonthChange) }} vs last month
            </span>
          </div>
          <p>Monthly lead conversion</p>
        </template>
      </CompactKpiCard>

      <CompactKpiCard>
        <template #label>Accessories Revenue</template>
        <template #value>${{ formatCurrency(data?.salesPerformance?.thisMonth?.accessoriesValue) }}</template>
        <template #action><ShoppingCart class="h-4 w-4 text-pink-500" /></template>
        <template #footer>
          <p class="font-medium text-foreground">
            {{ data?.salesPerformance?.thisMonth?.withAccessories || 0 }} enquiries with add-ons
          </p>
          <p>Accessory value this month</p>
        </template>
      </CompactKpiCard>
    </div>

    <!-- Targets -->
    <div class="dashboard-compact-kpis grid grid-cols-2 gap-3 md:gap-4">
      <CompactKpiCard>
        <template #label>Monthly Leads</template>
        <template #value>{{ data?.salesPerformance?.thisMonth?.leads || 0 }}</template>
        <template #action><Target class="h-4 w-4 text-blue-500" /></template>
        <template #footer>
          <div class="w-full">
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted-foreground">Target: {{ data?.salesPerformance?.targets?.monthlyLeads || 50 }}</span>
              <span :class="getTargetProgressClass(data?.salesPerformance?.thisMonth?.leads, data?.salesPerformance?.targets?.monthlyLeads)">
                {{ getTargetProgress(data?.salesPerformance?.thisMonth?.leads, data?.salesPerformance?.targets?.monthlyLeads) }}%
              </span>
            </div>
            <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-blue-500 transition-all"
                :style="{ width: `${Math.min(getTargetProgress(data?.salesPerformance?.thisMonth?.leads, data?.salesPerformance?.targets?.monthlyLeads), 100)}%` }"
              />
            </div>
          </div>
        </template>
      </CompactKpiCard>

      <CompactKpiCard>
        <template #label>Conversions</template>
        <template #value>{{ data?.salesPerformance?.thisMonth?.conversions || 0 }}</template>
        <template #action><CheckCircle class="h-4 w-4 text-green-500" /></template>
        <template #footer>
          <div class="w-full">
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted-foreground">Target: {{ data?.salesPerformance?.targets?.monthlyConversions || 15 }}</span>
              <span :class="getTargetProgressClass(data?.salesPerformance?.thisMonth?.conversions, data?.salesPerformance?.targets?.monthlyConversions)">
                {{ getTargetProgress(data?.salesPerformance?.thisMonth?.conversions, data?.salesPerformance?.targets?.monthlyConversions) }}%
              </span>
            </div>
            <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-green-500 transition-all"
                :style="{ width: `${Math.min(getTargetProgress(data?.salesPerformance?.thisMonth?.conversions, data?.salesPerformance?.targets?.monthlyConversions), 100)}%` }"
              />
            </div>
          </div>
        </template>
      </CompactKpiCard>
    </div>

    <!-- Funnel + Pipeline Status -->
    <div class="grid gap-4 md:gap-6 lg:grid-cols-2">
      <Card class="sales-panel">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Filter class="h-5 w-5" />
            Sales Funnel
          </CardTitle>
          <CardDescription>This month's conversion pipeline</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2.5 min-[701px]:space-y-3">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[13px] min-[701px]:text-sm">
              <span>Total Leads</span>
              <span class="font-semibold tabular-nums">{{ data?.conversionFunnel?.totalLeads || 0 }}</span>
            </div>
            <div class="h-2.5 w-full rounded-full bg-blue-500 min-[701px]:h-3" />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-[13px] min-[701px]:text-sm">
              <span>Contacted</span>
              <span class="font-semibold tabular-nums">{{ data?.conversionFunnel?.contacted || 0 }} ({{ data?.conversionFunnel?.contactedRate || 0 }}%)</span>
            </div>
            <div class="h-2.5 w-full overflow-hidden rounded-full bg-muted min-[701px]:h-3">
              <div
                class="h-full rounded-full bg-cyan-500 transition-all"
                :style="{ width: `${data?.conversionFunnel?.contactedRate || 0}%` }"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-[13px] min-[701px]:text-sm">
              <span>Test Drive Booked</span>
              <span class="font-semibold tabular-nums">{{ data?.conversionFunnel?.testDriveBooked || 0 }} ({{ data?.conversionFunnel?.testDriveRate || 0 }}%)</span>
            </div>
            <div class="h-2.5 w-full overflow-hidden rounded-full bg-muted min-[701px]:h-3">
              <div
                class="h-full rounded-full bg-purple-500 transition-all"
                :style="{ width: `${data?.conversionFunnel?.testDriveRate || 0}%` }"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-[13px] min-[701px]:text-sm">
              <span>Finance Applied</span>
              <span class="font-semibold tabular-nums">{{ data?.conversionFunnel?.financeApplied || 0 }} ({{ data?.conversionFunnel?.financeRate || 0 }}%)</span>
            </div>
            <div class="h-2.5 w-full overflow-hidden rounded-full bg-muted min-[701px]:h-3">
              <div
                class="h-full rounded-full bg-yellow-500 transition-all"
                :style="{ width: `${data?.conversionFunnel?.financeRate || 0}%` }"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-[13px] min-[701px]:text-sm">
              <span class="font-semibold">Converted</span>
              <span class="font-bold tabular-nums text-green-600">{{ data?.conversionFunnel?.converted || 0 }} ({{ data?.conversionFunnel?.conversionRate || 0 }}%)</span>
            </div>
            <div class="h-2.5 w-full overflow-hidden rounded-full bg-muted min-[701px]:h-3">
              <div
                class="h-full rounded-full bg-green-500 transition-all"
                :style="{ width: `${data?.conversionFunnel?.conversionRate || 0}%` }"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="sales-panel">
        <CardHeader>
          <CardTitle>Pipeline Status</CardTitle>
          <CardDescription>Current enquiry distribution</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-for="group in pipelineStageGroups" :key="group.stage">
            <h4 class="pb-1 text-[11px] font-bold uppercase tracking-[0.09em] text-muted-foreground">{{ group.label }}</h4>
            <div class="divide-y">
              <div
                v-for="status in group.statuses"
                :key="status.key"
                class="flex items-center justify-between gap-3 py-2 text-[13px] min-[701px]:text-sm"
              >
                <div class="flex min-w-0 items-center gap-2.5">
                  <Badge :variant="status.variant">{{ status.label }}</Badge>
                  <span class="truncate text-muted-foreground">{{ status.description }}</span>
                </div>
                <div class="text-base font-semibold tabular-nums">{{ data?.overview?.pipeline?.[status.key] || 0 }}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Department Cards -->
    <div>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">Department Overview</h2>
        <Button variant="ghost" size="sm" as-child>
          <NuxtLink to="/admin/forms">View all forms <ArrowRight class="ml-2 h-4 w-4" /></NuxtLink>
        </Button>
      </div>
      <div class="dashboard-compact-kpis grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Card
          v-for="dept in sortedDepartments"
          :key="dept.type"
          class="department-card cursor-pointer transition-colors hover:border-primary/50"
          role="link"
          tabindex="0"
          @click="navigateToEnquiries(dept.type)"
          @keydown.enter="navigateToEnquiries(dept.type)"
        >
          <CardHeader class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 pb-0">
            <div class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg"
                :class="getDeptBgClass(dept.color)"
              >
                <component :is="getDeptIcon(dept.icon)" class="h-4 w-4" :class="getDeptTextClass(dept.color)" />
              </div>
              <CardTitle class="[overflow-wrap:anywhere] text-[11.5px] font-semibold leading-[1.2] min-[701px]:text-[13px]">{{ dept.label }}</CardTitle>
            </div>
            <Badge v-if="dept.new > 0" variant="destructive" class="h-5 px-1.5 text-[10px]">
              {{ dept.new }} new
            </Badge>
          </CardHeader>
          <CardContent class="flex flex-1 flex-col">
            <div class="flex items-baseline justify-between gap-2">
              <div class="text-2xl font-bold">{{ dept.total }}</div>
              <div class="flex items-center gap-1 text-xs">
                <TrendingUp v-if="dept.weeklyChange > 0" class="h-3 w-3 text-green-500" />
                <TrendingDown v-else-if="dept.weeklyChange < 0" class="h-3 w-3 text-red-500" />
                <span :class="getTrendClass(dept.weeklyChange)">
                  {{ formatTrend(dept.weeklyChange) }}
                </span>
              </div>
            </div>
            <div class="mt-auto flex items-center justify-between gap-2 pt-3 text-[11px] text-muted-foreground min-[701px]:pt-3.5 min-[701px]:text-xs">
              <span>This week: {{ dept.thisWeek }}</span>
              <span v-if="dept.avgResponseHours !== null">
                Avg: {{ formatResponseTime(dept.avgResponseHours) }}
              </span>
            </div>
            <div v-if="dept.conversionRate > 0" class="mt-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-muted-foreground">Conversion</span>
                <span class="font-medium">{{ dept.conversionRate }}%</span>
              </div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full transition-all"
                  :class="getConversionBarClass(dept.conversionRate)"
                  :style="{ width: `${Math.min(dept.conversionRate, 100)}%` }"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <p v-if="!sortedDepartments.length" class="py-6 text-center text-sm text-muted-foreground">No department data yet</p>
    </div>

    <!-- Trends + Response Performance -->
    <div class="grid gap-4 md:gap-6 lg:grid-cols-3">
      <Card class="sales-panel lg:col-span-2">
        <CardHeader class="grid grid-cols-[1fr_auto] items-start gap-2">
          <div class="min-w-0">
            <CardTitle>Enquiry Trends</CardTitle>
            <CardDescription>Last 14 days activity</CardDescription>
          </div>
          <CardAction>
            <div class="flex gap-1">
              <Button
                v-for="chartType in chartTypes"
                :key="chartType.value"
                variant="ghost"
                size="sm"
                class="h-7 px-2 text-xs min-[701px]:h-9 min-[701px]:px-3"
                :class="{ 'bg-muted': selectedChartType === chartType.value }"
                :aria-pressed="selectedChartType === chartType.value"
                @click="selectedChartType = chartType.value"
              >
                {{ chartType.label }}
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div class="h-[200px] min-[701px]:h-[280px]">
            <div v-if="data?.dailyTrend?.length" class="flex h-full gap-1">
              <div
                v-for="day in data.dailyTrend"
                :key="day.date"
                class="group relative flex h-full flex-1 flex-col justify-end max-[700px]:[&:nth-last-child(even)_.trend-label]:invisible"
              >
                <div
                  class="w-full rounded-t bg-primary/80 transition-colors hover:bg-primary"
                  :style="{ height: `${Math.round(getBarHeight(day) * 0.9)}%`, minHeight: getDayValue(day) > 0 ? '4px' : '0' }"
                />
                <div class="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block">
                  {{ formatChartDate(day.date) }} · {{ getDayValue(day) }} enquiries
                </div>
                <div class="trend-label mt-1 text-center text-[10px] text-muted-foreground">
                  {{ formatChartDate(day.date) }}
                </div>
              </div>
            </div>
            <div v-else class="flex h-full items-center justify-center text-sm text-muted-foreground">
              No trend data available yet
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="sales-panel">
        <CardHeader>
          <CardTitle>Response Performance</CardTitle>
          <CardDescription>This month's metrics</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3 min-[701px]:space-y-4">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[13px] min-[701px]:text-sm">
              <span class="text-muted-foreground">Avg Response Time</span>
              <span class="font-semibold tabular-nums">
                {{ data?.responseMetrics?.avgHours ? formatResponseTime(data.responseMetrics.avgHours) : 'N/A' }}
              </span>
            </div>
            <div class="flex items-center justify-between text-[13px] min-[701px]:text-sm">
              <span class="text-muted-foreground">Median Response</span>
              <span class="font-semibold tabular-nums">
                {{ data?.responseMetrics?.medianHours ? formatResponseTime(data.responseMetrics.medianHours) : 'N/A' }}
              </span>
            </div>
          </div>

          <Separator />

          <div class="space-y-3">
            <div>
              <div class="flex items-center justify-between text-[13px] min-[701px]:text-sm">
                <span class="text-muted-foreground">Responded within 1 hour</span>
                <span class="font-semibold tabular-nums">{{ data?.responseMetrics?.within1hRate || 0 }}%</span>
              </div>
              <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full bg-green-500 transition-all"
                  :style="{ width: `${data?.responseMetrics?.within1hRate || 0}%` }"
                />
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between text-[13px] min-[701px]:text-sm">
                <span class="text-muted-foreground">Responded within 24 hours</span>
                <span class="font-semibold tabular-nums">{{ data?.responseMetrics?.within24hRate || 0 }}%</span>
              </div>
              <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full bg-blue-500 transition-all"
                  :style="{ width: `${data?.responseMetrics?.within24hRate || 0}%` }"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 class="mb-2 text-sm font-medium">Traffic Sources</h4>
            <div class="space-y-2">
              <div
                v-for="source in data?.sources || []"
                :key="source.source"
                class="flex items-center justify-between text-[13px] min-[701px]:text-sm"
              >
                <span class="capitalize text-muted-foreground">{{ source.source }}</span>
                <Badge variant="secondary" class="tabular-nums">{{ source.count }}</Badge>
              </div>
              <p v-if="!data?.sources?.length" class="text-xs text-muted-foreground">
                No source data available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  Inbox, Calendar, TrendingUp, TrendingDown, Minus, Percent, ShoppingCart,
  Target, CheckCircle, Filter, ArrowRight,
  Car, MessageSquare, DollarSign, Wrench, Package, CalendarCheck,
  ArrowLeftRight, Sparkles, Truck,
} from 'lucide-vue-next';
import { Card, CardAction, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import {
  getTrendClass, formatTrend, formatResponseTime, getConversionBarClass,
  formatChartDate, formatDashboardCurrency, getTargetProgress, getTargetProgressClass,
  getDeptBgClass, getDeptTextClass,
} from '~/utils/dashboardFormat';
import type { DashboardData } from './types';

const props = defineProps<{ data: DashboardData }>();

const formatCurrency = formatDashboardCurrency;

const selectedChartType = ref('total');
const chartTypes = [
  { value: 'total', label: 'All' },
  { value: 'sales', label: 'Sales' },
  { value: 'service', label: 'Service' },
];

const sortedDepartments = computed(() => {
  if (!props.data?.departments) return [];
  return [...props.data.departments].sort((a: any, b: any) => b.total - a.total);
});

// Sales funnel pipeline stages (Cold → Warm → Hot → Closed)
const pipelineStatuses = [
  { key: 'newLead', label: 'New Lead', description: 'Fresh enquiry', variant: 'default' as const, stage: 'cold' },
  { key: 'qualified', label: 'Qualified', description: 'Budget confirmed', variant: 'secondary' as const, stage: 'cold' },
  { key: 'attemptedContact', label: 'Attempted', description: 'No response yet', variant: 'outline' as const, stage: 'cold' },
  { key: 'appointmentSet', label: 'Appt Set', description: 'Visit scheduled', variant: 'default' as const, stage: 'warm' },
  { key: 'showed', label: 'Showed', description: 'Visited showroom', variant: 'secondary' as const, stage: 'warm' },
  { key: 'testDrive', label: 'Test Drive', description: 'Completed TD', variant: 'outline' as const, stage: 'warm' },
  { key: 'negotiating', label: 'Negotiating', description: 'Pricing discussion', variant: 'default' as const, stage: 'hot' },
  { key: 'pendingFinance', label: 'Pending Finance', description: 'Awaiting approval', variant: 'secondary' as const, stage: 'hot' },
  { key: 'depositTaken', label: 'Deposit', description: 'Holding deposit', variant: 'outline' as const, stage: 'hot' },
  { key: 'sold', label: 'Sold', description: 'Deal won', variant: 'default' as const, stage: 'closed' },
  { key: 'lost', label: 'Lost', description: 'Deal lost', variant: 'destructive' as const, stage: 'closed' },
];

const stageLabels: Record<string, string> = { cold: 'Cold', warm: 'Warm', hot: 'Hot', closed: 'Closed' };

const pipelineStageGroups = (['cold', 'warm', 'hot', 'closed'] as const).map(stage => ({
  stage,
  label: stageLabels[stage],
  statuses: pipelineStatuses.filter(s => s.stage === stage),
}));

const iconMap: Record<string, any> = {
  Car,
  MessageSquare,
  DollarSign,
  Wrench,
  Package,
  CalendarCheck,
  ArrowLeftRight,
  Sparkles,
  Truck,
  Mail: Inbox,
};

function getDeptIcon(icon: string) {
  return iconMap[icon] || Inbox;
}

type TrendDay = { total: number; vehicle?: number; testDrive?: number; service?: number };

function getDayValue(day: TrendDay): number {
  if (selectedChartType.value === 'sales') return (day.vehicle || 0) + (day.testDrive || 0);
  if (selectedChartType.value === 'service') return day.service || 0;
  return day.total;
}

function getBarHeight(day: TrendDay): number {
  if (!props.data?.dailyTrend) return 0;
  const maxValue = Math.max(...props.data.dailyTrend.map((d: TrendDay) => getDayValue(d)), 1);
  return (getDayValue(day) / maxValue) * 100;
}

function navigateToEnquiries(type: string) {
  navigateTo(`/admin/enquiries?type=${type}`);
}
</script>
