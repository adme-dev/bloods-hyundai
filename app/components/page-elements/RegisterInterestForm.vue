<template>
  <Card class="w-full max-w-lg mx-auto">
    <CardHeader class="text-center">
      <CardTitle class="text-2xl font-bold text-gray-900">
        Register Your Interest
      </CardTitle>
      <CardDescription v-if="vehicleModel" class="text-base">
        Be the first to know about the {{ vehicleModel }}
      </CardDescription>
      <CardDescription v-else>
        Register your interest and we'll be in touch
      </CardDescription>
    </CardHeader>

    <CardContent>
      <!-- Success State -->
      <div v-if="isSubmitted" class="py-8 text-center space-y-4">
        <div class="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <Check class="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Thank You, {{ form.firstName }}!</h3>
          <p class="text-gray-600 mt-2">
            Your interest has been registered. One of our team members will be in touch shortly.
          </p>
        </div>
        <Button variant="outline" @click="resetForm">
          Register Another Interest
        </Button>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Name Fields -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="firstName">
              First Name <span class="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              v-model="form.firstName"
              type="text"
              placeholder="John"
              :class="{ 'border-red-500 focus:ring-red-500': errors.firstName }"
            />
            <p v-if="errors.firstName" class="text-sm text-red-500">
              {{ errors.firstName }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="lastName">
              Last Name <span class="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              v-model="form.lastName"
              type="text"
              placeholder="Smith"
              :class="{ 'border-red-500 focus:ring-red-500': errors.lastName }"
            />
            <p v-if="errors.lastName" class="text-sm text-red-500">
              {{ errors.lastName }}
            </p>
          </div>
        </div>

        <!-- Email -->
        <div class="space-y-2">
          <Label for="email">
            Email Address <span class="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="john@example.com"
            :class="{ 'border-red-500 focus:ring-red-500': errors.email }"
          />
          <p v-if="errors.email" class="text-sm text-red-500">
            {{ errors.email }}
          </p>
        </div>

        <!-- Phone -->
        <div class="space-y-2">
          <Label for="phone">
            Phone Number <span class="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            :value="formattedPhone"
            type="tel"
            placeholder="0412 345 678"
            :class="{ 'border-red-500 focus:ring-red-500': errors.phone }"
            @input="handlePhoneInput"
          />
          <p v-if="errors.phone" class="text-sm text-red-500">
            {{ errors.phone }}
          </p>
        </div>

        <!-- Postcode -->
        <div class="space-y-2">
          <Label for="postcode">
            Postcode
          </Label>
          <Input
            id="postcode"
            v-model="form.postcode"
            type="text"
            placeholder="3850"
            maxlength="4"
            class="w-32"
          />
        </div>

        <!-- Interest Options -->
        <div class="space-y-3 pt-2">
          <Label class="text-base">I'm interested in:</Label>

          <div class="flex items-start space-x-3">
            <Checkbox
              id="testDrive"
              :model-value="form.testDrive"
              @update:model-value="form.testDrive = $event === true"
            />
            <Label for="testDrive" class="font-normal cursor-pointer">
              Booking a test drive
            </Label>
          </div>

          <div class="flex items-start space-x-3">
            <Checkbox
              id="financeInterest"
              :model-value="form.financeInterest"
              @update:model-value="form.financeInterest = $event === true"
            />
            <Label for="financeInterest" class="font-normal cursor-pointer">
              Finance options
            </Label>
          </div>

          <div class="flex items-start space-x-3">
            <Checkbox
              id="tradeIn"
              :model-value="form.tradeIn"
              @update:model-value="form.tradeIn = $event === true"
            />
            <Label for="tradeIn" class="font-normal cursor-pointer">
              Trading in my current vehicle
            </Label>
          </div>
        </div>

        <!-- Message -->
        <div class="space-y-2">
          <Label for="message">
            Message <span class="text-gray-400">(optional)</span>
          </Label>
          <Textarea
            id="message"
            v-model="form.message"
            placeholder="Any specific questions or requirements?"
            rows="3"
          />
        </div>

        <!-- Privacy Policy -->
        <p class="text-xs text-gray-500">
          By submitting this form, you agree to our
          <NuxtLink to="/privacy-policy" target="_blank" class="text-[#001E50] hover:underline">
            Privacy Policy
          </NuxtLink>.
          Your information will be used to respond to your enquiry.
        </p>

        <!-- Submit Button -->
        <Button
          type="submit"
          size="lg"
          class="w-full"
          :disabled="isSubmitting"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          {{ isSubmitting ? 'Submitting...' : 'Register Interest' }}
        </Button>

        <!-- Error Message -->
        <p v-if="submitError" class="text-sm text-red-500 text-center">
          {{ submitError }}
        </p>
      </form>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Check, Loader2 } from 'lucide-vue-next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { Checkbox } from '~/components/ui/checkbox';

