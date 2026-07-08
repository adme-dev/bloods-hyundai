<template>
  <div class="space-y-6">
    <!-- Volume overview -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Enquiries</CardTitle>
          <Inbox class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data?.overview?.total || 0 }}</div>
          <p class="text-xs text-muted-foreground">All-time recorded</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">This Week</CardTitle>
          <Calendar class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data?.overview?.thisWeek || 0 }}</div>
          <div class="flex items-center gap-1 text-xs">
            <TrendingUp v-if="(data?.overview?.weeklyChange || 0) > 0" class="h-3 w-3 text-green-500" />
            <TrendingDown v-else-if="(data?.overview?.weeklyChange || 0) < 0" class="h-3 w-3 text-red-500" />
            <Minus v-else class="h-3 w-3 text-muted-foreground" />
            <span :class="getTrendClass(data?.overview?.weeklyChange)">
              {{ formatTrend(data?.overview?.weeklyChange) }} vs last week
            </span>
          </div>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-purple-500">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Conversion Rate</CardTitle>
          <Percent class="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data?.salesPerformance?.thisMonth?.conversionRate || 0 }}%</div>
          <div class="flex items-center gap-1 text-xs mt-1">
            <TrendingUp v-if="(data?.salesPerformance?.monthOverMonthChange || 0) > 0" class="h-3 w-3 text-green-500" />
            <TrendingDown v-else-if="(data?.salesPerformance?.monthOverMonthChange || 0) < 0" class="h-3 w-3 text-red-500" />
            <Minus v-else class="h-3 w-3 text-muted-foreground" />
            <span :class="getTrendClass(data?.salesPerformance?.monthOverMonthChange)">
              {{ formatTrend(data?.salesPerformance?.monthOverMonthChange) }} vs last month
            </span>
          </div>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-pink-500">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Accessories Revenue</CardTitle>
          <ShoppingCart class="h-4 w-4 text-pink-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">${{ formatCurrency(data?.salesPerformance?.thisMonth?.accessoriesValue) }}</div>
          <p class="text-xs text-muted-foreground mt-1">
            {{ data?.salesPerformance?.thisMonth?.withAccessories || 0 }} enquiries with add-ons
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Targets -->
    <div class="grid gap-4 md:grid-cols-2">
      <Card class="border-l-4 border-l-blue-500">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Monthly Leads</CardTitle>
          <Target class="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data?.salesPerformance?.thisMonth?.leads || 0 }}</div>
          <div class="mt-2">
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
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-green-500">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Conversions</CardTitle>
          <CheckCircle class="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data?.salesPerformance?.thisMonth?.conversions || 0 }}</div>
          <div class="mt-2">
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
        </CardContent>
      </Card>
    </div>

    <!-- Funnel + Pipeline Status -->
    <div class="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Filter class="h-5 w-5" />
            Sales Funnel
          </CardTitle>
          <CardDescription>This month's conversion pipeline</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span>Total Leads</span>
              <span class="font-semibold">{{ data?.conversionFunnel?.totalLeads || 0 }}</span>
            </div>
            <div class="h-3 w-full rounded-full bg-blue-500" />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span>Contacted</span>
              <span class="font-semibold">{{ data?.conversionFunnel?.contacted || 0 }} ({{ data?.conversionFunnel?.contactedRate || 0 }}%)</span>
            </div>
            <div class="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full bg-cyan-500 transition-all"
                :style="{ width: `${data?.conversionFunnel?.contactedRate || 0}%` }"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span>Test Drive Booked</span>
              <span class="font-semibold">{{ data?.conversionFunnel?.testDriveBooked || 0 }} ({{ data?.conversionFunnel?.testDriveRate || 0 }}%)</span>
            </div>
            <div class="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full bg-purple-500 transition-all"
                :style="{ width: `${data?.conversionFunnel?.testDriveRate || 0}%` }"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span>Finance Applied</span>
              <span class="font-semibold">{{ data?.conversionFunnel?.financeApplied || 0 }} ({{ data?.conversionFunnel?.financeRate || 0 }}%)</span>
            </div>
            <div class="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full bg-yellow-500 transition-all"
                :style="{ width: `${data?.conversionFunnel?.financeRate || 0}%` }"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="font-semibold">Converted</span>
              <span class="font-bold text-green-600">{{ data?.conversionFunnel?.converted || 0 }} ({{ data?.conversionFunnel?.conversionRate || 0 }}%)</span>
            </div>
            <div class="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full bg-green-500 transition-all"
                :style="{ width: `${data?.conversionFunnel?.conversionRate || 0}%` }"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Status</CardTitle>
          <CardDescription>Current enquiry distribution</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-for="status in pipelineStatuses"
            :key="status.key"
            class="flex items-center justify-between rounded-lg border border-dashed px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <Badge :variant="status.variant">{{ status.label }}</Badge>
              <span class="text-sm text-muted-foreground">{{ status.description }}</span>
            </div>
            <div class="text-lg font-semibold">{{ data?.overview?.pipeline?.[status.key] || 0 }}</div>
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
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          v-for="dept in sortedDepartments"
          :key="dept.type"
          class="cursor-pointer transition-colors hover:border-primary/50"
          @click="navigateToEnquiries(dept.type)"
        >
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <div class="flex items-center gap-2">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg"
                :class="getDeptBgClass(dept.color)"
              >
                <component :is="getDeptIcon(dept.icon)" class="h-4 w-4" :class="getDeptTextClass(dept.color)" />
              </div>
              <CardTitle class="text-sm font-medium">{{ dept.label }}</CardTitle>
            </div>
            <Badge v-if="dept.new > 0" variant="destructive" class="h-5 px-1.5 text-[10px]">
              {{ dept.new }} new
            </Badge>
          </CardHeader>
          <CardContent>
            <div class="flex items-baseline justify-between">
              <div class="text-2xl font-bold">{{ dept.total }}</div>
              <div class="flex items-center gap-1 text-xs">
                <TrendingUp v-if="dept.weeklyChange > 0" class="h-3 w-3 text-green-500" />
                <TrendingDown v-else-if="dept.weeklyChange < 0" class="h-3 w-3 text-red-500" />
                <span :class="getTrendClass(dept.weeklyChange)">
                  {{ formatTrend(dept.weeklyChange) }}
                </span>
              </div>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs text-muted-foreground">
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
    <div class="grid gap-6 lg:grid-cols-3">
      <Card class="lg:col-span-2">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Enquiry Trends</CardTitle>
              <CardDescription>Last 14 days activity</CardDescription>
            </div>
            <div class="flex gap-1">
              <Button
                v-for="chartType in chartTypes"
                :key="chartType.value"
                variant="ghost"
                size="sm"
                :class="{ 'bg-muted': selectedChartType === chartType.value }"
                @click="selectedChartType = chartType.value"
              >
                {{ chartType.label }}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="h-[280px]">
            <div v-if="data?.dailyTrend?.length" class="flex h-full items-end gap-1">
              <div
                v-for="day in data.dailyTrend"
                :key="day.date"
                class="group relative flex-1"
              >
                <div
                  class="w-full rounded-t bg-primary/80 transition-colors hover:bg-primary"
                  :style="{ height: `${getBarHeight(day)}%`, minHeight: day.total > 0 ? '4px' : '0' }"
                />
                <div class="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block">
                  {{ day.total }} enquiries
                </div>
                <div class="mt-1 text-center text-[10px] text-muted-foreground">
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

      <Card>
        <CardHeader>
          <CardTitle>Response Performance</CardTitle>
          <CardDescription>This month's metrics</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Avg Response Time</span>
              <span class="font-semibold">
                {{ data?.responseMetrics?.avgHours ? formatResponseTime(data.responseMetrics.avgHours) : 'N/A' }}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Median Response</span>
              <span class="font-semibold">
                {{ data?.responseMetrics?.medianHours ? formatResponseTime(data.responseMetrics.medianHours) : 'N/A' }}
              </span>
            </div>
          </div>

          <Separator />

          <div class="space-y-3">
            <div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Responded within 1 hour</span>
                <span class="font-semibold">{{ data?.responseMetrics?.within1hRate || 0 }}%</span>
              </div>
              <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full bg-green-500 transition-all"
                  :style="{ width: `${data?.responseMetrics?.within1hRate || 0}%` }"
                />
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Responded within 24 hours</span>
                <span class="font-semibold">{{ data?.responseMetrics?.within24hRate || 0 }}%</span>
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
                class="flex items-center justify-between text-sm"
              >
                <span class="capitalize text-muted-foreground">{{ source.source }}</span>
                <Badge variant="secondary">{{ source.count }}</Badge>
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import {
  getTrendClass, formatTrend, formatResponseTime, getConversionBarClass,
  formatChartDate, formatCurrency, getTargetProgress, getTargetProgressClass,
  getDeptBgClass, getDeptTextClass,
} from '~/utils/dashboardFormat';
import type { DashboardData } from './types';

const props = defineProps<{ data: DashboardData }>();

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

function getBarHeight(day: { total: number }): number {
  if (!props.data?.dailyTrend) return 0;
  const maxTotal = Math.max(...props.data.dailyTrend.map((d: any) => d.total), 1);
  return (day.total / maxTotal) * 100;
}

function navigateToEnquiries(type: string) {
  navigateTo(`/admin/enquiries?type=${type}`);
}
</script>
