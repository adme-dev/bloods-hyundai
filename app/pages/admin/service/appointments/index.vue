<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Service Appointments</h1>
        <p class="text-sm text-muted-foreground">Manage all service bookings and appointments</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center border rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'bg-muted': viewMode === 'list' }"
            @click="viewMode = 'list'"
          >
            <List class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'bg-muted': viewMode === 'calendar' }"
            @click="viewMode = 'calendar'"
          >
            <CalendarDays class="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" @click="refresh()">
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': pending }" />
          Refresh
        </Button>
        <Button as-child>
          <NuxtLink to="/admin/service">
            <ArrowLeft class="mr-2 h-4 w-4" /> Dashboard
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="py-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-[200px]">
            <Input
              v-model="searchQuery"
              placeholder="Search customer, vehicle, rego..."
              class="max-w-sm"
            >
              <template #prefix>
                <Search class="h-4 w-4 text-muted-foreground" />
              </template>
            </Input>
          </div>

          <Select v-model="statusFilter">
            <SelectTrigger class="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <div class="flex items-center gap-2">
            <Label class="text-sm text-muted-foreground">From:</Label>
            <Input
              v-model="dateFrom"
              type="date"
              class="w-[150px]"
            />
          </div>

          <div class="flex items-center gap-2">
            <Label class="text-sm text-muted-foreground">To:</Label>
            <Input
              v-model="dateTo"
              type="date"
              class="w-[150px]"
            />
          </div>

          <Button v-if="hasActiveFilters" variant="ghost" size="sm" @click="clearFilters">
            <X class="mr-1 h-4 w-4" /> Clear
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Status Counts -->
    <div class="flex flex-wrap gap-2">
      <Badge
        v-for="(count, status) in data?.statusCounts"
        :key="status"
        :variant="statusFilter === status ? 'default' : 'outline'"
        class="cursor-pointer capitalize"
        @click="statusFilter = String(status)"
      >
        {{ status.replace('_', ' ') }}: {{ count }}
      </Badge>
    </div>

    <!-- List View -->
    <div v-if="viewMode === 'list'">
      <Card>
        <CardContent class="p-0">
          <div v-if="pending" class="p-8 text-center">
            <Loader2 class="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <div v-else-if="!data?.appointments?.length" class="p-8 text-center text-muted-foreground">
            <Calendar class="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No appointments found</p>
          </div>
          <Table v-else>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="apt in data.appointments"
                :key="apt.id"
                class="cursor-pointer hover:bg-muted/50"
                @click="navigateTo(`/admin/service/appointments/${apt.id}`)"
              >
                <TableCell>
                  <div class="font-medium">{{ formatDate(apt.scheduledDate) }}</div>
                  <div class="text-sm text-muted-foreground">{{ apt.scheduledTime || 'TBD' }}</div>
                </TableCell>
                <TableCell>
                  <div class="font-medium">{{ apt.customerName }}</div>
                  <div class="text-sm text-muted-foreground">{{ apt.customerPhone }}</div>
                </TableCell>
                <TableCell>
                  <div>{{ apt.vehicle }}</div>
                  <div class="text-sm text-muted-foreground">{{ apt.vehicleRegistration }}</div>
                </TableCell>
                <TableCell>
                  <div class="max-w-[200px] truncate">{{ apt.serviceType }}</div>
                </TableCell>
                <TableCell>
                  <div v-if="apt.technicianName" class="flex items-center gap-2">
                    <div class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User class="h-3 w-3 text-primary" />
                    </div>
                    {{ apt.technicianName }}
                  </div>
                  <span v-else class="text-muted-foreground">Unassigned</span>
                </TableCell>
                <TableCell>
                  <Badge :variant="getStatusVariant(apt.status)" class="capitalize">
                    {{ apt.status.replace('_', ' ') }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <ChevronRight class="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <!-- Pagination -->
          <div v-if="data?.pagination" class="flex items-center justify-between px-4 py-3 border-t">
            <div class="text-sm text-muted-foreground">
              Showing {{ (data.pagination.page - 1) * data.pagination.limit + 1 }} -
              {{ Math.min(data.pagination.page * data.pagination.limit, data.pagination.total) }}
              of {{ data.pagination.total }}
            </div>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="data.pagination.page <= 1"
                @click="page--"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="data.pagination.page >= data.pagination.totalPages"
                @click="page++"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Calendar View -->
    <div v-else-if="viewMode === 'calendar'">
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <Button variant="outline" size="sm" @click="previousWeek">
              <ChevronLeft class="h-4 w-4" />
            </Button>
            <CardTitle>{{ formatWeekRange() }}</CardTitle>
            <Button variant="outline" size="sm" @click="nextWeek">
              <ChevronRight class="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-7 gap-2">
            <div
              v-for="day in weekDays"
              :key="day.date"
              class="min-h-[150px] border rounded-lg p-2"
              :class="{ 'bg-primary/5': isToday(day.date) }"
            >
              <div class="text-center mb-2 pb-2 border-b">
                <div class="text-xs text-muted-foreground">{{ day.dayName }}</div>
                <div class="font-semibold" :class="{ 'text-primary': isToday(day.date) }">
                  {{ day.dayNum }}
                </div>
              </div>
              <div class="space-y-1">
                <div
                  v-for="apt in calendarData?.appointments?.[day.date] || []"
                  :key="apt.id"
                  class="text-xs p-1.5 rounded cursor-pointer truncate"
                  :class="getCalendarItemClass(apt.status)"
                  @click="navigateTo(`/admin/service/appointments/${apt.id}`)"
                >
                  <div class="font-medium">{{ apt.time || 'TBD' }}</div>
                  <div class="truncate">{{ apt.customer }}</div>
                  <div class="truncate text-[10px] opacity-75">{{ apt.registration }}</div>
                </div>
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
  CalendarDays,
  List,
  ArrowLeft,
  Search,
  X,
  Loader2,
  User,
  ChevronRight,
  ChevronLeft,
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'

definePageMeta({
  layout: 'admin',
})

type ServiceAppointmentListItem = {
  id: string
  scheduledDate: string | Date
  scheduledTime?: string | null
  customerName?: string | null
  customerPhone?: string | null
  vehicle?: string | null
  vehicleRegistration?: string | null
  serviceType?: string | null
  technicianName?: string | null
  status: string
}

type AppointmentsResponse = {
  appointments: ServiceAppointmentListItem[]
  statusCounts: Record<string, number>
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type CalendarAppointment = {
  id: string
  status: string
  time?: string | null
  customer?: string | null
  registration?: string | null
}

type CalendarAppointmentsResponse = {
  appointments: Record<string, CalendarAppointment[]>
}

const toIsoDate = (date: Date) => date.toISOString().split('T')[0] || ''

const viewMode = ref<'list' | 'calendar'>('list')
const searchQuery = ref('')
const statusFilter = ref('all')
const dateFrom = ref('')
const dateTo = ref('')
const page = ref(1)
const calendarWeekStart = ref(getWeekStart(new Date()))

function getWeekStart(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return toIsoDate(d)
}

const hasActiveFilters = computed(() => {
  return searchQuery.value || statusFilter.value !== 'all' || dateFrom.value || dateTo.value
})

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  dateFrom.value = ''
  dateTo.value = ''
  page.value = 1
}

// List view data
const { data, pending, refresh } = await useFetch<AppointmentsResponse>('/api/admin/service/appointments', {
  headers: useRequestHeaders(['cookie']),
  query: computed(() => ({
    page: page.value,
    search: searchQuery.value || undefined,
    status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
    dateFrom: dateFrom.value || undefined,
    dateTo: dateTo.value || undefined,
  })),
  watch: [page, searchQuery, statusFilter, dateFrom, dateTo],
  default: () => ({ appointments: [], statusCounts: {} }),
})

// Calendar view data
const calendarEndDate = computed(() => {
  const d = new Date(calendarWeekStart.value)
  d.setDate(d.getDate() + 6)
  return toIsoDate(d)
})

const { data: calendarData } = await useFetch<CalendarAppointmentsResponse>('/api/admin/service/appointments/calendar', {
  headers: useRequestHeaders(['cookie']),
  query: computed(() => ({
    dateFrom: calendarWeekStart.value,
    dateTo: calendarEndDate.value,
  })),
  watch: [calendarWeekStart],
  default: () => ({ appointments: {} }),
})

const weekDays = computed<Array<{ date: string; dayName: string; dayNum: number }>>(() => {
  const days: Array<{ date: string; dayName: string; dayNum: number }> = []
  const start = new Date(calendarWeekStart.value)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push({
      date: toIsoDate(d),
      dayName: d.toLocaleDateString('en-AU', { weekday: 'short' }),
      dayNum: d.getDate(),
    })
  }
  return days
})

