<template>
  <div v-if="isOpen" class="test-drive-modal-overlay" @click.self="closeModal">
    <div class="test-drive-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">Book a test drive.</h2>
        <button class="close-btn" @click="closeModal" aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar">
        <div class="progress-step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }"></div>
        <div class="progress-step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }"></div>
        <div class="progress-step" :class="{ active: currentStep >= 3 }"></div>
      </div>

      <!-- Step 1: Model Selection -->
      <div v-if="currentStep === 1" class="step-content">
        <p class="step-intro">
          Are you ready to experience your next Hyundai vehicle? Book a test drive with us today!
        </p>

        <h3 class="field-label">Model I am interested in*</h3>
        
        <div class="model-select-wrapper">
          <label class="select-label">Model*</label>
          <select v-model="formData.model" class="model-select" @change="onModelChange" :disabled="modelsLoading">
            <option value="" disabled>{{ modelsLoading ? 'Loading models...' : 'Select a model' }}</option>
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

        <!-- Vehicle Image -->
        <div class="vehicle-preview">
          <img 
            v-if="selectedModelImage" 
            :src="selectedModelImage" 
            :alt="selectedModelName"
            class="vehicle-image" />
          <div v-else class="vehicle-placeholder">
            <span>Select a model to preview</span>
          </div>
        </div>

        <!-- Next Button -->
        <button 
          class="btn-next" 
          :disabled="!formData.model"
          @click="nextStep">
          Next
        </button>
      </div>

      <!-- Step 2: Contact Details -->
      <div v-if="currentStep === 2" class="step-content">
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

        <p class="mandatory-note">All fields marked with * are mandatory</p>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn-back" @click="prevStep">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Back
          </button>
          <button 
            class="btn-submit" 
            :disabled="!isStep2Valid || isSubmitting"
            @click="submitForm">
            {{ isSubmitting ? 'Submitting...' : 'Submit request' }}
          </button>
        </div>
      </div>

      <!-- Step 3: Confirmation -->
      <div v-if="currentStep === 3" class="step-content confirmation">
        <div class="success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#002c5f" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h3 class="confirmation-title">Thank you!</h3>
        <p class="confirmation-text">
          Your test drive request has been submitted. Our team will contact you shortly to confirm your appointment.
        </p>
        <button class="btn-close" @click="closeModal">Close</button>
      </div>

      <!-- Privacy Policy Link -->
      <div class="privacy-footer">
        View our online <a href="https://www.hyundai.com/au/en/privacy-policy" target="_blank" class="privacy-link">Privacy Policy</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  preselectedModel?: string;      // Slug-based (legacy)
  preselectedModelId?: string;    // ID-based (preferred)
}>();

const emit = defineEmits<{
  close: [];
  submit: [data: any];
  'model-change': [model: string];
}>();

// State
const currentStep = ref(1);
const isSubmitting = ref(false);
const formData = ref({
  model: props.preselectedModel || '',
  title: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  purchaseTimeline: '',
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
    id: variant.id || variant.modelId || '',
    // Use the slug from API if available, otherwise compute it
    slug: variant.slug || getModelSlug(variant.name),
    name: variant.name,
    image: variant.image || '',
  }));
});

const availableModels = computed(() => allModels.value);

/**
 * Find the best matching model by ID
 */
const findModelById = (id: string) => {
  if (!id) return null;
  const models = availableModels.value;
  return models.find((m: { id: string }) => m.id === id) || null;
};

/**
 * Find the best matching model for the preselected slug
 * First tries exact match, then partial match (e.g., "i30" matches "i30-hatch")
 */
const findBestMatchingModel = (slug: string) => {
  if (!slug) return null;
  
  const models = availableModels.value;
  
  // Try exact slug match first
  const exactMatch = models.find((m: { slug: string }) => m.slug === slug);
  if (exactMatch) return exactMatch;
  
  // Try partial match - slug starts with the search term
  const partialMatch = models.find((m: { slug: string }) => m.slug.startsWith(slug + '-') || m.slug.startsWith(slug));
  if (partialMatch) return partialMatch;
  
  // Try partial match - search term contains the model slug
  const reverseMatch = models.find((m: { slug: string }) => slug.startsWith(m.slug + '-') || slug.startsWith(m.slug));
  if (reverseMatch) return reverseMatch;
  
  // Try name-based matching (case insensitive)
  const normalizedSlug = slug.toLowerCase().replace(/-/g, ' ');
  const nameMatch = models.find((m: { name: string }) => 
    m.name.toLowerCase().includes(normalizedSlug) || 
    normalizedSlug.includes(m.name.toLowerCase())
  );
  if (nameMatch) return nameMatch;
  
  return null;
};

/**
 * Find the best model using ID (preferred) or slug (fallback)
 */
const findPreselectedModel = () => {
  // Try ID first (most reliable)
  if (props.preselectedModelId) {
    const byId = findModelById(props.preselectedModelId);
    if (byId) return byId;
  }
  
  // Fallback to slug matching
  if (props.preselectedModel) {
    return findBestMatchingModel(props.preselectedModel);
  }
  
  return null;
};

const selectedModelData = computed(() => {
  if (!formData.value.model) return null;
  // formData.model stores the slug, so look up by slug
  return availableModels.value.find((m: { slug: string }) => m.slug === formData.value.model) || null;
});

const selectedModelName = computed(() => {
  return selectedModelData.value?.name || '';
});

const selectedModelImage = computed(() => {
  return selectedModelData.value?.image || '';
});

