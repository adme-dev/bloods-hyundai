<template>
  <div class="secure-vehicle-page">
    <LazyPageSchema />

    <div class="uk-container uk-margin-large-top uk-margin-large-bottom">
      <div class="uk-grid uk-grid-large" uk-grid>
        <!-- Vehicle Info -->
        <div class="uk-width-1-2@m">
          <div v-if="vehicle" class="uk-card uk-card-default uk-card-body">
            <h3 class="uk-card-title">{{ vehicle.title }}</h3>
            <img 
              v-if="vehicle.images?.[0]"
              :src="vehicle.images[0]"
              :alt="vehicle.title"
              class="uk-width-1-1 uk-margin"
            />
            <ul class="uk-list uk-list-divider">
              <li v-if="vehicle.year"><strong>Year:</strong> {{ vehicle.year }}</li>
              <li v-if="vehicle.odometer"><strong>Odometer:</strong> {{ vehicle.odometer?.toLocaleString() }} km</li>
              <li v-if="vehicle.transmission"><strong>Transmission:</strong> {{ vehicle.transmission }}</li>
              <li v-if="vehicle.stockNumber"><strong>Stock #:</strong> {{ vehicle.stockNumber }}</li>
            </ul>
            <div class="uk-h2 uk-text-primary">
              {{ vehicle.price ? `$${vehicle.price.toLocaleString()}` : 'POA' }}
            </div>
          </div>
          <div v-else class="uk-text-center uk-padding">
            <div uk-spinner></div>
          </div>
        </div>

        <!-- Payment Form -->
        <div class="uk-width-1-2@m">
          <div class="uk-card uk-card-default uk-card-body">
            <div class="uk-text-small uk-text-muted">Vehicle Reservation Deposit</div>
            <h3 class="uk-margin-remove uk-text-bold">{{ formattedDeposit }}</h3>
            
            <!-- Success Message -->
            <div v-if="paymentSuccess" class="uk-alert-success uk-margin-top" uk-alert>
              <p><strong>Payment Successful!</strong> Your vehicle has been reserved.</p>
            </div>

            <!-- Error Message -->
            <div v-if="paymentError" class="uk-alert-danger uk-margin-top" uk-alert>
              <p>{{ paymentError }}</p>
            </div>

            <!-- Payment Form -->
            <form v-if="!paymentSuccess" @submit.prevent="handlePayment" class="uk-form-stacked uk-margin-top">
              <div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid>
                <div>
                  <label class="uk-form-label">First Name *</label>
                  <input v-model="form.firstName" type="text" class="uk-input" required />
                </div>
                <div>
                  <label class="uk-form-label">Last Name *</label>
                  <input v-model="form.lastName" type="text" class="uk-input" required />
                </div>
              </div>

              <div class="uk-margin">
                <label class="uk-form-label">Email *</label>
                <input v-model="form.email" type="email" class="uk-input" required />
              </div>

              <div class="uk-margin">
                <label class="uk-form-label">Phone *</label>
                <input v-model="form.phone" type="tel" class="uk-input" required />
              </div>

              <!-- Stripe Card Element placeholder -->
              <div class="uk-margin">
                <label class="uk-form-label">Card Details</label>
                <div id="card-element" class="uk-padding-small uk-background-muted" style="min-height: 50px;">
                  <!-- Stripe Elements will be mounted here -->
                  <p class="uk-text-center uk-text-muted uk-margin-small">
                    Loading payment form...
                  </p>
                </div>
                <div v-if="cardError" class="uk-text-danger uk-text-small uk-margin-small-top">
                  {{ cardError }}
                </div>
              </div>

              <div class="uk-margin">
                <label>
                  <input v-model="form.agreeTerms" type="checkbox" class="uk-checkbox" required />
                  I agree to the <NuxtLink to="/terms-conditions" target="_blank">Terms & Conditions</NuxtLink>
                </label>
              </div>

              <div class="uk-margin-medium-top">
                <button 
                  type="submit"
                  class="uk-button uk-button-primary uk-button-large uk-width-1-1"
                  :disabled="processing"
                >
                  <span v-if="processing" uk-spinner="ratio: 0.6"></span>
                  {{ processing ? 'Processing...' : `Pay ${formattedDeposit}` }}
                </button>
              </div>

              <p class="uk-text-meta uk-text-center uk-margin-top">
                <span uk-icon="lock" class="uk-margin-small-right"></span>
                Secure payment powered by Stripe
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const config = useRuntimeConfig();

const vehicleId = computed(() => route.params.id as string);

// Config
const depositAmount = 500; // $500 deposit
const formattedDeposit = computed(() => `$${depositAmount.toLocaleString()}`);

// State
const vehicle = ref<any>(null);
const processing = ref(false);
const paymentSuccess = ref(false);
const paymentError = ref<string | null>(null);
const cardError = ref<string | null>(null);

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  agreeTerms: false,
});

// Fetch vehicle data
onMounted(async () => {
  try {
    const response = await $fetch<any>(`${config.public.apiUrl}/vehicle/${vehicleId.value}`);
    vehicle.value = response.vehicle || response;
  } catch (err) {
    console.error('Failed to fetch vehicle:', err);
  }
  
  // Initialize Stripe
  initStripe();
});

// Initialize Stripe Elements
const initStripe = async () => {
  if (!process.client) return;
  if (!config.public.stripePublishableKey) {
    console.warn('Stripe publishable key not configured');
    return;
  }
  
  // Load Stripe.js
  const { loadStripe } = await import('@stripe/stripe-js');
  const stripe = await loadStripe(config.public.stripePublishableKey);
  
  if (!stripe) return;
  
  // Create Elements
  const elements = stripe.elements();
  const cardElement = elements.create('card', {
    style: {
      base: {
        fontSize: '16px',
        color: '#333',
        '::placeholder': { color: '#999' },
      },
    },
  });
  
  // Mount card element
  const cardContainer = document.getElementById('card-element');
  if (cardContainer) {
    cardContainer.innerHTML = '';
    cardElement.mount('#card-element');
  }
  
  // Handle errors
  cardElement.on('change', (event: any) => {
    cardError.value = event.error ? event.error.message : null;
  });
  
  // Store for payment processing
  (window as any).__stripeElements = { stripe, cardElement };
};

// Handle payment
const handlePayment = async () => {
  if (processing.value) return;
  
  processing.value = true;
  paymentError.value = null;
  
  try {
    const { stripe, cardElement } = (window as any).__stripeElements || {};
    
    if (!stripe || !cardElement) {
      throw new Error('Payment system not initialized');
    }
    
    // Create checkout session on server
    const session = await $fetch<any>('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: {
        vehicleId: vehicleId.value,
        vehicleName: vehicle.value?.title,
        amount: depositAmount,
        customerEmail: form.email,
      },
    });
    
    if (!session.success) {
      throw new Error(session.error || 'Failed to create checkout session');
    }
    
    // Redirect to Stripe Checkout
    if (session.url) {
      window.location.href = session.url;
    }
  } catch (err: any) {
    paymentError.value = err.message || 'Payment failed. Please try again.';
    console.error('Payment error:', err);
  } finally {
    processing.value = false;
  }
};

// SEO
useSiteMeta({
  title: () => `Reserve ${vehicle.value?.title || 'Vehicle'}`,
  description: 'Secure your vehicle with a refundable deposit.',
});
</script>

<style lang="scss" scoped>
.secure-vehicle-page {
  min-height: 80vh;
  background: #f5f5f5;
}

#card-element {
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  background: white;
}
</style>







