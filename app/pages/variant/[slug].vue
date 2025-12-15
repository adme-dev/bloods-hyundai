<template>
  <div class="variant-enquire-page">
    <LazyPageSchema />

    <!-- Loading -->
    <div v-if="pending" class="uk-section uk-text-center">
      <div uk-spinner="ratio: 2"></div>
      <p class="uk-margin-top">Loading...</p>
    </div>

    <!-- Content -->
    <div v-else-if="variant">
      <!-- Header -->
      <div class="uk-section uk-section-primary uk-light">
        <div class="uk-container">
          <div class="uk-grid uk-grid-large uk-flex-middle" uk-grid>
            <div class="uk-width-1-2@m">
              <h1 class="uk-heading-small">Enquire About {{ variant.name }}</h1>
              <p v-if="variant.startingPrice" class="uk-h3 uk-margin-small-top">
                From {{ variant.startingPrice }}
              </p>
            </div>
            <div class="uk-width-1-2@m">
              <img 
                v-if="variant.image"
                :src="variant.image"
                :alt="variant.name"
                class="uk-width-1-1"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Form Section -->
      <div class="uk-section">
        <div class="uk-container">
          <div class="uk-grid uk-grid-large" uk-grid>
            <!-- Vehicle Info -->
            <div class="uk-width-1-3@m">
              <div class="uk-card uk-card-default uk-card-body">
                <h3 class="uk-card-title">{{ variant.name }}</h3>
                
                <ul v-if="variant.highlights" class="uk-list uk-list-disc">
                  <li v-for="(highlight, index) in variant.highlights" :key="index">
                    {{ highlight }}
                  </li>
                </ul>

                <div v-if="variant.specifications" class="uk-margin-top">
                  <h4>Key Specs</h4>
                  <dl class="uk-description-list">
                    <template v-for="(value, key) in variant.specifications" :key="key">
                      <dt>{{ key }}</dt>
                      <dd>{{ value }}</dd>
                    </template>
                  </dl>
                </div>
              </div>
            </div>

            <!-- Enquiry Form -->
            <div class="uk-width-2-3@m">
              <div class="uk-card uk-card-default uk-card-body">
                <h2 class="uk-card-title">Get a Quote</h2>
                <p class="uk-text-muted">Fill in your details and we'll get back to you with a personalized quote.</p>

                <form @submit.prevent="handleSubmit" class="uk-form-stacked uk-margin-medium-top">
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
                    <label class="uk-form-label">Comments</label>
                    <textarea v-model="form.comments" class="uk-textarea" rows="3"></textarea>
                  </div>

                  <div class="uk-margin">
                    <label>
                      <input v-model="form.testDrive" type="checkbox" class="uk-checkbox" />
                      I'd like to book a test drive
                    </label>
                  </div>

                  <div class="uk-margin">
                    <label>
                      <input v-model="form.consent" type="checkbox" class="uk-checkbox" required />
                      I agree to the <NuxtLink to="/privacy-policy" target="_blank">Privacy Policy</NuxtLink>
                    </label>
                  </div>

                  <div class="uk-margin-medium-top">
                    <button type="submit" class="uk-button uk-button-primary uk-button-large" :disabled="submitting">
                      {{ submitting ? 'Sending...' : 'Submit Enquiry' }}
                    </button>
                  </div>
                </form>

                <div v-if="submitted" class="uk-alert-success uk-margin-top" uk-alert>
                  <p><strong>Thank you!</strong> We've received your enquiry and will be in touch soon.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="uk-section uk-text-center">
      <h2>Vehicle Not Found</h2>
      <NuxtLink to="/build-and-price" class="uk-button uk-button-primary">View All Models</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const slug = computed(() => route.params.slug as string);

// Fetch variant
const { data: variant, pending } = await useFetch('/api/variant-details', {
  params: { variantId: slug },
  transform: (data: any) => data.variant,
  lazy: true,
});

// SEO
useSiteMeta({
  title: () => `Enquire - ${variant.value?.name || 'Vehicle'}`,
  description: () => `Get a quote for the ${variant.value?.name || 'vehicle'} at Sale Hyundai.`,
});

// Form
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  postcode: '',
  comments: '',
  testDrive: false,
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
        message: form.comments || undefined,
        vehicleInfo: variant.value ? {
          condition: 'new',
          make: 'Hyundai',
          model: variant.value.name,
          variant: variant.value.variant,
        } : undefined,
        testDrive: form.testDrive,
        source: `variant-page-${slug.value}`,
      },
    });

    submitted.value = true;

    if (process.client && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'FormSubmission',
        formType: 'vehicle',
        formStatus: 'submitted',
        enquiryId: response.enquiry.id,
        variant: variant.value?.name,
      });
    }
  } catch (error) {
    console.error('Form submission error:', error);
  } finally {
    submitting.value = false;
  }
};
</script>







