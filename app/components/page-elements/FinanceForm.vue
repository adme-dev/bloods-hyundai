<template>
  <div id="finance_form" class="finance-form-container p-6">
    <!-- Calculator Section -->
    <div class="finance-calculator max-w-md mx-auto w-full">
      <Card class="overflow-hidden rounded-3xl shadow-xl">
        <!-- Header with gradient -->
        <div class="bg-gradient-to-br from-[#001E50] to-[#1a4a8a] text-white p-6 pb-8">
          <div class="flex items-center justify-center gap-3 mb-4">
            <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
              </svg>
            </div>
            <div class="text-2xl font-semibold">Finance</div>
          </div>
          
          <h2 class="text-center text-lg font-medium mb-6 text-white">
            Consumer Finance Calculator <sup>‡</sup>
          </h2>

          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-white/90">Vehicle price</span>
              <span class="text-xl font-bold text-white">{{ formatCurrency(retail) }}<sup class="text-xs text-white/70">*</sup></span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-white/90">Interest rate</span>
              <span class="text-xl font-bold text-white">{{ rate.toFixed(2) }}%<sup class="text-xs text-white/70">^</sup></span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-white/90">Comparison rate</span>
              <span class="text-xl font-bold text-white">{{ comparisonRate.toFixed(2) }}%<sup class="text-xs text-white/70">#</sup></span>
            </div>
          </div>
        </div>

        <CardContent class="p-0">
          <!-- Estimated Repayment Card -->
          <div class="mx-4 -mt-4 relative z-10">
            <Card class="rounded-2xl shadow-lg border-0">
              <CardContent class="p-5 text-center">
                <p class="text-gray-600 text-sm font-medium mb-1">Estimated repayment</p>
                <p class="text-3xl font-bold text-gray-900 mb-4">{{ currentPayment }}</p>
                
                <!-- Payment frequency tabs -->
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
              </CardContent>
            </Card>
          </div>

          <!-- Loan Term -->
          <div class="p-4 mt-4">
            <Card class="rounded-2xl border border-gray-200 shadow-sm">
              <CardContent class="p-5">
                <Label class="text-gray-700 font-medium mb-4 block">Loan term in years</Label>
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
              </CardContent>
            </Card>
          </div>

          <!-- Deposit -->
          <div class="px-4">
            <Card class="rounded-2xl border border-gray-200 shadow-sm">
              <CardContent class="p-5">
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
              </CardContent>
            </Card>
          </div>

          <!-- Trade-in / Balloon -->
          <div class="p-4">
            <Card class="rounded-2xl border border-gray-200 shadow-sm">
              <CardContent class="p-5">
                <div class="flex items-center gap-2 mb-4">
                  <Label class="text-gray-700 font-medium">Trade-in value</Label>
                  <button class="w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-300">
                    ?
                  </button>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                    <input 
                      type="number"
                      v-model.number="tradeInInput"
                      class="w-full bg-transparent text-gray-900 font-medium focus:outline-none"
                      min="0"
                      step="100"
                    />
                  </div>
                  <div class="flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                    <span class="text-gray-500 mr-1">$</span>
                    <span class="text-gray-900 font-medium">{{ formatNumber(tradeIn) }}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Disclaimer -->
          <div class="px-4 pb-6 text-xs text-gray-500 leading-relaxed">
            <p>This calculator is for illustrative purposes. Your quote will be based on your personal needs and financial situation ‡</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Arrow Between Cards -->
    <div class="finance-arrow hidden lg:flex items-center justify-center">
      <div class="arrow-container">
        <svg class="w-16 h-16 text-[#001E50]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </div>
    </div>

    <!-- Mobile Arrow (pointing down) -->
    <div class="finance-arrow-mobile flex lg:hidden items-center justify-center py-4">
      <div class="arrow-container">
        <svg class="w-12 h-12 text-[#001E50]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      </div>
    </div>

    <!-- Form Section -->
    <div class="finance-form max-w-md mx-auto w-full">
      <Card class="rounded-3xl shadow-xl overflow-hidden">
        <CardHeader class="bg-gradient-to-br from-[#001E50] to-[#1a4a8a] text-white text-center py-8">
          <CardTitle class="text-2xl font-semibold text-white">Start Your Adventure</CardTitle>
          <CardDescription class="text-white uppercase text-sm mt-1">
            Pre-Approval {{ siteName }}
          </CardDescription>
        </CardHeader>

        <CardContent class="p-6">
          <div v-if="!isSubmitted">
            <form @submit.prevent="submitForm" class="space-y-5">
              <Alert v-if="hasErrors" variant="destructive" class="rounded-xl">
                <AlertDescription>Please correct the errors below.</AlertDescription>
              </Alert>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="firstName" class="text-gray-700">First Name</Label>
                  <Input 
                    id="firstName"
                    v-model="form.firstName" 
                    placeholder="First Name"
                    class="rounded-xl h-11"
                    required
                  />
                </div>
                <div class="space-y-2">
                  <Label for="lastName" class="text-gray-700">Last Name</Label>
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
                <Label for="email" class="text-gray-700">Email Address</Label>
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
                <Label for="phone" class="text-gray-700">Phone Number</Label>
                <Input 
                  id="phone"
                  v-model="form.phone" 
                  type="tel"
                  placeholder="Phone Number"
                  class="rounded-xl h-11"
                />
              </div>

              <div class="space-y-2">
                <Label for="message" class="text-gray-700">Message</Label>
                <Textarea 
                  id="message"
                  v-model="form.message" 
                  rows="3"
                  placeholder="Tell us about your finance needs..."
                  class="rounded-xl"
                />
              </div>

              <!-- Loan Summary -->
              <Card class="rounded-xl bg-gray-50 border-0">
                <CardContent class="p-4">
                  <h4 class="font-semibold text-gray-900 mb-3">Loan Summary</h4>
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-500">Vehicle:</span>
                      <span class="font-medium">{{ formatCurrency(retail) }}</span>
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
                      <span class="text-gray-500">Interest rate:</span>
                      <span class="font-medium">{{ rate.toFixed(2) }}%<sup class="text-xs">^</sup></span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">Comparison rate:</span>
                      <span class="font-medium">{{ comparisonRate.toFixed(2) }}%<sup class="text-xs">#</sup></span>
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
                {{ isSubmitting ? 'Sending...' : 'Send Enquiry' }}
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
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { Alert, AlertDescription } from '~/components/ui/alert'

