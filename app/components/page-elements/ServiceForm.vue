<template>
  <div class="service-form py-8 sm:py-12 bg-gray-50">
    <div class="mx-auto max-w-4xl px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Book Your Service
        </h2>
        <p class="mt-2 text-base text-gray-600">
          Schedule your next service appointment below
        </p>
      </div>

      <!-- Loading Settings -->
      <div v-if="settingsPending" class="flex items-center justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
      </div>

      <!-- External Booking Iframe -->
      <Card v-else-if="useExternalBooking && externalIframeUrl" class="shadow-xl overflow-hidden">
        <!-- Header with full screen button -->
        <div class="flex items-center justify-between px-4 py-3 bg-gray-100 border-b">
          <p class="text-sm text-gray-600 m-0">
            Book your service appointment online
          </p>
          <Button
            variant="outline"
            size="sm"
            @click="openFullScreenDialog"
          >
            <Maximize2 class="h-4 w-4 mr-2" />
            Full Screen
          </Button>
        </div>
        <CardContent class="p-0">
          <iframe
            :src="externalIframeUrl"
            class="w-full border-0"
            style="min-height: 800px;"
            title="Service Booking"
            allow="geolocation; payment"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        </CardContent>
      </Card>

      <!-- Internal Form -->
      <Card v-else class="shadow-xl">
        <CardHeader class="pb-6 pt-8">
          <!-- Stepper -->
          <Stepper v-model="currentStep" class="flex w-full items-start gap-2">
            <StepperItem
              v-for="step in formSteps"
              :key="step.step"
              v-slot="{ state }"
              class="relative flex w-full flex-col items-center justify-center"
              :step="step.step"
            >
              <!-- Separator Line -->
              <StepperSeparator
                v-if="step.step !== formSteps.length"
                class="absolute left-[calc(50%+24px)] right-[calc(-50%+14px)] top-5 block h-0.5 shrink-0 rounded-full bg-gray-200 group-data-[state=completed]:bg-[#001E50]"
              />

              <!-- Step Button -->
              <StepperTrigger as-child>
                <button
                  type="button"
                  class="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#001E50] focus-visible:ring-offset-2"
                  :class="[
                    state === 'completed' && 'border-[#001E50] bg-[#001E50] text-white',
                    state === 'active' && 'border-[#001E50] bg-[#001E50] text-white ring-4 ring-blue-100',
                    state === 'inactive' && 'border-gray-200 bg-white text-gray-400 cursor-default'
                  ]"
                  :disabled="state === 'inactive'"
                  @click="state !== 'inactive' && goToStep(step.step)"
                >
                  <Check v-if="state === 'completed'" class="h-5 w-5" />
                  <component v-else :is="step.icon" class="h-5 w-5" />
                </button>
              </StepperTrigger>

              <!-- Step Labels -->
              <div class="mt-3 flex flex-col items-center text-center">
                <StepperTitle 
                  class="text-xs sm:text-sm font-semibold transition-colors m-0"
                  :class="[
                    state === 'active' && 'text-[#001E50]',
                    state === 'completed' && 'text-gray-700',
                    state === 'inactive' && 'text-gray-400'
                  ]"
                >
                  {{ step.title }}
                </StepperTitle>
                <StepperDescription 
                  class="hidden sm:block text-xs mt-0.5 transition-colors"
                  :class="[
                    state === 'active' && 'text-[#001E50]/70',
                    state === 'completed' && 'text-gray-500',
                    state === 'inactive' && 'text-gray-400'
                  ]"
                >
                  {{ step.description }}
                </StepperDescription>
              </div>
            </StepperItem>
          </Stepper>
        </CardHeader>

        <CardContent class="pt-6">
          <!-- Success Message -->
          <div v-if="submitted" class="text-center py-12">
            <div class="flex justify-center mb-4">
              <div class="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 class="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Thank You, {{ form.firstName }}!</h3>
            <p class="text-gray-600 max-w-md mx-auto">
              Your service booking request has been submitted successfully. We'll be in touch shortly to confirm your appointment.
            </p>
          </div>

          <!-- Form -->
          <form v-else @submit.prevent="handleStepSubmit">
            <!-- Step 1: Your Details -->
            <div v-show="currentStep === 1" class="space-y-6">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User class="h-5 w-5 text-[#001E50]" />
                Your Details
              </h3>
              
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="space-y-2">
                  <Label for="firstName">First Name <span class="text-red-500">*</span></Label>
                  <Input 
                    id="firstName" 
                    v-model="form.firstName" 
                    placeholder="Enter your first name"
                    :class="{ 'border-red-500': errors.firstName }"
                  />
                  <p v-if="errors.firstName" class="text-sm text-red-500">{{ errors.firstName }}</p>
                </div>
                
                <div class="space-y-2">
                  <Label for="lastName">Last Name <span class="text-red-500">*</span></Label>
                  <Input 
                    id="lastName" 
                    v-model="form.lastName" 
                    placeholder="Enter your last name"
                    :class="{ 'border-red-500': errors.lastName }"
                  />
                  <p v-if="errors.lastName" class="text-sm text-red-500">{{ errors.lastName }}</p>
                </div>
                
                <div class="space-y-2">
                  <Label for="email">Email <span class="text-red-500">*</span></Label>
                  <Input 
                    id="email" 
                    type="email"
                    v-model="form.email" 
                    placeholder="Enter your email address"
                    :class="{ 'border-red-500': errors.email }"
                  />
                  <p v-if="errors.email" class="text-sm text-red-500">{{ errors.email }}</p>
                </div>
                
                <div class="space-y-2">
                  <Label for="phone">Phone <span class="text-red-500">*</span></Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    v-model="form.phone" 
                    placeholder="Enter your phone number"
                    :class="{ 'border-red-500': errors.phone }"
                  />
                  <p v-if="errors.phone" class="text-sm text-red-500">{{ errors.phone }}</p>
                </div>
              </div>
            </div>

            <!-- Step 2: Vehicle Details -->
            <div v-show="currentStep === 2" class="space-y-6">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Car class="h-5 w-5 text-[#001E50]" />
                Vehicle Details
              </h3>
              
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="space-y-2">
                  <Label for="vehicleMake">Vehicle Make <span class="text-red-500">*</span></Label>
                  <Input 
                    id="vehicleMake" 
                    v-model="form.vehicleMake" 
                    placeholder="e.g. Hyundai"
                    :class="{ 'border-red-500': errors.vehicleMake }"
                  />
                  <p v-if="errors.vehicleMake" class="text-sm text-red-500">{{ errors.vehicleMake }}</p>
                </div>
                
                <div class="space-y-2">
                  <Label for="vehicleModel">Vehicle Model <span class="text-red-500">*</span></Label>
                  <Input 
                    id="vehicleModel" 
                    v-model="form.vehicleModel" 
                    placeholder="e.g. Tucson"
                    :class="{ 'border-red-500': errors.vehicleModel }"
                  />
                  <p v-if="errors.vehicleModel" class="text-sm text-red-500">{{ errors.vehicleModel }}</p>
                </div>
                
                <div class="space-y-2">
                  <Label for="vehicleRego">Registration <span class="text-red-500">*</span></Label>
                  <Input 
                    id="vehicleRego" 
                    v-model="form.vehicleRego" 
                    placeholder="e.g. ABC123"
                    :class="{ 'border-red-500': errors.vehicleRego }"
                  />
                  <p v-if="errors.vehicleRego" class="text-sm text-red-500">{{ errors.vehicleRego }}</p>
                </div>
                
                <div class="space-y-2">
                  <Label for="vehicleYear">Year <span class="text-red-500">*</span></Label>
                  <Select v-model="form.vehicleYear">
                    <SelectTrigger :class="{ 'border-red-500': errors.vehicleYear }">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="year in years" :key="year" :value="year">
                        {{ year }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p v-if="errors.vehicleYear" class="text-sm text-red-500">{{ errors.vehicleYear }}</p>
                </div>
                
                <div class="space-y-2">
                  <Label for="vehicleVin">VIN/Chassis #</Label>
                  <Input 
                    id="vehicleVin" 
                    v-model="form.vehicleVin" 
                    placeholder="Optional"
                  />
                </div>
                
                <div class="space-y-2">
                  <Label for="vehicleOdometer">Odometer <span class="text-red-500">*</span></Label>
                  <Input 
                    id="vehicleOdometer" 
                    v-model="form.vehicleOdometer" 
                    placeholder="e.g. 45000"
                    :class="{ 'border-red-500': errors.vehicleOdometer }"
                  />
                  <p v-if="errors.vehicleOdometer" class="text-sm text-red-500">{{ errors.vehicleOdometer }}</p>
                </div>
              </div>
            </div>

            <!-- Step 3: Booking Preferences -->
            <div v-show="currentStep === 3" class="space-y-6">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar class="h-5 w-5 text-[#001E50]" />
                Preferred Booking Date/Time
              </h3>
              
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="space-y-2">
                  <Label for="dropOffDate">Preferred Drop Off Date <span class="text-red-500">*</span></Label>
                  <DatePicker 
                    v-model="form.dropOffDate" 
                    :min-date="minDate"
                    placeholder="Select drop off date"
                    :class="errors.dropOffDate ? 'border-red-500' : ''"
                  />
                  <p v-if="errors.dropOffDate" class="text-sm text-red-500">{{ errors.dropOffDate }}</p>
                </div>
                
                <div class="space-y-2">
                  <Label for="dropOffTime">Preferred Drop Off Time</Label>
                  <Select v-model="form.dropOffTime">
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="time in timeSlots" :key="time" :value="time">
                        {{ time }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div class="space-y-2">
                  <Label for="pickUpDate">Preferred Pick Up Date</Label>
                  <DatePicker 
                    v-model="form.pickUpDate" 
                    :min-date="form.dropOffDate || minDate"
                    placeholder="Select pick up date"
                  />
                </div>
                
                <div class="space-y-2">
                  <Label for="pickUpTime">Preferred Pick Up Time</Label>
                  <Select v-model="form.pickUpTime">
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="time in timeSlots" :key="time" :value="time">
                        {{ time }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <!-- Additional Information -->
              <div class="pt-6 border-t">
                <h4 class="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText class="h-5 w-5 text-[#001E50]" />
                  Additional Information
                </h4>
                
                <div class="space-y-3">
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      v-model="form.scheduledService"
                      class="h-4 w-4 rounded border-gray-300 text-[#001E50] focus:ring-[#001E50] focus:ring-offset-0"
                    />
                    <span class="font-normal text-gray-700">
                      Booking in for Scheduled Service
                    </span>
                  </label>
                  
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      v-model="form.previouslyServiced"
                      class="h-4 w-4 rounded border-gray-300 text-[#001E50] focus:ring-[#001E50] focus:ring-offset-0"
                    />
                    <span class="font-normal text-gray-700">
                      My vehicle has been serviced by {{ siteName }} in the past
                    </span>
                  </label>
                  
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      v-model="form.otherRepairs"
                      class="h-4 w-4 rounded border-gray-300 text-[#001E50] focus:ring-[#001E50] focus:ring-offset-0"
                    />
                    <span class="font-normal text-gray-700">
                      Booking In For Other Repairs
                    </span>
                  </label>
                </div>
              </div>

              <!-- Service & Repair Requests -->
              <div class="space-y-2">
                <Label for="serviceRequests">Service & Repair Requests</Label>
                <Textarea 
                  id="serviceRequests"
                  v-model="form.serviceRequests" 
                  placeholder="Please describe any specific service or repair requests..."
                  :rows="4"
                />
              </div>

              <!-- Privacy Policy -->
              <p class="text-sm text-gray-500">
                Your personal information will be collected, used and stored in strict accordance with our
                <NuxtLink to="/privacy-policy" class="text-[#001E50] hover:underline">Privacy Policy</NuxtLink>.
                Our Privacy Policy contains details on how information is used, how you may access / correct information held and our privacy complaints processes.
              </p>
            </div>

            <!-- Step 4: Review & Submit -->
            <div v-show="currentStep === 4" class="space-y-6">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardCheck class="h-5 w-5 text-[#001E50]" />
                Review & Submit
              </h3>
              
              <p class="text-gray-600">Please review your information before submitting.</p>

              <!-- Summary Cards -->
              <div class="grid gap-4 sm:grid-cols-2">
                <!-- Personal Details -->
                <div class="bg-gray-50 rounded-lg p-4">
                  <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User class="h-4 w-4" />
                    Your Details
                  </h4>
                  <dl class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <dt class="text-gray-500">Name:</dt>
                      <dd class="font-medium text-gray-900">{{ form.firstName }} {{ form.lastName }}</dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-gray-500">Email:</dt>
                      <dd class="font-medium text-gray-900">{{ form.email }}</dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-gray-500">Phone:</dt>
                      <dd class="font-medium text-gray-900">{{ form.phone }}</dd>
                    </div>
                  </dl>
                </div>

                <!-- Vehicle Details -->
                <div class="bg-gray-50 rounded-lg p-4">
                  <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Car class="h-4 w-4" />
                    Vehicle Details
                  </h4>
                  <dl class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <dt class="text-gray-500">Vehicle:</dt>
                      <dd class="font-medium text-gray-900">{{ form.vehicleYear }} {{ form.vehicleMake }} {{ form.vehicleModel }}</dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-gray-500">Registration:</dt>
                      <dd class="font-medium text-gray-900">{{ form.vehicleRego }}</dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-gray-500">Odometer:</dt>
                      <dd class="font-medium text-gray-900">{{ form.vehicleOdometer }} km</dd>
                    </div>
                    <div v-if="form.vehicleVin" class="flex justify-between">
                      <dt class="text-gray-500">VIN:</dt>
                      <dd class="font-medium text-gray-900">{{ form.vehicleVin }}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <!-- Booking Details -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar class="h-4 w-4" />
                  Booking Details
                </h4>
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <dt class="text-gray-500">Drop Off:</dt>
                    <dd class="font-medium text-gray-900">
                      {{ formatDate(form.dropOffDate) }}{{ form.dropOffTime ? ` at ${form.dropOffTime}` : '' }}
                    </dd>
                  </div>
                  <div v-if="form.pickUpDate" class="flex justify-between">
                    <dt class="text-gray-500">Pick Up:</dt>
                    <dd class="font-medium text-gray-900">
                      {{ formatDate(form.pickUpDate) }}{{ form.pickUpTime ? ` at ${form.pickUpTime}` : '' }}
                    </dd>
                  </div>
                  <div v-if="form.scheduledService || form.previouslyServiced || form.otherRepairs" class="pt-2 border-t">
                    <dt class="text-gray-500 mb-1">Additional:</dt>
                    <dd class="font-medium text-gray-900">
                      <ul class="list-disc list-inside">
                        <li v-if="form.scheduledService">Booking in for Scheduled Service</li>
                        <li v-if="form.previouslyServiced">Previously serviced by {{ siteName }}</li>
                        <li v-if="form.otherRepairs">Booking for Other Repairs</li>
                      </ul>
                    </dd>
                  </div>
                </dl>
              </div>

              <!-- Service Requests -->
              <div v-if="form.serviceRequests" class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText class="h-4 w-4" />
                  Service & Repair Requests
                </h4>
                <p class="text-sm text-gray-700">{{ form.serviceRequests }}</p>
              </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                :disabled="currentStep === 1"
                @click="prevStep"
              >
                <ChevronLeft class="w-4 h-4 mr-1" />
                Back
              </Button>
              
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500">
                  Step {{ currentStep }} of {{ formSteps.length }}
                </span>
              </div>

              <Button 
                v-if="currentStep < formSteps.length"
                type="submit"
              >
                Next
                <ChevronRight class="w-4 h-4 ml-1" />
              </Button>
              
              <Button 
                v-else
                type="submit"
                :disabled="isSubmitting"
              >
                <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                {{ isSubmitting ? 'Submitting...' : 'Submit Booking' }}
              </Button>
            </div>
          </form>

          <!-- Error Message -->
          <Alert v-if="submitError" variant="destructive" class="mt-6">
            <XCircle class="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{{ submitError }}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>

    <!-- Full Screen Dialog for External Booking -->
    <Dialog v-model:open="showFullScreenDialog">
      <DialogContent
        class="!max-w-none !w-screen !h-screen !rounded-none !p-0 !m-0 !left-0 !top-0 !translate-x-0 !translate-y-0"
      >
        <!-- Custom header with close button -->
        <div class="flex items-center justify-between px-4 py-3 bg-gray-100 border-b absolute top-0 left-0 right-0 z-10">
          <p class="text-sm font-medium text-gray-700 m-0">
            Book Your Service Appointment
          </p>
          <Button
            variant="ghost"
            size="sm"
            @click="showFullScreenDialog = false"
            class="h-8 w-8 p-0"
          >
            <X class="h-5 w-5" />
            <span class="sr-only">Close</span>
          </Button>
        </div>
        <!-- Iframe container -->
        <div class="pt-12 h-full">
          <iframe
            v-if="externalIframeUrl"
            :src="externalIframeUrl"
            class="w-full h-full border-0"
            title="Service Booking - Full Screen"
            allow="geolocation; payment"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  User,
  Car,
  Calendar,
  FileText,
  ClipboardCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Maximize2,
  X
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { DatePicker } from '~/components/ui/date-picker'
import { Stepper, StepperItem, StepperSeparator, StepperTitle, StepperDescription, StepperTrigger } from '~/components/ui/stepper'

// Runtime config
const config = useRuntimeConfig()
const { trackServiceBooking } = useAnalytics()
const { getUtmParams } = useUtmParams()

// Site name from runtime config or fallback
const siteName = computed(() => config.public.siteName || 'Sale Hyundai')

// Service booking settings type
interface ServiceBookingSettings {
  success: boolean
  settings: {
    useExternalBooking: boolean
    externalBookingIframe: string | null
    externalBookingProvider: string | null
  }
}

// Fetch service booking settings to determine internal vs external form
const { data: settingsData, pending: settingsPending } = await useFetch<ServiceBookingSettings>('/api/service-booking-settings', {
  lazy: true,
  default: (): ServiceBookingSettings => ({
    success: true,
    settings: {
      useExternalBooking: false,
      externalBookingIframe: null,
      externalBookingProvider: null,
    },
  }),
})

// Computed properties for external booking
const useExternalBooking = computed(() => settingsData.value?.settings?.useExternalBooking ?? false)

// Extract iframe URL from settings (handles both URL and HTML)
const externalIframeUrl = computed(() => {
  const input = settingsData.value?.settings?.externalBookingIframe?.trim()
  if (!input) return null

  // If it's already a URL
  if (/^https?:\/\//i.test(input)) {
    return input
  }

  // Try to extract src from iframe HTML
  const srcMatch = input.match(/<iframe[^>]*src\s*=\s*["']([^"']+)["']/i)
  if (srcMatch) {
    return srcMatch[1]
  }

  return null
})

// Full screen dialog state
const showFullScreenDialog = ref(false)

// Open external booking in full screen dialog
const openFullScreenDialog = () => {
  showFullScreenDialog.value = true
}

// Stepper configuration
const formSteps = [
  { step: 1, title: 'Your Details', description: 'Contact info', icon: User },
  { step: 2, title: 'Vehicle', description: 'Car details', icon: Car },
  { step: 3, title: 'Booking', description: 'Date & time', icon: Calendar },
  { step: 4, title: 'Review', description: 'Confirm', icon: ClipboardCheck },
]

// Generate years
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 30 }, (_, i) => String(currentYear - i))

// Time slots
const timeSlots = [
  '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
  '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
]

// Min date (tomorrow, excluding weekends)
const minDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  // Skip to Monday if weekend
  const day = tomorrow.getDay()
  if (day === 0) tomorrow.setDate(tomorrow.getDate() + 1) // Sunday -> Monday
  if (day === 6) tomorrow.setDate(tomorrow.getDate() + 2) // Saturday -> Monday
  return tomorrow.toISOString().split('T')[0]
})

