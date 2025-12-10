<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click.self="closeModal"
      >
        <div class="modal-container">
          <!-- Close Button - Top Right -->
          <button class="modal-close" @click="closeModal" aria-label="Close">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <div class="modal-layout">
            <!-- Vehicle Card Sidebar -->
            <aside class="vehicle-sidebar">
              <!-- Main Image Carousel -->
              <div class="gallery-section">
                <div class="main-image-container">
                  <div ref="mainCarouselRef" class="embla-main">
                    <div class="embla-main__container">
                      <div 
                        v-for="(image, index) in vehicleImages" 
                        :key="index" 
                        class="embla-main__slide"
                        @click="openLightbox(index)"
                      >
                        <img
                          :src="image"
                          :alt="`${vehicleTitle} - Image ${index + 1}`"
                          class="main-slide-image"
                        />
                      </div>
                      <!-- Fallback if no images -->
                      <div v-if="!vehicleImages.length" class="embla-main__slide">
                        <div class="vehicle-image-placeholder">
                          <span>{{ vehicleMake }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Condition Badge - Top Left -->
                  <div v-if="vehicleCondition" class="condition-badge" :class="conditionClass">
                    {{ vehicleCondition }}
                  </div>

                  <!-- Photo count badge -->
                  <div v-if="photoCount > 1" class="photo-count">
                    <span>{{ selectedIndex + 1 }} / {{ photoCount }}</span>
                  </div>

                  <!-- Navigation Arrows -->
                  <button 
                    v-if="vehicleImages.length > 1"
                    class="gallery-nav gallery-nav--prev" 
                    @click="scrollPrev"
                    :disabled="!canScrollPrev"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <button 
                    v-if="vehicleImages.length > 1"
                    class="gallery-nav gallery-nav--next" 
                    @click="scrollNext"
                    :disabled="!canScrollNext"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>

                <!-- Thumbnails Carousel -->
                <div v-if="vehicleImages.length > 1" class="thumbnails-container">
                  <div ref="thumbCarouselRef" class="embla-thumbs">
                    <div class="embla-thumbs__container">
                      <button
                        v-for="(image, index) in vehicleImages"
                        :key="index"
                        class="embla-thumbs__slide"
                        :class="{ 'is-selected': index === selectedIndex }"
                        @click="onThumbClick(index)"
                      >
                        <img
                          :src="image"
                          :alt="`Thumbnail ${index + 1}`"
                          class="thumb-image"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Vehicle Details -->
              <div class="vehicle-details">
                <h3 class="vehicle-title">{{ vehicleApiTitle }}</h3>
                <p class="vehicle-subtitle">{{ specsSubtitle }}</p>
                
                <!-- Specs -->
                <div class="vehicle-specs">
                  <div v-if="vehicleDrivetrain" class="spec-item">
                    <svg class="spec-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                    {{ vehicleDrivetrain }}
                  </div>
                  <div v-if="vehicleSeats" class="spec-item">
                    <svg class="spec-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    {{ vehicleSeats }} Seats
                  </div>
                  <div v-if="vehicleTransmission" class="spec-item">
                    <svg class="spec-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {{ vehicleTransmission }}
                  </div>
                  <div v-if="vehicleKms" class="spec-item">
                    <svg class="spec-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ vehicleKms }}
                  </div>
                </div>

                <!-- Info Cards - Uber Style (2 columns) -->
                <div class="info-cards-grid">
                  <!-- Price Card -->
                  <div class="info-card">
                    <div class="info-card__icon">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div class="info-card__content">
                      <span class="info-card__title">{{ vehiclePrice }}</span>
                      <span v-if="vehiclePrice !== 'POA'" class="info-card__subtitle">DRIVE AWAY</span>
                    </div>
                  </div>

                  <!-- Weekly Price Card -->
                  <div v-if="vehiclePerWeek" class="info-card info-card--primary">
                    <div class="info-card__icon">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    </div>
                    <div class="info-card__content">
                      <span class="info-card__title">{{ vehiclePerWeek }}<span class="info-card__suffix">p/w</span></span>
                      <span class="info-card__subtitle">EST. REPAYMENTS</span>
                    </div>
                  </div>
                </div>

                <!-- Contact & Stock -->
                <div class="contact-stock-section">
                  <a :href="`tel:${dealerPhone}`" class="contact-link">
                    <span class="contact-link__label">Call us</span>
                    <span class="contact-link__phone">{{ dealerPhoneDisplay }}</span>
                  </a>
                  <span class="stock-badge">Stock No: {{ vehicleStockId }}</span>
                </div>

                <!-- Expandable Sections -->
                <div class="expandable-sections">
                  <!-- Full Specifications -->
                  <details v-if="allSpecifications.length > 0" class="expandable-section">
                    <summary class="expandable-section__header">
                      <span>Full Specifications</span>
                      <svg class="expandable-section__chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </summary>
                    <div class="expandable-section__content">
                      <div class="specs-grid">
                        <div 
                          v-for="spec in allSpecifications" 
                          :key="spec.label" 
                          class="spec-row"
                        >
                          <span class="spec-label">{{ spec.label }}</span>
                          <span class="spec-value">{{ spec.value }}</span>
                        </div>
                      </div>
                    </div>
                  </details>

                  <!-- Description -->
                  <details v-if="vehicleDescription" class="expandable-section">
                    <summary class="expandable-section__header">
                      <span>Description</span>
                      <svg class="expandable-section__chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </summary>
                    <div class="expandable-section__content">
                      <p class="vehicle-description">{{ vehicleDescription }}</p>
                    </div>
                  </details>
                </div>
              </div>
            </aside>

            <!-- Form Section -->
            <div class="form-section">
              <!-- Header -->
              <header class="modal-header">
                <h2 class="modal-title">Enquire on this vehicle</h2>
              </header>

              <!-- Form -->
              <form v-if="!isSent" class="modal-form" @submit.prevent="submitForm">
                <!-- Loading Overlay -->
                <div v-if="isSending" class="loading-overlay">
                  <div class="loading-spinner"></div>
                  <p>Sending enquiry...</p>
                </div>

                <p class="form-intro">
                  Get in touch with us today - we'd love to help you discover if this 
                  <strong>{{ vehicleMakeModel }}</strong> is the perfect fit for you!
                </p>

                <h4 class="form-section-title">Start Your Journey Here:</h4>

                <div class="form-fields">
                  <!-- Name -->
                  <div class="form-field">
                    <div class="input-with-icon">
                      <svg class="field-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <input
                        v-model="form.name"
                        type="text"
                        class="form-input"
                        :class="{ 'has-error': errors.name }"
                        placeholder="First and last name"
                        required
                      />
                    </div>
                    <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
                  </div>

                  <!-- Email -->
                  <div class="form-field">
                    <div class="input-with-icon">
                      <svg class="field-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <input
                        v-model="form.email"
                        type="email"
                        class="form-input"
                        :class="{ 'has-error': errors.email }"
                        placeholder="Email address"
                        required
                      />
                    </div>
                    <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
                  </div>

                  <!-- Phone -->
                  <div class="form-field">
                    <div class="input-with-icon">
                      <svg class="field-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      <input
                        v-model="form.phone"
                        type="tel"
                        class="form-input"
                        placeholder="Phone Number"
                        maxlength="10"
                      />
                    </div>
                  </div>

                  <!-- Message -->
                  <div class="form-field">
                    <textarea
                      v-model="form.message"
                      class="form-textarea"
                      rows="3"
                      placeholder="Message"
                    ></textarea>
                  </div>
                </div>

                <!-- Options -->
                <div class="options-section">
                  <label class="option-row">
                    <span class="option-label">I would like a test drive.</span>
                    <div class="option-toggle">
                      <button
                        type="button"
                        :class="['toggle-btn', { active: !form.testDrive }]"
                        @click="form.testDrive = false"
                      >No</button>
                      <button
                        type="button"
                        :class="['toggle-btn toggle-btn--yes', { active: form.testDrive }]"
                        @click="form.testDrive = true"
                      >Yes</button>
                    </div>
                  </label>

                  <label class="option-row">
                    <span class="option-label">I have a vehicle to trade in.</span>
                    <div class="option-toggle">
                      <button
                        type="button"
                        :class="['toggle-btn', { active: !form.tradeIn }]"
                        @click="form.tradeIn = false"
                      >No</button>
                      <button
                        type="button"
                        :class="['toggle-btn toggle-btn--yes', { active: form.tradeIn }]"
                        @click="form.tradeIn = true"
                      >Yes</button>
                    </div>
                  </label>

                  <label class="option-row">
                    <span class="option-label">I'm interested in finance.</span>
                    <div class="option-toggle">
                      <button
                        type="button"
                        :class="['toggle-btn', { active: !form.finance }]"
                        @click="form.finance = false"
                      >No</button>
                      <button
                        type="button"
                        :class="['toggle-btn toggle-btn--yes', { active: form.finance }]"
                        @click="form.finance = true"
                      >Yes</button>
                    </div>
                  </label>
                </div>

                <!-- Spacer for fixed button on mobile -->
                <div class="mobile-button-spacer"></div>

                <!-- Submit - Fixed on mobile -->
                <div class="form-actions">
                  <button
                    type="submit"
                    class="btn-submit"
                    :disabled="isSending"
                  >
                    {{ isSending ? 'Sending...' : 'Send Enquiry' }}
                  </button>
                </div>
              </form>

              <!-- Success Message -->
              <div v-else class="success-container">
                <div class="success-icon">
                  <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 class="success-title">Thank you, {{ form.name }}!</h3>
                <p class="success-text">
                  Your enquiry has been submitted successfully. One of our team members will be in touch with you shortly.
                </p>
                <button class="btn-close" @click="closeModal">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Lightbox for full-screen image viewing -->
    <VehicleLightbox
      :is-open="lightboxOpen"
      :images="vehicleImages"
      :title="vehicleTitle"
      :initial-index="lightboxIndex"
      @close="closeLightbox"
    />
  </Teleport>
</template>

<script setup lang="ts">
import EmblaCarousel from 'embla-carousel';

interface Vehicle {
  stockid?: string | number;
  slug?: string;
  title?: string;
  images?: string[];
  thumb?: string;
  main_photo_url?: string;
  photo_count?: number;
  price?: number | string;
  perweek?: number;
  condition?: { displayValue?: string[] } | string;
  make?: { displayValue?: string[] } | string;
  model?: { displayValue?: string[] } | string;
  badge?: { displayValue?: string[] } | string;
  year?: { displayValue?: string[] } | string;
  variant?: { displayValue?: string[] } | string;
  transmission?: { displayValue?: string[] } | string;
  drivetrain?: { displayValue?: string[] } | string;
  seats?: { displayValue?: string[] } | string;
  kms?: number;
  odometer?: { displayValue?: string[]; value?: string[] } | number;
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

// Embla Carousel refs
const mainCarouselRef = ref<HTMLElement | null>(null);
const thumbCarouselRef = ref<HTMLElement | null>(null);
const mainEmbla = ref<any>(null);
const thumbEmbla = ref<any>(null);
const selectedIndex = ref(0);
const canScrollPrev = ref(false);
const canScrollNext = ref(false);

// Lightbox state
const lightboxOpen = ref(false);
const lightboxIndex = ref(0);

const openLightbox = (index: number) => {
  lightboxIndex.value = index;
  lightboxOpen.value = true;
};

const closeLightbox = () => {
  lightboxOpen.value = false;
};


// Helper to get display value
const getDisplay = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string' || typeof field === 'number') return String(field);
  if (Array.isArray(field?.displayValue)) return field.displayValue[0] || '';
  if (Array.isArray(field?.value)) return field.value[0] || '';
  return '';
};

// Vehicle computed properties
const vehicleTitle = computed(() => {
  if (!props.vehicle) return 'Vehicle';
  const year = getDisplay(props.vehicle.year);
  const make = getDisplay(props.vehicle.make);
  const model = getDisplay(props.vehicle.model);
  const badge = getDisplay(props.vehicle.variant) || getDisplay(props.vehicle.badge);
  return [year, make, model, badge].filter(Boolean).join(' ').trim() || props.vehicle.title || 'Vehicle';
});

const vehicleMake = computed(() => getDisplay(props.vehicle?.make) || 'Vehicle');

// API title (e.g., "2023 Ford F-150 Lariat SWB Auto 4X4 MY23")
const vehicleApiTitle = computed(() => {
  return props.vehicle?.title || vehicleTitle.value;
});

// Short title (Make Model / Badge)
const shortTitle = computed(() => {
  const make = getDisplay(props.vehicle?.make);
  const model = getDisplay(props.vehicle?.model);
  const badge = getDisplay(props.vehicle?.variant) || getDisplay(props.vehicle?.badge);
  
  if (make && model) {
    return badge ? `${make} ${model} / ${badge}` : `${make} ${model}`;
  }
  return vehicleTitle.value;
});

// Specs-based subtitle (e.g., "~20 km, Piston, Front Wheel Drive, BLACK Interior")
const specsSubtitle = computed(() => {
  const parts: string[] = [];
  
  // Kms
  const kms = props.vehicle?.kms;
  if (kms !== undefined && kms !== null) {
    if (kms === 0) {
      parts.push('0 km');
    } else {
      parts.push(`~${kms.toLocaleString()} km`);
    }
  }
  
  // Engine type
  const engine = getDisplay(props.vehicle?.engine);
  if (engine) parts.push(engine);
  
  // Drivetrain
  const drivetrain = getDisplay(props.vehicle?.drivetrain);
  if (drivetrain) parts.push(drivetrain);
  
  // Interior colour
  const interiorColour = props.vehicle?.interiorcolour || props.vehicle?.interior_colour || '';
  if (interiorColour) parts.push(`${interiorColour.toUpperCase()} Interior`);
  
  return parts.join(', ') || vehicleTitle.value;
});

const vehicleCondition = computed(() => {
  const condition = getDisplay(props.vehicle?.condition);
  return condition ? condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase() : '';
});

const conditionClass = computed(() => {
  const condition = vehicleCondition.value.toLowerCase();
  return {
    'condition-new': condition === 'new',
    'condition-used': condition === 'used',
    'condition-demo': condition === 'demo',
    'condition-certified': condition === 'certified',
  };
});

const vehicleMakeModel = computed(() => {
  const make = getDisplay(props.vehicle?.make);
  const model = getDisplay(props.vehicle?.model);
  return [make, model].filter(Boolean).join(' ') || 'this vehicle';
});

const vehicleImages = computed(() => {
  // Try photos first (primary field from carsales feed), then images
  const photos = props.vehicle?.photos || props.vehicle?.images || [];
  if (photos.length > 0) {
    return photos;
  }
  // Fallback to single image
  const singleImage = props.vehicle?.thumb || props.vehicle?.main_photo_url;
  return singleImage ? [singleImage] : [];
});

const vehicleImage = computed(() => {
  return vehicleImages.value[0] || '';
});

const photoCount = computed(() => {
  return vehicleImages.value.length || props.vehicle?.photo_count || 0;
});

const vehicleStockId = computed(() => {
  return props.vehicle?.stockid || props.vehicle?.identifier || '';
});

const vehicleDrivetrain = computed(() => getDisplay(props.vehicle?.drivetrain));
const vehicleSeats = computed(() => getDisplay(props.vehicle?.seats));
const vehicleTransmission = computed(() => {
  const trans = getDisplay(props.vehicle?.transmission);
  if (trans.toLowerCase().includes('automatic')) {
    return 'Sports Automatic';
  }
  return trans;
});

const vehicleBody = computed(() => getDisplay(props.vehicle?.body));
const vehicleEngine = computed(() => getDisplay(props.vehicle?.engine));
const vehicleFuel = computed(() => getDisplay(props.vehicle?.fuel));
const vehicleColour = computed(() => getDisplay(props.vehicle?.colour) || props.vehicle?.genericolour || '');
const vehicleDescription = computed(() => props.vehicle?.Comments || props.vehicle?.description || '');

const vehicleKms = computed(() => {
  const kms = props.vehicle?.kms || 
              props.vehicle?.odometer?.value?.[0] || 
              props.vehicle?.odometer?.displayValue?.[0] ||
              props.vehicle?.odometer;
  if (kms === 0) return '0 km';
  if (!kms) return '';
  const numKms = typeof kms === 'number' ? kms : parseFloat(String(kms));
  if (isNaN(numKms)) return '';
  return `${numKms.toLocaleString()} km`;
});

const vehiclePrice = computed(() => {
  const price = props.vehicle?.price;
  if (!price || price === '' || price === 0) return 'POA';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice) || numPrice === 0) return 'POA';
  return `$${numPrice.toLocaleString()}`;
});

