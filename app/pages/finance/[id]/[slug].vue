<template>
  <div class="vehicle-finance-page">
    <!-- Loading -->
    <div v-if="pending" class="flex min-h-[60vh] items-center justify-center">
      <div class="loading-spinner"></div>
    </div>

    <!-- Vehicle Content -->
    <div v-else-if="vehicle" class="finance-content">
      <!-- Header -->
      <div class="finance-header">
        <div class="max-w-7xl mx-auto px-4 py-6">
          <nav class="flex items-center gap-2 text-sm text-white/70 mb-4">
            <NuxtLink to="/" class="hover:text-white">Home</NuxtLink>
            <span>›</span>
            <NuxtLink to="/car-sales" class="hover:text-white">Cars for Sale</NuxtLink>
            <span>›</span>
            <NuxtLink :to="vehicleUrl" class="hover:text-white">{{ headline }}</NuxtLink>
            <span>›</span>
            <span class="text-white">Finance</span>
          </nav>
          
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">Finance Your {{ headline }}</h1>
          <p class="text-lg text-white/80">Calculate your repayments and apply for finance pre-approval</p>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="finance-layout">
          <!-- Vehicle Card -->
          <div class="vehicle-summary-card">
            <div class="vehicle-image-container">
              <NuxtImg
                :src="heroImage"
                :alt="headline"
                class="vehicle-image"
                width="640"
                height="400"
                format="webp"
                quality="80"
              />
              <div v-if="conditionLabel" class="condition-badge">{{ conditionLabel }}</div>
            </div>
            
            <div class="vehicle-details">
              <h2 class="vehicle-title">{{ headline }}</h2>
              
              <div class="vehicle-specs">
                <div v-if="kmsDisplay" class="spec-item">
                  <svg class="spec-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ kmsDisplay }}</span>
                </div>
                <div v-if="transmissionDisplay" class="spec-item">
                  <svg class="spec-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{{ transmissionDisplay }}</span>
                </div>
                <div v-if="fuelDisplay" class="spec-item">
                  <svg class="spec-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                  <span>{{ fuelDisplay }}</span>
                </div>
              </div>

              <!-- Additional Vehicle Information -->
              <div v-if="hasAdditionalInfo" class="vehicle-additional-info">
                <div v-if="bodyDisplay" class="info-row">
                  <span class="info-label">Body Type</span>
                  <span class="info-value">{{ bodyDisplay }}</span>
                </div>
                <div v-if="engineDisplay" class="info-row">
                  <span class="info-label">Engine</span>
                  <span class="info-value">{{ engineDisplay }}</span>
                </div>
                <div v-if="colourDisplay" class="info-row">
                  <span class="info-label">Colour</span>
                  <span class="info-value">{{ colourDisplay }}</span>
                </div>
                <div v-if="interiorColourDisplay" class="info-row">
                  <span class="info-label">Interior Colour</span>
                  <span class="info-value">{{ interiorColourDisplay }}</span>
                </div>
                <div v-if="seatsDisplay" class="info-row">
                  <span class="info-label">Seats</span>
                  <span class="info-value">{{ seatsDisplay }}</span>
                </div>
                <div v-if="doorsDisplay" class="info-row">
                  <span class="info-label">Doors</span>
                  <span class="info-value">{{ doorsDisplay }}</span>
                </div>
                <div v-if="stockIdDisplay" class="info-row">
                  <span class="info-label">Stock #</span>
                  <span class="info-value">{{ stockIdDisplay }}</span>
                </div>
              </div>

              <div class="vehicle-price-section">
                <div class="price-label">Vehicle Price</div>
                <div class="price-value">{{ priceDisplay }}</div>
                <div class="price-sublabel">Drive Away</div>
              </div>

              <NuxtLink :to="vehicleUrl" class="back-to-vehicle-link">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to vehicle details
              </NuxtLink>
            </div>
          </div>

          <!-- Arrow -->
          <div class="finance-arrow">
            <div class="arrow-container">
              <svg class="w-10 h-10 text-[#001E50]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>

          <!-- Arrow Mobile -->
          <div class="finance-arrow-mobile">
            <div class="arrow-container-mobile">
              <svg class="w-8 h-8 text-[#001E50]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            </div>
          </div>

          <!-- Finance Calculator & Form -->
          <div class="finance-calculator-section">
            <Card class="rounded-2xl shadow-xl overflow-hidden">
              <!-- Calculator Header -->
              <div class="bg-gradient-to-br from-[#001E50] to-[#1a4a8a] text-white p-6">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                    </svg>
                  </div>
                  <div class="text-xl font-semibold">Finance Calculator</div>
                </div>

                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div class="flex justify-between">
                    <span class="text-white/80">Interest rate</span>
                    <span class="font-bold">{{ rate.toFixed(2) }}%<sup class="text-xs">^</sup></span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-white/80">Comparison rate</span>
                    <span class="font-bold">{{ comparisonRate.toFixed(2) }}%<sup class="text-xs">#</sup></span>
                  </div>
                </div>
              </div>

              <CardContent class="p-6">
                <!-- Estimated Repayment -->
                <div class="text-center mb-6">
                  <p class="text-gray-600 text-sm mb-1">Estimated repayment</p>
                  <p class="text-4xl font-bold text-gray-900 mb-3">{{ currentPayment }}</p>
                  
                  <div class="inline-flex bg-gray-100 rounded-full p-1">
                    <button 
                      v-for="freq in frequencies" 
                      :key="freq.value"
                      @click="activeTab = freq.value"
                      :class="[
                        'px-4 py-2 text-sm font-medium rounded-full transition-all',
                        activeTab === freq.value 
                          ? 'bg-[#001E50] text-white shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      ]"
                    >
                      {{ freq.label }}
                    </button>
                  </div>
                </div>

                <!-- Loan Term -->
                <div class="mb-4">
                  <Label class="text-gray-700 font-medium mb-3 block">Loan term in years</Label>
                  <div class="flex justify-between items-center gap-2">
                    <button
                      v-for="year in loanTerms"
                      :key="year"
                      @click="setLoanTerm(year)"
                      :class="[
                        'w-10 h-10 rounded-full text-sm font-medium transition-all',
                        length === year * 12
                          ? 'bg-[#001E50] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      ]"
                    >
                      {{ year }}
                    </button>
                  </div>
                </div>

                <!-- Deposit -->
                <div class="mb-4">
                  <div class="flex items-center justify-between">
                    <Label class="text-gray-700 font-medium">Deposit</Label>
                    <div class="flex items-center bg-gray-50 rounded-xl px-4 py-2 border border-gray-200">
                      <span class="text-gray-500 mr-1">$</span>
                      <input 
                        type="number"
                        v-model.number="depositInput"
                        class="w-24 bg-transparent text-right text-gray-900 font-medium focus:outline-none"
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>
                </div>

                <!-- Trade-in -->
                <div class="mb-6">
                  <div class="flex items-center justify-between">
                    <Label class="text-gray-700 font-medium">Trade-in value</Label>
                    <div class="flex items-center bg-gray-50 rounded-xl px-4 py-2 border border-gray-200">
                      <span class="text-gray-500 mr-1">$</span>
                      <input 
                        type="number"
                        v-model.number="tradeInInput"
                        class="w-24 bg-transparent text-right text-gray-900 font-medium focus:outline-none"
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>
                </div>

                <div class="border-t border-gray-200 pt-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Apply for Finance Pre-Approval</h3>

                  <div v-if="!isSubmitted">
                    <form @submit.prevent="submitForm" class="space-y-4">
                      <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                          <Label for="firstName" class="text-gray-700">First Name *</Label>
                          <Input 
                            id="firstName"
                            v-model="form.firstName" 
                            placeholder="First Name"
                            class="rounded-xl h-11"
                            required
                          />
                        </div>
                        <div class="space-y-2">
                          <Label for="lastName" class="text-gray-700">Last Name *</Label>
                          <Input 
                            id="lastName"
                            v-model="form.lastName" 
                            placeholder="Last Name"
                            class="rounded-xl h-11"
                            required
                          />
                        </div>
                      </div>

                      <div class="space-y-2">
                        <Label for="email" class="text-gray-700">Email Address *</Label>
                        <Input 
                          id="email"
                          v-model="form.email" 
                          type="email"
                          placeholder="Email Address"
                          class="rounded-xl h-11"
                          required
                        />
                      </div>

                      <div class="space-y-2">
                        <Label for="phone" class="text-gray-700">Phone Number *</Label>
                        <Input 
                          id="phone"
                          v-model="form.phone" 
                          type="tel"
                          placeholder="Phone Number"
                          class="rounded-xl h-11"
                          required
                        />
                      </div>

                      <div class="space-y-2">
                        <Label for="message" class="text-gray-700">Message</Label>
                        <Textarea 
                          id="message"
                          v-model="form.message" 
                          rows="2"
                          placeholder="Any additional details..."
                          class="rounded-xl"
                        />
                      </div>

                      <!-- Loan Summary -->
                      <Card class="rounded-xl bg-gray-50 border-0">
                        <CardContent class="p-4">
                          <h4 class="font-semibold text-gray-900 mb-3">Loan Summary</h4>
                          <div class="grid grid-cols-2 gap-2 text-sm">
                            <div class="flex justify-between">
                              <span class="text-gray-500">Vehicle:</span>
                              <span class="font-medium">{{ priceDisplay }}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-500">Deposit:</span>
                              <span class="font-medium">{{ formatCurrency(downPayment) }}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-500">Trade-in:</span>
                              <span class="font-medium">{{ formatCurrency(tradeIn) }}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-500">Term:</span>
                              <span class="font-medium">{{ length / 12 }} years</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-500">Interest:</span>
                              <span class="font-medium">{{ rate.toFixed(2) }}%</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-gray-500">Loan amount:</span>
                              <span class="font-medium">{{ formatCurrency(loanAmount) }}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <p class="text-xs text-gray-500 leading-relaxed">
                        Your personal information will be collected, used and stored in strict accordance with our
                        <NuxtLink to="/privacy-policy" class="text-[#001E50] hover:underline" target="_blank">Privacy Policy</NuxtLink>.
                      </p>

                      <Button 
                        type="submit" 
                        :disabled="isSubmitting"
                        class="w-full h-12 rounded-full bg-[#001E50] hover:bg-[#002a6b] text-white font-medium"
                      >
                        <span v-if="isSubmitting" class="mr-2">
                          <svg class="animate-spin h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </span>
                        {{ isSubmitting ? 'Sending...' : 'Submit Finance Application' }}
                      </Button>
                    </form>
                  </div>

                  <!-- Success Message -->
                  <div v-else class="text-center py-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-2">Thank You, {{ form.firstName }}!</h3>
                    <p class="text-gray-600">Your finance pre-approval enquiry has been submitted. One of our team members will be in touch shortly.</p>
                    
                    <NuxtLink :to="vehicleUrl" class="inline-flex items-center gap-2 mt-6 text-[#001E50] font-medium hover:underline">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to vehicle
                    </NuxtLink>
                  </div>
                </div>

                <!-- Disclaimer -->
                <div class="mt-6 text-xs text-gray-500 leading-relaxed">
                  <p>This calculator is for illustrative purposes. Your quote will be based on your personal needs and financial situation ‡</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center px-4">
      <h2 class="text-2xl font-semibold">Vehicle Not Found</h2>
      <p class="text-gray-600">The vehicle you're looking for may no longer be available.</p>
      <NuxtLink to="/car-sales" class="rounded-full bg-[#001E50] px-6 py-3 text-sm font-semibold text-white hover:bg-[#002a6b]">
        Browse All Vehicles
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'

