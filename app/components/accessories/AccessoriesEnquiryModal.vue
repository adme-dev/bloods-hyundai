<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Modal -->
    <Transition name="slide-up">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <!-- Success State -->
          <div v-if="submitted" class="p-8 text-center">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-slate-900">Quote Request Sent!</h2>
            <p class="mt-2 text-slate-600">
              Thank you for your enquiry. Our accessories team will contact you shortly with pricing and availability.
            </p>
            <button
              class="mt-6 rounded-xl bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
              @click="handleClose"
            >
              Continue Shopping
            </button>
          </div>

          <!-- Form State -->
          <div v-else>
            <!-- Header -->
            <div class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 class="text-xl font-bold text-slate-900">Request Accessories Quote</h2>
                <p class="text-sm text-slate-500">Fill in your details and we'll get back to you</p>
              </div>
              <button
                class="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                @click="$emit('close')"
              >
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="handleSubmit" class="p-6">
              <!-- Cart Summary -->
              <div class="mb-6 rounded-xl bg-slate-50 p-4">
                <div class="mb-3 flex items-center gap-2">
                  <svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 class="font-semibold text-slate-900">Your Accessories ({{ itemCount }} items)</h3>
                </div>

                <!-- Selected Model -->
                <div v-if="selectedModel" class="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm">
                  <svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-blue-700">For <strong>Hyundai {{ selectedModel.name }}</strong></span>
                </div>

                <!-- Item List -->
                <div class="space-y-2 max-h-40 overflow-y-auto">
                  <div
                    v-for="item in items"
                    :key="item.accessory.id"
                    class="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                  >
                    <div class="flex items-center gap-3">
                      <div class="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-slate-100">
                        <NuxtImg
                          v-if="getItemImage(item)"
                          :src="getItemImage(item)!"
                          :alt="item.accessory.name"
                          class="h-full w-full object-contain p-1"
                          width="40"
                          height="40"
                          loading="lazy"
                          format="webp"
                          quality="80"
                        />
                      </div>
                      <div>
                        <span class="font-medium text-slate-900">{{ item.accessory.name }}</span>
                        <span v-if="item.quantity > 1" class="ml-1 text-slate-500">× {{ item.quantity }}</span>
                      </div>
                    </div>
                    <span class="font-semibold text-slate-900">${{ formatPrice(item.accessory.price * item.quantity) }}</span>
                  </div>
                </div>

                <!-- Total -->
                <div class="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span class="font-semibold text-slate-700">Estimated Total</span>
                  <span class="text-lg font-bold text-primary">${{ formatPrice(total) }}</span>
                </div>
                <p class="mt-1 text-xs text-slate-500">*Includes GST & estimated fitment. Final pricing confirmed at dealership.</p>
              </div>

              <!-- Customer Details Form -->
              <div class="space-y-4">
                <h3 class="font-semibold text-slate-900">Your Details</h3>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700">
                      First Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="form.firstName"
                      type="text"
                      required
                      class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                      :class="{ 'border-red-500': errors.firstName }"
                      placeholder="John"
                    >
                    <p v-if="errors.firstName" class="mt-1 text-xs text-red-500">{{ errors.firstName }}</p>
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700">
                      Last Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="form.lastName"
                      type="text"
                      required
                      class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                      :class="{ 'border-red-500': errors.lastName }"
                      placeholder="Smith"
                    >
                    <p v-if="errors.lastName" class="mt-1 text-xs text-red-500">{{ errors.lastName }}</p>
                  </div>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700">
                      Email <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="form.email"
                      type="email"
                      required
                      class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                      :class="{ 'border-red-500': errors.email }"
                      placeholder="john.smith@email.com"
                    >
                    <p v-if="errors.email" class="mt-1 text-xs text-red-500">{{ errors.email }}</p>
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700">
                      Phone <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="form.phone"
                      type="tel"
                      required
                      class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                      :class="{ 'border-red-500': errors.phone }"
                      placeholder="0400 000 000"
                    >
                    <p v-if="errors.phone" class="mt-1 text-xs text-red-500">{{ errors.phone }}</p>
                  </div>
                </div>

                <div>
                  <label class="mb-1.5 block text-sm font-medium text-slate-700">
                    Postcode
                  </label>
                  <input
                    v-model="form.postcode"
                    type="text"
                    maxlength="4"
                    class="w-full max-w-[150px] rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="3000"
                  >
                </div>

                <div>
                  <label class="mb-1.5 block text-sm font-medium text-slate-700">
                    Additional Notes
                  </label>
                  <textarea
                    v-model="form.message"
                    rows="3"
                    class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Any specific questions or preferences?"
                  ></textarea>
                </div>

                <!-- Consent -->
                <div class="flex items-start gap-3">
                  <input
                    v-model="form.consent"
                    type="checkbox"
                    required
                    id="consent"
                    class="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  >
                  <label for="consent" class="text-sm text-slate-600">
                    I agree to be contacted by Sale Hyundai regarding this accessories enquiry and related offers.
                    <span class="text-red-500">*</span>
                  </label>
                </div>
              </div>

              <!-- Error Message -->
              <div v-if="submitError" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {{ submitError }}
              </div>

              <!-- Submit Button -->
              <div class="mt-6 flex gap-3">
                <button
                  type="button"
                  class="flex-1 rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  @click="$emit('close')"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg v-if="isSubmitting" class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ isSubmitting ? 'Sending...' : 'Request Quote' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { CartItem, HyundaiModel } from '~/stores/accessories';