const isStep2Valid = computed(() => {
  return (
    formData.value.title &&
    formData.value.firstName &&
    formData.value.lastName &&
    formData.value.email &&
    formData.value.phone &&
    formData.value.privacyConsent
  );
});

const closeModal = () => {
  emit('close');
};

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const onModelChange = () => {
  emit('model-change', formData.value.model);
};

const resetForm = () => {
  currentStep.value = 1;
  isSubmitting.value = false;
  formData.value = {
    model: '', // Will be set by the watcher after models load
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    purchaseTimeline: '',
    privacyConsent: false,
    marketingConsent: false,
  };
};

const submitForm = async () => {
  if (!isStep2Valid.value) return;
  
  isSubmitting.value = true;
  
  try {
    emit('submit', {
      ...formData.value,
      modelName: selectedModelName.value,
    });
    
    currentStep.value = 3;
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
    // Set preselected model - if models are already loaded, find best match
    if ((props.preselectedModelId || props.preselectedModel) && allModels.value.length > 0) {
      const matchingModel = findPreselectedModel();
      if (matchingModel) {
        formData.value.model = matchingModel.slug;
      }
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

// Watch for models to load - then try to set preselected model
watch(() => allModels.value, (models) => {
  if (props.isOpen && (props.preselectedModelId || props.preselectedModel) && models.length > 0 && !formData.value.model) {
    const matchingModel = findPreselectedModel();
    if (matchingModel) {
      formData.value.model = matchingModel.slug;
    }
  }
}, { immediate: true });

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

.test-drive-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.test-drive-modal {
  background: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  
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

.progress-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0 1.5rem 1.5rem;
  
  .progress-step {
    flex: 1;
    height: 4px;
    background: $border-color;
    border-radius: 2px;
    transition: background 0.3s;
    
    &.active {
      background: $accent-blue;
    }
    
    &.completed {
      background: $accent-blue;
    }
  }
}

.step-content {
  padding: 0 1.5rem 1.5rem;
}

.step-intro {
  color: $text-dark;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.field-label {
  font-size: 1rem;
  font-weight: 600;
  color: $primary-blue;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: $primary-blue;
  margin-bottom: 1.5rem;
}

.model-select-wrapper {
  position: relative;
  margin-bottom: 1.5rem;
  
  .select-label {
    position: absolute;
    top: 0.5rem;
    left: 1rem;
    font-size: 0.75rem;
    color: $text-gray;
  }
  
  .model-select {
    width: 100%;
    max-width: 100%;
    padding: 1.75rem 2.5rem 0.75rem 1rem;
    font-size: 1rem;
    font-weight: 500;
    color: $text-dark;
    border: 1px solid $border-color;
    border-radius: 4px;
    background: #fff;
    appearance: none;
    cursor: pointer;
    font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    
    &:focus {
      outline: none;
      border-color: $primary-blue;
    }
    
    option {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 400;
      padding: 0.5rem;
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
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.vehicle-preview {
  width: 100%;
  aspect-ratio: 16/10;
  background: $bg-light;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .vehicle-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  .vehicle-placeholder {
    color: $text-gray;
    font-size: 0.9rem;
  }
}

.btn-next {
  width: 100%;
  padding: 1rem;
  background: $primary-blue;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover:not(:disabled) {
    background: color.adjust($primary-blue, $lightness: -10%);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}

// Form Fields
.form-field {
  position: relative;
  margin-bottom: 1rem;
  
  .form-input {
    width: 100%;
    max-width: 100%;
    padding: 1rem;
    font-size: 1rem;
    color: $text-dark;
    border: 1px solid $border-color;
    border-radius: 4px;
    background: #fff;
    font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    
    &::placeholder {
      color: $text-gray;
    }
    
    &:focus {
      outline: none;
      border-color: $primary-blue;
    }
  }
  
  .form-select {
    width: 100%;
    max-width: 100%;
    padding: 1rem 2.5rem 1rem 1rem;
    font-size: 1rem;
    color: $text-dark;
    border: 1px solid $border-color;
    border-radius: 4px;
    background: #fff;
    appearance: none;
    cursor: pointer;
    font-family: 'HyundaiSansHead', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    
    &:focus {
      outline: none;
      border-color: $primary-blue;
    }
    
    option {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
}

// Action Buttons
.action-buttons {
  display: flex;
  gap: 1rem;
}

.btn-back {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #fff;
  color: $text-dark;
  border: 1px solid $border-color;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: $bg-light;
  }
}

.btn-submit {
  flex: 2;
  padding: 1rem;
  background: $primary-blue;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover:not(:disabled) {
    background: color.adjust($primary-blue, $lightness: -10%);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}

// Confirmation Step
.confirmation {
  text-align: center;
  padding: 3rem 1.5rem;
  
  .success-icon {
    margin-bottom: 1.5rem;
  }
  
  .confirmation-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: $primary-blue;
    margin-bottom: 1rem;
  }
  
  .confirmation-text {
    color: $text-gray;
    line-height: 1.5;
    margin-bottom: 2rem;
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
    
    &:hover {
      background: color.adjust($primary-blue, $lightness: -10%);
    }
  }
}

// Privacy Footer
.privacy-footer {
  padding: 1rem 1.5rem;
  text-align: center;
  font-size: 0.85rem;
  color: $text-gray;
  border-top: 1px solid $border-color;
  
  .privacy-link {
    color: $accent-blue;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

// Responsive
@media (max-width: 480px) {
  .test-drive-modal {
    max-height: 100vh;
    border-radius: 0;
  }
  
  .action-buttons {
    flex-direction: column;
    
    .btn-back,
    .btn-submit {
      flex: none;
    }
  }
}
</style>

