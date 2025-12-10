<template>
  <div v-if="isOpen" class="enquire-modal-overlay" @click.self="closeModal">
    <div class="enquire-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">Contact us</h2>
        <div class="header-actions">
          <button class="close-text-btn" @click="closeModal">Close</button>
          <button class="close-btn" @click="closeModal" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Intro Text -->
      <div class="intro-section">
        <p class="intro-text">
          We're here to help you find the best Hyundai to suit your needs. Simply fill out the fields below and one of our specialists from your local dealer will be in touch soon.
        </p>
      </div>

      <!-- Form Content -->
      <div class="form-content">
        <h3 class="section-title">Contact details</h3>

        <!-- Title -->
        <div class="form-field">
          <select v-model="formData.title" class="form-select">
            <option value="" disabled>Title*</option>
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Ms">Ms</option>
            <option value="Miss">Miss</option>
            <option value="Dr">Dr</option>
          </select>
          <svg class="select-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>

        <!-- First Name -->
        <div class="form-field">
          <input 
            v-model="formData.firstName" 
            type="text" 
            class="form-input"
            placeholder="First Name*" />
        </div>

        <!-- Last Name -->
        <div class="form-field">
          <input 
            v-model="formData.lastName" 
            type="text" 
            class="form-input"
            placeholder="Last Name*" />
        </div>

        <!-- Email -->
        <div class="form-field">
          <input 
            v-model="formData.email" 
            type="email" 
            class="form-input"
            placeholder="Email Address*" />
        </div>

        <!-- Phone -->
        <div class="form-field">
          <input 
            v-model="formData.phone" 
            type="tel" 
            class="form-input"
            placeholder="Phone Number*" />
        </div>

        <!-- Postcode -->
        <div class="form-field floating-label" :class="{ 'has-value': formData.postcode }">
          <label class="field-label">Postcode*</label>
          <input 
            v-model="formData.postcode" 
            type="text" 
            class="form-input with-label"
            maxlength="4" />
        </div>

        <!-- Purchase Timeline -->
        <div class="form-field">
          <select v-model="formData.purchaseTimeline" class="form-select">
            <option value="" disabled>When are you likely to purchase?</option>
            <option value="immediately">Immediately</option>
            <option value="1-3-months">1-3 months</option>
            <option value="3-6-months">3-6 months</option>
            <option value="6-12-months">6-12 months</option>
            <option value="just-looking">Just looking</option>
          </select>
          <svg class="select-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>

        <!-- Model of Interest -->
        <div class="form-field floating-label" :class="{ 'has-value': formData.model }">
          <label class="field-label">Model of interest*</label>
          <select v-model="formData.model" class="form-select with-label" :disabled="modelsLoading">
            <option value="" disabled>{{ modelsLoading ? 'Loading...' : 'Select a model' }}</option>
            <option v-for="model in availableModels" :key="model.slug" :value="model.slug">
              {{ model.name }}
            </option>
          </select>
          <svg v-if="!modelsLoading" class="select-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
          <div v-else class="select-loading">
            <div class="spinner"></div>
          </div>
        </div>

        <!-- Consent Checkboxes -->
        <div class="consent-section">
          <label class="consent-checkbox">
            <input type="checkbox" v-model="formData.privacyConsent" />
            <span class="checkbox-custom"></span>
            <span class="consent-text">
              I consent to Hyundai Motor Company Australia Pty Ltd collecting and using my personal information in accordance with its 
              <a href="https://www.hyundai.com/au/en/privacy-collection-notice" target="_blank" class="consent-link">Privacy Collection Notice</a> and 
              <a href="https://www.hyundai.com/au/en/privacy-policy" target="_blank" class="consent-link">Privacy Policy</a>.*
            </span>
          </label>

          <label class="consent-checkbox">
            <input type="checkbox" v-model="formData.marketingConsent" />
            <span class="checkbox-custom"></span>
            <span class="consent-text">
              I consent to receiving direct marketing communication from Hyundai Motor Company Australia Pty Ltd, including the latest updates, news and offers, and acknowledge that I may opt-out of receiving these communications at any time by following the instructions included in the communications.
            </span>
          </label>
        </div>

        <p class="mandatory-note">All fields marked with * are mandatory.</p>

        <!-- Submit Button -->
        <button 
          class="btn-submit" 
          :disabled="!isFormValid || isSubmitting"
          @click="submitForm">
          {{ isSubmitting ? 'Submitting...' : 'Submit' }}
        </button>
      </div>

      <!-- Success Message -->
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-content">
          <div class="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#002c5f" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h3 class="success-title">Thank you!</h3>
          <p class="success-text">
            Your enquiry has been submitted. One of our specialists will be in touch with you shortly.
          </p>
          <button class="btn-close" @click="closeModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  preselectedModel?: string;
}>();

