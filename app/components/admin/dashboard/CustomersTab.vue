<template>
  <div class="space-y-6">
    <template v-if="data?.customerRetention">
      <!-- Retention Quick Stats -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card class="border-l-4 border-l-teal-500 cursor-pointer hover:border-teal-600 transition-colors" @click="navigateTo('/admin/customers')">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Customers</CardTitle>
            <UserCheck class="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-bold">{{ data.customerRetention.totalCustomers }}</div>
            <p class="text-xs text-muted-foreground">
              +{{ data.customerRetention.newThisMonth }} this month
            </p>
          </CardContent>
        </Card>

        <Card class="border-l-4 border-l-red-500 cursor-pointer hover:border-red-600 transition-colors" @click="navigateTo('/admin/customers?view=at_risk')">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">At-Risk Customers</CardTitle>
            <HeartCrack class="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-bold text-red-600">{{ data.customerRetention.atRisk }}</div>
            <p class="text-xs text-muted-foreground">
              <span v-if="data.customerRetention.critical > 0" class="text-red-600 font-semibold">
                {{ data.customerRetention.critical }} critical
              </span>
              <span v-else>Need attention</span>
            </p>
          </CardContent>
        </Card>

        <Card class="border-l-4 border-l-amber-500 cursor-pointer hover:border-amber-600 transition-colors" @click="navigateTo('/admin/customers?view=due_followup')">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Due Follow-ups</CardTitle>
            <ClipboardCheck class="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-bold text-amber-600">
              {{ data.customerRetention.tasksDueToday + data.customerRetention.overdueTasks }}
            </div>
            <p class="text-xs text-muted-foreground">
              <span v-if="data.customerRetention.overdueTasks > 0" class="text-red-600 font-semibold">
                {{ data.customerRetention.overdueTasks }} overdue
              </span>
              <span v-else>{{ data.customerRetention.tasksDueToday }} due today</span>
            </p>
          </CardContent>
        </Card>

        <Card class="border-l-4 border-l-orange-500 cursor-pointer hover:border-orange-600 transition-colors" @click="navigateTo('/admin/customers')">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">No Contact 30+ Days</CardTitle>
            <UserMinus class="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-bold text-orange-600">{{ data.customerRetention.noContactIn30Days }}</div>
            <p class="text-xs text-muted-foreground">Need re-engagement</p>
          </CardContent>
        </Card>
      </div>

      <!-- Deep Dive Row -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Lifecycle Funnel -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="flex items-center gap-2">
                  <GitMerge class="h-5 w-5 text-teal-500" />
                  Customer Lifecycle
                </CardTitle>
                <CardDescription>Journey stage distribution</CardDescription>
              </div>
              <Button variant="ghost" size="sm" as-child>
                <NuxtLink to="/admin/customers">View All</NuxtLink>
              </Button>
            </div>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="stage in lifecycleStagesOrdered"
              :key="stage.key"
              class="space-y-1"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" :class="getLifecycleColor(stage.key)" />
                  {{ stage.label }}
                </span>
                <span class="font-semibold">{{ getLifecycleCount(stage.key) }}</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full transition-all"
                  :class="getLifecycleColor(stage.key)"
                  :style="{ width: `${getLifecyclePercent(stage.key)}%` }"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Risk Segmentation -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="flex items-center gap-2">
                  <ShieldAlert class="h-5 w-5 text-red-500" />
                  Risk Analysis
                </CardTitle>
                <CardDescription>Customer health breakdown</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Risk Level</h4>
              <div class="grid grid-cols-4 gap-2">
                <div class="rounded-lg border bg-green-50 dark:bg-green-950/30 p-2 text-center cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors" @click="navigateTo('/admin/customers?riskLevel=low')">
                  <div class="text-lg font-bold text-green-600">{{ data.customerRetention.riskSegmentation?.byRiskLevel?.low || 0 }}</div>
                  <div class="text-[10px] text-muted-foreground">Low</div>
                </div>
                <div class="rounded-lg border bg-yellow-50 dark:bg-yellow-950/30 p-2 text-center cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-950/50 transition-colors" @click="navigateTo('/admin/customers?riskLevel=medium')">
                  <div class="text-lg font-bold text-yellow-600">{{ data.customerRetention.riskSegmentation?.byRiskLevel?.medium || 0 }}</div>
                  <div class="text-[10px] text-muted-foreground">Medium</div>
                </div>
                <div class="rounded-lg border bg-orange-50 dark:bg-orange-950/30 p-2 text-center cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors" @click="navigateTo('/admin/customers?riskLevel=high')">
                  <div class="text-lg font-bold text-orange-600">{{ data.customerRetention.riskSegmentation?.byRiskLevel?.high || 0 }}</div>
                  <div class="text-[10px] text-muted-foreground">High</div>
                </div>
                <div class="rounded-lg border bg-red-50 dark:bg-red-950/30 p-2 text-center cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors" @click="navigateTo('/admin/customers?riskLevel=critical')">
                  <div class="text-lg font-bold text-red-600">{{ data.customerRetention.riskSegmentation?.byRiskLevel?.critical || 0 }}</div>
                  <div class="text-[10px] text-muted-foreground">Critical</div>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Contact Gap</h4>
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-muted-foreground">90+ days (critical)</span>
                  <Badge variant="destructive">{{ data.customerRetention.riskSegmentation?.byContactGap?.noContact90Plus || 0 }}</Badge>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-muted-foreground">60-90 days</span>
                  <Badge variant="default">{{ data.customerRetention.riskSegmentation?.byContactGap?.noContact60to90 || 0 }}</Badge>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-muted-foreground">30-60 days</span>
                  <Badge variant="secondary">{{ data.customerRetention.riskSegmentation?.byContactGap?.noContact30to60 || 0 }}</Badge>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-dashed p-3">
              <div class="flex items-center justify-between">
                <div class="text-center flex-1">
                  <div class="text-2xl font-bold" :class="getEngagementScoreColor(data.customerRetention.riskSegmentation?.averages?.engagementScore)">
                    {{ data.customerRetention.riskSegmentation?.averages?.engagementScore || 0 }}
                  </div>
                  <div class="text-xs text-muted-foreground">Avg Engagement</div>
                </div>
                <Separator orientation="vertical" class="h-10" />
                <div class="text-center flex-1">
                  <div class="text-2xl font-bold" :class="getRiskScoreColor(data.customerRetention.riskSegmentation?.averages?.riskScore)">
                    {{ data.customerRetention.riskSegmentation?.averages?.riskScore || 0 }}
                  </div>
                  <div class="text-xs text-muted-foreground">Avg Risk Score</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Task Breakdown & Priority -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="flex items-center gap-2">
                  <ListTodo class="h-5 w-5 text-amber-500" />
                  Follow-up Tasks
                </CardTitle>
                <CardDescription>Task breakdown by type</CardDescription>
              </div>
              <Button variant="ghost" size="sm" as-child>
                <NuxtLink to="/admin/tasks">View All</NuxtLink>
              </Button>
            </div>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <div
                v-for="task in (data.customerRetention.taskBreakdown?.byType || []).slice(0, 5)"
                :key="task.type"
                class="flex items-center justify-between text-sm"
              >
                <span class="flex items-center gap-2">
                  <component :is="getTaskTypeIcon(task.type)" class="h-4 w-4 text-muted-foreground" />
                  {{ task.label }}
                </span>
                <div class="flex items-center gap-2">
                  <Badge v-if="task.overdue > 0" variant="destructive" class="text-[10px]">
                    {{ task.overdue }} overdue
                  </Badge>
                  <Badge variant="outline">{{ task.pending + task.inProgress }}</Badge>
                </div>
              </div>
              <div v-if="!data.customerRetention.taskBreakdown?.byType?.length" class="text-center text-sm text-muted-foreground py-4">
                No tasks scheduled
              </div>
            </div>

            <Separator />
            <div class="space-y-2">
              <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Priority</h4>
              <div class="grid grid-cols-4 gap-2">
                <div class="rounded bg-red-100 dark:bg-red-950/30 p-2 text-center">
                  <div class="text-lg font-bold text-red-600">{{ data.customerRetention.taskBreakdown?.byPriority?.urgent || 0 }}</div>
                  <div class="text-[10px] text-muted-foreground">Urgent</div>
                </div>
                <div class="rounded bg-orange-100 dark:bg-orange-950/30 p-2 text-center">
                  <div class="text-lg font-bold text-orange-600">{{ data.customerRetention.taskBreakdown?.byPriority?.high || 0 }}</div>
                  <div class="text-[10px] text-muted-foreground">High</div>
                </div>
                <div class="rounded bg-yellow-100 dark:bg-yellow-950/30 p-2 text-center">
                  <div class="text-lg font-bold text-yellow-600">{{ data.customerRetention.taskBreakdown?.byPriority?.medium || 0 }}</div>
                  <div class="text-[10px] text-muted-foreground">Medium</div>
                </div>
                <div class="rounded bg-gray-100 dark:bg-gray-800 p-2 text-center">
                  <div class="text-lg font-bold text-gray-600">{{ data.customerRetention.taskBreakdown?.byPriority?.low || 0 }}</div>
                  <div class="text-[10px] text-muted-foreground">Low</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- At-Risk List & Vehicle Interest -->
      <div class="grid gap-6 lg:grid-cols-2">
        <Card :class="data.customerRetention.atRiskCustomers?.length ? 'border-red-200 dark:border-red-900' : ''">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="flex items-center gap-2" :class="data.customerRetention.atRiskCustomers?.length ? 'text-red-600' : ''">
                  <AlertOctagon class="h-5 w-5" />
                  Priority At-Risk Customers
                </CardTitle>
                <CardDescription>Highest risk customers needing immediate attention</CardDescription>
              </div>
              <Button variant="outline" size="sm" as-child>
                <NuxtLink to="/admin/customers?view=at_risk">View All</NuxtLink>
              </Button>
            </div>
          </CardHeader>
          <CardContent class="p-0">
            <div v-if="data.customerRetention.atRiskCustomers?.length" class="divide-y">
              <div
                v-for="customer in data.customerRetention.atRiskCustomers"
                :key="customer.id"
                class="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="relative">
                    <Avatar class="h-9 w-9">
                      <AvatarImage :src="getGravatarUrl(customer.email)" :alt="customer.name" />
                      <AvatarFallback>{{ getInitials(customer.name) }}</AvatarFallback>
                    </Avatar>
                    <div
                      class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      :class="customer.riskLevel === 'critical' ? 'bg-red-500' : 'bg-orange-500'"
                    >
                      {{ customer.riskScore }}
                    </div>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{{ customer.name }}</span>
                      <Badge :variant="customer.riskLevel === 'critical' ? 'destructive' : 'default'" class="text-[10px]">
                        {{ customer.riskLevel }}
                      </Badge>
                    </div>
                    <div class="text-xs text-muted-foreground">
                      <span v-if="customer.daysSinceContact !== null">
                        Last contact: {{ customer.daysSinceContact }} days ago
                      </span>
                      <span v-else>Never contacted</span>
                      <span class="mx-1">•</span>
                      <span class="capitalize">{{ customer.lifecycleStage?.replace('_', ' ') }}</span>
                    </div>
                  </div>
                </div>
                <Button variant="destructive" size="sm" class="bg-red-600 text-white no-underline hover:bg-red-700 hover:text-white" as-child>
                  <NuxtLink :to="`/admin/customers/${customer.id}`">
                    <Phone class="mr-1 h-3 w-3" /> Contact
                  </NuxtLink>
                </Button>
              </div>
            </div>
            <p v-else class="py-6 text-center text-sm text-muted-foreground">No at-risk customers right now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="flex items-center gap-2">
                  <Car class="h-5 w-5 text-blue-500" />
                  Customer Vehicle Interest
                </CardTitle>
                <CardDescription>Top models customers are interested in</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-if="data.customerRetention.topVehicleInterests?.length" class="space-y-3">
              <div
                v-for="(interest, index) in data.customerRetention.topVehicleInterests"
                :key="interest.model"
                class="flex items-center gap-3"
              >
                <span class="w-5 text-sm font-bold text-muted-foreground">{{ index + 1 }}</span>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium">{{ interest.model }}</span>
                    <Badge variant="secondary">{{ interest.count }} customers</Badge>
                  </div>
                  <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      class="h-full rounded-full bg-blue-500 transition-all"
                      :style="{ width: `${getVehicleInterestPercent(interest.count)}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="py-6 text-center text-sm text-muted-foreground">No vehicle interest recorded yet</p>

            <Separator />
            <div class="space-y-2">
              <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Engagement Distribution</h4>
              <div class="grid grid-cols-3 gap-2">
                <div class="rounded-lg border bg-green-50 dark:bg-green-950/30 p-3 text-center">
                  <div class="text-xl font-bold text-green-600">{{ data.customerRetention.riskSegmentation?.byEngagement?.high || 0 }}</div>
                  <div class="text-xs text-muted-foreground">High (70+)</div>
                </div>
                <div class="rounded-lg border bg-yellow-50 dark:bg-yellow-950/30 p-3 text-center">
                  <div class="text-xl font-bold text-yellow-600">{{ data.customerRetention.riskSegmentation?.byEngagement?.medium || 0 }}</div>
                  <div class="text-xs text-muted-foreground">Medium (40-69)</div>
                </div>
                <div class="rounded-lg border bg-red-50 dark:bg-red-950/30 p-3 text-center">
                  <div class="text-xl font-bold text-red-600">{{ data.customerRetention.riskSegmentation?.byEngagement?.low || 0 }}</div>
                  <div class="text-xs text-muted-foreground">Low (&lt;40)</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
    <p v-else class="py-6 text-center text-sm text-muted-foreground">No customer retention data yet</p>
  </div>
