<template>
  <div class="vehicle-enquire-page">
    <LazyPageSchema />

    <div class="uk-section uk-section-primary uk-light">
      <div class="uk-container">
        <h1 class="uk-heading-small">Enquire About This Vehicle</h1>
        <p class="uk-text-lead">{{ vehicleTitle }}</p>
      </div>
    </div>

    <div class="uk-section">
      <div class="uk-container uk-container-small">
        <div class="uk-card uk-card-default uk-card-body">
          <!-- Vehicle Summary -->
          <div v-if="vehicleInfo" class="uk-margin-bottom uk-padding-small uk-background-muted">
            <div class="uk-grid uk-grid-small uk-flex-middle" uk-grid>
              <div class="uk-width-auto">
                <span uk-icon="icon: car; ratio: 2" class="uk-text-primary"></span>
              </div>
              <div class="uk-width-expand">
                <h3 class="uk-margin-remove">{{ vehicleTitle }}</h3>
                <p class="uk-text-meta uk-margin-remove">Stock #{{ vehicleInfo.stockId }}</p>
              </div>
            </div>
          </div>

          <!-- Enquiry Form -->
          <form @submit.prevent="handleSubmit" class="uk-form-stacked">
            <h3>Your Details</h3>

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

            <div class="uk-grid uk-grid-small uk-child-width-1-2@s" uk-grid>
              <div>
                <label class="uk-form-label">Email *</label>
                <input v-model="form.email" type="email" class="uk-input" required />
              </div>
              <div>
                <label class="uk-form-label">Phone *</label>
                <input v-model="form.phone" type="tel" class="uk-input" required />
              </div>
            </div>

            <div class="uk-margin">
              <label class="uk-form-label">Postcode</label>
              <input v-model="form.postcode" type="text" class="uk-input uk-form-width-small" maxlength="4" />
            </div>

            <div class="uk-margin">
              <label class="uk-form-label">Message</label>
              <textarea v-model="form.message" class="uk-textarea" rows="4" placeholder="Any questions or comments?"></textarea>
            </div>

            <div class="uk-margin">
              <label>
                <input v-model="form.testDrive" type="checkbox" class="uk-checkbox" />
                I'd like to book a test drive
              </label>
            </div>

            <div class="uk-margin">
              <label>
                <input v-model="form.tradeIn" type="checkbox" class="uk-checkbox" />
                I have a vehicle to trade in
              </label>
            </div>

            <!-- Trade-in Details -->
            <div v-if="form.tradeIn" class="uk-margin uk-padding-small uk-background-muted">
              <h4>Trade-in Details</h4>
              <div class="uk-grid uk-grid-small uk-child-width-1-3@s" uk-grid>
                <div>
                  <label class="uk-form-label">Make</label>
                  <input v-model="form.tradeInMake" type="text" class="uk-input" />
                </div>
                <div>
                  <label class="uk-form-label">Model</label>
                  <input v-model="form.tradeInModel" type="text" class="uk-input" />
                </div>
                <div>
                  <label class="uk-form-label">Year</label>
                  <input v-model="form.tradeInYear" type="text" class="uk-input" />
                </div>
              </div>
            </div>

            <div class="uk-margin">
              <label>
                <input v-model="form.consent" type="checkbox" class="uk-checkbox" required />
                I agree to the <NuxtLink to="/privacy-policy" target="_blank">Privacy Policy</NuxtLink>
              </label>
            </div>

            <div class="uk-margin-medium-top">
              <button type="submit" class="uk-button uk-button-primary uk-button-large uk-width-1-1" :disabled="submitting">
                {{ submitting ? 'Sending...' : 'Submit Enquiry' }}
              </button>
            </div>
          </form>

          <!-- Success Message -->
          <div v-if="submitted" class="uk-alert-success uk-margin-top" uk-alert>
            <p><strong>Thank you!</strong> Your enquiry has been submitted. We'll be in touch soon.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const config = useRuntimeConfig();

// Parse params: /vehicle-enquire/{condition}-{year}-{make}-{model}-{stockid}
const params = computed(() => {
  const p = route.params.params;
  if (Array.isArray(p) && p.length > 0) {
    const parts = p[0].split('-');
    if (parts.length >= 5) {
      return {
        condition: parts[0],
        year: parts[1],
        make: parts[2],
        model: parts[3],
        stockId: parts.slice(4).join('-'),
      };
    }
  }
  return null;
});

const vehicleInfo = computed(() => params.value);

const vehicleTitle = computed(() => {
  if (!vehicleInfo.value) return 'Vehicle';
  const { year, make, model, condition } = vehicleInfo.value;
  return `${condition === 'used' ? 'Used' : condition === 'new' ? 'New' : 'Demo'} ${year} ${make} ${model}`.replace(/-/g, ' ');
});

// Form
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  postcode: '',
  message: '',
  testDrive: false,
  tradeIn: false,
  tradeInMake: '',
  tradeInModel: '',
  tradeInYear: '',
  consent: false,
});

const submitting = ref(false);
const submitted = ref(false);

const handleSubmit = async () => {
  if (submitting.value) return;
  submitting.value = true;

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
        vehicleInfo: vehicleInfo.value ? {
          condition: vehicleInfo.value.condition || undefined,
          make: vehicleInfo.value.make || undefined,
          model: vehicleInfo.value.model || undefined,
          year: vehicleInfo.value.year ? parseInt(vehicleInfo.value.year) : undefined,
          price: vehicleInfo.value.price ? parseInt(vehicleInfo.value.price) : undefined,
          stockId: vehicleInfo.value.stockId || undefined,
        } : undefined,
        tradeIn: form.tradeIn ? {
          make: form.tradeInMake || undefined,
          model: form.tradeInModel || undefined,
          year: form.tradeInYear ? parseInt(form.tradeInYear) : undefined,
        } : undefined,
        testDrive: form.testDrive,
        source: 'vehicle-enquire-page',
      },
    });

    submitted.value = true;

    if (process.client && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'FormSubmission',
        formType: 'vehicle',
        formStatus: 'submitted',
        enquiryId: response.enquiry.id,
        vehicle: vehicleTitle.value,
      });
    }
  } catch (error) {
    console.error('Form submission error:', error);
  } finally {
    submitting.value = false;
  }
};

// SEO
useSiteMeta({
  title: () => `Enquire - ${vehicleTitle.value}`,
  description: () => `Enquire about the ${vehicleTitle.value} at Sale Hyundai.`,
});
</script>

<style lang="scss" scoped>
.vehicle-enquire-page {
  min-height: 80vh;
}
</style>





