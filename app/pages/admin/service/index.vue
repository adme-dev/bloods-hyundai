<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Service Department</h1>
        <p class="text-sm text-muted-foreground">Manage service appointments and workshop schedule</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" @click="refresh()">
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': pending }" />
          Refresh
        </Button>
        <Button as-child>
          <NuxtLink to="/admin/service/appointments">
            <Calendar class="mr-2 h-4 w-4" /> View Calendar
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Overdue Alert -->
    <div v-if="data.overdueCount > 0" class="rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30 p-4">
      <div class="flex items-start gap-3">
        <AlertTriangle class="h-5 w-5 text-amber-500 mt-0.5" />
        <div class="flex-1">
          <h3 class="font-semibold text-amber-800 dark:text-amber-200">Overdue Appointments</h3>
          <p class="text-sm text-amber-700 dark:text-amber-300">
            {{ data.overdueCount }} appointments are past their scheduled date and need attention
          </p>
        </div>
        <Button variant="outline" size="sm" as-child class="border-amber-500 text-amber-700 hover:bg-amber-100">
          <NuxtLink to="/admin/service/appointments?status=pending">
            Review <ArrowRight class="ml-1 h-4 w-4" />
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Pending Enquiries Alert -->
    <div v-if="data.pendingEnquiries > 0" class="rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 p-4">
      <div class="flex items-start gap-3">
        <Inbox class="h-5 w-5 text-blue-500 mt-0.5" />
        <div class="flex-1">
          <h3 class="font-semibold text-blue-800 dark:text-blue-200">New Service Enquiries</h3>
          <p class="text-sm text-blue-700 dark:text-blue-300">
            {{ data.pendingEnquiries }} service booking requests waiting to be confirmed
          </p>
        </div>
        <Button variant="outline" size="sm" as-child class="border-blue-500 text-blue-700 hover:bg-blue-100">
          <NuxtLink to="/admin/enquiries?type=service&status=new">
            View Enquiries <ArrowRight class="ml-1 h-4 w-4" />
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Today's Overview -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Today's Total</CardTitle>
          <Calendar class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data.today.total || 0 }}</div>
          <p class="text-xs text-muted-foreground">Scheduled appointments</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Pending</CardTitle>
          <Clock class="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold text-amber-600">{{ data.today.pending || 0 }}</div>
          <p class="text-xs text-muted-foreground">Awaiting confirmation</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">In Progress</CardTitle>
          <Wrench class="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold text-blue-600">{{ data.today.inProgress || 0 }}</div>
          <p class="text-xs text-muted-foreground">Currently being serviced</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Completed</CardTitle>
          <CheckCircle class="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold text-green-600">{{ data.today.completed || 0 }}</div>
          <p class="text-xs text-muted-foreground">Finished today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">This Week</CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data.week.total || 0 }}</div>
          <p class="text-xs text-muted-foreground">
            {{ data.week.completionRate || 0 }}% completion rate
          </p>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Today's Appointments -->
      <Card class="lg:col-span-2">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>{{ formatDate(new Date()) }}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" as-child>
              <NuxtLink to="/admin/service/appointments">
                View All <ChevronRight class="ml-1 h-4 w-4" />
              </NuxtLink>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="!data.today.appointments.length" class="py-8 text-center text-muted-foreground">
            <Calendar class="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No appointments scheduled for today</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="apt in data.today.appointments"
              :key="apt.id"
              class="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
              @click="navigateTo(`/admin/service/appointments/${apt.id}`)"
            >
              <div class="flex-shrink-0 w-16 text-center">
                <div class="text-lg font-semibold">{{ apt.time || 'TBD' }}</div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium truncate">{{ apt.customer }}</span>
                  <Badge :variant="getStatusVariant(apt.status)" class="capitalize">
                    {{ apt.status.replace('_', ' ') }}
                  </Badge>
                  <Badge v-if="apt.priority === 'high'" variant="destructive" class="text-xs">
                    High Priority
                  </Badge>
                </div>
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <Car class="h-3.5 w-3.5" />
                  <span class="truncate">{{ apt.vehicle }}</span>
                  <span class="text-xs bg-muted px-1.5 py-0.5 rounded">{{ apt.registration }}</span>
                </div>
                <div class="text-xs text-muted-foreground mt-1">
                  {{ apt.serviceType }}
                  <span v-if="apt.technician" class="ml-2">
                    | <User class="inline h-3 w-3" /> {{ apt.technician }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button v-if="apt.status === 'confirmed'" size="sm" @click.stop="startService(apt.id)">
                  Start
                </Button>
                <Button v-if="apt.status === 'in_progress'" size="sm" variant="outline" @click.stop="completeService(apt.id)">
                  Complete
                </Button>
                <ChevronRight class="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Technician Workload -->
      <Card>
        <CardHeader>
          <CardTitle>Technician Workload</CardTitle>
          <CardDescription>Today's assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="!data.technicianWorkload.length" class="py-8 text-center text-muted-foreground">
            <Users class="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No technicians available</p>
          </div>
          <div v-else class="space-y-4">
            <div v-for="tech in data.technicianWorkload" :key="tech.id" class="space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User class="h-4 w-4 text-primary" />
                  </div>
                  <span class="font-medium">{{ tech.name }}</span>
                </div>
                <span class="text-sm text-muted-foreground">
                  {{ tech.todayCompleted }}/{{ tech.todayAssigned }}
                </span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full bg-primary transition-all"
                  :style="{ width: `${tech.todayAssigned > 0 ? (tech.todayCompleted / tech.todayAssigned) * 100 : 0}%` }"
                />
              </div>
              <p class="text-xs text-muted-foreground">
                {{ tech.weekTotal }} total this week
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Upcoming Appointments -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="!data.upcoming.length" class="py-6 text-center text-muted-foreground">
            <p>No upcoming appointments</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="apt in data.upcoming"
              :key="apt.id"
              class="flex items-center gap-3 py-2 border-b last:border-0"
            >
              <div class="flex-shrink-0 text-center w-16">
                <div class="text-xs text-muted-foreground">{{ formatShortDate(apt.date) }}</div>
                <div class="text-sm font-medium">{{ apt.time || 'TBD' }}</div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ apt.customer }}</div>
                <div class="text-sm text-muted-foreground truncate">
                  {{ apt.vehicle }} · {{ apt.registration }}
                </div>
              </div>
              <Badge :variant="getStatusVariant(apt.status)" class="capitalize text-xs">
                {{ apt.status }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Service Types -->
      <Card>
        <CardHeader>
          <CardTitle>Service Breakdown</CardTitle>
          <CardDescription>This month by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="!data.serviceTypes.length" class="py-6 text-center text-muted-foreground">
            <p>No service data available</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="service in data.serviceTypes" :key="service.type" class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium">{{ service.type }}</span>
                <span class="text-muted-foreground">
                  {{ service.completed }}/{{ service.count }} completed
                </span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full bg-green-500 transition-all"
                  :style="{ width: `${service.count > 0 ? (service.completed / service.count) * 100 : 0}%` }"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  RefreshCw,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Inbox,
  Clock,
  Wrench,
  CheckCircle,
  TrendingUp,
  ChevronRight,
  Car,
  User,
  Users,
} from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