// Stepper state
const currentStep = ref(1)

// Form state
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleRego: '',
  vehicleYear: '',
  vehicleVin: '',
  vehicleOdometer: '',
  dropOffDate: '',
  dropOffTime: '',
  pickUpDate: '',
  pickUpTime: '',
  scheduledService: false,
  previouslyServiced: false,
  otherRepairs: false,
  serviceRequests: '',
})

const errors = reactive<Record<string, string>>({})
const isSubmitting = ref(false)
const submitted = ref(false)
const submitError = ref('')

// Format date for display
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-AU', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  })
}

// Step validation
const validateStep = (step: number): boolean => {
  Object.keys(errors).forEach(key => delete errors[key])
  
  if (step === 1) {
    if (!form.firstName.trim()) errors.firstName = 'First name is required'
    if (!form.lastName.trim()) errors.lastName = 'Last name is required'
    if (!form.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email address'
    if (!form.phone.trim()) errors.phone = 'Phone is required'
    else if (!/^[\d\s\-+()]{8,15}$/.test(form.phone)) errors.phone = 'Invalid phone number'
  }
  
  if (step === 2) {
    if (!form.vehicleMake.trim()) errors.vehicleMake = 'Vehicle make is required'
    if (!form.vehicleModel.trim()) errors.vehicleModel = 'Vehicle model is required'
    if (!form.vehicleRego.trim()) errors.vehicleRego = 'Registration is required'
    if (!form.vehicleYear) errors.vehicleYear = 'Year is required'
    if (!form.vehicleOdometer.trim()) errors.vehicleOdometer = 'Odometer is required'
  }
  
  if (step === 3) {
    if (!form.dropOffDate) errors.dropOffDate = 'Drop off date is required'
  }
  
  return Object.keys(errors).length === 0
}

// Navigation
const goToStep = (step: number) => {
  if (step <= currentStep.value) {
    currentStep.value = step
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const nextStep = () => {
  if (currentStep.value < formSteps.length) {
    currentStep.value++
  }
}

// Form submission
const handleStepSubmit = async () => {
  if (!validateStep(currentStep.value)) return
  
  // If not on last step, go to next
  if (currentStep.value < formSteps.length) {
    nextStep()
    return
  }
  
  // Final submission
  isSubmitting.value = true
  submitted.value = false
  submitError.value = ''
  
  try {
    // Format dates for submission
    const dropOffDateTime = form.dropOffDate 
      ? `${formatDate(form.dropOffDate)}${form.dropOffTime ? ` at ${form.dropOffTime}` : ''}`
      : ''
    const pickUpDateTime = form.pickUpDate 
      ? `${formatDate(form.pickUpDate)}${form.pickUpTime ? ` at ${form.pickUpTime}` : ''}`
      : ''

    // Build service types array
    const serviceTypes: string[] = []
    if (form.scheduledService) serviceTypes.push('Scheduled Service')
    if (form.previouslyServiced) serviceTypes.push('Previously Serviced')
    if (form.otherRepairs) serviceTypes.push('Other Repairs')

    // Submit to the new Neon database API
    const response = await $fetch<{ enquiry: { id: string } }>('/api/submit-enquiry', {
      method: 'POST',
      body: {
        type: 'service',
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        message: form.serviceRequests || undefined,
        serviceInfo: {
          serviceType: serviceTypes.join(', ') || 'General Service',
          preferredDate: form.dropOffDate,
          preferredTime: form.dropOffTime || undefined,
          registration: form.vehicleRego,
          odometer: form.vehicleOdometer,
          vehicleMake: form.vehicleMake,
          vehicleModel: form.vehicleModel,
          vehicleYear: form.vehicleYear,
        },
        vehicleInfo: {
          make: form.vehicleMake,
          model: form.vehicleModel,
          year: form.vehicleYear ? parseInt(form.vehicleYear) : undefined,
          registration: form.vehicleRego,
          vin: form.vehicleVin || undefined,
        },
        source: 'service-booking-form',
        // UTM tracking for marketing analytics
        ...getUtmParams(),
      },
    })

    submitted.value = true

    // Track conversion with enhanced analytics
    trackServiceBooking({
      form_location: 'service_booking_page',
      enquiry_id: response.enquiry.id,
      service_type: serviceTypes.join(', ') || 'General Service',
      vehicle_make: form.vehicleMake,
      vehicle_model: form.vehicleModel,
      vehicle_year: form.vehicleYear,
      preferred_date: form.dropOffDate,
      preferred_time: form.dropOffTime,
    })
  } catch (error: any) {
    console.error('Form submission error:', error)
    submitError.value = error?.data?.message || 'Something went wrong. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

// Type declarations
declare global {
  interface Window {
    dataLayer: any[]
  }
}
</script>



