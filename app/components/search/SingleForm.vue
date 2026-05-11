<template>
  <div class="car-sales-form">
    <!-- Finance Widget Mode -->
    <div v-if="useFinanceWidget && financeWidgetIframeUrl" class="uk-card uk-card-hover uk-padding-small">
      <div class="uk-width-1-1 uk-h4 uk-text-bold uk-margin-remove uk-text-center">
        Apply for Finance
      </div>
      <div v-if="financeWidgetPending" class="uk-flex uk-flex-center uk-padding">
        <div uk-spinner="ratio: 1.5"></div>
      </div>
      <div v-else class="finance-widget-container">
        <iframe
          :src="financeWidgetIframeUrl"
          class="finance-widget-iframe"
          title="Finance Application"
          allow="geolocation; payment"
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>

    <!-- Standard Enquiry Form Mode -->
    <div v-else class="uk-card uk-card-hover uk-padding-small">
      <div class="uk-width-1-1 uk-h4 uk-text-bold uk-margin-remove uk-text-center">
        Enquire on this vehicle
      </div>
      <div class="uk-width-1-1 uk-text-small uk-text-center uk-margin-small-bottom">
        or ask a question
      </div>

      <form v-if="!isSent" @submit.prevent="submitForm" class="enquiry-form">
        <!-- Loading Overlay -->
        <div v-if="isSending" class="uk-overlay-default uk-position-cover uk-flex uk-flex-center uk-flex-middle">
          <div class="uk-text-center">
            <div uk-spinner="ratio: 2"></div>
            <p>Sending...</p>
          </div>
        </div>

        <div class="uk-margin-small">
          <div class="uk-inline uk-width-1-1">
            <span class="uk-form-icon" uk-icon="icon: user"></span>
            <input 
              v-model="form.name" 
              type="text" 
              class="uk-input uk-form-large"
              :class="{ 'uk-form-danger': errors.name }"
              placeholder="First and last name"
              required
            />
          </div>
          <div v-if="errors.name" class="uk-text-small uk-text-danger">{{ errors.name }}</div>
        </div>

        <div class="uk-margin-small">
          <div class="uk-inline uk-width-1-1">
            <span class="uk-form-icon" uk-icon="icon: mail"></span>
            <input 
              v-model="form.email" 
              type="email" 
              class="uk-input uk-form-large"
              :class="{ 'uk-form-danger': errors.email }"
              placeholder="Email address"
              required
            />
          </div>
          <div v-if="errors.email" class="uk-text-small uk-text-danger">{{ errors.email }}</div>
        </div>

        <div class="uk-margin-small">
          <div class="uk-inline uk-width-1-1">
            <span class="uk-form-icon" uk-icon="icon: receiver"></span>
            <input 
              v-model="form.phone" 
              type="tel" 
              class="uk-input uk-form-large"
              placeholder="Phone Number"
              maxlength="10"
            />
          </div>
        </div>

        <div class="uk-margin-small">
          <textarea 
            v-model="form.message" 
            class="uk-textarea uk-form-large" 
            rows="3"
            placeholder="Message"
          ></textarea>
        </div>

        <!-- Options -->
        <div class="uk-margin-small uk-grid-small uk-child-width-auto uk-flex uk-flex-middle" uk-grid>
          <label class="uk-margin-small-left uk-margin-auto-right font-14">I would like a test drive.</label>
          <label><input class="uk-radio" type="radio" v-model="form.testDrive" :value="false" /> No</label>
          <label><input class="uk-radio" type="radio" v-model="form.testDrive" :value="true" /> Yes</label>
        </div>

        <div class="uk-margin-small uk-grid-small uk-child-width-auto uk-flex uk-flex-middle" uk-grid>
          <label class="uk-margin-small-left uk-margin-auto-right font-14">I have a vehicle to trade in.</label>
          <label><input class="uk-radio" type="radio" v-model="form.tradeIn" :value="false" /> No</label>
          <label><input class="uk-radio" type="radio" v-model="form.tradeIn" :value="true" /> Yes</label>
        </div>

        <div class="uk-margin-small uk-grid-small uk-child-width-auto uk-flex uk-flex-middle" uk-grid>
          <label class="uk-margin-small-left uk-margin-auto-right font-14">I'm interested in finance.</label>
          <label><input class="uk-radio" type="radio" v-model="form.finance" :value="false" /> No</label>
          <label><input class="uk-radio" type="radio" v-model="form.finance" :value="true" /> Yes</label>
        </div>

        <div class="uk-margin uk-text-center">
          <button 
            type="submit" 
            class="uk-button uk-button-primary uk-button-large uk-width-1-1"
            :disabled="isSending"
          >
            Send Enquiry
          </button>
        </div>

        <div class="uk-text-small uk-text-muted uk-text-center">
          <sup>*</sup>We do not disclose any information collected on the website to any organisation not related to this company.
        </div>
      </form>

      <!-- Success Message -->
      <div v-else class="uk-text-center uk-padding">
        <span uk-icon="icon: check; ratio: 2" class="uk-text-success"></span>
        <div class="uk-margin-small-top">
          <strong>Hi {{ form.name }}</strong>
        </div>
        <div>Thank you for your enquiry. One of our staff members will be in touch shortly.</div>
        <button
          class="uk-button uk-button-primary uk-margin-top"
          @click="resetForm"
        >
          OK
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAnalytics } from '~/composables/useAnalytics';
import { useUtmParams } from '~/composables/useUtmParams';