const mainStore = useMainStore();
const { trackFinanceEnquiry } = useAnalytics();
const { getUtmParams } = useUtmParams();

const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');

// Calculator state
const retail = ref(39485);
const depositInput = ref(0);
const tradeInInput = ref(0);
const lengthInYears = ref(4);
const rateValue = ref(11.09);

const activeTab = ref<'weekly' | 'fortnightly' | 'monthly'>('monthly');

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
const hasErrors = ref(false);

// Calculations
const loanAmount = computed(() => retail.value - downPayment.value - tradeIn.value);

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

const formatNumber = (value: number) => {
  return value.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const setLoanTerm = (years: number) => {
  lengthInYears.value = years;
};

// Submit form
const submitForm = async () => {
  if (!form.firstName || !form.lastName || !form.email) {
    hasErrors.value = true;
    return;
  }

  hasErrors.value = false;
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
        phone: form.phone || undefined,
        message: form.message || undefined,
        financeInfo: {
          vehiclePrice: retail.value,
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
        source: 'finance-pre-approval-form',
        // UTM tracking for marketing analytics
        ...getUtmParams(),
      }
    });

    isSubmitted.value = true;

    // Track conversion with enhanced analytics
    trackFinanceEnquiry({
      form_location: 'finance_page',
      enquiry_id: response.enquiry.id,
      loan_amount: loanAmount.value,
      deposit_amount: downPayment.value,
      loan_term_months: length.value,
    });
  } catch (error) {
    console.error('Form submission error:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.finance-form-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (min-width: 1024px) {
  .finance-form-container {
    grid-template-columns: 1fr auto 1fr;
    gap: 2rem;
  }
}

.finance-calculator,
.finance-form {
  justify-self: center;
}

@media (min-width: 1024px) {
  .finance-calculator {
    justify-self: end;
  }
  
  .finance-form {
    justify-self: start;
  }
}

.finance-arrow {
  align-self: center;
}

.arrow-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 44, 95, 0.15);
}

.finance-arrow-mobile .arrow-container {
  width: 64px;
  height: 64px;
}

.finance-arrow-mobile .arrow-container svg {
  animation: bounce-down 2s ease-in-out infinite;
}

@keyframes bounce-down {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(4px);
  }
}
</style>




