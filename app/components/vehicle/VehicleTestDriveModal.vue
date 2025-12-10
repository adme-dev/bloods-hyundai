<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click.self="closeModal"
      >
        <div class="modal-container">
          <!-- Header -->
          <header class="modal-header">
            <div>
              <h2 class="modal-title">Book a Test Drive</h2>
              <p class="modal-subtitle">{{ vehicleTitle }}</p>
            </div>
            <button class="modal-close" @click="closeModal" aria-label="Close">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </header>

          <!-- Form -->
          <form v-if="!isSent" class="modal-form" @submit.prevent="submitForm">
            <!-- Loading Overlay -->
            <div v-if="isSending" class="loading-overlay">
              <div class="loading-spinner"></div>
              <p>Booking your test drive...</p>
            </div>

            <div class="form-grid">
              <!-- Name (Full Width) -->
              <div class="form-field form-field--full">
                <label class="form-label">Full Name *</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-input"
                  :class="{ 'has-error': errors.name }"
                  placeholder="First and last name"
                  required
                />
                <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
              </div>

              <!-- Email -->
              <div class="form-field">
                <label class="form-label">Email Address *</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="form-input"
                  :class="{ 'has-error': errors.email }"
                  placeholder="you@example.com"
                  required
                />
                <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
              </div>

              <!-- Phone -->
              <div class="form-field">
                <label class="form-label">Phone Number *</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  class="form-input"
                  :class="{ 'has-error': errors.phone }"
                  placeholder="04XX XXX XXX"
                  maxlength="10"
                  required
                />
                <span v-if="errors.phone" class="error-text">{{ errors.phone }}</span>
              </div>

              <!-- Preferred Date -->
              <div class="form-field">
                <label class="form-label">Preferred Date *</label>
                <div class="date-input-wrapper">
                  <input
                    v-model="form.preferredDate"
                    type="date"
                    class="form-input"
                    :class="{ 'has-error': errors.preferredDate }"
                    :min="minDate"
                    required
                  />
                  <svg class="date-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <span v-if="errors.preferredDate" class="error-text">{{ errors.preferredDate }}</span>
              </div>

              <!-- Preferred Time -->
              <div class="form-field">
                <label class="form-label">Preferred Time</label>
                <div class="select-wrapper">
                  <select v-model="form.preferredTime" class="form-select">
                    <option value="">Select a time</option>
                    <option value="morning">Morning (9am - 12pm)</option>
                    <option value="afternoon">Afternoon (12pm - 3pm)</option>
                    <option value="late-afternoon">Late Afternoon (3pm - 5pm)</option>
                  </select>
                  <svg class="select-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </div>

              <!-- Message -->
              <div class="form-field form-field--full">
                <label class="form-label">Additional Comments</label>
                <textarea
                  v-model="form.message"
                  class="form-textarea"
                  rows="3"
                  placeholder="Anything else we should know?"
                ></textarea>
              </div>
            </div>

            <!-- Vehicle Info Card -->
            <div v-if="vehicle" class="vehicle-card">
              <div class="vehicle-card-content">
                <svg class="vehicle-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h8m-8 4h4m4 0h.01M3 21h18a1 1 0 001-1V9a1 1 0 00-1-1h-3.28a1 1 0 01-.948-.684l-1.11-3.33A1 1 0 0014.72 3H9.28a1 1 0 00-.948.684l-1.11 3.33A1 1 0 016.28 8H3a1 1 0 00-1 1v11a1 1 0 001 1z"/>
                </svg>
                <div>
                  <div class="vehicle-card-title">{{ vehicleTitle }}</div>
                  <div class="vehicle-card-stock">Stock #{{ vehicle?.stockid || '—' }}</div>
                </div>
              </div>
            </div>

            <!-- Submit -->
            <div class="form-actions">
              <button
                type="submit"
                class="btn-submit"
                :disabled="isSending"
              >
                {{ isSending ? 'Booking...' : 'Book Test Drive' }}
              </button>
              <p class="privacy-note">
                By submitting this form, you agree to be contacted by our team regarding your test drive request.
              </p>
            </div>
          </form>

          <!-- Success Message -->
          <div v-else class="success-container">
            <div class="success-icon">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="success-title">Test Drive Booked!</h3>
            <p class="success-text">
              Thank you, {{ form.name }}! We've received your test drive request for <strong>{{ formattedDate }}</strong>. 
              One of our team members will contact you shortly to confirm your appointment.
            </p>
            <button class="btn-close" @click="closeModal">
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Vehicle {
  stockid?: string | number;
  slug?: string;
  title?: string;
  condition?: { displayValue?: string[] } | string;
  make?: { displayValue?: string[] } | string;
  model?: { displayValue?: string[] } | string;
  badge?: { displayValue?: string[] } | string;
  year?: { displayValue?: string[] } | string;
  variant?: { displayValue?: string[] } | string;
  [key: string]: any;
}

const props = defineProps<{
  isOpen: boolean;
  vehicle?: Vehicle | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const mainStore = useMainStore();

// Helper to get display value
const getDisplay = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string' || typeof field === 'number') return String(field);
  if (Array.isArray(field?.displayValue)) return field.displayValue[0] || '';
  if (Array.isArray(field?.value)) return field.value[0] || '';
  return '';
};

// Computed vehicle title
const vehicleTitle = computed(() => {
  if (!props.vehicle) return 'Vehicle';
  const year = getDisplay(props.vehicle.year);
  const make = getDisplay(props.vehicle.make);
  const model = getDisplay(props.vehicle.model);
  const badge = getDisplay(props.vehicle.variant) || getDisplay(props.vehicle.badge);
  return [year, make, model, badge].filter(Boolean).join(' ').trim() || props.vehicle.title || 'Vehicle';
});