const route = useRoute();
const mainStore = useMainStore();

const vehicleId = computed(() => route.params.id as string);

// Fetch vehicle data
const { data: apiResponse, status } = await useFetch<any>(`/api/vehicle-detail/${vehicleId.value}`, {
  key: `vehicle-finance-${vehicleId.value}`,
});

const pending = computed(() => status.value === 'pending');
const vehicle = computed(() => apiResponse.value?.vehicle || null);

// Helper functions
const getDisplay = (field: any) => {
  if (!field) return '';
  if (typeof field === 'string' || typeof field === 'number') return String(field);
  if (Array.isArray(field?.displayValue)) return field.displayValue[0] || '';
  if (Array.isArray(field?.value)) return field.value[0] || '';
  return '';
};

const formatPrice = (price: any) => {
  if (!price || price === 0 || price === '0') return 'POA';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return 'POA';
  return `$${num.toLocaleString()}`;
};

const formatKms = (v: any) => {
  const kms = v?.kms || v?.odometer?.value?.[0] || v?.odometer?.displayValue?.[0] || v?.odometer;
  if (!kms || kms === 0) return '';
  const num = typeof kms === 'number' ? kms : parseFloat(String(kms));
  return isNaN(num) ? '' : `${num.toLocaleString()} km`;
};

