<template>
  <div class="vehicle-enquiry-form">
    <!-- Finance Widget Mode -->
    <div v-if="useFinanceWidget && financeWidgetIframeUrl" class="uk-card uk-card-default uk-card-body">
      <h3 class="uk-card-title uk-text-center">Apply for Finance</h3>
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
    <template v-else>
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAnalytics } from '~/composables/useAnalytics';

// Finance widget settings type
type VehicleCondition = 'new' | 'used' | 'demo';

interface FinanceWidgetSettings {
  success: boolean;
  settings: {
    useFinanceWidget: boolean;
    financeWidgetIframe: string | null;
    financeWidgetProvider: string | null;
    enabledConditions: VehicleCondition[];
  };
}

const DEFAULT_CONDITIONS: VehicleCondition[] = ['new', 'used', 'demo'];

// Fetch finance widget settings to determine if we should show the widget
const { data: financeWidgetData, pending: financeWidgetPending } = useFetch<FinanceWidgetSettings>('/api/finance-widget-settings', {
  lazy: true,
  default: (): FinanceWidgetSettings => ({
    success: true,
    settings: {
      useFinanceWidget: false,
      financeWidgetIframe: null,
      financeWidgetProvider: null,
      enabledConditions: DEFAULT_CONDITIONS,
    },
  }),
});

// Computed properties for finance widget
const useFinanceWidget = computed(() => {
  const settings = financeWidgetData.value?.settings;
  if (!settings?.useFinanceWidget) return false;

  const enabled = settings.enabledConditions ?? DEFAULT_CONDITIONS;
  const vehicleCondition = getDisplay(props.vehicle?.condition).toLowerCase();
  if (vehicleCondition !== 'new' && vehicleCondition !== 'used' && vehicleCondition !== 'demo') {
    return false;
  }
  return enabled.includes(vehicleCondition);
});

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

interface Vehicle {
  stockid?: string | number;
  title?: string;
  condition?: { displayValue?: string[] };
  make?: { displayValue?: string[] };
  model?: { displayValue?: string[] };
  year?: { displayValue?: string[] };
  badge?: { displayValue?: string[] };
  variant?: { displayValue?: string[] };
  price?: number;
  kms?: number;
  odometer?: { value?: string[]; displayValue?: string[] };
  transmission?: { displayValue?: string[] };
  fuel?: { displayValue?: string[] };
  drivetrain?: { displayValue?: string[] };
  body?: { displayValue?: string[] };
  colour?: { displayValue?: string[] };
  genericolour?: string;
  seats?: { displayValue?: string[] };
  engine?: { displayValue?: string[] };
  thumb?: string;
  main_photo_url?: string;
  photos?: { photos?: string[] };
}

const props = defineProps<{
  vehicle?: Vehicle;
  stockId?: string | number;
}>();

// Helper to extract display value from vehicle field
const getDisplay = (field: { displayValue?: string[] } | string | number | undefined): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'number') return String(field);
  return field.displayValue?.[0] || '';
};

