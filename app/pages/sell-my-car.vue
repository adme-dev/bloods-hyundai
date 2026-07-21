<template>
  <div class="min-h-screen bg-slate-50">
    <LazyPageSchema />

    <!-- Hero Section -->
    <section class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center">
          <div class="max-w-3xl">
            <p class="text-sm font-semibold uppercase tracking-wide text-sky-600">Sell my car</p>
            <h1 class="mt-3 text-4xl font-bold tracking-tight text-[#001E50] sm:text-5xl">
              Sell your car to {{ siteName }}.
            </h1>
            <p class="mt-5 text-lg leading-8 text-slate-600">
              Share your vehicle details and photos, and our used car team will review it quickly with a clear next step.
            </p>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#valuation-form"
                class="inline-flex min-h-12 items-center justify-center rounded px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#001842] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#001E50] focus-visible:ring-offset-2"
                style="background-color: #001E50;"
              >
                Start valuation
              </a>
              <NuxtLink
                to="/car-sales"
                class="inline-flex min-h-12 items-center justify-center rounded border border-slate-300 bg-white px-6 text-sm font-semibold text-[#001E50] transition hover:border-[#001E50] hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#001E50] focus-visible:ring-offset-2"
              >
                Browse current stock
              </NuxtLink>
            </div>
          </div>

          <figure class="relative min-h-[320px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm sm:min-h-[380px] lg:min-h-[420px]">
            <picture>
              <source media="(max-width: 639px)" :srcset="heroImageMobile">
              <img
                :src="heroImageDesktop"
                :alt="`${siteName} vehicle valuation`"
                class="absolute inset-0 h-full w-full object-cover"
                width="1400"
                height="525"
                loading="eager"
                fetchpriority="high"
              >
            </picture>
            <figcaption class="absolute inset-x-0 bottom-0 bg-[#001E50]/90 p-5 text-white">
              <p class="text-xs font-semibold uppercase tracking-wide text-sky-200">{{ siteName }} appraisal team</p>
              <p class="mt-1 text-lg font-semibold">Fast, fair valuation with a local team.</p>
            </figcaption>
          </figure>
        </div>

        <div class="mt-8 grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-3">
          <div v-for="item in processSteps" :key="item.title" class="flex gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#001E50] text-white">
              <component :is="item.icon" class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900">{{ item.title }}</h3>
              <p class="mt-1 text-sm leading-6 text-slate-600">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stepper Form Section -->
    <div id="valuation-form" class="py-8 sm:py-12">
      <div class="mx-auto max-w-4xl px-6 lg:px-8">
        <Card class="border-slate-200 shadow-sm">
          <CardHeader class="pb-6 pt-8">
            <div class="mb-8">
              <p class="text-sm font-semibold uppercase tracking-wide text-sky-600">Vehicle valuation request</p>
              <h2 class="mt-2 text-2xl font-bold tracking-tight text-[#001E50]">Tell us about your car</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                The more accurate the details and photos, the faster our team can assess the vehicle.
              </p>
            </div>

            <!-- Horizontal Stepper -->
            <Stepper v-model="currentStep" class="flex w-full items-start gap-2">
              <StepperItem
                v-for="step in formSteps"
                :key="step.step"
                v-slot="slotProps"
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
                      getStepperState(slotProps) === 'completed' && 'border-[#001E50] bg-[#001E50] text-white',
                      getStepperState(slotProps) === 'active' && 'border-[#001E50] bg-[#001E50] text-white ring-4 ring-blue-100',
                      getStepperState(slotProps) === 'inactive' && 'border-gray-200 bg-white text-gray-400 cursor-default'
                    ]"
                    :disabled="getStepperState(slotProps) === 'inactive'"
                    @click="getStepperState(slotProps) !== 'inactive' && goToStep(step.step)"
                  >
                    <Check v-if="getStepperState(slotProps) === 'completed'" class="h-5 w-5" />
                    <span v-else>{{ step.step }}</span>
                  </button>
                </StepperTrigger>

                <!-- Step Labels -->
                <div class="mt-3 flex flex-col items-center text-center">
                  <StepperTitle 
                    class="text-xs sm:text-sm font-semibold transition-colors m-0"
                    :class="[
                      getStepperState(slotProps) === 'active' && 'text-[#001E50]',
                      getStepperState(slotProps) === 'completed' && 'text-gray-700',
                      getStepperState(slotProps) === 'inactive' && 'text-gray-400'
                    ]"
                  >
                    {{ step.title }}
                  </StepperTitle>
                  <StepperDescription 
                    class="hidden sm:block text-xs mt-0.5 transition-colors"
                    :class="[
                      getStepperState(slotProps) === 'active' && 'text-[#001E50]/70',
                      getStepperState(slotProps) === 'completed' && 'text-gray-500',
                      getStepperState(slotProps) === 'inactive' && 'text-gray-400'
                    ]"
                  >
                    {{ step.description }}
                  </StepperDescription>
                </div>
              </StepperItem>
            </Stepper>
          </CardHeader>
          
          <CardContent class="pt-6">
            <form @submit.prevent="handleStepSubmit">
              <!-- Step 1: Personal Details -->
              <div v-show="currentStep === 1" class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-1">Personal Details</h3>
                <p class="mb-4 text-sm text-slate-500">We will use these details only to contact you about this valuation request.</p>
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
                      placeholder="Enter your email"
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
              <div v-show="currentStep === 2" class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-1">Vehicle Details</h3>
                <p class="mb-4 text-sm text-slate-500">Registration, odometer and condition help us provide a realistic appraisal.</p>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="year">Year <span class="text-red-500">*</span></Label>
                    <Select v-model="form.year">
                      <SelectTrigger :class="{ 'border-red-500': errors.year }">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="year in years" :key="year" :value="year">
                          {{ year }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p v-if="errors.year" class="text-sm text-red-500">{{ errors.year }}</p>
                  </div>
                  <div class="space-y-2">
                    <Label for="make">Vehicle Make <span class="text-red-500">*</span></Label>
                    <Input 
                      id="make" 
                      v-model="form.make" 
                      placeholder="e.g. Hyundai, Toyota"
                      :class="{ 'border-red-500': errors.make }"
                    />
                    <p v-if="errors.make" class="text-sm text-red-500">{{ errors.make }}</p>
                  </div>
                  <div class="space-y-2">
                    <Label for="model">Vehicle Model <span class="text-red-500">*</span></Label>
                    <Input 
                      id="model" 
                      v-model="form.model" 
                      placeholder="e.g. i30, Tucson"
                      :class="{ 'border-red-500': errors.model }"
                    />
                    <p v-if="errors.model" class="text-sm text-red-500">{{ errors.model }}</p>
                  </div>
                  <div class="space-y-2">
                    <Label for="grade">Vehicle Grade <span class="text-red-500">*</span></Label>
                    <Input 
                      id="grade" 
                      v-model="form.grade" 
                      placeholder="e.g. Active, Elite, N Line"
                      :class="{ 'border-red-500': errors.grade }"
                    />
                    <p v-if="errors.grade" class="text-sm text-red-500">{{ errors.grade }}</p>
                  </div>
                  <div class="space-y-2">
                    <Label for="vin">VIN Number</Label>
                    <Input 
                      id="vin" 
                      v-model="form.vin" 
                      placeholder="Optional"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="registration">Registration <span class="text-red-500">*</span></Label>
                    <Input 
                      id="registration" 
                      v-model="form.registration" 
                      placeholder="e.g. ABC123"
                      :class="{ 'border-red-500': errors.registration }"
                    />
                    <p v-if="errors.registration" class="text-sm text-red-500">{{ errors.registration }}</p>
                  </div>
                  <div class="space-y-2">
                    <Label for="odometer">Odometer (km) <span class="text-red-500">*</span></Label>
                    <Input 
                      id="odometer" 
                      type="number"
                      v-model="form.odometer" 
                      placeholder="Current reading"
                      :class="{ 'border-red-500': errors.odometer }"
                    />
                    <p v-if="errors.odometer" class="text-sm text-red-500">{{ errors.odometer }}</p>
                  </div>
                  <div class="space-y-2">
                    <Label for="condition">Vehicle Condition <span class="text-red-500">*</span></Label>
                    <Select v-model="form.condition">
                      <SelectTrigger :class="{ 'border-red-500': errors.condition }">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <p v-if="errors.condition" class="text-sm text-red-500">{{ errors.condition }}</p>
                  </div>
                  <div class="space-y-2">
                    <Label for="tyreCondition">Tyre Condition <span class="text-red-500">*</span></Label>
                    <Select v-model="form.tyreCondition">
                      <SelectTrigger :class="{ 'border-red-500': errors.tyreCondition }">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <p v-if="errors.tyreCondition" class="text-sm text-red-500">{{ errors.tyreCondition }}</p>
                  </div>
                  <div class="space-y-2">
                    <Label for="serviceHistory">Full Service History <span class="text-red-500">*</span></Label>
                    <Select v-model="form.serviceHistory">
                      <SelectTrigger :class="{ 'border-red-500': errors.serviceHistory }">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <p v-if="errors.serviceHistory" class="text-sm text-red-500">{{ errors.serviceHistory }}</p>
                  </div>
                  <div class="space-y-2">
                    <Label for="oneOwner">One Owner <span class="text-red-500">*</span></Label>
                    <Select v-model="form.oneOwner">
                      <SelectTrigger :class="{ 'border-red-500': errors.oneOwner }">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <p v-if="errors.oneOwner" class="text-sm text-red-500">{{ errors.oneOwner }}</p>
                  </div>
                </div>
              </div>

              <!-- Step 3: Vehicle Photos -->
              <div v-show="currentStep === 3" class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Vehicle Photos</h3>
                <p class="text-sm text-gray-500 mb-4">
                  Upload at least one photo. Exterior, interior, odometer and service book photos help us review it faster.
                </p>
                <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div v-for="(_, index) in 6" :key="index" class="space-y-2">
                    <Label class="text-xs">Photo {{ index + 1 }} {{ index === 0 ? '*' : '' }}</Label>
                    <ImageUpload
                      v-model="form.photos[index]"
                      :required="index === 0"
                      :has-error="index === 0 && !!errors.photos"
                      :upload-to-r2="!!dealerApiKey"
                      :dealer-api-key="dealerApiKey"
                    />
                  </div>
                </div>
                <p v-if="errors.photos" class="text-sm text-red-500">{{ errors.photos }}</p>
              </div>

              <!-- Step 4: Additional Info -->
              <div v-show="currentStep === 4" class="space-y-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-1">Additional Information</h3>
                <p class="mb-4 text-sm text-slate-500">Let us know about anything that could affect the vehicle value.</p>
                
                <!-- Toggles Section -->
                <div class="space-y-4">
                  <div class="space-y-3">
                    <div class="flex items-center space-x-3">
                      <Switch 
                        :checked="form.hasHailDamage" 
                        @update:checked="form.hasHailDamage = $event"
                      />
                      <Label>Previous Hail Damage?</Label>
                    </div>
                    <div v-if="form.hasHailDamage" class="ml-14">
                      <Textarea 
                        v-model="form.hailDamageDetails" 
                        placeholder="Describe the damage..."
                        :rows="2"
                      />
                    </div>
                  </div>

                  <div class="space-y-3">
                    <div class="flex items-center space-x-3">
                      <Switch 
                        :checked="form.hasFinance" 
                        @update:checked="form.hasFinance = $event"
                      />
                      <Label>Finance Owing?</Label>
                    </div>
                    <div v-if="form.hasFinance" class="ml-14">
                      <Textarea 
                        v-model="form.financeDetails" 
                        placeholder="Finance company, amount..."
                        :rows="2"
                      />
                    </div>
                  </div>

                  <div class="space-y-3">
                    <div class="flex items-center space-x-3">
                      <Switch 
                        :checked="form.hasKnownFaults" 
                        @update:checked="form.hasKnownFaults = $event"
                      />
                      <Label>Known Faults?</Label>
                    </div>
                    <div v-if="form.hasKnownFaults" class="ml-14">
                      <Textarea 
                        v-model="form.knownFaultsDetails" 
                        placeholder="Describe any faults..."
                        :rows="2"
                      />
                    </div>
                  </div>
                </div>

                <!-- Text Fields -->
                <div class="space-y-4 pt-4 border-t">
                  <div class="space-y-2">
                    <Label for="accessories">Additional Accessories</Label>
                    <Textarea 
                      id="accessories"
                      v-model="form.accessories" 
                      placeholder="Roof racks, tow bar, etc."
                      :rows="2"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="comments">Additional Comments</Label>
                    <Textarea 
                      id="comments"
                      v-model="form.comments" 
                      placeholder="Anything else about your vehicle..."
                      :rows="2"
                    />
                  </div>
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
                  {{ isSubmitting ? 'Submitting...' : 'Submit' }}
                </Button>
              </div>
            </form>

            <!-- Success Message -->
            <Alert v-if="submitted" variant="success" class="mt-6">
              <CheckCircle2 class="h-4 w-4" />
              <AlertTitle>Thank You!</AlertTitle>
              <AlertDescription>
                Your submission has been received. We will review your vehicle details and contact you within 24-48 hours with a valuation.
              </AlertDescription>
            </Alert>

            <!-- Error Message -->
            <Alert v-if="submitError" variant="destructive" class="mt-6">
              <XCircle class="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{{ submitError }}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Why Sell to Us Section -->
    <div class="py-12 sm:py-16 bg-white">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 class="text-2xl font-bold tracking-tight text-gray-900 text-center mb-10">
          Why Sell to {{ siteName }}?
        </h2>
        
        <div class="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <div v-for="(benefit, index) in benefits" :key="index" class="text-center">
            <div class="flex justify-center">
              <div class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <component :is="benefit.icon" class="h-7 w-7 text-[#001E50]" />
              </div>
            </div>
            <h3 class="mt-3 text-sm font-semibold text-gray-900">{{ benefit.title }}</h3>
            <p class="mt-1 text-xs text-gray-500">{{ benefit.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { User, Car, Camera, FileText, Tag, Clock, FileCheck, Users, Check, ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle } from 'lucide-vue-next'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Stepper, StepperItem, StepperSeparator, StepperTitle, StepperDescription, StepperTrigger } from '~/components/ui/stepper'
import ImageUpload from '~/components/form-elements/ImageUpload.vue'
import { useAnalytics } from '~/composables/useAnalytics'

// Runtime config
const config = useRuntimeConfig()
const { siteName } = useSiteIdentity();

// Analytics
const { trackSellMyCar } = useAnalytics()

// Dealer API key for R2 uploads and CRM integration
// This should be set in the environment or fetched from dealer settings
const dealerApiKey = computed(() => {
  // Check for dealer API key in runtime config
  return config.public.dealerApiKey || ''
})

// Fetch WordPress page content
const { data: page } = await useAsyncData(
  'page-sell-my-car',
  async () => {
    try {
      const response = await $fetch<any>('/api/page/sell-my-car')
      return response?.page || response
    } catch {
      return null
    }
  }
)

const pageHeroImages = computed(() =>
  extractPageHeroImages(page.value?.content?.rendered || '')
)

const heroImageDesktop = computed(() =>
  pageHeroImages.value.desktop ||
  page.value?.featuredImage?.source_url ||
  page.value?.featuredImage?.url ||
  page.value?.yoast_head_json?.og_image?.[0]?.url ||
  '/images/placeholder-car.svg'
)

const heroImageMobile = computed(() =>
  pageHeroImages.value.mobile ||
  heroImageDesktop.value
)

// SEO - use the same pattern as [slug].vue
useSeoMeta({
  title: () => page.value?.yoast_head_json?.title || page.value?.title?.rendered || 'Sell Your Car',
  description: () => page.value?.yoast_head_json?.description || `Sell your car to ${siteName.value}. Upload your vehicle details and photos to request a competitive valuation from our used car team.`,
  ogTitle: () => page.value?.yoast_head_json?.og_title || page.value?.title?.rendered || 'Sell Your Car',
  ogDescription: () => page.value?.yoast_head_json?.og_description || `Sell your car to ${siteName.value}. Request a quick used car valuation online.`,
  ogImage: () => heroImageDesktop.value,
})

// Stepper configuration
const formSteps = [
  { step: 1, title: 'Personal', description: 'Your details', icon: User },
  { step: 2, title: 'Vehicle', description: 'Car info', icon: Car },
  { step: 3, title: 'Photos', description: 'Upload images', icon: Camera },
  { step: 4, title: 'Additional', description: 'Extra info', icon: FileText },
]

const benefits = [
  { icon: Tag, title: 'Fair Pricing', description: 'Competitive market rates' },
  { icon: Clock, title: 'Fast Process', description: '24-48 hour valuation' },
  { icon: FileCheck, title: 'No Hidden Fees', description: 'Transparent pricing' },
  { icon: Users, title: 'Expert Team', description: 'Years of experience' },
]

function extractPageHeroImages(html: string): { desktop?: string; mobile?: string } {
  const imageTags = html.match(/<img\b[^>]*>/gi) || []
  const images = imageTags
    .map((tag) => ({
      src: decodeHtmlAttribute(
        getHtmlAttribute(tag, 'data-src') ||
        getHtmlAttribute(tag, 'src') ||
        getHtmlAttribute(tag, 'data-lazy-src')
      ),
      className: getHtmlAttribute(tag, 'class') || '',
      width: Number(getHtmlAttribute(tag, 'width') || 0),
      height: Number(getHtmlAttribute(tag, 'height') || 0),
    }))
    .filter((image) => Boolean(image.src))

  const mobile = images.find((image) =>
    /uk-hidden@s|mobile|767|975/i.test(`${image.className} ${image.src}`)
  )?.src

  const desktop = images.find((image) =>
    /uk-visible@s|desktop|1920|720/i.test(`${image.className} ${image.src}`)
  )?.src || images
    .slice()
    .sort((a, b) => (b.width * b.height) - (a.width * a.height))[0]
    ?.src

  return {
    desktop,
    mobile,
  }
}

function getHtmlAttribute(tag: string, attribute: string): string | undefined {
  const pattern = new RegExp(`${attribute}=(["'])(.*?)\\1`, 'i')
  return tag.match(pattern)?.[2]
}

function decodeHtmlAttribute(value?: string): string | undefined {
  if (!value) return undefined

  return value
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
}

const processSteps = [
  { icon: FileText, title: 'Submit the basics', description: 'Tell us the make, model, kilometres and registration details.' },
  { icon: Camera, title: 'Add clear photos', description: 'Upload exterior, interior and odometer images for a better appraisal.' },
  { icon: Clock, title: 'We review it', description: 'Our used car team checks the details and gets back to you with the next step.' },
]

type StepperState = 'active' | 'completed' | 'inactive'

const getStepperState = (slotProps: { state?: unknown }): StepperState => {
  const state = slotProps.state
  return state === 'active' || state === 'completed' || state === 'inactive'
    ? state
    : 'inactive'
}

// Generate years
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 30 }, (_, i) => String(currentYear - i))

