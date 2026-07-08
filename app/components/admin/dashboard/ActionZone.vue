<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Hot Leads -->
    <Card id="hot-leads-card">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="flex items-center gap-2">
              <Flame class="h-5 w-5 text-orange-500" />
              Hot Leads
            </CardTitle>
            <CardDescription>High-priority leads with buying signals</CardDescription>
          </div>
          <Button variant="outline" size="sm" as-child>
            <NuxtLink to="/admin/enquiries?priority=high,urgent">View All</NuxtLink>
          </Button>
        </div>
      </CardHeader>
      <CardContent class="p-0">
        <div v-if="data?.hotLeads?.length" class="divide-y">
          <div
            v-for="lead in data.hotLeads.slice(0, 5)"
            :key="lead.id"
            class="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
          >
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <div class="relative shrink-0">
                <Avatar class="h-9 w-9">
                  <AvatarImage :src="getGravatarUrl(lead.email)" :alt="lead.customer" />
                  <AvatarFallback>{{ getInitials(lead.customer) }}</AvatarFallback>
                </Avatar>
                <div
                  class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  :class="getLeadScoreClass(lead.score)"
                >
                  {{ lead.score }}
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="truncate font-medium">{{ lead.customer }}</span>
                  <Badge v-if="lead.priority === 'urgent'" variant="destructive" class="shrink-0 text-[10px]">Urgent</Badge>
                  <Badge v-else-if="lead.priority === 'high'" variant="default" class="shrink-0 text-[10px]">High</Badge>
                </div>
                <div v-if="lead.vehicle || lead.variant" class="truncate text-xs text-muted-foreground">
                  <span v-if="lead.vehicle" class="font-medium">{{ lead.vehicle }}</span>
                  <span v-if="lead.vehicle && lead.variant"> · </span>
                  <span v-if="lead.variant" class="text-muted-foreground/70">{{ lead.variant }}</span>
                </div>
                <div class="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge v-if="lead.signals?.testDrive" variant="outline" class="text-[10px] gap-1">
                    <CalendarCheck class="h-3 w-3" /> Test Drive
                  </Badge>
                  <Badge v-if="lead.signals?.financeInterest" variant="outline" class="text-[10px] gap-1">
                    <DollarSign class="h-3 w-3" /> Finance
                  </Badge>
                  <Badge v-if="lead.signals?.hasAccessories" variant="outline" class="text-[10px] gap-1">
                    <Package class="h-3 w-3" /> +${{ formatCurrency(lead.signals?.accessoriesValue) }}
                  </Badge>
                </div>
              </div>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-1.5">
              <span class="whitespace-nowrap text-xs text-muted-foreground">{{ formatTimeAgo(lead.createdAt) }}</span>
              <Button variant="default" size="sm" as-child>
                <NuxtLink :to="`/admin/enquiries/${lead.id}`">
                  <Phone class="mr-1 h-3 w-3" /> Contact
                </NuxtLink>
              </Button>
            </div>
          </div>
        </div>
        <p v-else class="py-6 text-center text-sm text-muted-foreground">No hot leads right now</p>
      </CardContent>
    </Card>

    <!-- Overdue Responses -->
    <Card :class="data?.followUpAlerts?.overdueEnquiries?.length ? 'border-red-200 dark:border-red-900' : ''">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="flex items-center gap-2" :class="data?.followUpAlerts?.overdueEnquiries?.length ? 'text-red-600' : ''">
              <Clock class="h-5 w-5" />
              Overdue Responses
            </CardTitle>
            <CardDescription>Leads waiting over 24 hours</CardDescription>
          </div>
          <Badge v-if="data?.followUpAlerts?.overdue" variant="destructive">{{ data.followUpAlerts.overdue }} overdue</Badge>
        </div>
      </CardHeader>
      <CardContent class="p-0">
        <div v-if="data?.followUpAlerts?.overdueEnquiries?.length" class="divide-y">
          <div
            v-for="enquiry in data.followUpAlerts.overdueEnquiries"
            :key="enquiry.id"
            class="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
          >
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <Clock class="h-5 w-5 text-red-600" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="truncate font-medium">{{ enquiry.customer }}</span>
                  <Badge variant="outline" class="shrink-0 text-[10px]">{{ enquiry.typeLabel }}</Badge>
                </div>
                <div class="truncate text-xs text-muted-foreground">
                  <span v-if="enquiry.vehicle">{{ enquiry.vehicle }} • </span>
                  <span class="text-red-600 font-semibold">Waiting {{ enquiry.hoursWaiting }}h</span>
                </div>
              </div>
            </div>
            <Button variant="destructive" size="sm" as-child>
              <NuxtLink :to="`/admin/enquiries/${enquiry.id}`">
                Respond Now
              </NuxtLink>
            </Button>
          </div>
        </div>
        <p v-else class="py-6 text-center text-sm text-muted-foreground">Nothing overdue — nice work</p>
      </CardContent>
    </Card>

    <!-- Quick Actions -->
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common admin tasks</CardDescription>
      </CardHeader>
      <CardContent class="space-y-2">
        <Button variant="secondary" class="w-full justify-start" as-child>
          <NuxtLink to="/admin/enquiries?status=new_lead">
            <Inbox class="mr-2 h-4 w-4" />
            Review new enquiries
            <Badge v-if="data?.overview?.pipeline?.newLead" variant="destructive" class="ml-auto">
              {{ data.overview.pipeline.newLead }}
            </Badge>
          </NuxtLink>
        </Button>
        <Button variant="secondary" class="w-full justify-start" as-child>
          <NuxtLink to="/admin/enquiries?assigned=unassigned">
            <UserPlus class="mr-2 h-4 w-4" />
            Assign pending enquiries
            <Badge v-if="data?.overview?.pipeline?.unassigned" variant="outline" class="ml-auto">
              {{ data.overview.pipeline.unassigned }}
            </Badge>
          </NuxtLink>
        </Button>
        <Button variant="secondary" class="w-full justify-start" as-child>
          <NuxtLink to="/admin/customers?view=at_risk">
            <HeartCrack class="mr-2 h-4 w-4" />
            At-risk customers
            <Badge v-if="data?.customerRetention?.atRisk" variant="destructive" class="ml-auto">
              {{ data.customerRetention.atRisk }}
            </Badge>
          </NuxtLink>
        </Button>
        <Button variant="secondary" class="w-full justify-start" as-child>
          <NuxtLink to="/admin/staff">
            <Users class="mr-2 h-4 w-4" /> Manage team roster
          </NuxtLink>
        </Button>
        <Button variant="secondary" class="w-full justify-start" as-child>
          <NuxtLink to="/admin/settings/routing">
            <GitBranch class="mr-2 h-4 w-4" /> Routing rules
          </NuxtLink>
        </Button>
        <Separator class="my-2" />
        <Button variant="outline" class="w-full justify-start" as-child>
          <NuxtLink to="/admin/settings">
            <Settings class="mr-2 h-4 w-4" /> Account settings
          </NuxtLink>
        </Button>
        <Button variant="outline" class="w-full justify-start" as-child>
          <NuxtLink to="/admin/settings/targets">
            <Target class="mr-2 h-4 w-4" /> Sales targets
          </NuxtLink>
        </Button>
        <Button variant="outline" class="w-full justify-start" as-child>
          <NuxtLink to="/admin/settings/email">
            <Mail class="mr-2 h-4 w-4" /> Email configuration
          </NuxtLink>
        </Button>
      </CardContent>
    </Card>

    <!-- Recent Activity -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest enquiries across all departments</CardDescription>
        </div>
        <Button variant="outline" size="sm" as-child>
          <NuxtLink to="/admin/enquiries">View all</NuxtLink>
        </Button>
      </CardHeader>
      <CardContent class="p-0">
        <div class="divide-y">
          <div
            v-for="enquiry in (data?.recentEnquiries || []).slice(0, 6)"
            :key="enquiry.id"
            class="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
          >
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <Avatar class="h-9 w-9 shrink-0">
                <AvatarImage :src="getGravatarUrl(enquiry.email)" :alt="enquiry.customer" />
                <AvatarFallback>{{ getInitials(enquiry.customer) }}</AvatarFallback>
              </Avatar>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="truncate font-medium">{{ enquiry.customer }}</span>
                  <Badge variant="outline" class="shrink-0 text-[10px]">{{ enquiry.typeLabel }}</Badge>
                </div>
                <div class="truncate text-xs text-muted-foreground">
                  <span>{{ enquiry.email }}</span>
                  <span v-if="enquiry.vehicle"> • {{ enquiry.vehicle }}</span>
                </div>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-3">
              <Badge :variant="getStatusVariant(enquiry.status)">
                {{ formatStatus(enquiry.status) }}
              </Badge>
              <span class="text-xs text-muted-foreground">
                {{ formatTimeAgo(enquiry.createdAt) }}
              </span>
              <Button variant="ghost" size="icon" as-child>
                <NuxtLink :to="`/admin/enquiries/${enquiry.id}`">
                  <ArrowRight class="h-4 w-4" />
                </NuxtLink>
              </Button>
            </div>
          </div>
          <p v-if="!data?.recentEnquiries?.length" class="py-6 text-center text-sm text-muted-foreground">No recent enquiries</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import {
  Flame, CalendarCheck, DollarSign, Package, Phone, Clock, Inbox, UserPlus,
  HeartCrack, Users, GitBranch, Settings, Target, Mail, ArrowRight,
} from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { getGravatarUrl } from '~/utils/gravatar';
import {
  getInitials, getLeadScoreClass, formatCurrency, formatTimeAgo,
  getStatusVariant, formatStatus,
} from '~/utils/dashboardFormat';
import type { DashboardData } from './types';

defineProps<{ data: DashboardData }>();
</script>
