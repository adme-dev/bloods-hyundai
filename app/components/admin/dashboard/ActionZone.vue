<template>
  <div class="grid min-w-0 gap-6 lg:grid-cols-2">
    <!-- Hot Leads -->
    <Card id="hot-leads-card" class="crm-queue-card">
      <CardHeader>
        <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
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
        <div v-if="data?.hotLeads?.length" class="dashboard-action-list divide-y">
          <div
            v-for="lead in data.hotLeads.slice(0, 5)"
            :key="lead.id"
            class="dashboard-action-row flex min-w-0 flex-col items-stretch gap-3 px-4 py-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6"
          >
            <NuxtLink class="dashboard-record-link" :to="`/admin/enquiries/${lead.id}`">
              <span class="sr-only">Open {{ lead.customer }} enquiry</span>
            </NuxtLink>
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <div class="dashboard-record-avatar relative shrink-0">
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
                  <span class="dashboard-record-date dashboard-record-date--mobile ml-auto whitespace-nowrap">{{ formatTimeAgo(lead.createdAt) }}</span>
                  <Badge v-if="lead.priority === 'urgent'" variant="destructive" class="shrink-0 text-[10px]">Urgent</Badge>
                  <Badge v-else-if="lead.priority === 'high'" variant="default" class="shrink-0 text-[10px]">High</Badge>
                </div>
                <div v-if="lead.vehicle" class="dashboard-record-subject truncate">{{ lead.vehicle }}</div>
                <div v-if="lead.variant" class="dashboard-record-preview truncate">{{ lead.variant }}</div>
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
            <div class="dashboard-action-row__actions flex shrink-0 items-center justify-between gap-3 pl-12 sm:flex-col sm:items-end sm:gap-1.5 sm:pl-0">
              <span class="dashboard-record-date dashboard-record-date--desktop whitespace-nowrap">{{ formatTimeAgo(lead.createdAt) }}</span>
              <Button variant="outline" size="sm" class="dashboard-record-action" as-child>
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
    <Card class="crm-queue-card" :class="data?.followUpAlerts?.overdueEnquiries?.length ? 'border-red-200 dark:border-red-900' : ''">
      <CardHeader>
        <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
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
        <div v-if="data?.followUpAlerts?.overdueEnquiries?.length" class="dashboard-action-list divide-y">
          <div
            v-for="enquiry in data.followUpAlerts.overdueEnquiries"
            :key="enquiry.id"
            class="dashboard-action-row dashboard-overdue-row flex min-w-0 flex-col items-stretch gap-3 px-4 py-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6"
          >
            <NuxtLink class="dashboard-record-link" :to="`/admin/enquiries/${enquiry.id}`">
              <span class="sr-only">Open {{ enquiry.customer }} overdue enquiry</span>
            </NuxtLink>
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <div class="dashboard-overdue-avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <Clock class="h-5 w-5 text-red-600" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="truncate font-medium">{{ enquiry.customer }}</span>
                  <span class="dashboard-overdue-wait dashboard-record-date--mobile ml-auto whitespace-nowrap">{{ enquiry.hoursWaiting }}h waiting</span>
                </div>
                <div v-if="enquiry.vehicle" class="dashboard-record-preview truncate">{{ enquiry.vehicle }}</div>
                <div class="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge variant="outline" class="shrink-0 text-[10px]">{{ enquiry.typeLabel }}</Badge>
                  <Badge variant="destructive" class="dashboard-overdue-wait--desktop shrink-0 text-[10px]">Waiting {{ enquiry.hoursWaiting }}h</Badge>
                </div>
              </div>
            </div>
            <Button variant="destructive" size="sm" class="dashboard-action-row__button ml-12 self-start sm:ml-0 sm:self-auto" as-child>
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
    <Card class="crm-queue-card">
      <CardHeader class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest enquiries across all departments</CardDescription>
        </div>
        <Button variant="outline" size="sm" as-child>
          <NuxtLink to="/admin/enquiries">View all</NuxtLink>
        </Button>
      </CardHeader>
      <CardContent class="p-0">
        <div class="dashboard-action-list divide-y">
          <div
            v-for="enquiry in (data?.recentEnquiries || []).slice(0, 6)"
            :key="enquiry.id"
            class="dashboard-action-row dashboard-recent-row flex min-w-0 flex-col items-stretch gap-3 px-4 py-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6"
          >
            <NuxtLink class="dashboard-record-link" :to="`/admin/enquiries/${enquiry.id}`">
              <span class="sr-only">Open {{ enquiry.customer }} enquiry</span>
            </NuxtLink>
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <Avatar class="dashboard-recent-avatar h-9 w-9 shrink-0">
                <AvatarImage :src="getGravatarUrl(enquiry.email)" :alt="enquiry.customer" />
                <AvatarFallback>{{ getInitials(enquiry.customer) }}</AvatarFallback>
              </Avatar>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="truncate font-medium">{{ enquiry.customer }}</span>
                  <span class="dashboard-record-date dashboard-record-date--mobile ml-auto whitespace-nowrap">{{ formatTimeAgo(enquiry.createdAt) }}</span>
                </div>
                <div class="dashboard-record-subject truncate">{{ enquiry.typeLabel }}</div>
                <div class="dashboard-record-preview truncate">
                  <span v-if="enquiry.vehicle">{{ enquiry.vehicle }}</span>
                  <span v-else>{{ enquiry.email }}</span>
                </div>
                <div class="dashboard-recent-tags mt-1.5 hidden flex-wrap gap-1.5">
                  <Badge :variant="getStatusVariant(enquiry.status)">{{ formatStatus(enquiry.status) }}</Badge>
                </div>
              </div>
            </div>
            <div class="dashboard-record-meta flex min-w-0 shrink-0 items-center justify-between gap-2 pl-12 sm:justify-start sm:gap-3 sm:pl-0">
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
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