const isToday = (dateStr: string) => {
  return dateStr === toIsoDate(new Date())
}

const previousWeek = () => {
  const d = new Date(calendarWeekStart.value)
  d.setDate(d.getDate() - 7)
  calendarWeekStart.value = toIsoDate(d)
}

const nextWeek = () => {
  const d = new Date(calendarWeekStart.value)
  d.setDate(d.getDate() + 7)
  calendarWeekStart.value = toIsoDate(d)
}

const formatWeekRange = () => {
  const start = new Date(calendarWeekStart.value)
  const end = new Date(calendarWeekStart.value)
  end.setDate(end.getDate() + 6)

  const startStr = start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  const endStr = end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startStr} - ${endStr}`
}

const formatDate = (dateStr: string | Date) => {
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
    case 'no_show':
      return 'destructive'
    default:
      return 'secondary'
  }
}

const getCalendarItemClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-900 hover:bg-amber-200'
    case 'confirmed':
      return 'bg-blue-100 text-blue-900 hover:bg-blue-200'
    case 'in_progress':
      return 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200'
    case 'completed':
      return 'bg-green-100 text-green-900 hover:bg-green-200'
    case 'cancelled':
    case 'no_show':
      return 'bg-red-100 text-red-900 hover:bg-red-200'
    default:
      return 'bg-gray-100 text-gray-900 hover:bg-gray-200'
  }
}
</script>