const emit = defineEmits<{
  close: [];
  submit: [data: any];
}>();

// State
const isSubmitting = ref(false);
const showSuccess = ref(false);
const formData = ref({
  title: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  postcode: '',
  purchaseTimeline: '',
  model: props.preselectedModel || '',
  privacyConsent: false,
  marketingConsent: false,
});

// Methods
const getModelSlug = (modelName: string) => {
  if (!modelName) return '';
  return modelName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Use shared composable to avoid duplicate fetches
const { variants: allVariantsRaw, pending: modelsLoading, refresh: refreshModels } = useAllVariants();

// Transform variants to model format for dropdown
const allModels = computed(() => {
  return allVariantsRaw.value.map((variant: any) => ({
    slug: getModelSlug(variant.name),
    name: variant.name,
    image: variant.image || '',
  }));
});

const availableModels = computed(() => allModels.value);

const selectedModelData = computed(() => {
  if (!formData.value.model) return null;
  return availableModels.value.find((m: { slug: string; name: string; image: string }) => m.slug === formData.value.model);
});

const selectedModelName = computed(() => {
  return selectedModelData.value?.name || '';
});

const isFormValid = computed(() => {
  return (
    formData.value.title &&
    formData.value.firstName &&
    formData.value.lastName &&
    formData.value.email &&
    formData.value.phone &&
    formData.value.postcode &&
    formData.value.model &&
    formData.value.privacyConsent
  );
});

const closeModal = () => {
  showSuccess.value = false;
  emit('close');
};

const resetForm = () => {
  isSubmitting.value = false;
  showSuccess.value = false;
  formData.value = {
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    postcode: '',
    purchaseTimeline: '',
    model: props.preselectedModel || '',
    privacyConsent: false,
    marketingConsent: false,
  };
};

const submitForm = async () => {
  if (!isFormValid.value) return;
  
  isSubmitting.value = true;
  
  try {
    emit('submit', {
      ...formData.value,
      modelName: selectedModelName.value,
    });
    
    showSuccess.value = true;
  } catch (error) {
    console.error('Error submitting form:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// Watch isOpen prop
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetForm();
    if (allModels.value.length === 0) {
      refreshModels();
    }
    if (props.preselectedModel) {
      formData.value.model = props.preselectedModel;
    }
    if (process.client) {
      document.body.style.overflow = 'hidden';
    }
  } else {
    if (process.client) {
      document.body.style.overflow = '';
    }
  }
});

onBeforeUnmount(() => {
  if (process.client) {
    document.body.style.overflow = '';
  }
});
</script>

<style lang="scss" scoped>
$primary-blue: #002c5f;
$accent-blue: #00aad2;
$text-dark: #1a1a1a;
$text-gray: #666;
$border-color: #e0e0e0;
$bg-light: #f5f5f5;

.enquire-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  overflow-y: auto;
}

.enquire-modal {
  background: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: 480px;
  margin: 2rem auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  
  * {
    box-sizing: border-box;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem;
  
  .modal-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: $text-dark;
    margin: 0;
    font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .close-text-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    color: $text-gray;
    font-size: 1rem;
    font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    
    &:hover {
      color: $text-dark;
    }
  }
  
  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    color: $text-gray;
    transition: color 0.2s;
    
    &:hover {
      color: $text-dark;
    }
  }
}