// Finance widget settings type
interface FinanceWidgetSettings {
  success: boolean;
  settings: {
    useFinanceWidget: boolean;
    financeWidgetIframe: string | null;
    financeWidgetProvider: string | null;
  };
}

interface Vehicle {
  stockid?: string | number;
  slug?: string;
  title?: string;
  condition?: { displayValue?: string[] };
  make?: { displayValue?: string[] };
  model?: { displayValue?: string[] };
  badge?: { displayValue?: string[] };
  year?: { displayValue?: string[] };
  price?: number;
  kms?: number;
  [key: string]: any;
}

const props = defineProps<{
  item?: Vehicle;
  itemStock?: string | number;
  condition?: string;
}>();

const mainStore = useMainStore();
const { trackVehicleEnquiry } = useAnalytics();
const { getUtmParams } = useUtmParams();

// Fetch finance widget settings to determine if we should show the widget
const { data: financeWidgetData, pending: financeWidgetPending } = useFetch<FinanceWidgetSettings>('/api/finance-widget-settings', {
  lazy: true,
  default: (): FinanceWidgetSettings => ({
    success: true,
    settings: {
      useFinanceWidget: false,
      financeWidgetIframe: null,
      financeWidgetProvider: null,
    },
  }),
});

// Computed properties for finance widget
const useFinanceWidget = computed(() => financeWidgetData.value?.settings?.useFinanceWidget ?? false);

// Helper to extract display value from vehicle field
const getDisplay = (field: { displayValue?: string[] } | string | number | undefined): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'number') return String(field);
  return field.displayValue?.[0] || '';
};

// Extract base iframe URL from settings (handles both URL and HTML)
const financeWidgetBaseUrl = computed(() => {
  const input = financeWidgetData.value?.settings?.financeWidgetIframe?.trim();
  if (!input) return null;

  // If it's already a URL
  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  // Try to extract src from iframe HTML
  const srcMatch = input.match(/<iframe[^>]*src\s*=\s*["']([^"']+)["']/i);
  if (srcMatch) {
    return srcMatch[1];
  }

  return null;
});