// Stepper state
const currentStep = ref(1)

// Form state
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  year: '',
  make: '',
  model: '',
  grade: '',
  vin: '',
  registration: '',
  odometer: '',
  condition: '',
  tyreCondition: '',
  serviceHistory: '',
  oneOwner: '',
  photos: ['', '', '', '', '', ''] as string[],
  hasHailDamage: false,
  hailDamageDetails: '',
  hasFinance: false,
  financeDetails: '',
  hasKnownFaults: false,
  knownFaultsDetails: '',
  accessories: '',
  comments: '',
})

const errors = reactive<Record<string, string>>({})
const isSubmitting = ref(false)
const submitted = ref(false)
const submitError = ref('')

// Step validation
const validateStep = (step: number): boolean => {
  Object.keys(errors).forEach(key => delete errors[key])
  
  if (step === 1) {
    if (!form.firstName) errors.firstName = 'Required'
    if (!form.lastName) errors.lastName = 'Required'
    if (!form.email) errors.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email'
    if (!form.phone) errors.phone = 'Required'
    else if (!/^[\d\s\-+()]{8,15}$/.test(form.phone)) errors.phone = 'Invalid phone'
  }
  
  if (step === 2) {
    if (!form.year) errors.year = 'Required'
    if (!form.make) errors.make = 'Required'
    if (!form.model) errors.model = 'Required'
    if (!form.grade) errors.grade = 'Required'
    if (!form.registration) errors.registration = 'Required'
    if (!form.odometer) errors.odometer = 'Required'
    if (!form.condition) errors.condition = 'Required'
    if (!form.tyreCondition) errors.tyreCondition = 'Required'
    if (!form.serviceHistory) errors.serviceHistory = 'Required'
    if (!form.oneOwner) errors.oneOwner = 'Required'
  }
  
  if (step === 3) {
    if (!form.photos[0]) errors.photos = 'At least one photo required'
  }
  
  return Object.keys(errors).length === 0
}

