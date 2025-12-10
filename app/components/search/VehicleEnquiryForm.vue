<template>
  <div class="vehicle-enquiry-form">
    <div v-if="!isSubmitted" class="uk-card uk-card-default uk-card-body">
      <h3 class="uk-card-title uk-text-center">
        <span v-if="vehicle">Enquire about this {{ vehicle.condition?.displayValue?.[0] || '' }} {{ vehicle.title }}</span>
        <span v-else>Vehicle Enquiry</span>
      </h3>

      <form @submit.prevent="submitForm" :class="{ 'errors': hasErrors }">
        <div v-if="hasErrors" class="uk-alert uk-alert-danger">
          Please fill in all required fields.
        </div>

        <fieldset class="uk-fieldset uk-grid-small" uk-grid>
          <div class="uk-width-1-2@m">
            <label class="uk-form-label">First Name *</label>
            <div class="uk-inline uk-width-1-1">
              <span class="uk-form-icon" uk-icon="icon: user"></span>
              <input 
                v-model="form.firstName" 
                class="uk-input" 
                type="text" 
                required
              />
            </div>
          </div>

          <div class="uk-width-1-2@m">
            <label class="uk-form-label">Last Name *</label>
            <div class="uk-inline uk-width-1-1">
              <span class="uk-form-icon" uk-icon="icon: user"></span>
              <input 
                v-model="form.lastName" 
                class="uk-input" 
                type="text" 
                required
              />
            </div>
          </div>

          <div class="uk-width-1-1">
            <label class="uk-form-label">Email Address *</label>
            <div class="uk-inline uk-width-1-1">
              <span class="uk-form-icon" uk-icon="icon: mail"></span>
              <input 
                v-model="form.email" 
                class="uk-input" 
                type="email" 
                required
              />
            </div>
          </div>

          <div class="uk-width-1-1">
            <label class="uk-form-label">Phone Number *</label>
            <div class="uk-inline uk-width-1-1">
              <span class="uk-form-icon" uk-icon="icon: receiver"></span>
              <input 
                v-model="form.phone" 
                class="uk-input" 
                type="tel" 
                required
              />
            </div>
          </div>

          <div class="uk-width-1-1">
            <label class="uk-form-label">Postcode</label>
            <div class="uk-inline uk-width-1-1">
              <span class="uk-form-icon" uk-icon="icon: location"></span>
              <input 
                v-model="form.postcode" 
                class="uk-input" 
                type="text" 
                maxlength="4"
              />
            </div>
          </div>

          <div class="uk-width-1-1">
            <label class="uk-form-label">Message</label>
            <textarea 
              v-model="form.message" 
              class="uk-textarea" 
              rows="4" 
              placeholder="I'm interested in this vehicle..."
            ></textarea>
          </div>

          <!-- Trade-in Option -->
          <div class="uk-width-1-1">
            <label>
              <input type="checkbox" class="uk-checkbox" v-model="hasTradeIn" />
              I have a vehicle to trade in
            </label>
          </div>

          <template v-if="hasTradeIn">
            <div class="uk-width-1-3@m">
              <label class="uk-form-label">Trade Make</label>
              <input v-model="form.tradeMake" class="uk-input" type="text" />
            </div>
            <div class="uk-width-1-3@m">
              <label class="uk-form-label">Trade Model</label>
              <input v-model="form.tradeModel" class="uk-input" type="text" />
            </div>
            <div class="uk-width-1-3@m">
              <label class="uk-form-label">Trade Year</label>
              <input v-model="form.tradeYear" class="uk-input" type="text" />
            </div>
          </template>

          <!-- Finance Option -->
          <div class="uk-width-1-1">
            <label>
              <input type="checkbox" class="uk-checkbox" v-model="form.financeInterest" />
              I'm interested in finance options
            </label>
          </div>

          <div class="uk-width-1-1">
            <p class="uk-text-meta">
              Your personal information will be collected in accordance with our
              <NuxtLink to="/privacy-policy" class="uk-text-primary" target="_blank">Privacy Policy</NuxtLink>.
            </p>
          </div>
        </fieldset>

        <div class="uk-margin-top">
          <button 
            type="submit" 
            class="uk-button uk-button-primary uk-button-large uk-width-1-1"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" uk-spinner="ratio: 0.6"></span>
            {{ isSubmitting ? 'Sending...' : 'Send Enquiry' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Success Message -->
    <div v-else class="uk-card uk-card-default uk-card-body uk-text-center">
      <span uk-icon="icon: check; ratio: 3" class="uk-text-success"></span>
      <h3>Thank You, {{ form.firstName }}!</h3>
      <p>Your enquiry has been submitted. One of our sales consultants will contact you shortly.</p>
      <div class="uk-margin-top">
        <NuxtLink to="/car-sales" class="uk-button uk-button-default">
          Browse More Vehicles
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Vehicle {
  stockid?: string | number;
  title?: string;
  condition?: { displayValue?: string[] };
  make?: { displayValue?: string[] };
  model?: { displayValue?: string[] };
  year?: { displayValue?: string[] };
  price?: number;
}

const props = defineProps<{
  vehicle?: Vehicle;
  stockId?: string | number;
}>();

const mainStore = useMainStore();

// Form state
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  postcode: '',
  message: '',
  tradeMake: '',
  tradeModel: '',
  tradeYear: '',
  financeInterest: false
});

const hasTradeIn = ref(false);
const isSubmitting = ref(false);
const isSubmitted = ref(false);
const hasErrors = ref(false);

// Pre-populate message if vehicle provided
onMounted(() => {
  if (props.vehicle) {
    form.message = `I'm interested in the ${props.vehicle.condition?.displayValue?.[0] || ''} ${props.vehicle.title || ''} (Stock #${props.vehicle.stockid || props.stockId}).`;
  }
});

// Submit form
const submitForm = async () => {
  if (!form.firstName || !form.lastName || !form.email || !form.phone) {
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
        type: 'vehicle',
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        postcode: form.postcode || undefined,
        message: form.message || undefined,
        vehicleInfo: props.vehicle ? {
          condition: props.vehicle.condition?.displayValue?.[0] || undefined,
          make: props.vehicle.make?.displayValue?.[0] || undefined,
          model: props.vehicle.model?.displayValue?.[0] || undefined,
          year: props.vehicle.year?.displayValue?.[0] ? parseInt(props.vehicle.year.displayValue[0]) : undefined,
          price: props.vehicle.price || undefined,
          stockId: String(props.vehicle.stockid || props.stockId || ''),
        } : undefined,
        tradeIn: hasTradeIn.value ? {
          make: form.tradeMake || undefined,
          model: form.tradeModel || undefined,
          year: form.tradeYear ? parseInt(form.tradeYear) : undefined,
        } : undefined,
        financeInterest: form.financeInterest,
        source: 'vehicle-enquiry-form',
      }
    });

    isSubmitted.value = true;

    // GTM tracking
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'FormSubmission',
        formType: 'vehicle',
        formStatus: 'submitted',
        enquiryId: response.enquiry.id,
        stockId: props.vehicle?.stockid || props.stockId,
        vehicleTitle: props.vehicle?.title,
        hasTradeIn: hasTradeIn.value,
        financeInterest: form.financeInterest,
      });
    }
  } catch (error) {
    console.error('Form submission error:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.vehicle-enquiry-form {
  .uk-card {
    border-radius: 8px;
  }

  .uk-form-label {
    font-weight: 500;
    font-size: 0.875rem;
    margin-bottom: 4px;
  }

  .uk-checkbox {
    margin-right: 8px;
  }
}
</style>




