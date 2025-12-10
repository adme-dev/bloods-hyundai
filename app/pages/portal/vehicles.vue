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
            <span class="text-lg font-semibold text-gray-900">My Vehicles</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="pending" class="flex justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
      </div>

      <div v-else class="space-y-6">
        <div v-if="!data?.vehicles?.length" class="bg-white rounded-lg border p-8 text-center text-gray-500">
          <Car class="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No vehicles registered yet</p>
          <p class="text-sm mt-2">Your vehicles will appear here after your first service appointment.</p>
        </div>

        <Card v-for="vehicle in data?.vehicles" :key="vehicle.id">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Car class="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{{ vehicle.displayName }}</CardTitle>
                  <CardDescription v-if="vehicle.registration">
                    {{ vehicle.registration }}
                  </CardDescription>
                </div>
              </div>
              <div class="text-right text-sm text-gray-500">
                <div v-if="vehicle.lastServiceDate">
                  Last service: {{ formatDate(vehicle.lastServiceDate) }}
                </div>
                <div v-if="vehicle.currentOdometer">
                  {{ vehicle.currentOdometer }} km
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <!-- Vehicle Details -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
              <div>
                <span class="text-gray-500">Make</span>
                <p class="font-medium">{{ vehicle.make }}</p>
              </div>
              <div>
                <span class="text-gray-500">Model</span>
                <p class="font-medium">{{ vehicle.model }}</p>
              </div>
              <div>
                <span class="text-gray-500">Year</span>
                <p class="font-medium">{{ vehicle.year || '-' }}</p>
              </div>
              <div v-if="vehicle.color">
                <span class="text-gray-500">Color</span>
                <p class="font-medium">{{ vehicle.color }}</p>
              </div>
            </div>

            <!-- Service History -->
            <div v-if="vehicle.serviceHistory?.length">
              <h4 class="font-medium mb-3 flex items-center gap-2">
                <History class="h-4 w-4" />
                Service History
              </h4>
              <div class="space-y-2">
                <div
                  v-for="service in vehicle.serviceHistory"
                  :key="service.id"
                  class="flex items-start gap-3 py-2 border-b last:border-0"
                >
                  <div class="flex-shrink-0 w-24 text-sm text-gray-500">
                    {{ formatDate(service.serviceDate) }}
                  </div>
                  <div class="flex-1">
                    <div class="font-medium">{{ service.serviceType }}</div>
                    <div class="text-sm text-gray-500 line-clamp-2">
                      {{ service.workPerformed }}
                    </div>
                    <div v-if="service.recommendations" class="mt-1 text-sm text-amber-600">
                      <span class="font-medium">Recommendation:</span> {{ service.recommendations }}
                    </div>
                  </div>
                  <div class="text-right text-sm">
                    <div v-if="service.odometerReading" class="text-gray-500">
                      {{ service.odometerReading }} km
                    </div>
                    <div v-if="service.totalCost" class="font-medium">
                      ${{ service.totalCost }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-4 text-gray-500 text-sm">
              No service history for this vehicle yet
            </div>

            <!-- Next Service Due -->
            <div v-if="vehicle.nextServiceDue" class="mt-4 p-3 bg-amber-50 rounded-lg">
              <div class="flex items-center gap-2 text-amber-800">
                <AlertCircle class="h-4 w-4" />
                <span class="font-medium">Next Service Due:</span>
                {{ formatDate(vehicle.nextServiceDue) }}
              </div>
            </div>
          </CardContent>

          <CardFooter class="border-t pt-4">
            <Button class="w-full" as-child>
              <NuxtLink to="/service">
                <Calendar class="h-4 w-4 mr-2" />
                Book Service for this Vehicle
              </NuxtLink>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  Loader2,
  Car,
  History,
  AlertCircle,
  Calendar,
} from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'

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

const { data, pending } = await useFetch('/api/customer/vehicles', {
  headers: useRequestHeaders(['cookie']),
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>
