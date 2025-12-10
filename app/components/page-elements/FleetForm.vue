<template>
  <div class="fleet-form uk-padding-small">
    <div class="uk-container">
      <div class="uk-text-center uk-margin-medium-top">
        <div class="uk-h1 uk-text-bold">Fleet Enquiry</div>
        <p class="uk-text-lead">
          Whether you need one vehicle or an entire fleet, we can help you find the right solution for your business.
        </p>
      </div>

      <div class="uk-grid-large" uk-grid>
        <!-- Form Section -->
        <div class="uk-width-2-3@m">
          <div v-if="!isSubmitted" class="uk-card uk-card-default uk-card-body">
            <form @submit.prevent="submitForm" :class="{ 'errors': hasErrors }">
              <div v-if="hasErrors" class="uk-alert uk-alert-danger">
                Please fill in all required fields.
              </div>

              <!-- Contact Details -->
              <div class="uk-h4 uk-margin-remove-top">Contact Details</div>
              
              <fieldset class="uk-fieldset uk-grid-small" uk-grid>
                <div class="uk-width-1-2@m">
                  <label class="uk-form-label">First Name *</label>
                  <input 
                    v-model="form.firstName" 
                    class="uk-input" 
                    type="text" 
                    required
                  />
                </div>

                <div class="uk-width-1-2@m">
                  <label class="uk-form-label">Last Name *</label>
                  <input 
                    v-model="form.lastName" 
                    class="uk-input" 
                    type="text" 
                    required
                  />
                </div>

                <div class="uk-width-1-2@m">
                  <label class="uk-form-label">Email Address *</label>
                  <input 
                    v-model="form.email" 
                    class="uk-input" 
                    type="email" 
                    required
                  />
                </div>

                <div class="uk-width-1-2@m">
                  <label class="uk-form-label">Phone Number *</label>
                  <input 
                    v-model="form.phone" 
                    class="uk-input" 
                    type="tel" 
                    required
                  />
                </div>
              </fieldset>

              <!-- Business Details -->
              <div class="uk-h4 uk-margin-top">Business Details</div>
              
              <fieldset class="uk-fieldset uk-grid-small" uk-grid>
                <div class="uk-width-1-2@m">
                  <label class="uk-form-label">Company Name *</label>
                  <input 
                    v-model="form.companyName" 
                    class="uk-input" 
                    type="text" 
                    required
                  />
                </div>

                <div class="uk-width-1-2@m">
                  <label class="uk-form-label">ABN</label>
                  <input 
                    v-model="form.abn" 
                    class="uk-input" 
                    type="text"
                  />
                </div>

                <div class="uk-width-1-2@m">
                  <label class="uk-form-label">Industry</label>
                  <select v-model="form.industry" class="uk-select">
                    <option value="">Select Industry</option>
                    <option value="construction">Construction</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="transport">Transport & Logistics</option>
                    <option value="retail">Retail</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="government">Government</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div class="uk-width-1-2@m">
                  <label class="uk-form-label">Fleet Size</label>
                  <select v-model="form.fleetSize" class="uk-select">
                    <option value="">Select Fleet Size</option>
                    <option value="1-5">1-5 vehicles</option>
                    <option value="6-10">6-10 vehicles</option>
                    <option value="11-25">11-25 vehicles</option>
                    <option value="26-50">26-50 vehicles</option>
                    <option value="50+">50+ vehicles</option>
                  </select>
                </div>
              </fieldset>

              <!-- Vehicle Requirements -->
              <div class="uk-h4 uk-margin-top">Vehicle Requirements</div>
              
              <fieldset class="uk-fieldset uk-grid-small" uk-grid>
                <div class="uk-width-1-2@m">
                  <label class="uk-form-label">Number of Vehicles Required</label>
                  <input 
                    v-model="form.vehiclesRequired" 
                    class="uk-input" 
                    type="number"
                    min="1"
                  />
                </div>

                <div class="uk-width-1-2@m">
                  <label class="uk-form-label">Vehicle Type Interest</label>
                  <select v-model="form.vehicleType" class="uk-select">
                    <option value="">Select Type</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="van">Van / iLoad</option>
                    <option value="ute">Ute</option>
                    <option value="electric">Electric / Hybrid</option>
                    <option value="mixed">Mixed Fleet</option>
                  </select>
                </div>

                <div class="uk-width-1-1">
                  <label class="uk-form-label">Models of Interest</label>
                  <div class="uk-grid-small uk-child-width-1-3@m uk-child-width-1-2" uk-grid>
                    <label v-for="model in availableModels" :key="model">
                      <input 
                        type="checkbox" 
                        class="uk-checkbox" 
                        :value="model"
                        v-model="form.modelsInterested"
                      />
                      {{ model }}
                    </label>
                  </div>
                </div>

                <div class="uk-width-1-1">
                  <label class="uk-form-label">Additional Requirements</label>
                  <textarea 
                    v-model="form.requirements" 
                    class="uk-textarea" 
                    rows="4" 
                    placeholder="Tell us about your specific requirements, timeline, and any questions you have..."
                  ></textarea>
                </div>

                <div class="uk-width-1-1">
                  <label>
                    <input type="checkbox" class="uk-checkbox" v-model="form.contactPreference" />
                    I'd prefer to be contacted by phone
                  </label>
                </div>

                <div class="uk-width-1-1">
                  <p class="uk-text-meta">
                    Your personal information will be collected, used and stored in strict accordance with our
                    <NuxtLink to="/privacy-policy" class="uk-text-primary" target="_blank">Privacy Policy</NuxtLink>.
                  </p>
                </div>
              </fieldset>

              <div class="uk-margin-medium-top">
                <button 
                  type="submit" 
                  class="uk-button uk-button-primary uk-button-large uk-width-1-1"
                  :disabled="isSubmitting"
                >
                  <span v-if="isSubmitting" uk-spinner="ratio: 0.6"></span>
                  {{ isSubmitting ? 'Submitting...' : 'Submit Fleet Enquiry' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Success Message -->
          <div v-else class="uk-card uk-card-default uk-card-body uk-text-center">
            <span uk-icon="icon: check; ratio: 4" class="uk-text-success"></span>
            <h2>Thank You!</h2>
            <p class="uk-text-lead">
              Your fleet enquiry has been received. Our dedicated fleet team will review your requirements and contact you within 24 hours.
            </p>
            <button @click="resetForm" class="uk-button uk-button-default">
              Submit Another Enquiry
            </button>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="uk-width-1-3@m">
          <div class="uk-card uk-card-primary uk-card-body">
            <h3 class="uk-card-title">Fleet Benefits</h3>
            <ul class="uk-list uk-list-bullet">
              <li>Competitive fleet pricing</li>
              <li>Priority servicing</li>
              <li>Dedicated fleet manager</li>
              <li>Flexible finance options</li>
              <li>Volume discounts</li>
              <li>Extended warranty options</li>
            </ul>
          </div>

          <div class="uk-card uk-card-default uk-card-body uk-margin-top">
            <h3 class="uk-card-title">Contact Fleet Sales</h3>
            <p>Speak directly with our fleet specialists:</p>
            <a 
              v-if="salesPhone" 
              :href="`tel:${salesPhone.replace(/[^0-9+]/g, '')}`"
              class="uk-button uk-button-default uk-width-1-1"
            >
              <span uk-icon="receiver"></span>
              {{ salesPhone }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const mainStore = useMainStore();

const salesPhone = computed(() => mainStore.site?.departments?.sales?.phone || '');

const availableModels = [
  'i30', 'i30 Sedan', 'Tucson', 'Santa Fe', 'Kona', 'Kona Electric',
  'IONIQ 5', 'IONIQ 6', 'Palisade', 'Staria', 'iLoad'
];

// Form state
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  companyName: '',
  abn: '',
  industry: '',
  fleetSize: '',
  vehiclesRequired: '',
  vehicleType: '',
  modelsInterested: [] as string[],
  requirements: '',
  contactPreference: false
});

const isSubmitting = ref(false);
const isSubmitted = ref(false);
const hasErrors = ref(false);

// Submit form
const submitForm = async () => {
  if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.companyName) {
    hasErrors.value = true;
    return;
  }

  hasErrors.value = false;
  isSubmitting.value = true;

  try {
    // Build message with fleet details
    const fleetDetails = [
      `Company: ${form.companyName}`,
      form.abn ? `ABN: ${form.abn}` : null,
      form.industry ? `Industry: ${form.industry}` : null,
      form.fleetSize ? `Current Fleet Size: ${form.fleetSize}` : null,
      form.vehiclesRequired ? `Vehicles Required: ${form.vehiclesRequired}` : null,
      form.vehicleType ? `Vehicle Type: ${form.vehicleType}` : null,
      form.modelsInterested.length ? `Models Interested: ${form.modelsInterested.join(', ')}` : null,
      form.requirements ? `Requirements: ${form.requirements}` : null,
      form.contactPreference ? 'Contact Preference: Phone' : 'Contact Preference: Email',
    ].filter(Boolean).join('\n');

    // Submit to the new Neon database API
    const response = await $fetch<{ enquiry: { id: string } }>('/api/submit-enquiry', {
      method: 'POST',
      body: {
        type: 'vehicle',
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        message: fleetDetails,
        vehicleInfo: {
          condition: 'new',
          make: 'Hyundai',
          model: form.modelsInterested.length ? form.modelsInterested[0] : undefined,
        },
        source: 'fleet-form',
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
        companyName: form.companyName,
        fleetSize: form.fleetSize,
      });
    }
  } catch (error) {
    console.error('Form submission error:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  form.firstName = '';
  form.lastName = '';
  form.email = '';
  form.phone = '';
  form.companyName = '';
  form.abn = '';
  form.industry = '';
  form.fleetSize = '';
  form.vehiclesRequired = '';
  form.vehicleType = '';
  form.modelsInterested = [];
  form.requirements = '';
  form.contactPreference = false;
  isSubmitted.value = false;
};
</script>

<style lang="scss" scoped>
.fleet-form {
  background-color: #f8f8f8;
  padding-bottom: 60px;
}

.uk-form-label {
  font-weight: 500;
  margin-bottom: 5px;
  display: block;
}

.uk-checkbox {
  margin-right: 8px;
}
</style>