</template>

<script setup lang="ts">
import {
  UserCheck, HeartCrack, ClipboardCheck, UserMinus, GitMerge, ShieldAlert,
  ListTodo, AlertOctagon, Car, Phone, PhoneCall, Mail as MailIcon,
  MessageSquareText, CalendarClock, Handshake, Bell,
} from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { getGravatarUrl } from '~/utils/gravatar';
import { getInitials } from '~/utils/dashboardFormat';
import { LIFECYCLE_STAGE_CONFIG } from '~~/shared/constants/salesFunnel';
import type { DashboardData } from './types';

const props = defineProps<{ data: DashboardData }>();

// Canonical lifecycle stages, ordered (replaces the retired list that
// contained the invalid 'purchased' stage).
const lifecycleStagesOrdered = Object.values(LIFECYCLE_STAGE_CONFIG)
  .sort((a, b) => a.order - b.order)
  .map((s) => ({ key: s.key as string, label: s.label }));

const lifecycleColors: Record<string, string> = {
  prospect: 'bg-slate-500',
  lead: 'bg-blue-500',
  opportunity: 'bg-cyan-500',
  test_drive: 'bg-purple-500',
  negotiating: 'bg-yellow-500',
  new_customer: 'bg-green-500',
  active_customer: 'bg-emerald-500',
  service_customer: 'bg-teal-500',
  at_risk: 'bg-orange-500',
  churning: 'bg-red-500',
  inactive: 'bg-gray-400',
  lost: 'bg-zinc-400',
};

