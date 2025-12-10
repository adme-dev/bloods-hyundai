<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <Button variant="ghost" size="icon" as-child>
              <NuxtLink to="/portal">
                <ArrowLeft class="h-5 w-5" />
              </NuxtLink>
            </Button>
            <span class="text-lg font-semibold text-gray-900">My Appointments</span>
          </div>
          <Button as-child>
            <NuxtLink to="/service">
              <Plus class="h-4 w-4 mr-2" />
              Book Service
            </NuxtLink>
          </Button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="pending" class="flex justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
      </div>

      <div v-else class="space-y-8">
        <!-- Upcoming Appointments -->
        <div>
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock class="h-5 w-5" />
            Upcoming Appointments
          </h2>

          <div v-if="!data?.upcoming?.length" class="bg-white rounded-lg border p-8 text-center text-gray-500">
            <Calendar class="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No upcoming appointments</p>
            <Button class="mt-4" as-child>
              <NuxtLink to="/service">Book a Service</NuxtLink>
            </Button>
          </div>

          <div v-else class="space-y-4">
            <Card v-for="apt in data.upcoming" :key="apt.id">
              <CardContent class="p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 text-center w-20 py-2 bg-primary/10 rounded-lg">
                    <div class="text-2xl font-bold text-primary">{{ formatDay(apt.scheduledDate) }}</div>
                    <div class="text-sm text-primary/80">{{ formatMonth(apt.scheduledDate) }}</div>
                    <div class="text-xs text-gray-500 mt-1">{{ apt.scheduledTime || 'TBD' }}</div>
                  </div>

                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <h3 class="font-semibold text-lg">{{ apt.serviceType }}</h3>
                      <Badge :variant="getStatusVariant(apt.status)" class="capitalize">
                        {{ apt.status.replace('_', ' ') }}
                      </Badge>
                    </div>

                    <div class="space-y-2 text-sm text-gray-600">
                      <div class="flex items-center gap-2">
                        <Car class="h-4 w-4" />
                        <span>{{ apt.vehicle }}</span>
                        <span class="bg-gray-100 px-2 py-0.5 rounded text-xs">{{ apt.vehicleRegistration }}</span>
                      </div>

                      <div v-if="apt.serviceDescription" class="flex items-start gap-2">
                        <FileText class="h-4 w-4 mt-0.5" />
                        <span>{{ apt.serviceDescription }}</span>
                      </div>

                      <div v-if="apt.estimatedCost" class="flex items-center gap-2">
                        <DollarSign class="h-4 w-4" />
                        <span>Estimated: ${{ apt.estimatedCost }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="text-right">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Past Appointments -->
        <div>
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <History class="h-5 w-5" />
            Service History
          </h2>

          <div v-if="!data?.past?.length" class="bg-white rounded-lg border p-8 text-center text-gray-500">
            <History class="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No service history yet</p>
          </div>

          <div v-else class="bg-white rounded-lg border divide-y">
            <div
              v-for="apt in data.past"
              :key="apt.id"
              class="p-4 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center gap-4">
                <div class="flex-shrink-0 text-center w-20">
                  <div class="text-sm font-medium">{{ formatShortDate(apt.scheduledDate) }}</div>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ apt.serviceType }}</span>
                    <Badge :variant="getStatusVariant(apt.status)" class="capitalize text-xs">
                      {{ apt.status }}
                    </Badge>
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ apt.vehicle }} · {{ apt.vehicleRegistration }}
                  </div>
                </div>

                <div v-if="apt.actualCost || apt.estimatedCost" class="text-right">
                  <span class="font-medium">${{ apt.actualCost || apt.estimatedCost }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  Plus,
  Loader2,
  Clock,
  Calendar,
  Car,
  FileText,
  DollarSign,
  History,
} from 'lucide-vue-next'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

definePageMeta({
  layout: false,
})

// Check authentication
const { error: authError } = await useFetch('/api/customer/auth/me', {
  headers: useRequestHeaders(['cookie']),
})

if (authError.value) {
  navigateTo('/portal/login')
}

const { data, pending } = await useFetch('/api/customer/appointments', {
  headers: useRequestHeaders(['cookie']),
})

const formatDay = (dateStr: string) => new Date(dateStr).getDate()
const formatMonth = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-AU', { month: 'short' })
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
    case 'completed':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'cancelled':
    case 'no_show':
      return 'destructive'
    default:
      return 'secondary'
  }
}
</script>