const vehicleTitle = (v: any) => {
  if (!v) return 'Vehicle';
  const year = getDisplay(v.year);
  const make = getDisplay(v.make);
  const model = getDisplay(v.model);
  const badge = getDisplay(v.variant) || getDisplay(v.badge);
  return [year, make, model, badge].filter(Boolean).join(' ').trim() || v.title || 'Vehicle';
};

// Vehicle computed properties
const headline = computed(() => vehicleTitle(vehicle.value));
const conditionLabel = computed(() => {
  const cond = getDisplay(vehicle.value?.condition);
  return cond ? cond.charAt(0).toUpperCase() + cond.slice(1) : '';
});

const priceDisplay = computed(() => {
  const price = vehicle.value?.price || vehicle.value?.egc_price;
  return formatPrice(price);
});

const priceNumber = computed(() => {
  const price = vehicle.value?.price || vehicle.value?.egc_price;
  if (!price) return 0;
  return typeof price === 'string' ? parseFloat(price) : price;
});

const heroImage = computed(() => {
  if (!vehicle.value) return '';
  const photos = vehicle.value.photos || vehicle.value.images || [];
  if (photos.length > 0) return photos[0];
  return vehicle.value.thumb || vehicle.value.main_photo_url || '';
});

const kmsDisplay = computed(() => formatKms(vehicle.value));
const fuelDisplay = computed(() => getDisplay(vehicle.value?.fuel));
const transmissionDisplay = computed(() => getDisplay(vehicle.value?.transmission));
const bodyDisplay = computed(() => getDisplay(vehicle.value?.body));
const engineDisplay = computed(() => {
  const engine = getDisplay(vehicle.value?.engine);
  if (engine) return engine;
  // Try to get engine size from attributes
  const engineSize = vehicle.value?.attributes?.find((a: any) => a.Name === 'EngineSize')?.Value;
  if (engineSize) return `${engineSize}cc`;
  return '';
});
const colourDisplay = computed(() => {
  return getDisplay(vehicle.value?.colour) || vehicle.value?.genericolour || '';
});
const interiorColourDisplay = computed(() => {
  return vehicle.value?.interiorcolour || vehicle.value?.interior_colour || '';
});
const seatsDisplay = computed(() => getDisplay(vehicle.value?.seats));
const doorsDisplay = computed(() => getDisplay(vehicle.value?.doors));
const stockIdDisplay = computed(() => {
  return vehicle.value?.stockid || vehicle.value?.stockNumber || vehicle.value?.identifier || '';
});