// Build the full iframe URL with vehicle parameters
const financeWidgetIframeUrl = computed(() => {
  const baseUrl = financeWidgetBaseUrl.value;
  if (!baseUrl || !props.vehicle) return null;

  // Get vehicle data using getDisplay helper
  const condition = getDisplay(props.vehicle?.condition) || '';
  const price = props.vehicle?.price || 0;
  const year = getDisplay(props.vehicle?.year) || '';
  const make = getDisplay(props.vehicle?.make) || '';
  const model = getDisplay(props.vehicle?.model) || '';
  const kms = props.vehicle?.kms || 0;
  const vin = (props.vehicle as any)?.vin || '';

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

// Computed properties for vehicle data
const vehicleThumbnail = computed(() => {
  if (!props.vehicle) return undefined;
  // Try photos array first
  const photos = props.vehicle.photos?.photos;
  if (photos && photos.length > 0) return photos[0];
  // Fallback to thumb or main_photo_url
  return props.vehicle.thumb || props.vehicle.main_photo_url || undefined;
});

const vehicleKms = computed(() => {
  if (!props.vehicle) return undefined;
  const kms = props.vehicle.kms ||
              props.vehicle.odometer?.value?.[0] ||
              props.vehicle.odometer?.displayValue?.[0];
  if (!kms) return undefined;
  const numKms = typeof kms === 'number' ? kms : parseFloat(String(kms));
  if (isNaN(numKms)) return undefined;
  return `${numKms.toLocaleString()} km`;
});

const mainStore = useMainStore();
const { trackVehicleEnquiry } = useAnalytics();
const { getUtmParams } = useUtmParams();

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
          // Identifiers
          stockId: String(props.vehicle.stockid || props.stockId || ''),

          // Basic Info
          condition: getDisplay(props.vehicle.condition) || undefined,
          make: getDisplay(props.vehicle.make) || undefined,
          model: getDisplay(props.vehicle.model) || undefined,
          variant: getDisplay(props.vehicle.badge) || getDisplay(props.vehicle.variant) || undefined,
          year: props.vehicle.year?.displayValue?.[0] ? parseInt(props.vehicle.year.displayValue[0]) : undefined,

          // Specifications
          kms: vehicleKms.value || undefined,
          transmission: getDisplay(props.vehicle.transmission) || undefined,
          fuel: getDisplay(props.vehicle.fuel) || undefined,
          drivetrain: getDisplay(props.vehicle.drivetrain) || undefined,
          body: getDisplay(props.vehicle.body) || undefined,
          colour: getDisplay(props.vehicle.colour) || props.vehicle.genericolour || undefined,
          seats: props.vehicle.seats?.displayValue?.[0] ? parseInt(props.vehicle.seats.displayValue[0]) : undefined,
          engine: getDisplay(props.vehicle.engine) || undefined,

          // Pricing
          price: props.vehicle.price || undefined,

          // Media (for emails/CRM display)
          thumbnail: vehicleThumbnail.value || undefined,
          vehicleUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        } : undefined,
        tradeIn: hasTradeIn.value ? {
          make: form.tradeMake || undefined,
          model: form.tradeModel || undefined,
          year: form.tradeYear ? parseInt(form.tradeYear) : undefined,
        } : undefined,
        financeInterest: form.financeInterest,
        source: 'vehicle-enquiry-form',
        // UTM tracking for marketing analytics
        ...getUtmParams(),
      }
    });

    isSubmitted.value = true;

    // Track vehicle enquiry conversion
    const conditionValue = getDisplay(props.vehicle?.condition);
    const validCondition = ['new', 'used', 'demo'].includes(conditionValue.toLowerCase())
      ? conditionValue.toLowerCase() as 'new' | 'used' | 'demo'
      : undefined;

    trackVehicleEnquiry({
      form_type: 'vehicle_enquiry',
      form_location: 'vehicle_detail_page',
      enquiry_id: response.enquiry.id,
      vehicle: {
        stockid: props.vehicle ? String(props.vehicle.stockid || props.stockId || '') : undefined,
        condition: validCondition,
        make: props.vehicle ? (getDisplay(props.vehicle.make) || 'Unknown') : 'Unknown',
        model: props.vehicle ? (getDisplay(props.vehicle.model) || 'Unknown') : 'Unknown',
        variant: props.vehicle ? (getDisplay(props.vehicle.badge) || getDisplay(props.vehicle.variant) || undefined) : undefined,
        year: props.vehicle?.year?.displayValue?.[0] ? parseInt(props.vehicle.year.displayValue[0]) : undefined,
        price: props.vehicle?.price,
      },
      has_trade_in: hasTradeIn.value,
      trade_in_vehicle: hasTradeIn.value ? {
        make: form.tradeMake || undefined,
        model: form.tradeModel || undefined,
        year: form.tradeYear || undefined,
      } : undefined,
      finance_interest: form.financeInterest,
      has_message: !!form.message,
    });
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
</style>