// Navigation
const goToStep = (step: number) => {
  // Only allow going to completed steps or current step
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
    await $fetch('/api/sell-my-car', {
      method: 'POST',
      headers: dealerApiKey.value
        ? {
            'X-Dealer-Key': dealerApiKey.value,
          }
        : undefined,
      body: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        year: form.year,
        make: form.make,
        model: form.model,
        grade: form.grade,
        vin: form.vin,
        registration: form.registration,
        odometer: form.odometer,
        condition: form.condition,
        tyreCondition: form.tyreCondition,
        serviceHistory: form.serviceHistory,
        oneOwner: form.oneOwner,
        photos: form.photos.filter(Boolean),
        hasHailDamage: form.hasHailDamage,
        hailDamageDetails: form.hailDamageDetails,
        hasFinance: form.hasFinance,
        financeDetails: form.financeDetails,
        hasKnownFaults: form.hasKnownFaults,
        knownFaultsDetails: form.knownFaultsDetails,
        accessories: form.accessories,
        comments: form.comments,
        ...useUtmParams().getUtmParams(),
      },
    })

    submitted.value = true

    // Track sell my car form submission (GA4 + Facebook Pixel + GTM)
    const uploadedPhotos = form.photos.filter(Boolean)
    trackSellMyCar({
      form_location: 'sell_my_car_page',
      vehicle_make: form.make,
      vehicle_model: form.model,
      vehicle_year: form.year,
      odometer: form.odometer ? parseInt(form.odometer) : undefined,
      condition: form.condition,
      has_photos: uploadedPhotos.length > 0,
      photos_count: uploadedPhotos.length,
    })
  } catch (error: any) {
    console.error('Form submission error:', error)
    submitError.value = error?.data?.message || 'Something went wrong. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

</script>