import { useAnalytics } from '~/composables/useAnalytics';

interface Props {
  show: boolean;
  items: CartItem[];
  total: number;
  selectedModel?: HyundaiModel | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submitted'): void;
}>();

const accessoriesStore = useAccessoriesStore();
const { trackAccessoriesEnquiry } = useAnalytics();
const { getUtmParams } = useUtmParams();

// Form state
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  postcode: '',
  message: '',
  consent: false,
});

const errors = reactive<Record<string, string>>({});
const isSubmitting = ref(false);
const submitError = ref('');
const submitted = ref(false);

// Computed
const itemCount = computed(() => {
  return props.items.reduce((count, item) => count + item.quantity, 0);
});

// Methods
const formatPrice = (price: number) => {
  return price.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// Get image URL from cart item (handles both Accessory and AccessoryPack types)
const getItemImage = (item: CartItem): string | null => {
  const acc = item.accessory;
  if (acc.image) return acc.image;
  if ('thumbnail' in acc && acc.thumbnail) return acc.thumbnail;
  return null;
};

const validateForm = () => {
  // Clear previous errors
  Object.keys(errors).forEach(key => delete errors[key]);

  let isValid = true;

  if (!form.firstName.trim()) {
    errors.firstName = 'First name is required';
    isValid = false;
  }

  if (!form.lastName.trim()) {
    errors.lastName = 'Last name is required';
    isValid = false;
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address';
    isValid = false;
  }

  if (!form.phone.trim()) {
    errors.phone = 'Phone number is required';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;
  submitError.value = '';

  try {
    // Format cart items for submission (include image URLs for CRM display)
    const accessoriesCart = props.items.map(item => ({
      id: item.accessory.id,
      name: item.accessory.name,
      partNumber: 'partNumber' in item.accessory ? item.accessory.partNumber : undefined,
      price: item.accessory.price,
      quantity: item.quantity,
      type: item.type,
      subtotal: item.accessory.price * item.quantity,
      // Include image URLs for display in CRM
      image: item.accessory.image || null,
      thumbnail: 'thumbnail' in item.accessory ? item.accessory.thumbnail : null,
    }));

    // Submit to API
    const response = await $fetch<{ enquiry: { id: string } }>('/api/submit-enquiry', {
      method: 'POST',
      body: {
        type: 'accessories',
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        postcode: form.postcode || undefined,
        message: form.message || undefined,
        source: 'accessories-store',
        // Include vehicle model info
        vehicleInfo: props.selectedModel ? {
          make: 'Hyundai',
          model: props.selectedModel.name,
        } : undefined,
        // Include accessories cart
        accessoriesCart: {
          model: props.selectedModel?.name || null,
          items: accessoriesCart,
          itemCount: itemCount.value,
          total: props.total,
        },
        // UTM tracking for marketing analytics
        ...getUtmParams(),
      },
    });

    // Track accessories enquiry conversion
    trackAccessoriesEnquiry({
      form_location: 'accessories_store_modal',
      enquiry_id: response.enquiry.id,
      vehicle_model: props.selectedModel?.name || undefined,
      total_value: props.total,
      items_count: itemCount.value,
      accessories: accessoriesCart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        type: item.type,
      })),
    });

    // Success
    submitted.value = true;
    emit('submitted');

    // Clear cart
    accessoriesStore.clearCart();

  } catch (error: any) {
    console.error('Accessories enquiry submission failed:', error);
    submitError.value = error?.data?.message || 'Failed to submit enquiry. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};

const handleClose = () => {
  // Reset form
  form.firstName = '';
  form.lastName = '';
  form.email = '';
  form.phone = '';
  form.postcode = '';
  form.message = '';
  form.consent = false;
  submitted.value = false;
  submitError.value = '';
  Object.keys(errors).forEach(key => delete errors[key]);

  emit('close');
};

// Watch for modal close to reset state
watch(() => props.show, (newShow) => {
  if (!newShow) {
    // Small delay before resetting to allow animation
    setTimeout(() => {
      if (!submitted.value) return; // Only reset if not submitted
      handleClose();
    }, 300);
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