const hasAdditionalInfo = computed(() => {
  return !!(bodyDisplay.value || engineDisplay.value || colourDisplay.value || interiorColourDisplay.value || seatsDisplay.value || doorsDisplay.value || stockIdDisplay.value);
});

const vehicleUrl = computed(() => {
  const slug = route.params.slug as string;
  return `/vehicle-for-sale/${vehicleId.value}/${slug}`;
});

// Calculator state
const depositInput = ref(0);
const tradeInInput = ref(0);
const lengthInYears = ref(5);
const rateValue = ref(11.09);

const activeTab = ref<'weekly' | 'fortnightly' | 'monthly'>('weekly');

const frequencies = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

const loanTerms = [1, 2, 3, 4, 5, 6, 7];

// Computed values
const downPayment = computed(() => depositInput.value);
const tradeIn = computed(() => tradeInInput.value);
const length = computed(() => lengthInYears.value * 12);
const rate = computed(() => rateValue.value);
const comparisonRate = computed(() => rate.value + 0.99);

// Form state
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  message: ''
});

const isSubmitting = ref(false);
const isSubmitted = ref(false);

// Calculations
const loanAmount = computed(() => Math.max(0, priceNumber.value - downPayment.value - tradeIn.value));

const calcMonthlyPayment = computed(() => {
  const p = loanAmount.value;
  const r = rate.value / 1200;
  const n = length.value;
  if (r === 0) return p / n;
  const i = Math.pow(1 + r, n);
  return (p * r * i) / (i - 1) || 0;
});

const calcFortnightlyPayment = computed(() => {
  return (calcMonthlyPayment.value * 12) / 26;
});

const calcWeeklyPayment = computed(() => {
  return (calcMonthlyPayment.value * 12) / 52;
});

const currentPayment = computed(() => {
  let payment = 0;
  switch (activeTab.value) {
    case 'weekly':
      payment = calcWeeklyPayment.value;
      break;
    case 'fortnightly':
      payment = calcFortnightlyPayment.value;
      break;
    case 'monthly':
      payment = calcMonthlyPayment.value;
      break;
  }
  return '$' + payment.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});

