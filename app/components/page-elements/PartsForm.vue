<template>
  <div class="parts-form uk-padding-small">
    <div class="uk-grid-column-small uk-grid-row-large uk-child-width-1-2@m" uk-grid>
      <!-- Form Section -->
      <div>
        <div class="uk-text-center uk-margin-medium-top">
          <div class="uk-h1 uk-text-bold uk-text-capitalize">Parts Enquiry</div>
          <p>
            Genuine Hyundai Parts are designed to meet the highest level of quality
            <br class="uk-visible@m" />
            expected not only by Hyundai, but also by our customers.
          </p>
          <div class="uk-h4 uk-margin-remove">Your Details</div>
        </div>

        <div v-if="!isSubmitted" class="uk-padding-small">
          <form @submit.prevent="submitForm" :class="{ 'errors': hasErrors }">
            <div v-if="hasErrors" class="uk-alert uk-alert-danger">
              Please correct the errors below.
            </div>

            <fieldset class="uk-fieldset uk-grid-small" uk-grid>
              <div class="uk-width-1-2@m uk-inline">
                <span class="uk-form-icon" uk-icon="icon: user"></span>
                <input 
                  v-model="form.firstName" 
                  class="uk-input uk-form-large" 
                  type="text" 
                  placeholder="First Name"
                  required
                />
              </div>

              <div class="uk-width-1-2@m uk-inline">
                <span class="uk-form-icon" uk-icon="icon: user"></span>
                <input 
                  v-model="form.lastName" 
                  class="uk-input uk-form-large" 
                  type="text" 
                  placeholder="Last Name"
                  required
                />
              </div>

              <div class="uk-width-1-1 uk-inline">
                <span class="uk-form-icon" uk-icon="icon: mail"></span>
                <input 
                  v-model="form.email" 
                  class="uk-input uk-form-large" 
                  type="email" 
                  placeholder="Email Address"
                  required
                />
              </div>

              <div class="uk-width-1-1 uk-inline">
                <span class="uk-form-icon" uk-icon="icon: receiver"></span>
                <input 
                  v-model="form.phone" 
                  class="uk-input uk-form-large" 
                  type="tel" 
                  placeholder="Phone Number"
                />
              </div>

              <div class="uk-width-1-1">
                <div class="uk-h4 uk-margin-small-top uk-margin-small-bottom">Vehicle Details</div>
              </div>

              <div class="uk-width-1-2@m uk-inline">
                <span class="uk-form-icon" uk-icon="icon: car"></span>
                <input 
                  v-model="form.vehicleMake" 
                  class="uk-input uk-form-large" 
                  type="text" 
                  placeholder="Vehicle Make"
                />
              </div>

              <div class="uk-width-1-2@m uk-inline">
                <span class="uk-form-icon" uk-icon="icon: car"></span>
                <input 
                  v-model="form.vehicleModel" 
                  class="uk-input uk-form-large" 
                  type="text" 
                  placeholder="Vehicle Model"
                />
              </div>

              <div class="uk-width-1-2@m uk-inline">
                <span class="uk-form-icon" uk-icon="icon: calendar"></span>
                <input 
                  v-model="form.vehicleYear" 
                  class="uk-input uk-form-large" 
                  type="text" 
                  placeholder="Vehicle Year"
                />
              </div>

              <div class="uk-width-1-2@m uk-inline">
                <span class="uk-form-icon" uk-icon="icon: file-text"></span>
                <input 
                  v-model="form.registration" 
                  class="uk-input uk-form-large" 
                  type="text" 
                  placeholder="Registration Number"
                />
              </div>

              <div class="uk-width-1-1 uk-inline">
                <span class="uk-form-icon" uk-icon="icon: file-text"></span>
                <input 
                  v-model="form.vin" 
                  class="uk-input uk-form-large" 
                  type="text" 
                  placeholder="VIN Number (optional)"
                />
              </div>

              <div class="uk-width-1-1">
                <div class="uk-h4 uk-margin-small-top uk-margin-small-bottom">Part Details</div>
              </div>

              <div class="uk-width-1-1 uk-inline">
                <span class="uk-form-icon" uk-icon="icon: settings"></span>
                <input 
                  v-model="form.partNumber" 
                  class="uk-input uk-form-large" 
                  type="text" 
                  placeholder="Part Number (if known)"
                />
              </div>

              <div class="uk-width-1-1 uk-inline">
                <span class="uk-form-icon" uk-icon="icon: commenting"></span>
                <textarea 
                  v-model="form.partDescription" 
                  class="uk-textarea" 
                  rows="4" 
                  placeholder="Part Description / Requirements"
                  required
                ></textarea>
              </div>

              <div class="uk-width-1-1">
                <p class="uk-text-meta uk-margin-small-top">
                  Your personal information will be collected, used and stored in strict accordance with our
                  <NuxtLink to="/privacy-policy" class="uk-text-primary" target="_blank">Privacy Policy</NuxtLink>.
                </p>
              </div>
            </fieldset>

            <div class="uk-margin-medium-top uk-text-center">
              <button 
                type="submit" 
                class="uk-button uk-button-primary uk-button-large"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" uk-spinner="ratio: 0.6"></span>
                {{ isSubmitting ? 'Sending...' : 'Submit Parts Enquiry' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Success Message -->
        <div v-else class="uk-text-center uk-padding">
          <span uk-icon="icon: check; ratio: 3" class="uk-text-success"></span>
          <h3>Thank You, {{ form.firstName }}!</h3>
          <p>Your parts enquiry has been submitted. Our parts department will be in touch shortly with availability and pricing.</p>
        </div>
      </div>

      <!-- Trading Hours Section -->
      <div>
        <div class="uk-text-center uk-margin-medium-top">
          <div class="uk-h1 uk-text-bold uk-margin-medium-bottom">Parts Department</div>
        </div>
        
        <LazyHeaderHours activeTab="parts" />

        <div class="uk-margin-medium-top uk-text-center">
          <div class="uk-h4">Contact Parts Directly</div>
          <a 
            v-if="partsPhone" 
            :href="`tel:${partsPhone.replace(/[^0-9+]/g, '')}`"
            class="uk-button uk-button-default uk-button-large"
          >
            <span uk-icon="receiver"></span>
            {{ partsPhone }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const mainStore = useMainStore();

const siteName = computed(() => mainStore.site?.name || 'Sale Hyundai');
const partsPhone = computed(() => mainStore.site?.departments?.parts?.phone || '');

// Form state
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  vehicleMake: 'Hyundai',
  vehicleModel: '',
  vehicleYear: '',
  registration: '',
  vin: '',
  partNumber: '',
  partDescription: ''
});

const isSubmitting = ref(false);
const isSubmitted = ref(false);
const hasErrors = ref(false);

// Submit form
const submitForm = async () => {
  if (!form.firstName || !form.lastName || !form.email || !form.partDescription) {
    hasErrors.value = true;
    return;
  }

  hasErrors.value = false;
  isSubmitting.value = true;

  try {
    await $fetch('/api/form', {
      method: 'POST',
      body: {
        payload: {
          input_1: `${form.firstName} ${form.lastName}`,
          input_2: form.phone,
          input_3: form.email,
          input_4: form.partDescription,
          input_5: form.vehicleMake,
          input_6: form.vehicleModel,
          input_7: form.vehicleYear,
          input_8: form.registration,
          input_9: form.vin,
          input_10: form.partNumber,
        },
        formid: mainStore.site?.forms?.parts || 'parts'
      }
    });

    isSubmitted.value = true;

    // GTM tracking
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'FormSub Parts',
        formName: 'Parts Form',
        formStatus: 'submitted',
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
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
.parts-form {
  background-color: #f8f8f8;
}

.uk-form-icon {
  color: #999;
}

.uk-input,
.uk-textarea {
  &:focus {
    border-color: var(--color-primary);
  }
}
</style>



