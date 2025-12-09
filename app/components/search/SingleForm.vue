<template>
  <div class="car-sales-form">
    <div class="uk-card uk-card-hover uk-padding-small">
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
interface Vehicle {
  stockid?: string | number;
  slug?: string;
  title?: string;
  condition?: { displayValue?: string[] };
  make?: { displayValue?: string[] };
  model?: { displayValue?: string[] };
  badge?: { displayValue?: string[] };
  [key: string]: any;
}

const props = defineProps<{
  item?: Vehicle;
  itemStock?: string | number;
  condition?: string;
}>();

const mainStore = useMainStore();

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
    
    await $fetch('/api/form', {
      method: 'POST',
      body: {
        payload: {
          input_1: form.name,
          input_2: form.phone,
          input_3: form.email,
          input_4: form.message,
          input_5: vehicle?.stockid || props.itemStock,
          input_6: form.finance ? 'Yes I\'m interested in finance.' : '',
          input_7: form.tradeIn ? 'Yes I have a vehicle to trade in' : '',
          input_17: form.testDrive ? 'Yes I would like a test drive' : '',
          input_8: vehicle?.condition?.displayValue?.[0] || props.condition || '',
          input_9: vehicle?.make?.displayValue?.[0] || '',
          input_10: vehicle?.model?.displayValue?.[0] || '',
          input_11: vehicle?.badge?.displayValue?.[0] || '',
          input_12: `${vehicle?.stockid || props.itemStock}/${vehicle?.slug || ''}`,
          input_26: 'Stock Enquiry Page',
        },
        formid: mainStore.site?.forms?.carsales || 'carsales'
      }
    });

    isSent.value = true;

    // GTM tracking
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'FormSub Vehicle',
        formName: 'Vehicle Enquiry',
        formStatus: 'submitted',
        stockId: vehicle?.stockid || props.itemStock,
        vehicleTitle: vehicle?.title,
        testDrive: form.testDrive,
        tradeIn: form.tradeIn,
        finance: form.finance,
      });
    }
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

@media (min-width: 960px) {
  .single-modal .sidebar-card {
    max-width: 350px;
  }
}
</style>