<style scoped>
.dashboard-action-list > * + * {
  border-top-color: var(--dashboard-line, hsl(var(--border)));
}

.dashboard-action-row {
  position: relative;
}

.dashboard-action-row::before {
  position: absolute;
  inset-block: 12px;
  left: 0;
  width: 2px;
  border-radius: 999px;
  background: transparent;
  content: "";
}

.dashboard-action-row:hover::before {
  background: var(--dashboard-accent, hsl(var(--primary)));
}

.dashboard-record-date {
  color: var(--dashboard-muted, hsl(var(--muted-foreground)));
  font-size: 12px;
  font-weight: 650;
}

.dashboard-record-date--mobile {
  display: none;
}

.dashboard-record-link {
  display: none;
}

.dashboard-record-subject {
  color: var(--dashboard-ink, hsl(var(--foreground)));
  font-size: 12px;
  font-weight: 600;
}

.dashboard-record-preview {
  margin-top: 2px;
  color: var(--dashboard-muted, hsl(var(--muted-foreground)));
  font-size: 11px;
}

@media (max-width: 639px) {
  .crm-queue-card :deep([data-slot="card-header"]) {
    padding: 1rem;
  }

  .crm-queue-card :deep([data-slot="card-content"]) {
    padding: 0 .75rem .75rem;
  }

  .dashboard-action-list {
    display: grid;
    gap: .625rem;
  }

  .dashboard-action-list > * + * {
    border-top: 1px solid var(--dashboard-line, hsl(var(--border)));
  }

  .dashboard-action-row {
    min-height: 0;
    gap: .5rem;
    border: 1px solid var(--dashboard-line, hsl(var(--border)));
    border-radius: 10px;
    padding: .875rem;
    background: var(--dashboard-surface, hsl(var(--background)));
    box-shadow: 0 1px 2px rgb(11 26 43 / 4%);
  }

  .dashboard-record-link {
    position: absolute;
    z-index: 1;
    display: block;
    inset: 0;
    border-radius: inherit;
  }

  .dashboard-record-link:focus-visible {
    outline: 2px solid var(--dashboard-accent, hsl(var(--ring)));
    outline-offset: 2px;
  }

  .dashboard-record-avatar,
  .dashboard-action-row__actions {
    display: none;
  }

  .dashboard-action-row > div {
    gap: 0;
  }

  .dashboard-action-row > div > div:last-child {
    width: 100%;
  }

  .dashboard-action-row::before {
    display: none;
  }

  .dashboard-action-row__button {
    width: 100%;
    min-width: 0;
    margin-left: 0;
  }

  .dashboard-record-action {
    min-width: 6.5rem;
    height: 2rem;
    background: transparent;
  }

  .dashboard-record-subject {
    margin-top: 5px;
    font-size: 12px;
    font-weight: 600;
  }

  .dashboard-record-preview {
    margin-top: 4px;
    font-size: 11.5px;
    line-height: 1.35;
  }

  .dashboard-record-date {
    color: var(--dashboard-ink-2, hsl(var(--foreground)));
    font-size: 11px;
    font-weight: 600;
  }

  .dashboard-record-date--mobile {
    display: inline;
  }

  .dashboard-record-date--desktop {
    display: none;
  }

  .dashboard-overdue-avatar,
  .dashboard-overdue-row .dashboard-action-row__button,
  .dashboard-overdue-wait--desktop {
    display: none;
  }

  .dashboard-overdue-wait {
    display: inline;
    color: var(--dashboard-crit, hsl(var(--destructive)));
    font-size: 11px;
    font-weight: 700;
  }

  .dashboard-recent-avatar,
  .dashboard-recent-row .dashboard-record-meta {
    display: none;
  }

  .dashboard-recent-tags {
    display: flex;
  }

  .dashboard-record-meta {
    width: 100%;
    padding: .625rem 0 0;
    border-top: 1px solid var(--dashboard-line, hsl(var(--border)));
  }

  .dashboard-action-row :deep(.h-9.w-9),
  .dashboard-action-row :deep(.h-10.w-10) {
    width: 2.25rem;
    height: 2.25rem;
  }

  .dashboard-action-row :deep(a),
  .dashboard-action-row :deep(button) {
    max-width: 100%;
  }

  .dashboard-action-row :deep(.truncate) {
    max-width: 100%;
  }
}
</style>