const vehiclePerWeek = computed(() => {
  const perweek = props.vehicle?.perweek;
  if (!perweek || perweek === 0) return '';
  return `$${perweek.toLocaleString()}`;
});

// Dealer info
const dealerPhone = computed(() => mainStore.site?.phone || '0352217233');
const dealerPhoneDisplay = computed(() => {
  const phone = dealerPhone.value.replace(/\D/g, '');
  if (phone.length === 10) {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)} ${phone.slice(6)}`;
  }
  return phone;
});

// All specifications (combines standard fields + attributes array)
const allSpecifications = computed(() => {
  const specs: { label: string; value: string }[] = [];
  
  // Add standard fields first
  if (vehicleKms.value) specs.push({ label: 'Odometer', value: vehicleKms.value });
  if (vehicleDrivetrain.value) specs.push({ label: 'Drivetrain', value: vehicleDrivetrain.value });
  if (vehicleTransmission.value) specs.push({ label: 'Transmission', value: vehicleTransmission.value });
  if (vehicleSeats.value) specs.push({ label: 'Seats', value: vehicleSeats.value });
  if (vehicleBody.value) specs.push({ label: 'Body Type', value: vehicleBody.value });
  if (vehicleFuel.value) specs.push({ label: 'Fuel Type', value: vehicleFuel.value });
  if (vehicleColour.value) specs.push({ label: 'Colour', value: vehicleColour.value });
  
  // Add attributes from the attributes array (avoiding duplicates)
  const existingLabels = new Set(specs.map(s => s.label.toLowerCase()));
  const attributes = props.vehicle?.attributes || [];
  
  // Map attribute names to readable labels
  const labelMap: Record<string, string> = {
    'Badge': 'Badge',
    'EngineType': 'Engine Type',
    'GenericEngType': 'Engine',
    'EngineSize': 'Engine Size (cc)',
    'Cylinders': 'Cylinders',
    'FuelType': 'Fuel Type',
    'Transmission': 'Transmission',
    'Gears': 'Gears',
    'Drive': 'Drivetrain',
    'BodyStyle': 'Body Style',
    'Doors': 'Doors',
    'Seats': 'Seats',
  };
  
  // Fields to skip (already covered or redundant)
  const skipFields = new Set(['GenericEngType']);
  
  for (const attr of attributes) {
    if (!attr.Name || !attr.Value || skipFields.has(attr.Name)) continue;
    
    const readableLabel = labelMap[attr.Name] || attr.Name.replace(/([A-Z])/g, ' $1').trim();
    const lowerLabel = readableLabel.toLowerCase();
    
    // Skip if we already have this field
    if (existingLabels.has(lowerLabel)) continue;
    
    specs.push({ label: readableLabel, value: attr.Value });
    existingLabels.add(lowerLabel);
  }
  
  return specs;
});

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

// Analytics tracking
const { trackEnquirySubmit } = useAnalytics();

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
        type: 'vehicle',
        firstName,
        lastName,
        email: form.email,
        phone: form.phone || undefined,
        message: form.message || undefined,
        vehicleInfo: {
          condition: getDisplay(vehicle?.condition) || undefined,
          make: getDisplay(vehicle?.make) || undefined,
          model: getDisplay(vehicle?.model) || undefined,
          variant: getDisplay(vehicle?.badge) || getDisplay(vehicle?.variant) || undefined,
          stockId: String(vehicle?.stockid || ''),
          price: vehicle?.price || undefined,
        },
        tradeIn: form.tradeIn ? {} : undefined,
        testDrive: form.testDrive,
        financeInterest: form.finance,
        source: 'vehicle-enquiry-modal',
      }
    });

    isSent.value = true;

    // GA4 Analytics tracking
    trackEnquirySubmit({
      vehicle: vehicle || undefined,
      form_type: 'enquiry',
      has_trade_in: form.tradeIn,
      interested_in_finance: form.finance,
      wants_test_drive: form.testDrive,
    });

    // GTM tracking
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'FormSubmission',
        formType: 'vehicle',
        formStatus: 'submitted',
        enquiryId: response.enquiry.id,
        stockId: vehicle?.stockid,
        vehicleTitle: vehicleTitle.value,
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
  errors.name = '';
  errors.email = '';
  isSent.value = false;
};

const closeModal = () => {
  emit('close');
};

// Embla carousel functions
const initCarousels = () => {
  if (!process.client) return;
  
  // Destroy existing instances
  if (mainEmbla.value) {
    mainEmbla.value.destroy();
    mainEmbla.value = null;
  }
  if (thumbEmbla.value) {
    thumbEmbla.value.destroy();
    thumbEmbla.value = null;
  }

  nextTick(() => {
    if (!mainCarouselRef.value || vehicleImages.value.length === 0) return;

    // Initialize main carousel
    mainEmbla.value = EmblaCarousel(mainCarouselRef.value, { loop: false });
    
    const updateButtons = () => {
      if (!mainEmbla.value) return;
      canScrollPrev.value = mainEmbla.value.canScrollPrev();
      canScrollNext.value = mainEmbla.value.canScrollNext();
    };

    const onSelect = () => {
      if (!mainEmbla.value) return;
      selectedIndex.value = mainEmbla.value.selectedScrollSnap();
      updateButtons();
      
      // Sync thumb carousel
      if (thumbEmbla.value) {
        thumbEmbla.value.scrollTo(selectedIndex.value);
      }
    };

    mainEmbla.value.on('select', onSelect);
    mainEmbla.value.on('init', updateButtons);
    mainEmbla.value.on('reInit', updateButtons);
    onSelect();

    // Initialize thumb carousel
    if (thumbCarouselRef.value && vehicleImages.value.length > 1) {
      thumbEmbla.value = EmblaCarousel(thumbCarouselRef.value, {
        containScroll: 'keepSnaps',
        dragFree: true,
      });
    }
  });
};

const scrollPrev = () => {
  if (mainEmbla.value) mainEmbla.value.scrollPrev();
};

const scrollNext = () => {
  if (mainEmbla.value) mainEmbla.value.scrollNext();
};

const onThumbClick = (index: number) => {
  if (mainEmbla.value) mainEmbla.value.scrollTo(index);
};

// Watch isOpen
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm();
    selectedIndex.value = 0;
    if (process.client) {
      document.body.style.overflow = 'hidden';
      // Initialize carousels after modal opens
      setTimeout(() => {
        initCarousels();
      }, 100);
    }
  } else {
    if (process.client) {
      document.body.style.overflow = '';
    }
    // Cleanup carousels
    if (mainEmbla.value) {
      mainEmbla.value.destroy();
      mainEmbla.value = null;
    }
    if (thumbEmbla.value) {
      thumbEmbla.value.destroy();
      thumbEmbla.value = null;
    }
  }
});

onBeforeUnmount(() => {
  if (process.client) {
    document.body.style.overflow = '';
  }
  if (mainEmbla.value) {
    mainEmbla.value.destroy();
  }
  if (thumbEmbla.value) {
    thumbEmbla.value.destroy();
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
  max-width: 56rem;
  margin: 2rem auto;
  background-color: #fff;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

/* Close Button - Absolute positioned */
.modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.95);
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

@media (max-width: 767px) {
  .modal-close {
    position: fixed;
    top: 0.5rem;
    right: 0.5rem;
  }
}

.modal-close:hover {
  background-color: #fff;
  color: #0f172a;
  transform: scale(1.05);
}

.modal-close svg {
  width: 20px;
  height: 20px;
}

.modal-layout {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .modal-layout {
    flex-direction: row;
    align-items: flex-start;
    max-height: 85vh;
    overflow: hidden;
  }
}

/* Vehicle Sidebar */
.vehicle-sidebar {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

@media (min-width: 768px) {
  .vehicle-sidebar {
    flex: 1;
    min-width: 0;
    border-bottom: none;
    border-right: 1px solid #e2e8f0;
    overflow-y: auto;
    max-height: 85vh;
  }
}

/* Gallery Section */
.gallery-section {
  background-color: #0f172a;
}

.main-image-container {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
}

/* Embla Main Carousel */
.embla-main {
  overflow: hidden;
  height: 100%;
}

.embla-main__container {
  display: flex;
  height: 100%;
}

.embla-main__slide {
  flex: 0 0 100%;
  min-width: 0;
  height: 100%;
  cursor: pointer;
}

.main-slide-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vehicle-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e2e8f0;
  color: #64748b;
  font-size: 1.25rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Gallery Navigation */
.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  color: #0f172a;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.gallery-nav:hover:not(:disabled) {
  background-color: #fff;
  transform: translateY(-50%) scale(1.1);
}

.gallery-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.gallery-nav--prev {
  left: 0.5rem;
}

.gallery-nav--next {
  right: 0.5rem;
}

.photo-count {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 0.375rem;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Thumbnails Carousel */
.thumbnails-container {
  padding: 0.5rem;
  background-color: #1e293b;
}

.embla-thumbs {
  overflow: hidden;
}

.embla-thumbs__container {
  display: flex;
  gap: 0.375rem;
}

.embla-thumbs__slide {
  flex: 0 0 auto;
  width: 3.5rem;
  height: 2.5rem;
  border: 2px solid transparent;
  border-radius: 0.25rem;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.2s;
  padding: 0;
  background: none;
}

.embla-thumbs__slide:hover {
  opacity: 0.8;
}

.embla-thumbs__slide.is-selected {
  opacity: 1;
  border-color: #fff;
}

.thumb-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Condition Badge */
.condition-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 0.375rem;
  color: #fff;
  background-color: #64748b;
}

.condition-badge.condition-new {
  background-color: #16a34a;
}

.condition-badge.condition-used {
  background-color: #2563eb;
}

.condition-badge.condition-demo {
  background-color: #9333ea;
}

.condition-badge.condition-certified {
  background-color: #ea580c;
}

.vehicle-details {
  padding: 1.25rem;
}

.vehicle-title {
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.vehicle-subtitle {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.4;
}

.vehicle-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #475569;
}

.spec-icon {
  width: 1rem;
  height: 1rem;
  color: #64748b;
}

/* Info Cards - Uber Style (2 columns) */
.info-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background-color: #fff;
  border: 1px solid #e2e8f0;
  text-decoration: none;
  color: inherit;
}

.info-card:first-child {
  border-right: none;
}

.info-card--clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.info-card--clickable:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.info-card--primary {
  background-color: #0f172a;
  border-color: #0f172a;
  color: #fff;
}

.info-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #f1f5f9;
  flex-shrink: 0;
}

.info-card--primary .info-card__icon {
  background-color: rgba(255, 255, 255, 0.15);
}

.info-card__icon--green {
  background-color: #dcfce7;
}

.info-card__icon svg {
  width: 1.25rem;
  height: 1.25rem;
  color: #475569;
}

.info-card--primary .info-card__icon svg {
  color: #fff;
}

.info-card__icon--green svg {
  color: #16a34a;
}

.info-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
}

.info-card__label {
  font-size: 0.75rem;
  color: #64748b;
}

.info-card__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.info-card--primary .info-card__title {
  color: #fff;
}

.info-card__title--phone {
  font-size: 1rem;
  font-weight: 600;
  color: #0ea5e9;
}

.info-card__suffix {
  font-size: 0.875rem;
  font-weight: 500;
  margin-left: 0.125rem;
}

.info-card--primary .info-card__suffix {
  color: rgba(255, 255, 255, 0.8);
}

.info-card__subtitle {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
}

.info-card--primary .info-card__subtitle {
  color: rgba(255, 255, 255, 0.7);
}

.info-card__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-card__arrow svg {
  width: 1.25rem;
  height: 1.25rem;
  color: #94a3b8;
}

/* Contact & Stock Section */
.contact-stock-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.contact-link {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  text-decoration: none;
}

.contact-link__label {
  font-size: 0.75rem;
  color: #64748b;
}

.contact-link__phone {
  font-size: 1rem;
  font-weight: 600;
  color: #0ea5e9;
}

.contact-link:hover .contact-link__phone {
  color: #0284c7;
}

.stock-badge {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Expandable Sections */
.expandable-sections {
  border-top: 1px solid #e2e8f0;
}

.expandable-section {
  border-bottom: 1px solid #e2e8f0;
}

.expandable-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
  list-style: none;
  background: none;
}

.expandable-section__header::-webkit-details-marker {
  display: none;
}

.expandable-section__chevron {
  width: 1.25rem;
  height: 1.25rem;
  color: #94a3b8;
  transition: transform 0.2s;
}

.expandable-section[open] .expandable-section__chevron {
  transform: rotate(180deg);
}

.expandable-section__content {
  padding: 0 1.25rem 1.25rem;
}

.specs-grid {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.spec-row:last-child {
  border-bottom: none;
}

.spec-label {
  font-size: 0.875rem;
  color: #64748b;
}

.spec-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #0f172a;
}

.vehicle-description {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #475569;
  white-space: pre-line;
}

/* Form Section */
.form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .form-section {
    flex: 0 0 400px;
    max-width: 400px;
    position: sticky;
    top: 0;
    max-height: 85vh;
    overflow-y: auto;
  }
}

/* Header */
.modal-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
}

/* Form */
.modal-form {
  position: relative;
  padding: 1.25rem;
  flex: 1;
  overflow-y: auto;
}

.form-intro {
  margin: 0 0 1rem;
  font-size: 0.9375rem;
  color: #334155;
  line-height: 1.5;
}

.form-section-title {
  margin: 0 0 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-with-icon {
  position: relative;
}

.field-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #94a3b8;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  font-size: 0.9375rem;
  color: #0f172a;
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #002c5f;
  box-shadow: 0 0 0 3px rgba(0, 44, 95, 0.1);
}

.form-input.has-error {
  border-color: #ef4444;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  color: #0f172a;
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  resize: vertical;
  min-height: 4rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #002c5f;
  box-shadow: 0 0 0 3px rgba(0, 44, 95, 0.1);
}

.error-text {
  font-size: 0.75rem;
  color: #ef4444;
}

/* Options */
.options-section {
  margin-top: 1rem;
  padding-top: 1rem;
  padding-bottom: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.option-label {
  font-size: 0.875rem;
  color: #334155;
}

.option-toggle {
  display: flex;
  gap: 0.25rem;
  background-color: #f1f5f9;
  border-radius: 0.375rem;
  padding: 0.1875rem;
}

.toggle-btn {
  padding: 0.3125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  background-color: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background-color: #fff;
  color: #0f172a;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.toggle-btn--yes.active {
  background-color: #002c5f;
  color: #fff;
}

/* Mobile button spacer - not needed with sticky positioning */
.mobile-button-spacer {
  display: none;
}

/* Actions */
.form-actions {
  margin-top: 1.25rem;
}

@media (max-width: 767px) {
  .form-actions {
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 1.25rem -1rem 0;
    padding: 0.75rem 1rem;
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
    background: #fff;
    border-top: 1px solid #e2e8f0;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }
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

/* Loading */
.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background-color: rgba(255, 255, 255, 0.95);
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

.btn-close {
  padding: 0.75rem 2rem;
  font-size: 0.9375rem;
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
@media (max-width: 767px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-start;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .modal-container {
    max-width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    margin: 0;
    border-radius: 0;
    display: flex;
    flex-direction: column;
  }

  .modal-layout {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: visible;
  }

  .vehicle-sidebar {
    flex-shrink: 0;
  }

  .main-image-container {
    aspect-ratio: 16/9;
  }

  .thumbnails-container {
    padding: 0.375rem;
  }

  .embla-thumbs__slide {
    width: 3rem;
    height: 2rem;
  }

  .vehicle-details {
    padding: 1rem;
  }

  .vehicle-title {
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .vehicle-subtitle {
    font-size: 0.8125rem;
    margin-bottom: 0.75rem;
  }

  .vehicle-specs {
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
  }

  .info-cards-grid {
    grid-template-columns: 1fr 1fr;
  }

  .info-card {
    padding: 0.75rem 1rem;
  }

  .info-card__icon {
    width: 2rem;
    height: 2rem;
  }

  .info-card__icon svg {
    width: 1rem;
    height: 1rem;
  }

  .info-card__title {
    font-size: 1rem;
  }

  .contact-stock-section {
    padding: 0.75rem 1rem;
  }

  .contact-link__phone {
    font-size: 0.9375rem;
  }

  .expandable-section__header {
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
  }

  .expandable-section__content {
    padding: 0 1rem 1rem;
  }

  .form-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: visible;
  }

  .modal-form {
    flex: 1;
    overflow: visible;
    padding: 1rem;
    padding-bottom: 0;
  }

  .form-intro {
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }

  .form-section-title {
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }

  .options-section {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
  }

  .option-label {
    font-size: 0.8125rem;
  }

  .success-container {
    padding: 2rem 1rem;
  }

  .success-icon {
    width: 4rem;
    height: 4rem;
    margin-bottom: 1rem;
  }

  .success-icon svg {
    width: 48px;
    height: 48px;
  }

  .success-title {
    font-size: 1.25rem;
  }

  .success-text {
    font-size: 0.9375rem;
    margin-bottom: 1.5rem;
  }
}
</style>
