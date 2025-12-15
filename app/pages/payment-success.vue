<template>
  <div class="payment-success-page">
    <div class="uk-section uk-section-large">
      <div class="uk-container uk-container-small uk-text-center">
        <!-- Loading -->
        <div v-if="pending" class="uk-padding-large">
          <div uk-spinner="ratio: 2"></div>
          <p class="uk-margin-top">Confirming your payment...</p>
        </div>

        <!-- Success -->
        <div v-else-if="sessionData" class="success-content">
          <div class="success-icon">
            <span uk-icon="icon: check; ratio: 4" class="uk-text-success"></span>
          </div>
          
          <h1 class="uk-heading-small uk-margin-medium-top">Payment Successful!</h1>
          
          <p class="uk-text-lead uk-text-muted">
            Thank you for your deposit. Your vehicle has been secured.
          </p>

          <div class="uk-card uk-card-default uk-card-body uk-margin-medium-top">
            <h3 class="uk-card-title">Order Details</h3>
            
            <dl class="uk-description-list uk-description-list-divider">
              <dt>Vehicle</dt>
              <dd>{{ sessionData.description }}</dd>
              
              <dt>Reference</dt>
              <dd>{{ sessionData.vehicleId }}</dd>
            </dl>
          </div>

          <div class="uk-margin-large-top">
            <p class="uk-text-muted">
              A confirmation email has been sent to your registered email address.
              One of our team members will be in touch within 24 hours.
            </p>
          </div>

          <div class="uk-margin-medium-top">
            <NuxtLink to="/" class="uk-button uk-button-primary uk-button-large">
              Return to Home
            </NuxtLink>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="error-content">
          <div class="error-icon">
            <span uk-icon="icon: warning; ratio: 4" class="uk-text-danger"></span>
          </div>
          
          <h1 class="uk-heading-small uk-margin-medium-top">Something went wrong</h1>
          
          <p class="uk-text-lead uk-text-muted">
            We couldn't verify your payment. Please contact us for assistance.
          </p>

          <div class="uk-margin-medium-top">
            <NuxtLink to="/contact" class="uk-button uk-button-primary uk-button-large">
              Contact Us
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// SEO
useSiteMeta({
  title: 'Payment Successful',
  description: 'Your vehicle deposit has been successfully processed.',
});

// Get session ID from URL
const route = useRoute();
const sessionId = computed(() => route.query.session_id as string);

// Fetch session data
const { data: sessionData, pending, error } = await useFetch('/api/stripe/retrieve-session', {
  method: 'POST',
  body: {
    id: sessionId.value,
  },
  lazy: true,
  immediate: !!sessionId.value,
});

// Track conversion
if (process.client && sessionData.value) {
  onMounted(() => {
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'purchase',
        ecommerce: {
          transaction_id: sessionId.value,
          items: [{
            item_name: sessionData.value?.description,
            item_id: sessionData.value?.vehicleId,
          }],
        },
      });
    }
  });
}
</script>

<style lang="scss" scoped>
.payment-success-page {
  min-height: 60vh;
  background: #f9f9f9;
}

.success-icon,
.error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.success-icon {
  border: 3px solid var(--uk-success);
}

.error-icon {
  border: 3px solid var(--uk-danger);
}

.uk-card {
  text-align: left;
}

.uk-description-list dt {
  font-weight: 600;
  color: #666;
}

.uk-description-list dd {
  font-size: 1.125rem;
}
</style>