function getLifecycleColor(stage: string): string {
  return lifecycleColors[stage] || 'bg-gray-400';
}

function getLifecycleCount(stage: string): number {
  if (!props.data?.customerRetention?.lifecycleDistribution) return 0;
  const found = props.data.customerRetention.lifecycleDistribution.find((d: any) => d.stage === stage);
  return found?.count || 0;
}

function getLifecyclePercent(stage: string): number {
  if (!props.data?.customerRetention?.totalCustomers) return 0;
  const count = getLifecycleCount(stage);
  return Math.round((count / props.data.customerRetention.totalCustomers) * 100);
}

function getEngagementScoreColor(score: number | undefined): string {
  if (!score) return 'text-gray-600';
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getRiskScoreColor(score: number | undefined): string {
  if (!score) return 'text-gray-600';
  if (score >= 70) return 'text-red-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-green-600';
}

function getTaskTypeIcon(type: string | null) {
  const icons: Record<string, any> = {
    follow_up: PhoneCall,
    call: PhoneCall,
    email: MailIcon,
    sms: MessageSquareText,
    meeting: Handshake,
    service_reminder: CalendarClock,
    trade_in_offer: Car,
    other: Bell,
  };
  return icons[type || 'other'] || Bell;
}

function getVehicleInterestPercent(count: number): number {
  if (!props.data?.customerRetention?.topVehicleInterests?.length) return 0;
  const maxCount = Math.max(...props.data.customerRetention.topVehicleInterests.map((i: any) => i.count), 1);
  return Math.round((count / maxCount) * 100);
}
</script>
