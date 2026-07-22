<template>
  <div class="grid min-w-0 gap-6 lg:grid-cols-2">
    <!-- Hot Leads -->
    <Card id="hot-leads-card">
      <CardHeader class="grid grid-cols-[1fr_auto] items-start gap-2 max-sm:p-4">
        <div class="min-w-0">
          <CardTitle class="flex items-center gap-2">
            <Flame class="h-5 w-5 text-orange-500" />
            Hot Leads
          </CardTitle>
          <CardDescription>High-priority leads with buying signals</CardDescription>
        </div>
        <CardAction>
          <Button variant="outline" size="sm" as-child>
            <NuxtLink to="/admin/enquiries?priority=high,urgent">View All</NuxtLink>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent class="p-0 max-sm:px-3 max-sm:pb-3">
        <div v-if="data?.hotLeads?.length" class="divide-y max-sm:grid max-sm:gap-2.5 max-sm:divide-y-0">
          <div
            v-for="lead in data.hotLeads.slice(0, 5)"
            :key="lead.id"
            class="group relative flex min-w-0 flex-col items-stretch gap-2 rounded-[10px] border bg-background p-3.5 shadow-sm transition-colors hover:bg-muted/50 sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-6 sm:py-4 sm:shadow-none md:flex-row md:items-center md:justify-between md:gap-4 before:absolute before:inset-y-3 before:left-0 before:hidden before:w-0.5 before:rounded-full before:bg-transparent before:content-[''] hover:before:bg-primary sm:before:block"
          >
            <NuxtLink class="absolute inset-0 z-[1] block rounded-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:hidden" :to="`/admin/enquiries/${lead.id}`">
              <span class="sr-only">Open {{ lead.customer }} enquiry</span>
            </NuxtLink>
            <div class="flex min-w-0 flex-1 items-center gap-0 sm:gap-3">
              <div class="relative hidden shrink-0 sm:block">
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
                  <span class="ml-auto whitespace-nowrap text-[11px] font-semibold text-foreground sm:hidden">{{ formatTimeAgo(lead.createdAt) }}</span>
                  <Badge v-if="lead.priority === 'urgent'" variant="destructive" class="shrink-0 text-[10px]">Urgent</Badge>
                  <Badge v-else-if="lead.priority === 'high'" variant="default" class="shrink-0 text-[10px]">High</Badge>
                </div>
                <div v-if="lead.vehicle" class="mt-[5px] truncate text-xs font-semibold text-foreground sm:mt-0">{{ lead.vehicle }}</div>
                <div v-if="lead.variant" class="mt-1 truncate text-[11.5px] leading-[1.35] text-muted-foreground sm:mt-0.5 sm:text-[11px]">{{ lead.variant }}</div>
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
            <div class="hidden shrink-0 items-center justify-between gap-3 pl-12 sm:flex sm:flex-col sm:items-end sm:gap-1.5 sm:pl-0">
              <span class="whitespace-nowrap text-xs font-semibold text-muted-foreground">{{ formatTimeAgo(lead.createdAt) }}</span>
              <Button variant="outline" size="sm" class="h-8 min-w-[6.5rem] bg-transparent" as-child>
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
      <CardHeader class="grid grid-cols-[1fr_auto] items-start gap-2 max-sm:p-4">
        <div class="min-w-0">
          <CardTitle class="flex items-center gap-2" :class="data?.followUpAlerts?.overdueEnquiries?.length ? 'text-red-600' : ''">
            <Clock class="h-5 w-5" />
            Overdue Responses
          </CardTitle>
          <CardDescription>Leads waiting over 24 hours</CardDescription>
        </div>
        <CardAction>
          <Badge v-if="data?.followUpAlerts?.overdue" variant="destructive">{{ data.followUpAlerts.overdue }} overdue</Badge>
        </CardAction>
      </CardHeader>
      <CardContent class="p-0 max-sm:px-3 max-sm:pb-3">
        <div v-if="data?.followUpAlerts?.overdueEnquiries?.length" class="divide-y max-sm:grid max-sm:gap-2.5 max-sm:divide-y-0">
          <div
            v-for="enquiry in data.followUpAlerts.overdueEnquiries"
            :key="enquiry.id"
            class="group relative flex min-w-0 flex-col items-stretch gap-2 rounded-[10px] border bg-background p-3.5 shadow-sm transition-colors hover:bg-muted/50 sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-6 sm:py-4 sm:shadow-none md:flex-row md:items-center md:justify-between md:gap-4 before:absolute before:inset-y-3 before:left-0 before:hidden before:w-0.5 before:rounded-full before:bg-transparent before:content-[''] hover:before:bg-primary sm:before:block"
          >
            <NuxtLink class="absolute inset-0 z-[1] block rounded-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:hidden" :to="`/admin/enquiries/${enquiry.id}`">
              <span class="sr-only">Open {{ enquiry.customer }} overdue enquiry</span>
            </NuxtLink>
            <div class="flex min-w-0 flex-1 items-center gap-0 sm:gap-3">
              <div class="hidden size-10 shrink-0 items-center justify-center rounded-full bg-red-100 sm:flex dark:bg-red-900">
                <Clock class="h-5 w-5 text-red-600" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="truncate font-medium">{{ enquiry.customer }}</span>
                  <span class="ml-auto whitespace-nowrap text-[11px] font-bold text-destructive sm:hidden">{{ enquiry.hoursWaiting }}h waiting</span>
                </div>
                <div v-if="enquiry.vehicle" class="mt-1 truncate text-[11.5px] leading-[1.35] text-muted-foreground sm:mt-0.5 sm:text-[11px]">{{ enquiry.vehicle }}</div>
                <div class="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge variant="outline" class="shrink-0 text-[10px]">{{ enquiry.typeLabel }}</Badge>
                  <Badge variant="destructive" class="hidden shrink-0 text-[10px] sm:inline-flex">Waiting {{ enquiry.hoursWaiting }}h</Badge>
                </div>
              </div>
            </div>
            <Button variant="destructive" size="sm" class="ml-12 hidden self-start sm:ml-0 sm:inline-flex sm:self-auto" as-child>
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
        <Button variant="secondary" class="w-full justify-start" as-child>
          <NuxtLink to="/admin/settings/lead-sources">
            <MailPlus class="mr-2 h-4 w-4" /> Lead source setup
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
      <CardHeader class="grid grid-cols-[1fr_auto] items-start gap-2 max-sm:p-4">
        <div class="min-w-0">
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest enquiries across all departments</CardDescription>
        </div>
        <CardAction><Button variant="outline" size="sm" as-child><NuxtLink to="/admin/enquiries">View all</NuxtLink></Button></CardAction>
      </CardHeader>
      <CardContent class="p-0 max-sm:px-3 max-sm:pb-3">
        <div class="divide-y max-sm:grid max-sm:gap-2.5 max-sm:divide-y-0">
          <div
            v-for="enquiry in (data?.recentEnquiries || []).slice(0, 6)"
            :key="enquiry.id"
            class="group relative flex min-w-0 flex-col items-stretch gap-2 rounded-[10px] border bg-background p-3.5 shadow-sm transition-colors hover:bg-muted/50 sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-6 sm:py-4 sm:shadow-none md:flex-row md:items-center md:justify-between md:gap-4 before:absolute before:inset-y-3 before:left-0 before:hidden before:w-0.5 before:rounded-full before:bg-transparent before:content-[''] hover:before:bg-primary sm:before:block"
          >
            <NuxtLink class="absolute inset-0 z-[1] block rounded-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:hidden" :to="`/admin/enquiries/${enquiry.id}`">
              <span class="sr-only">Open {{ enquiry.customer }} enquiry</span>
            </NuxtLink>
            <div class="flex min-w-0 flex-1 items-center gap-0 sm:gap-3">
              <Avatar class="hidden h-9 w-9 shrink-0 sm:flex">
                <AvatarImage :src="getGravatarUrl(enquiry.email)" :alt="enquiry.customer" />
                <AvatarFallback>{{ getInitials(enquiry.customer) }}</AvatarFallback>
              </Avatar>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="truncate font-medium">{{ enquiry.customer }}</span>
                  <span class="ml-auto whitespace-nowrap text-[11px] font-semibold text-foreground sm:hidden">{{ formatTimeAgo(enquiry.createdAt) }}</span>
                </div>
                <div class="mt-[5px] truncate text-xs font-semibold text-foreground sm:mt-0">{{ enquiry.typeLabel }}</div>
                <div class="mt-1 truncate text-[11.5px] leading-[1.35] text-muted-foreground sm:mt-0.5 sm:text-[11px]">
                  <span v-if="enquiry.vehicle">{{ enquiry.vehicle }}</span>
                  <span v-else>{{ enquiry.email }}</span>
                </div>
                <div class="mt-1.5 flex flex-wrap gap-1.5 sm:hidden">
                  <Badge :variant="getStatusVariant(enquiry.status)">{{ formatStatus(enquiry.status) }}</Badge>
                </div>
              </div>
            </div>
            <div class="hidden min-w-0 shrink-0 items-center justify-between gap-2 pl-12 sm:flex sm:justify-start sm:gap-3 sm:pl-0">
              <Badge :variant="getStatusVariant(enquiry.status)">
                {{ formatStatus(enquiry.status) }}
              </Badge>
              <span class="shrink-0 text-xs text-muted-foreground">
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
  HeartCrack, Users, GitBranch, Settings, Target, Mail, MailPlus, ArrowRight,
} from 'lucide-vue-next';
import { Card, CardAction, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { getGravatarUrl } from '~/utils/gravatar';
import {
  getDashboardInitials, getLeadScoreClass, formatDashboardCurrency, formatTimeAgo,
  getStatusVariant, formatStatus,
} from '~/utils/dashboardFormat';
import type { DashboardData } from './types';

defineProps<{ data: DashboardData }>();

const getInitials = getDashboardInitials;
const formatCurrency = formatDashboardCurrency;
</script>