// Helpers
const formatCurrency = (value: number) => {
  return '$' + value.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const setLoanTerm = (years: number) => {
  lengthInYears.value = years;
};

// Submit form
const submitForm = async () => {
  if (!form.firstName || !form.lastName || !form.email || !form.phone) {
    return;
  }

  isSubmitting.value = true;

  try {
    // Submit to the new Neon database API
    const response = await $fetch<{ enquiry: { id: string } }>('/api/submit-enquiry', {
      method: 'POST',
      body: {
        type: 'finance',
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        message: form.message || undefined,
        vehicleInfo: {
          stockId: vehicleId.value,
          make: getDisplay(vehicle.value?.make),
          model: getDisplay(vehicle.value?.model),
          year: getDisplay(vehicle.value?.year),
          variant: getDisplay(vehicle.value?.variant) || getDisplay(vehicle.value?.badge),
          price: priceNumber.value,
          condition: getDisplay(vehicle.value?.condition),
          colour: colourDisplay.value,
          thumbnail: heroImage.value,
          kms: kmsDisplay.value,
          transmission: transmissionDisplay.value,
          fuel: fuelDisplay.value,
          body: bodyDisplay.value,
          engine: engineDisplay.value,
        },
        financeInfo: {
          vehiclePrice: priceNumber.value,
          deposit: downPayment.value,
          tradeInValue: tradeIn.value,
          loanAmount: loanAmount.value,
          loanTermMonths: length.value,
          loanTermYears: lengthInYears.value,
          interestRate: rate.value,
          comparisonRate: comparisonRate.value,
          weeklyPayment: Math.round(calcWeeklyPayment.value * 100) / 100,
          fortnightlyPayment: Math.round(calcFortnightlyPayment.value * 100) / 100,
          monthlyPayment: Math.round(calcMonthlyPayment.value * 100) / 100,
          paymentFrequency: activeTab.value,
          selectedPayment: currentPayment.value,
        },
        financeInterest: true,
        source: 'vehicle-finance-calculator',
      },
    });

    isSubmitted.value = true;

    // GTM tracking
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'FormSubmission',
        formType: 'finance',
        formStatus: 'submitted',
        enquiryId: response.enquiry.id,
        vehicleId: vehicleId.value,
        vehicleName: headline.value,
        vehiclePrice: priceNumber.value,
      });
    }
  } catch (error) {
    console.error('Form submission error:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// SEO
useSeoMeta({
  title: () => `Finance ${headline.value} | Sale Hyundai`,
  description: () => `Calculate finance repayments and apply for pre-approval on this ${headline.value}. ${priceDisplay.value} drive away.`,
});
</script>

<style scoped>
.vehicle-finance-page {
  min-height: 100vh;
  background: #f8fafc;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: #001E50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.finance-header {
  background: linear-gradient(135deg, #001E50 0%, #1a4a8a 100%);
}

.finance-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: start;
}

@media (min-width: 1024px) {
  .finance-layout {
    grid-template-columns: 1fr auto 1fr;
    gap: 2rem;
  }
}

.vehicle-summary-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.vehicle-image-container {
  position: relative;
  aspect-ratio: 16/10;
  background: #f1f5f9;
}

.vehicle-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.condition-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: #001E50;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.vehicle-details {
  padding: 1.5rem;
}

.vehicle-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1rem;
}

.vehicle-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.spec-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.vehicle-price-section {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
}

.price-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.05em;
}

.price-value {
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
}

.price-sublabel {
  font-size: 0.75rem;
  color: #64748b;
}

.back-to-vehicle-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #001E50;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.back-to-vehicle-link:hover {
  color: #002a6b;
  text-decoration: underline;
}

.finance-arrow {
  display: none;
  align-items: center;
  justify-content: center;
}

@media (min-width: 1024px) {
  .finance-arrow {
    display: flex;
    align-self: center;
  }
}

.arrow-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 44, 95, 0.15);
}

.finance-arrow-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;
}

@media (min-width: 1024px) {
  .finance-arrow-mobile {
    display: none;
  }
}

.arrow-container-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 44, 95, 0.15);
  animation: bounce-down 2s ease-in-out infinite;
}

@keyframes bounce-down {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

.finance-calculator-section {
  max-width: 500px;
  width: 100%;
}

@media (min-width: 1024px) {
  .finance-calculator-section {
    justify-self: start;
  }
  
  .vehicle-summary-card {
    justify-self: end;
    max-width: 450px;
    position: sticky;
    top: 1rem;
    align-self: start;
  }
}

.vehicle-additional-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.info-label {
  color: #64748b;
  font-weight: 500;
}

.info-value {
  color: #0f172a;
  font-weight: 600;
  text-align: right;
}
</style>
