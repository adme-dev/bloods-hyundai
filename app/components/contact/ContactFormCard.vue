<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription v-if="description">
        {{ description }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <!-- Step 1: Form -->
      <div v-if="currentStep === 1">
        <form @submit.prevent="validateAndNext" class="space-y-4">
          <!-- Error Alert -->
          <Alert v-if="errors.length > 0" variant="destructive">
            <AlertCircle class="h-4 w-4" />
            <AlertTitle>Please fix the following:</AlertTitle>
            <AlertDescription>
              <ul class="list-disc list-inside mt-2">
                <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
              </ul>
            </AlertDescription>
          </Alert>

          <!-- Name Fields -->
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="firstName">
                First Name <span class="text-red-500">*</span>
              </Label>
              <div class="input-icon-wrapper">
                <User class="form-input-icon" />
                <Input 
                  id="firstName"
                  v-model="form.firstName"
                  placeholder="First name"
                  class="pl-10"
                  :class="{ 'border-red-500': submitted && !form.firstName }"
                />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="lastName">
                Last Name <span class="text-red-500">*</span>
              </Label>
              <div class="input-icon-wrapper">
                <User class="form-input-icon" />
                <Input 
                  id="lastName"
                  v-model="form.lastName"
                  placeholder="Last name"
                  class="pl-10"
                  :class="{ 'border-red-500': submitted && !form.lastName }"
                />
              </div>
            </div>
          </div>

          <!-- Email Field -->
          <div class="space-y-2">
            <Label for="email">
              Email Address <span class="text-red-500">*</span>
            </Label>
            <div class="input-icon-wrapper">
              <Mail class="form-input-icon" />
              <Input 
                id="email"
                v-model="form.email"
                type="email"
                placeholder="your@email.com"
                class="pl-10"
                :class="{ 'border-red-500': submitted && (!form.email || !isValidEmail) }"
              />
            </div>
          </div>

          <!-- Phone Field -->
          <div class="space-y-2">
            <Label for="phone">
              Phone Number
            </Label>
            <div class="input-icon-wrapper">
              <Phone class="form-input-icon" />
              <Input 
                id="phone"
                :value="formattedPhone"
                @input="handlePhoneInput"
                type="tel"
                placeholder="0400 000 000"
                class="pl-10"
                :class="{ 'border-red-500': form.phone && !isPhoneValid }"
              />
            </div>
            <p v-if="form.phone && !isPhoneValid" class="text-sm text-red-500">
              Please enter a valid phone number
            </p>
          </div>

          <!-- Registration Field (Parts only) -->
          <div v-if="showRegistration" class="space-y-2">
            <Label for="registration">
              Vehicle Registration <span class="text-red-500">*</span>
            </Label>
            <div class="input-icon-wrapper">
              <FileEdit class="form-input-icon" />
              <Input 
                id="registration"
                v-model="form.registration"
                placeholder="ABC123"
                class="pl-10 uppercase"
                :class="{ 'border-red-500': submitted && showRegistration && !form.registration }"
              />
            </div>
          </div>

          <!-- Message Field -->
          <div class="space-y-2">
            <Label for="message">Message</Label>
            <Textarea 
              id="message"
              v-model="form.message"
              placeholder="How can we help you?"
              rows="4"
            />
          </div>

          <!-- Privacy Notice -->
          <p class="text-xs text-gray-500">
            Your personal information will be collected, used and stored in accordance with our
            <NuxtLink to="/privacy-policy" class="text-[#001E50] hover:underline" target="_blank">
              Privacy Policy
            </NuxtLink>.
          </p>

          <!-- Submit Button -->
          <Button type="submit" class="w-full sm:w-auto">
            Continue
            <ArrowRight class="ml-2 h-4 w-4" />
          </Button>
        </form>
      </div>

      <!-- Step 2: Confirmation -->
      <div v-else-if="currentStep === 2">
        <!-- Loading State -->
        <div v-if="isSending" class="text-center py-12">
          <Loader2 class="h-8 w-8 animate-spin mx-auto text-[#001E50]" />
          <p class="mt-4 text-gray-600">Sending your enquiry...</p>
        </div>

        <!-- Success State -->
        <div v-else-if="isSent" class="text-center py-12">
          <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle class="h-8 w-8 text-green-600" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900">Thank You, {{ form.firstName }}!</h3>
          <p class="text-gray-600 mt-2">
            Your enquiry has been submitted. One of our team members will be in touch shortly.
          </p>
          <Button variant="outline" class="mt-6" @click="resetForm">
            Send Another Enquiry
          </Button>
        </div>

        <!-- Confirmation Review -->
        <div v-else class="space-y-6">
          <div class="flex items-center justify-between">
            <Button variant="ghost" size="sm" @click="currentStep = 1">
              <ArrowLeft class="mr-2 h-4 w-4" />
              Back
            </Button>
            <span class="text-sm font-medium text-gray-500">Review & Send</span>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-500">Name</span>
              <span class="font-medium">{{ form.firstName }} {{ form.lastName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Email</span>
              <span class="font-medium">{{ form.email }}</span>
            </div>
            <div v-if="form.phone" class="flex justify-between">
              <span class="text-gray-500">Phone</span>
              <span class="font-medium">{{ formattedPhone }}</span>
            </div>
            <div v-if="form.registration" class="flex justify-between">
              <span class="text-gray-500">Registration</span>
              <span class="font-medium uppercase">{{ form.registration }}</span>
            </div>
            <div v-if="form.message" class="pt-2 border-t">
              <span class="text-gray-500 block mb-1">Message</span>
              <p class="text-gray-900">{{ form.message }}</p>
            </div>
          </div>

          <Button class="w-full" @click="submitForm">
            <Send class="mr-2 h-4 w-4" />
            Send Enquiry
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { 
  User, 
  Mail, 
  Phone, 
  FileEdit, 
  ArrowRight, 
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-vue-next';

// Note: Form input icons use the .form-input-icon class for proper positioning
// This overrides UIkit styles that may interfere with Tailwind positioning
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Label } from '~/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';

interface Props {
  formType: string;
  siteName: string;
  showRegistration?: boolean;
  description?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showRegistration: false,
});

const route = useRoute();
const mainStore = useMainStore();
const config = useRuntimeConfig();

// Form state
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  registration: '',
  message: '',
});

