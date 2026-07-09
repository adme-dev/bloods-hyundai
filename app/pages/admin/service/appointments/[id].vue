<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" as-child>
          <NuxtLink to="/admin/service/appointments">
            <ArrowLeft class="h-5 w-5" />
          </NuxtLink>
        </Button>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ data?.appointment?.customerName }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ data?.appointment?.vehicleDisplay }} · {{ data?.appointment?.vehicleRegistration }}
          </p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <Badge :variant="getStatusVariant(data?.appointment?.status)" class="capitalize text-sm">
          {{ data?.appointment?.status?.replace('_', ' ') }}
        </Badge>
        <Button variant="outline" size="sm" @click="refresh">
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': pending }" />
          Refresh
        </Button>
      </div>
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="data?.appointment" class="grid gap-6 lg:grid-cols-3">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Appointment Details -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Calendar class="h-5 w-5" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <Label class="text-muted-foreground">Scheduled Date</Label>
                <p class="font-medium">{{ formatDate(data.appointment.scheduledDate) }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Scheduled Time</Label>
                <p class="font-medium">{{ data.appointment.scheduledTime || 'TBD' }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Drop Off</Label>
                <p class="font-medium">
                  {{ data.appointment.dropOffDate ? formatDate(data.appointment.dropOffDate) : 'Not set' }}
                  {{ data.appointment.dropOffTime ? `at ${data.appointment.dropOffTime}` : '' }}
                </p>
              </div>
              <div>
                <Label class="text-muted-foreground">Pick Up</Label>
                <p class="font-medium">
                  {{ data.appointment.pickUpDate ? formatDate(data.appointment.pickUpDate) : 'Not set' }}
                  {{ data.appointment.pickUpTime ? `at ${data.appointment.pickUpTime}` : '' }}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <Label class="text-muted-foreground">Service Type</Label>
              <p class="font-medium">{{ data.appointment.serviceType }}</p>
            </div>

            <div v-if="data.appointment.serviceDescription">
              <Label class="text-muted-foreground">Description</Label>
              <p class="text-sm">{{ data.appointment.serviceDescription }}</p>
            </div>

            <div v-if="data.appointment.customerNotes">
              <Label class="text-muted-foreground">Customer Notes</Label>
              <p class="text-sm bg-muted p-3 rounded-lg">{{ data.appointment.customerNotes }}</p>
            </div>

            <div class="flex flex-wrap gap-2">
              <Badge v-if="data.appointment.isScheduledService" variant="outline">
                Scheduled Service
              </Badge>
              <Badge v-if="data.appointment.isPreviouslyServiced" variant="outline">
                Previous Customer
              </Badge>
              <Badge v-if="data.appointment.hasOtherRepairs" variant="outline">
                Other Repairs
              </Badge>
              <Badge v-if="data.appointment.requiresLoanCar" variant="outline">
                Loan Car Required
              </Badge>
            </div>
          </CardContent>
        </Card>

        <!-- Customer Details -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <User class="h-5 w-5" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <Label class="text-muted-foreground">Name</Label>
                <p class="font-medium">{{ data.appointment.customerName }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Email</Label>
                <p class="font-medium">
                  <a :href="`mailto:${data.appointment.customerEmail}`" class="text-primary hover:underline">
                    {{ data.appointment.customerEmail }}
                  </a>
                </p>
              </div>
              <div>
                <Label class="text-muted-foreground">Phone</Label>
                <p class="font-medium">
                  <a :href="`tel:${data.appointment.customerPhone}`" class="text-primary hover:underline">
                    {{ data.appointment.customerPhone }}
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Vehicle Details -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Car class="h-5 w-5" />
              Vehicle Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label class="text-muted-foreground">Make</Label>
                <p class="font-medium">{{ data.appointment.vehicleMake }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Model</Label>
                <p class="font-medium">{{ data.appointment.vehicleModel }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Year</Label>
                <p class="font-medium">{{ data.appointment.vehicleYear || '-' }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Registration</Label>
                <p class="font-medium">{{ data.appointment.vehicleRegistration || '-' }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">VIN</Label>
                <p class="font-medium">{{ data.appointment.vehicleVin || '-' }}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Odometer</Label>
                <p class="font-medium">{{ data.appointment.vehicleOdometer ? `${data.appointment.vehicleOdometer} km` : '-' }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Service History -->
        <Card v-if="data.vehicleServiceHistory?.length">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <History class="h-5 w-5" />
              Vehicle Service History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="history in data.vehicleServiceHistory"
                :key="history.id"
                class="flex items-start gap-4 py-3 border-b last:border-0"
              >
                <div class="flex-shrink-0 text-center w-20">
                  <div class="text-sm font-medium">{{ formatShortDate(history.serviceDate) }}</div>
                  <div class="text-xs text-muted-foreground">{{ history.odometerReading }} km</div>
                </div>
                <div class="flex-1">
                  <p class="font-medium">{{ history.serviceType }}</p>
                  <p class="text-sm text-muted-foreground line-clamp-2">{{ history.workPerformed }}</p>
                </div>
                <div v-if="history.totalCost" class="text-right">
                  <p class="font-medium">${{ history.totalCost }}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Internal Notes -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <FileText class="h-5 w-5" />
              Internal Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              v-model="internalNotes"
              placeholder="Add internal notes about this appointment..."
              :rows="4"
            />
            <Button class="mt-3" size="sm" @click="saveNotes" :disabled="savingNotes">
              <Loader2 v-if="savingNotes" class="mr-2 h-4 w-4 animate-spin" />
              Save Notes
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Actions -->
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <Button
              v-if="data.appointment.status === 'pending'"
              class="w-full"
              @click="updateStatus('confirmed')"
              :disabled="updatingStatus"
            >
              <CheckCircle class="mr-2 h-4 w-4" />
              Confirm Appointment
            </Button>
            <Button
              v-if="data.appointment.status === 'confirmed'"
              class="w-full"
              @click="updateStatus('in_progress')"
              :disabled="updatingStatus"
            >
              <Wrench class="mr-2 h-4 w-4" />
              Start Service
            </Button>
            <Button
              v-if="data.appointment.status === 'in_progress'"
              class="w-full"
              @click="showCompleteDialog = true"
              :disabled="updatingStatus"
            >
              <CheckCircle class="mr-2 h-4 w-4" />
              Complete Service
            </Button>
            <Button
              v-if="data.appointment.status === 'in_progress'"
              variant="outline"
              class="w-full"
              @click="updateStatus('awaiting_parts')"
              :disabled="updatingStatus"
            >
              <Package class="mr-2 h-4 w-4" />
              Awaiting Parts
            </Button>
            <Button
              v-if="!['completed', 'cancelled'].includes(data.appointment.status)"
              variant="destructive"
              class="w-full"
              @click="updateStatus('cancelled')"
              :disabled="updatingStatus"
            >
              <X class="mr-2 h-4 w-4" />
              Cancel Appointment
            </Button>
          </CardContent>
        </Card>

        <!-- Assignment -->
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <Label>Technician</Label>
              <Select v-model="selectedTechnician" @update:modelValue="updateAssignment('technician')">
                <SelectTrigger>
                  <SelectValue placeholder="Assign technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="null">Unassigned</SelectItem>
                  <SelectItem
                    v-for="tech in data.availableTechnicians"
                    :key="tech.id"
                    :value="tech.id"
                  >
                    {{ tech.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <!-- Costing -->
        <Card>
          <CardHeader>
            <CardTitle>Costing</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <Label>Estimated Cost</Label>
              <div class="flex items-center gap-2">
                <span class="text-muted-foreground">$</span>
                <Input v-model="estimatedCost" type="text" placeholder="0.00" />
              </div>
            </div>
            <div v-if="data.appointment.status === 'completed'">
              <Label>Actual Cost</Label>
              <p class="font-medium">${{ data.appointment.actualCost || '0.00' }}</p>
            </div>
          </CardContent>
        </Card>

        <!-- Communication -->
        <Card>
          <CardHeader>
            <CardTitle>Communication</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span>Confirmation Sent</span>
              <Badge :variant="data.appointment.confirmationSent ? 'default' : 'secondary'">
                {{ data.appointment.confirmationSent ? 'Yes' : 'No' }}
              </Badge>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span>Reminder Sent</span>
              <Badge :variant="data.appointment.reminderSent ? 'default' : 'secondary'">
                {{ data.appointment.reminderSent ? 'Yes' : 'No' }}
              </Badge>
            </div>
            <Separator />
            <Button variant="outline" class="w-full" size="sm">
              <Mail class="mr-2 h-4 w-4" />
              Send Email
            </Button>
            <Button variant="outline" class="w-full" size="sm">
              <Phone class="mr-2 h-4 w-4" />
              Call Customer
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Complete Service Dialog -->
    <Dialog v-model:open="showCompleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Service</DialogTitle>
          <DialogDescription>
            Enter the final details for this service appointment.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <Label>Final Odometer Reading</Label>
            <Input v-model="completionOdometer" placeholder="e.g. 45500" />
          </div>
          <div>
            <Label>Work Performed</Label>
            <Textarea
              v-model="workPerformed"
              placeholder="Describe the work that was performed..."
              :rows="4"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCompleteDialog = false">Cancel</Button>
          <Button @click="completeService" :disabled="updatingStatus">
            <Loader2 v-if="updatingStatus" class="mr-2 h-4 w-4 animate-spin" />
            Complete Service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  Calendar,
  User,
  Car,
  History,
  FileText,
  CheckCircle,
  Wrench,
  Package,
  X,
  Mail,
  Phone,
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Separator } from '~/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const appointmentId = route.params.id as string

type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'awaiting_parts'

type ServiceAppointment = {
  customerName: string
  customerEmail?: string
  customerPhone?: string
  vehicleDisplay?: string
  vehicleRegistration?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleYear?: string | number | null
  vehicleVin?: string | null
  vehicleOdometer?: string | number | null
  scheduledDate: string | Date
  scheduledTime?: string | null
  dropOffDate?: string | Date | null
  dropOffTime?: string | null
  pickUpDate?: string | Date | null
  pickUpTime?: string | null
  serviceType?: string
  serviceDescription?: string | null
  customerNotes?: string | null
  isScheduledService?: boolean
  isPreviouslyServiced?: boolean
  hasOtherRepairs?: boolean
  requiresLoanCar?: boolean
  status: AppointmentStatus
  internalNotes?: string | null
  assignedTechnicianId?: string | null
  estimatedCost?: string | number | null
  actualCost?: string | number | null
  confirmationSent?: boolean
  reminderSent?: boolean
}

type VehicleServiceHistoryItem = {
  id: string
  serviceDate: string | Date
  odometerReading?: string | number | null
  serviceType?: string
  workPerformed?: string | null
  totalCost?: string | number | null
}

type AvailableTechnician = {
  id: string
  name: string
}

type ServiceAppointmentDetailResponse = {
  appointment: ServiceAppointment
  technician: unknown | null
  serviceAdvisor: unknown | null
  customer: unknown | null
  vehicle: unknown | null
  vehicleServiceHistory: VehicleServiceHistoryItem[]
  availableTechnicians: AvailableTechnician[]
}

const { data, pending, refresh } = await useFetch<ServiceAppointmentDetailResponse>(`/api/admin/service/appointments/${appointmentId}`, {
  headers: useRequestHeaders(['cookie']),
})

const internalNotes = ref(data.value?.appointment?.internalNotes || '')
const selectedTechnician = ref(data.value?.appointment?.assignedTechnicianId || null)
const estimatedCost = ref(data.value?.appointment?.estimatedCost || '')
const updatingStatus = ref(false)
const savingNotes = ref(false)
const showCompleteDialog = ref(false)
const completionOdometer = ref('')
const workPerformed = ref('')

watch(() => data.value?.appointment, (apt) => {
  if (apt) {
    internalNotes.value = apt.internalNotes || ''
    selectedTechnician.value = apt.assignedTechnicianId || null
    estimatedCost.value = apt.estimatedCost || ''
  }
})

const formatDate = (dateStr: string | Date) => {
  const date = new Date(dateStr)
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
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getStatusVariant = (status?: string) => {
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

const updateStatus = async (status: string) => {
  updatingStatus.value = true
  try {
    await $fetch(`/api/admin/service/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: { status },
    })
    await refresh()
  } catch (error) {
    console.error('Failed to update status:', error)
  } finally {
    updatingStatus.value = false
  }
}

const completeService = async () => {
  updatingStatus.value = true
  try {
    await $fetch(`/api/admin/service/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: {
        status: 'completed',
        completedOdometer: completionOdometer.value,
        workPerformed: workPerformed.value,
      },
    })
    showCompleteDialog.value = false
    await refresh()
  } catch (error) {
    console.error('Failed to complete service:', error)
  } finally {
    updatingStatus.value = false
  }
}

const updateAssignment = async (type: 'technician' | 'advisor') => {
  try {
    await $fetch(`/api/admin/service/appointments/${appointmentId}/assign`, {
      method: 'PATCH',
      body: {
        technicianId: type === 'technician' ? selectedTechnician.value : undefined,
      },
    })
    await refresh()
  } catch (error) {
    console.error('Failed to update assignment:', error)
  }
}

const saveNotes = async () => {
  savingNotes.value = true
  try {
    await $fetch(`/api/admin/service/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: {
        status: data.value?.appointment?.status,
        internalNotes: internalNotes.value,
      },
    })
    await refresh()
  } catch (error) {
    console.error('Failed to save notes:', error)
  } finally {
    savingNotes.value = false
  }
}
</script>