.intro-section {
  padding: 0 1.5rem 1rem;
  border-bottom: 1px solid $border-color;
  
  .intro-text {
    color: $text-dark;
    font-size: 1rem;
    line-height: 1.6;
    margin: 0;
    font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
}

.form-content {
  padding: 1.5rem;
  
  * {
    box-sizing: border-box;
  }
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $primary-blue;
  margin: 0 0 1.5rem 0;
  font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

// Form Fields
.form-field {
  position: relative;
  margin-bottom: 1rem;
  z-index: 1;
  
  .form-input {
    width: 100%;
    padding: 1rem;
    font-size: 1rem;
    color: $text-dark;
    border: 1px solid $border-color;
    border-radius: 4px;
    background: #fff;
    font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-sizing: border-box;
    display: block;
    
    &::placeholder {
      color: $text-gray;
    }
    
    &:focus {
      outline: none;
      border-color: $primary-blue;
    }
    
    &.with-label {
      padding-top: 1.75rem;
      padding-bottom: 0.5rem;
    }
  }
  
  .form-select {
    width: 100%;
    padding: 1rem 2.5rem 1rem 1rem;
    font-size: 1rem;
    color: $text-dark;
    border: 1px solid $border-color;
    border-radius: 4px;
    background: #fff;
    appearance: none;
    cursor: pointer;
    font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-sizing: border-box;
    display: block;
    
    &:focus {
      outline: none;
      border-color: $primary-blue;
    }
    
    &.with-label {
      padding-top: 1.75rem;
      padding-bottom: 0.5rem;
    }
    
    option {
      font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 400;
    }
  }
  
  .select-arrow {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: $text-gray;
  }
  
  .select-loading {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid $border-color;
      border-top-color: $primary-blue;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }
  
  &.floating-label {
    .field-label {
      position: absolute;
      top: 0.5rem;
      left: 1rem;
      font-size: 0.75rem;
      color: $text-gray;
      font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      pointer-events: none;
      z-index: 2;
      background: #fff;
      padding: 0 0.25rem;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Consent Section
.consent-section {
  margin: 1.5rem 0;
}

.consent-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
  cursor: pointer;
  
  input[type="checkbox"] {
    display: none;
  }
  
  .checkbox-custom {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border: 2px solid $border-color;
    border-radius: 2px;
    background: #fff;
    position: relative;
    margin-top: 2px;
    
    &::after {
      content: '';
      position: absolute;
      display: none;
      left: 6px;
      top: 2px;
      width: 5px;
      height: 10px;
      border: solid $primary-blue;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }
  
  input[type="checkbox"]:checked + .checkbox-custom {
    border-color: $primary-blue;
    
    &::after {
      display: block;
    }
  }
  
  .consent-text {
    font-size: 0.85rem;
    color: $text-dark;
    line-height: 1.5;
    font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .consent-link {
    color: $accent-blue;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.mandatory-note {
  font-size: 0.85rem;
  color: $text-gray;
  margin-bottom: 1.5rem;
  font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.btn-submit {
  width: 100%;
  max-width: 200px;
  margin: 0 auto;
  display: block;
  padding: 1rem 2rem;
  background: $primary-blue;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  &:hover:not(:disabled) {
    background: color.adjust($primary-blue, $lightness: -10%);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}

// Success Overlay
.success-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.success-content {
  text-align: center;
  padding: 3rem 1.5rem;
  
  .success-icon {
    margin-bottom: 1.5rem;
  }
  
  .success-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: $primary-blue;
    margin-bottom: 1rem;
    font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .success-text {
    color: $text-gray;
    line-height: 1.5;
    margin-bottom: 2rem;
    font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .btn-close {
    padding: 1rem 3rem;
    background: $primary-blue;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    
    &:hover {
      background: color.adjust($primary-blue, $lightness: -10%);
    }
  }
}

// Responsive
@media (max-width: 480px) {
  .enquire-modal-overlay {
    padding: 0;
    align-items: stretch;
  }
  
  .enquire-modal {
    max-height: 100vh;
    border-radius: 0;
    margin: 0;
    min-height: 100vh;
    overflow-y: auto;
  }
  
  .btn-submit {
    max-width: 100%;
  }
}
</style>