interface Props {
  vehicleModel?: string;
  vehicleSlug?: string;
  vehicleImage?: string;
  source?: string;
}

const props = withDefaults(defineProps<Props>(), {
  vehicleModel: '',
  vehicleSlug: '',
  vehicleImage: '',
  source: '',
});

const route = useRoute();
const { trackContactForm } = useAnalytics();
const { getUtmParams } = useUtmParams();

// Form state
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  postcode: '',
  message: '',
  testDrive: false,
  financeInterest: false,
  tradeIn: false,
});

const errors = reactive<Record<string, string>>({});
const isSubmitting = ref(false);
const isSubmitted = ref(false);
const submitError = ref('');

// Phone formatting
const formattedPhone = computed(() => {
  const digits = form.phone.replace(/\D/g, '');
  if (digits.startsWith('04')) {
    // Mobile: 0412 345 678
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  } else {
    // Landline: (03) 1234 5678
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
});

const handlePhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  form.phone = target.value.replace(/\D/g, '').slice(0, 10);
};

// Validation
const validateForm = (): boolean => {
  // Clear previous errors
  Object.keys(errors).forEach(key => delete errors[key]);

  if (!form.firstName.trim()) {
    errors.firstName = 'First name is required';
  }

  if (!form.lastName.trim()) {
    errors.lastName = 'Last name is required';
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!form.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else {
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
  }

  return Object.keys(errors).length === 0;
};

// Submit handler
const handleSubmit = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;
  submitError.value = '';

  try {
    const utmParams = getUtmParams();

    const response = await $fetch<{ enquiry: { id: string } }>('/api/submit-enquiry', {
      method: 'POST',
      body: {
        type: 'vehicle',
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone,
        postcode: form.postcode || undefined,
        message: form.message.trim() || undefined,
        source: props.source || route.path,
        testDrive: form.testDrive,
        financeInterest: form.financeInterest,
        vehicleInfo: props.vehicleModel ? {
          make: 'Hyundai',
          model: props.vehicleModel,
          condition: 'new',
          vehicleUrl: props.vehicleSlug ? `/vehicle/${props.vehicleSlug}` : undefined,
          thumbnail: props.vehicleImage || undefined,
        } : undefined,
        tradeIn: form.tradeIn ? { interested: true } : undefined,
        ...utmParams,
      },
    });

    isSubmitted.value = true;

    // Track conversion
    trackContactForm({
      form_location: props.source || 'vehicle_page',
      enquiry_id: response.enquiry.id,
      department: 'sales',
      has_message: !!form.message,
    });

  } catch (error: any) {
    console.error('Form submission error:', error);
    submitError.value = error.data?.message || 'Failed to submit. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};

// Reset form
const resetForm = () => {
  form.firstName = '';
  form.lastName = '';
  form.email = '';
  form.phone = '';
  form.postcode = '';
  form.message = '';
  form.testDrive = false;
  form.financeInterest = false;
  form.tradeIn = false;
  isSubmitted.value = false;
  submitError.value = '';
  Object.keys(errors).forEach(key => delete errors[key]);
};
</script>
