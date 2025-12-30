<template>
  <div class="contact-form uk-padding-small">
    <div class="uk-grid-column-small uk-grid-row-large uk-child-width-1-2@m" uk-grid>
      <div>
        <div class="uk-text-center uk-margin-medium-top">
          <div class="uk-h1 uk-text-bold uk-text-capitalize">Contact {{ siteName }}</div>
          <p>At {{ siteName }}, your satisfaction is important to us. We're here to help.</p>
          <p v-if="activeHoursTab === 'parts_form'">
            Genuine Hyundai Parts are designed to meet the highest level of quality
            <br class="uk-visible@m" />
            expected not only by Hyundai, but also by our customers.
          </p>
          <div class="uk-h4 uk-margin-remove">Your Details</div>
        </div>

        <ul :id="id" class="uk-hidden" uk-switcher="animation: uk-animation-slide-left-medium, uk-animation-slide-right-medium">
          <li><a href="#"></a></li>
          <li><a href="#"></a></li>
        </ul>

        <ul class="uk-switcher">
          <!-- Step 1: Form -->
          <li>
            <div class="uk-width-1-1 small-lead-form">
              <div class="uk-padding-small">
                <form novalidate @submit.prevent="checkForm" :class="{ errors: hasErrors }">
                  <div v-if="hasErrors" class="error-message">
                    <div>Please correct the following error(s):</div>
                    <ul class="uk-list uk-list-hyphen uk-hidden">
                      <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
                    </ul>
                  </div>

                  <fieldset class="uk-fieldset uk-grid-small uk-grid">
                    <div class="uk-width-1-2@m uk-inline">
                      <input
                        id="first_name"
                        v-model="form.firstName"
                        class="uk-input uk-form-large"
                        name="first_name"
                        required
                        placeholder="First Name"
                        type="text"
                      />
                      <label class="uk-form-label" for="first_name">First Name<sup>*</sup></label>
                      <span class="error-message uk-text-small">First name required</span>
                      <span class="uk-form-icon" uk-icon="icon: user"></span>
                    </div>

                    <div class="uk-width-1-2@m uk-inline">
                      <input
                        id="second_name"
                        v-model="form.lastName"
                        class="uk-input uk-form-large"
                        name="second_name"
                        required
                        placeholder="Last Name"
                        type="text"
                      />
                      <label class="uk-form-label" for="second_name">Last Name<sup>*</sup></label>
                      <span class="error-message uk-text-small">Last name required</span>
                      <span class="uk-form-icon" uk-icon="icon: user"></span>
                    </div>

                    <div class="uk-width-1-1 uk-inline">
                      <input
                        id="email_a"
                        v-model="form.email"
                        class="uk-input uk-form-large"
                        name="email_a"
                        required
                        placeholder="Email Address"
                        type="email"
                      />
                      <label class="uk-form-label" for="email_a">Email Address<sup>*</sup></label>
                      <span class="error-message uk-text-small">Email address required</span>
                      <span class="uk-form-icon" uk-icon="icon: mail"></span>
                    </div>

                    <div class="uk-width-1-1 uk-inline">
                      <input
                        id="phone_n"
                        :value="formattedPhoneNumber"
                        class="uk-input uk-form-large"
                        :class="{ 'error-phone-input': !isPhoneValid && form.phone }"
                        name="phone_n"
                        placeholder="Phone Number"
                        type="tel"
                        @input="handlePhoneInput"
                      />
                      <label class="uk-form-label" for="phone_n">Phone Number<sup>*</sup></label>
                      <span class="error-message uk-text-small">Phone not valid</span>
                      <span v-if="!isPhoneValid && form.phone" class="uk-text-small error-phone">Phone not valid</span>
                      <span class="uk-form-icon" uk-icon="icon: receiver"></span>
                    </div>

                    <div v-if="activeHoursTab === 'parts_form'" class="uk-width-1-1 uk-inline">
                      <input
                        id="registration"
                        v-model="form.registration"
                        class="uk-input uk-form-large"
                        name="registration"
                        placeholder="Vehicle Registration"
                        type="text"
                        required
                      />
                      <label class="uk-form-label" for="registration">Vehicle Registration</label>
                      <span class="error-message uk-text-small">Vehicle Registration required</span>
                      <span class="uk-form-icon" uk-icon="icon: file-edit"></span>
                    </div>

                    <div class="uk-width-1-1 uk-inline message-textarea">
                      <textarea
                        v-model="form.message"
                        rows="4"
                        class="uk-textarea"
                        name="message"
                        placeholder="Message"
                      ></textarea>
                      <label class="uk-form-label" for="message">Message</label>
                      <span class="uk-form-icon" uk-icon="icon: commenting"></span>
                    </div>

                    <div class="uk-width-1-1">
                      <p class="uk-text-meta uk-margin-small-top">
                        Your personal information will be collected, used and stored in strict accordance with our
                        <NuxtLink class="uk-text-primary" to="/privacy-policy" target="_blank">Privacy Policy</NuxtLink>.
                        Our Privacy Policy contains details on how information is used, how you may access / correct
                        information held and our privacy complaints processes.
                      </p>
                    </div>
                  </fieldset>
                </form>

                <div class="uk-grid-small uk-margin-medium-top uk-child-width-1-2" uk-grid>
                  <div class="uk-margin-auto-left">
                    <button class="uk-button uk-width-1-1 uk-button-primary" @click="checkForm">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </li>

          <!-- Step 2: Confirmation -->
          <li>
            <div class="uk-width-1-1 uk-inline">
              <div
                v-show="isSending"
                class="uk-overlay form-overlay-default uk-width-1-1 uk-height-1-1 uk-position-top-left uk-position-z-index"
              >
                <div class="uk-position-center uk-text-center">
                  <div uk-spinner="ratio: 2"></div>
                  <p>Sending...</p>
                </div>
              </div>

              <div
                v-show="isSent"
                class="uk-overlay form-overlay-default uk-width-1-1 uk-height-1-1 uk-position-top-left uk-position-z-index"
              >
                <div class="uk-position-center uk-text-center form-confirmation">
                  <strong>Hi {{ form.firstName }}</strong>
                  <div>Thank you for your enquiry. One of our staff members will be in touch shortly.</div>
                </div>
              </div>

              <div class="uk-padding-small">
                <div>
                  <a href="#" class="uk-button uk-button-link uk-link-reset" uk-switcher-item="0">
                    <span uk-icon="chevron-left"></span> Back
                  </a>
                  <div class="uk-text-secondary uk-text-bold uk-float-right">Confirm & Send</div>
                </div>

                <ul class="uk-list uk-list-divider uk-padding-small">
                  <li>First Name: <div class="uk-float-right uk-text-bold">{{ form.firstName }}</div></li>
                  <li>Last Name: <div class="uk-float-right uk-text-bold">{{ form.lastName }}</div></li>
                  <li>Email Address: <div class="uk-float-right uk-text-bold">{{ form.email }}</div></li>
                  <li v-if="form.phone">Phone Number: <div class="uk-float-right uk-text-bold">{{ form.phone }}</div></li>
                  <li v-if="form.registration">Vehicle Registration: <div class="uk-float-right uk-text-bold">{{ form.registration }}</div></li>
                  <li v-if="form.message">
                    <div>Message:</div>
                    <div>{{ form.message }}</div>
                  </li>
                </ul>

                <div class="uk-grid-small uk-margin-small-top uk-margin-medium-bottom" uk-grid>
                  <div class="uk-margin-auto">
                    <button
                      class="uk-button uk-button-large border-radius-50 uk-width-1-1 uk-button-primary"
                      @click="submitForm"
                    >
                      Send Enquiry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div>
        <div class="uk-text-center uk-margin-medium-top">
          <div class="uk-h1 uk-text-bold uk-margin-medium-bottom">Our Trading Hours</div>
        </div>

        <div class="uk-margin--top">
          <LazyHeaderHours :active-tab="activeHoursTab" :switch-id="activeHoursTab" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  activeHoursTab?: string;
  id?: string;
  formType?: string;
}

