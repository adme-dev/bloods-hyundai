<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <NuxtLink to="/">
              <NuxtImg src="/assets/logos/logo-black-sm.svg" alt="Sale Hyundai" class="h-8" width="80" height="32" />
            </NuxtLink>
            <span class="text-lg font-semibold text-gray-900">Customer Portal</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">
              Welcome, {{ customer?.firstName }}
            </span>
            <Button variant="ghost" size="sm" @click="logout">
              <LogOut class="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="flex justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
      </div>

      <div v-else class="space-y-8">
        <!-- Quick Actions -->
        <div class="grid gap-4 md:grid-cols-3">
          <Card class="hover:shadow-md transition-shadow cursor-pointer" @click="navigateTo('/service')">
            <CardContent class="pt-6">
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar class="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold">Book Service</h3>
                  <p class="text-sm text-gray-500">Schedule your next service</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card class="hover:shadow-md transition-shadow cursor-pointer" @click="navigateTo('/portal/appointments')">
            <CardContent class="pt-6">
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <ClipboardList class="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 class="font-semibold">My Appointments</h3>
                  <p class="text-sm text-gray-500">View upcoming & past bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card class="hover:shadow-md transition-shadow cursor-pointer" @click="navigateTo('/portal/vehicles')">
            <CardContent class="pt-6">
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Car class="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 class="font-semibold">My Vehicles</h3>
                  <p class="text-sm text-gray-500">Service history & records</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Upcoming Appointments -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle class="flex items-center gap-2">
                <Clock class="h-5 w-5" />
                Upcoming Appointments
              </CardTitle>
              <Button variant="outline" size="sm" as-child>
                <NuxtLink to="/portal/appointments">View All</NuxtLink>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="!appointments?.upcoming?.length" class="py-8 text-center text-gray-500">
              <Calendar class="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No upcoming appointments</p>
              <Button class="mt-4" as-child>
                <NuxtLink to="/service">Book a Service</NuxtLink>
              </Button>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="apt in appointments.upcoming.slice(0, 3)"
                :key="apt.id"
                class="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div class="flex-shrink-0 text-center w-16">
                  <div class="text-lg font-bold text-primary">{{ formatDay(apt.scheduledDate) }}</div>
                  <div class="text-xs text-gray-500">{{ formatMonth(apt.scheduledDate) }}</div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ apt.serviceType }}</span>
                    <Badge :variant="getStatusVariant(apt.status)" class="capitalize">
                      {{ apt.status }}
                    </Badge>
                  </div>
                  <div class="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Car class="h-3.5 w-3.5" />
                    <span>{{ apt.vehicle }}</span>
                    <span>·</span>
                    <span>{{ apt.scheduledTime || 'Time TBD' }}</span>
                  </div>
                </div>
                <ChevronRight class="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Recent Service History -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle class="flex items-center gap-2">
                <History class="h-5 w-5" />
                Recent Service History
              </CardTitle>
              <Button variant="outline" size="sm" as-child>
                <NuxtLink to="/portal/vehicles">View All</NuxtLink>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="!appointments?.past?.length" class="py-8 text-center text-gray-500">
              <History class="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No service history yet</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="apt in appointments.past.slice(0, 5)"
                :key="apt.id"
                class="flex items-center gap-4 py-3 border-b last:border-0"
              >
                <div class="flex-shrink-0 text-center w-20">
                  <div class="text-sm font-medium">{{ formatShortDate(apt.scheduledDate) }}</div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium">{{ apt.serviceType }}</div>
                  <div class="text-sm text-gray-500">
                    {{ apt.vehicle }} · {{ apt.vehicleRegistration }}
                  </div>
                </div>
                <div v-if="apt.actualCost" class="text-right">
                  <span class="font-medium">${{ apt.actualCost }}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Contact Info -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Phone class="h-5 w-5" />
              Contact Service Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Phone class="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div class="text-sm text-gray-500">Phone</div>
                  <a :href="`tel:${servicePhoneFormatted}`" class="font-medium text-primary hover:underline">
                    {{ servicePhone }}
                  </a>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Mail class="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div class="text-sm text-gray-500">Email</div>
                  <a href="mailto:service@salehyundai.com.au" class="font-medium text-primary hover:underline">
                    service@salehyundai.com.au
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  Loader2,
  LogOut,
  Calendar,
  ClipboardList,
  Car,
  Clock,
  History,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

definePageMeta({
  layout: false,
})

const loading = ref(true)
const customer = ref<any>(null)

// Site config for contact info
const mainStore = useMainStore()
const servicePhone = computed(() => mainStore.site?.departments?.service?.phone || mainStore.site?.phone || '')
const servicePhoneFormatted = computed(() => servicePhone.value.replace(/[^0-9+]/g, ''))

// Check authentication
const { data: authData, error: authError } = await useFetch('/api/customer/auth/me', {
  headers: useRequestHeaders(['cookie']),
})

if (authError.value) {
  navigateTo('/portal/login')
}

customer.value = authData.value?.customer

// Fetch appointments
const { data: appointments } = await useFetch('/api/customer/appointments', {
  headers: useRequestHeaders(['cookie']),
})

loading.value = false

const logout = async () => {
  await $fetch('/api/customer/auth/logout', { method: 'POST' })
  navigateTo('/portal/login')
}

const formatDay = (dateStr: string) => {
  return new Date(dateStr).getDate()
}

const formatMonth = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-AU', { month: 'short' })
}

const formatShortDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'completed':
      return 'default'
    case 'cancelled':
      return 'destructive'
    default:
      return 'secondary'
  }
}
</script>