definePageMeta({
  layout: 'admin',
})

type DashboardAppointment = {
  id: string
  time?: string | null
  customer?: string | null
  vehicle?: string | null
  registration?: string | null
  serviceType?: string | null
  technician?: string | null
  status: string
  priority?: string | null
  date?: string | Date
}

type TechnicianWorkload = {
  id: string
  name: string
  todayCompleted: number
  todayAssigned: number
  weekTotal: number
}

type ServiceTypeSummary = {
  type: string
  completed: number
  count: number
}

type ServiceDashboardResponse = {
  overdueCount: number
  pendingEnquiries: number
  today: {
    total: number
    pending: number
    inProgress: number
    completed: number
    appointments: DashboardAppointment[]
  }
  week: {
    total: number
    completionRate: number
  }
  technicianWorkload: TechnicianWorkload[]
  upcoming: Array<DashboardAppointment & { date: string | Date }>
  serviceTypes: ServiceTypeSummary[]
}

const emptyDashboard: ServiceDashboardResponse = {
  overdueCount: 0,
  pendingEnquiries: 0,
  today: {
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    appointments: [],
  },
  week: {
    total: 0,
    completionRate: 0,
  },
  technicianWorkload: [],
  upcoming: [],
  serviceTypes: [],
}

const { data: dashboardData, pending, refresh } = await useFetch<ServiceDashboardResponse>('/api/admin/service/dashboard', {
  headers: useRequestHeaders(['cookie']),
  default: () => emptyDashboard,
})
const data = computed(() => dashboardData.value || emptyDashboard)

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatShortDate = (dateStr: string | Date) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending':
      return 'secondary'
    case 'confirmed':
      return 'default'
    case 'in_progress':
      return 'default'
    case 'completed':
      return 'default'
    case 'cancelled':
      return 'destructive'
    default:
      return 'secondary'
  }
}

const startService = async (id: string) => {
  await $fetch(`/api/admin/service/appointments/${id}/status`, {
    method: 'PATCH',
    body: { status: 'in_progress' },
  })
  refresh()
}

const completeService = async (id: string) => {
  await $fetch(`/api/admin/service/appointments/${id}/status`, {
    method: 'PATCH',
    body: { status: 'completed' },
  })
  refresh()
}
</script>