const props = withDefaults(defineProps<Props>(), {
  activeHoursTab: 'contact_form',
  id: 'contact-form',
  formType: 'contact',
});

const { $uikit } = useNuxtApp();
const route = useRoute();
const mainStore = useMainStore();
const config = useRuntimeConfig();
const { trackContactForm, trackPartsEnquiry } = useAnalytics();
const { getUtmParams } = useUtmParams();

// State
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  registration: '',
  message: '',
});

const errors = ref<string[]>([]);
const isSending = ref(false);
const isSent = ref(false);

// Computed
const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');
const hasErrors = computed(() => errors.value.length > 0);

const formattedPhoneNumber = computed(() => {
  let number = form.phone.replace(/\D/g, '');
  if (number.startsWith('04')) {
    // Mobile number
    if (number.length <= 4) return number;
    if (number.length <= 7) return `${number.slice(0, 4)} ${number.slice(4)}`;
    return `${number.slice(0, 4)} ${number.slice(4, 7)} ${number.slice(7)}`;
  } else {
    // Landline
    if (number.length <= 2) return number;
    if (number.length <= 6) return `(${number.slice(0, 2)}) ${number.slice(2)}`;
    return `(${number.slice(0, 2)}) ${number.slice(2, 6)} ${number.slice(6)}`;
  }
});