const currentStep = ref(1);
const submitted = ref(false);
const errors = ref<string[]>([]);
const isSending = ref(false);
const isSent = ref(false);

// Computed
const title = computed(() => {
  const sectionTitles: Record<string, string> = {
    sales: 'Sales Enquiry',
    parts: 'Parts Enquiry',
    finance: 'Finance Enquiry',
    service: 'Service Enquiry',
    general: 'General Enquiry',
  };
  return sectionTitles[props.formType] || `Contact ${props.siteName}`;
});

const isValidEmail = computed(() => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(form.email);
});

const formattedPhone = computed(() => {
  let number = form.phone.replace(/\D/g, '');
  if (number.startsWith('04')) {
    if (number.length <= 4) return number;
    if (number.length <= 7) return `${number.slice(0, 4)} ${number.slice(4)}`;
    return `${number.slice(0, 4)} ${number.slice(4, 7)} ${number.slice(7)}`;
  } else {
    if (number.length <= 2) return number;
    if (number.length <= 6) return `(${number.slice(0, 2)}) ${number.slice(2)}`;
    return `(${number.slice(0, 2)}) ${number.slice(2, 6)} ${number.slice(6)}`;
  }
});

const isPhoneValid = computed(() => {
  if (!form.phone) return true;
  const phone = formattedPhone.value;
  const mobileRegex = /^04\d{2}\s?\d{3}\s?\d{3}$/;
  const landlineRegex = /^\(0\d\)\s?\d{4}\s?\d{4}$/;
  return mobileRegex.test(phone) || landlineRegex.test(phone);
});

// Methods
const handlePhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  form.phone = target.value.replace(/\D/g, '').slice(0, 10);
};

const validateAndNext = () => {
  submitted.value = true;
  errors.value = [];

  if (!form.firstName) errors.value.push('First name is required');
  if (!form.lastName) errors.value.push('Last name is required');
  if (!form.email) errors.value.push('Email is required');
  else if (!isValidEmail.value) errors.value.push('Please enter a valid email');
  if (form.phone && !isPhoneValid.value) errors.value.push('Please enter a valid phone number');
  if (props.showRegistration && !form.registration) errors.value.push('Vehicle registration is required');

  if (errors.value.length === 0) {
    currentStep.value = 2;
  }
};

const submitForm = async () => {
  isSending.value = true;

  try {
    // Map form type to API type
    const typeMap: Record<string, string> = {
      sales: 'vehicle',
      parts: 'parts',
      finance: 'finance',
      service: 'service',
      general: 'contact',
    };

    // Submit to the new Neon database API
    const response = await $fetch<{ enquiry: { id: string } }>('/api/submit-enquiry', {
      method: 'POST',
      body: {
        type: typeMap[props.formType] || 'contact',
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        message: form.message || undefined,
        vehicleInfo: form.registration ? { registration: form.registration } : undefined,
        source: `contact-page-${props.formType}`,
      },
    });

    isSending.value = false;
    isSent.value = true;

    // Track in GTM
    if (process.client && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: `FormSubmission`,
        formType: props.formType,
        formStatus: 'submitted',
        enquiryId: response.enquiry.id,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        message: form.message,
      });
    }
  } catch (error: any) {
    console.error('Form submission error:', error);
    isSending.value = false;
    errors.value = [error?.data?.message || 'Something went wrong. Please try again.'];
  }
};

const resetForm = () => {
  form.firstName = '';
  form.lastName = '';
  form.email = '';
  form.phone = '';
  form.registration = '';
  form.message = '';
  currentStep.value = 1;
  submitted.value = false;
  isSent.value = false;
  errors.value = [];
};
</script>

<style scoped>
/* Input icon positioning - overrides UIkit styles */
.input-icon-wrapper {
  position: relative;
  display: block;
}

.form-input-icon {
  position: absolute !important;
  left: 0.75rem !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  height: 1rem !important;
  width: 1rem !important;
  color: rgb(156 163 175) !important; /* gray-400 */
  pointer-events: none;
  z-index: 1;
}
</style>