// Min date is tomorrow
const minDate = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
});

// Form state
const form = reactive({
  name: '',
  email: '',
  phone: '',
  preferredDate: '',
  preferredTime: '',
  message: ''
});

const errors = reactive({
  name: '',
  email: '',
  phone: '',
  preferredDate: ''
});

const isSending = ref(false);
const isSent = ref(false);

// Formatted date for success message
const formattedDate = computed(() => {
  if (!form.preferredDate) return '';
  const date = new Date(form.preferredDate);
  return date.toLocaleDateString('en-AU', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
});

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
  errors.phone = '';
  errors.preferredDate = '';

  if (!form.name.trim()) {
    errors.name = 'Name is required';
    isValid = false;
  }

  if (!validateEmail(form.email)) {
    errors.email = 'Valid email is required';
    isValid = false;
  }

  if (!form.phone || form.phone.length < 10) {
    errors.phone = 'Valid phone number is required';
    isValid = false;
  }

  if (!form.preferredDate) {
    errors.preferredDate = 'Please select a date';
    isValid = false;
  }

  return isValid;
};

// Submit form
const submitForm = async () => {
  if (!validate()) return;

  isSending.value = true;

  try {
    const vehicle = props.vehicle;
    const nameParts = form.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Submit to the new Neon database API
    const response = await $fetch<{ enquiry: { id: string } }>('/api/submit-enquiry', {
      method: 'POST',
      body: {
        type: 'test_drive',
        firstName,
        lastName,
        email: form.email,
        phone: form.phone || undefined,
        message: form.message || `Test drive request for ${form.preferredDate}${form.preferredTime ? ` at ${form.preferredTime}` : ''}`,
        vehicleInfo: {
          condition: getDisplay(vehicle?.condition) || undefined,
          make: getDisplay(vehicle?.make) || undefined,
          model: getDisplay(vehicle?.model) || undefined,
          variant: getDisplay(vehicle?.badge) || getDisplay(vehicle?.variant) || undefined,
          stockId: String(vehicle?.stockid || ''),
        },
        serviceInfo: {
          preferredDate: form.preferredDate,
          preferredTime: form.preferredTime || undefined,
        },
        testDrive: true,
        source: 'vehicle-test-drive-modal',
      }
    });

    isSent.value = true;

    // GTM tracking
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'FormSubmission',
        formType: 'test_drive',
        formStatus: 'submitted',
        enquiryId: response.enquiry.id,
        stockId: vehicle?.stockid,
        vehicleTitle: vehicleTitle.value,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
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
  form.preferredDate = '';
  form.preferredTime = '';
  form.message = '';
  errors.name = '';
  errors.email = '';
  errors.phone = '';
  errors.preferredDate = '';
  isSent.value = false;
};

const closeModal = () => {
  emit('close');
};

// Watch isOpen
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm();
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

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  overflow-y: auto;
}

.modal-container {
  position: relative;
  width: 100%;
  max-width: 32rem;
  margin: 2rem auto;
  background-color: #fff;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

/* Header */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.modal-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.modal-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 0.5rem;
  background-color: transparent;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background-color: #e2e8f0;
  color: #0f172a;
}

/* Form */
.modal-form {
  position: relative;
  padding: 1.5rem;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background-color: rgba(255, 255, 255, 0.9);
  color: #0f172a;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #e2e8f0;
  border-top-color: #002c5f;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 480px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  color: #0f172a;
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #002c5f;
  box-shadow: 0 0 0 3px rgba(0, 44, 95, 0.1);
}

.form-input.has-error,
.form-textarea.has-error,
.form-select.has-error {
  border-color: #ef4444;
}

.form-textarea {
  resize: vertical;
  min-height: 5rem;
}

.form-select {
  appearance: none;
  cursor: pointer;
}

.error-text {
  font-size: 0.75rem;
  color: #ef4444;
}

/* Date Input */
.date-input-wrapper,
.select-wrapper {
  position: relative;
}

.date-input-wrapper .form-input {
  padding-right: 2.5rem;
}

.date-icon,
.select-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  pointer-events: none;
}

/* Vehicle Card */
.vehicle-card {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
}

.vehicle-card-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.vehicle-icon {
  flex-shrink: 0;
  color: #64748b;
}

.vehicle-card-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.vehicle-card-stock {
  font-size: 0.75rem;
  color: #64748b;
}

/* Actions */
.form-actions {
  margin-top: 1.5rem;
  text-align: center;
}

.btn-submit {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background-color: #002c5f;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background-color: #001d40;
}

.btn-submit:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.privacy-note {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Success */
.success-container {
  padding: 3rem 1.5rem;
  text-align: center;
}

.success-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  margin-bottom: 1.5rem;
  color: #10b981;
}

.success-title {
  margin: 0 0 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.success-text {
  margin: 0 0 2rem;
  font-size: 1rem;
  color: #64748b;
  line-height: 1.5;
}

.success-text strong {
  color: #0f172a;
}

.btn-close {
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background-color: #002c5f;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-close:hover {
  background-color: #001d40;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container {
  transform: scale(0.95) translateY(-1rem);
}

.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(1rem);
}

/* Responsive */
@media (max-width: 480px) {
  .modal-overlay {
    padding: 0;
    align-items: stretch;
  }
  
  .modal-container {
    max-width: 100%;
    min-height: 100vh;
    margin: 0;
    border-radius: 0;
  }
}
</style>