const isPhoneValid = computed(() => {
  const phone = formattedPhoneNumber.value;
  const mobileRegex = /^04\d{2}\s?\d{3}\s?\d{3}$/;
  const landlineRegex = /^\(0\d\)\s?\d{4}\s?\d{4}$/;
  return mobileRegex.test(phone) || landlineRegex.test(phone);
});

// Methods
const handlePhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  form.phone = target.value.replace(/\D/g, '').slice(0, 10);
};

const validEmail = (email: string) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

const checkForm = () => {
  errors.value = [];

  if (props.activeHoursTab === 'parts_form' && !form.registration) {
    errors.value.push('Vehicle Registration required.');
  }

  if (form.phone && !isPhoneValid.value) {
    errors.value.push('Valid phone number required.');
  }

  if (!form.firstName) {
    errors.value.push('First Name required.');
  }

  if (!form.lastName) {
    errors.value.push('Last Name required.');
  }

  if (!form.email) {
    errors.value.push('Email required.');
  } else if (!validEmail(form.email)) {
    errors.value.push('Valid email required.');
  }

  if (errors.value.length === 0 && $uikit) {
    const switcher = document.getElementById(props.id);
    if (switcher) {
      $uikit.switcher(switcher).show(1);
    }
  }
};

const submitForm = async () => {
  isSending.value = true;

  try {
    // Map form type to API type
    const typeMap: Record<string, string> = {
      contact_form: 'contact',
      parts_form: 'parts',
      service_form: 'service',
      finance_form: 'finance',
    };

    // Get UTM params for marketing attribution
    const utmParams = getUtmParams();

    // Submit to the new Neon database API
    const response = await $fetch<{ enquiry: { id: string } }>('/api/submit-enquiry', {
      method: 'POST',
      body: {
        type: typeMap[props.activeHoursTab] || props.formType || 'contact',
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        message: form.message || undefined,
        vehicleInfo: form.registration ? { registration: form.registration } : undefined,
        source: route.path,
        // UTM tracking for marketing analytics
        utmSource: utmParams.utmSource,
        utmMedium: utmParams.utmMedium,
        utmCampaign: utmParams.utmCampaign,
      },
    });

    isSending.value = false;
    isSent.value = true;

    // Track conversion with enhanced analytics
    const formType = typeMap[props.activeHoursTab] || props.formType || 'contact';
    if (formType === 'parts') {
      trackPartsEnquiry({
        form_location: 'contact_page',
        enquiry_id: response.enquiry.id,
        has_registration: !!form.registration,
        has_message: !!form.message,
      });
    } else {
      trackContactForm({
        form_location: 'contact_page',
        enquiry_id: response.enquiry.id,
        department: formType,
        has_message: !!form.message,
      });
    }
  } catch (error: any) {
    console.error('Form submission error:', error);
    isSending.value = false;
  }
};
</script>

<style>
.form-wrap .trading-title {
  display: none;
}

.error-phone {
  color: #ff002f;
}

.error-phone-input {
  border: 1px solid #ff002f;
}
</style>