// Build the full iframe URL with vehicle parameters
const financeWidgetIframeUrl = computed(() => {
  const baseUrl = financeWidgetBaseUrl.value;
  if (!baseUrl) return null;

  const vehicle = props.item;
  if (!vehicle) return baseUrl;

  // Get vehicle data using getDisplay helper
  const condition = getDisplay(vehicle?.condition) || props.condition || '';
  const price = vehicle?.price || 0;
  const year = getDisplay(vehicle?.year) || '';
  const make = getDisplay(vehicle?.make) || '';
  const model = getDisplay(vehicle?.model) || '';
  const kms = vehicle?.kms || 0;
  const vin = (vehicle as any)?.vin || '';

  // Build URL with vehicle parameters
  const params = new URLSearchParams();
  if (condition) params.append('condition', condition);
  if (price) params.append('amount', String(price));
  if (year) params.append('buildyear', year);
  if (make) params.append('make', make);
  if (model) params.append('model', model);
  if (kms) params.append('kilometers', String(kms));
  if (vin) params.append('vin', vin);

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${params.toString()}`;
});

// Form state
const form = reactive({
  name: '',
  email: '',
  phone: '',
  message: '',
  testDrive: false,
  tradeIn: false,
  finance: false
});

const errors = reactive({
  name: '',
  email: ''
});

const isSending = ref(false);
const isSent = ref(false);

// Phone formatting
watch(() => form.phone, (newVal) => {
  form.phone = newVal.replace(/[^0-9]/g, '').substring(0, 10);
});

// Validation
const validateEmail = (email: string) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

const validate = () => {
  let isValid = true;
  errors.name = '';
  errors.email = '';

  if (!form.name.trim()) {
    errors.name = 'Name is required';
    isValid = false;
  }

  if (!validateEmail(form.email)) {
    errors.email = 'Valid email is required';
    isValid = false;
  }

  return isValid;
};

// Submit form
const submitForm = async () => {
  if (!validate()) return;

  isSending.value = true;

  try {
    const vehicle = props.item;
    const nameParts = form.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Get UTM params for marketing attribution
    const utmParams = getUtmParams();

    // Submit to the new Neon database API
    const response = await $fetch<{ enquiry: { id: string } }>('/api/submit-enquiry', {
      method: 'POST',
      body: {
        type: 'vehicle',
        firstName,
        lastName,
        email: form.email,
        phone: form.phone || undefined,
        message: form.message || undefined,
        vehicleInfo: {
          condition: vehicle?.condition?.displayValue?.[0] || props.condition || undefined,
          make: vehicle?.make?.displayValue?.[0] || undefined,
          model: vehicle?.model?.displayValue?.[0] || undefined,
          stockId: String(vehicle?.stockid || props.itemStock || ''),
        },
        tradeIn: form.tradeIn ? {} : undefined,
        testDrive: form.testDrive,
        financeInterest: form.finance,
        source: 'vehicle-single-form',
        // UTM tracking for marketing analytics
        utmSource: utmParams.utmSource,
        utmMedium: utmParams.utmMedium,
        utmCampaign: utmParams.utmCampaign,
      }
    });

    isSent.value = true;

    // Track vehicle enquiry (GA4 + Facebook Pixel + GTM)
    const conditionValue = vehicle?.condition?.displayValue?.[0] || props.condition || '';
    const validCondition = ['new', 'used', 'demo'].includes(conditionValue.toLowerCase())
      ? conditionValue.toLowerCase() as 'new' | 'used' | 'demo'
      : undefined;

    trackVehicleEnquiry({
      form_location: 'vehicle_single_form',
      enquiry_id: response.enquiry.id,
      vehicle: {
        stockid: String(vehicle?.stockid || props.itemStock || ''),
        condition: validCondition,
        make: vehicle?.make?.displayValue?.[0] || 'Unknown',
        model: vehicle?.model?.displayValue?.[0] || 'Unknown',
        variant: vehicle?.badge?.displayValue?.[0] || undefined,
      },
      has_trade_in: form.tradeIn,
      interested_in_finance: form.finance,
      wants_test_drive: form.testDrive,
      has_message: !!form.message,
    });
  } catch (error) {
    console.error('Form submission error:', error);
  } finally {
    isSending.value = false;
  }
};

const resetForm = () => {
  form.name = '';
  form.email = '';
  form.phone = '';
  form.message = '';
  form.testDrive = false;
  form.tradeIn = false;
  form.finance = false;
  isSent.value = false;
};
</script>

<style lang="scss" scoped>
.car-sales-form {
  background-image: linear-gradient(to top, #f8f8f8 0.84%, white);
}

.font-14 {
  font-size: 14px;
}

.enquiry-form {
  position: relative;
}

/* Finance Widget Container */
.finance-widget-container {
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.finance-widget-iframe {
  flex: 1;
  width: 100%;
  min-height: 500px;
  border: none;
  border-radius: 4px;
}

@media (min-width: 768px) {
  .finance-widget-container {
    min-height: 600px;
  }

  .finance-widget-iframe {
    min-height: 600px;
  }
}

@media (min-width: 960px) {
  .single-modal .sidebar-card {
    max-width: 350px;
  }
}
</style>









