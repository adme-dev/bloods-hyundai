<template>
  <div class="offer-detail-page">
    <LazyPageSchema />

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading offer details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <NuxtLink to="/special-offers" class="back-button">
        Back to Offers
      </NuxtLink>
    </div>

    <!-- Offer Content -->
    <div v-else-if="offer" class="offer-content">
      <!-- Test Drive Modal -->
      <ClientOnly>
        <LazyTestDriveModal 
          :is-open="showTestDriveModal"
          :preselected-model-id="testDriveModelId"
          :preselected-model="testDriveModelSlug"
          @close="showTestDriveModal = false"
          @submit="handleTestDriveSubmit"
        />
      </ClientOnly>

      <!-- Breadcrumb Navigation -->
      <OffersBreadcrumb 
        :category="offerCategory"
        :model="breadcrumbModelName"
      />

      <!-- Page Title -->
      <div class="offer-page-title">
        <h1>{{ offer.model }} Offer Details.</h1>
      </div>

      <!-- Hero Section with Diagonal Layout -->
      <div class="offer-hero-section">
        <div class="hero-diagonal-bg"></div>
        
        <div class="hero-content">
          <!-- Left Side - Vehicle Info -->
          <div class="hero-info">
            <h2 class="hero-model-name">{{ offer.model }}</h2>
            <!-- Only show variant name if different from model name -->
            <h3 v-if="offer.variantName && offer.variantName.toUpperCase() !== offer.model?.toUpperCase()" class="hero-variant-name">{{ offer.variantName }}</h3>
            <p class="hero-specs">{{ offer.specifications || `${offer.engineType || ''} ${offer.transmission || ''}`.trim() }}</p>
            
            <!-- Offer Display -->
            <div v-if="offer.hasValueOffer && offer.offerAmount" class="hero-offer">
              <span class="hero-offer-label" :class="{ 'value-offer': offer.offerType !== 'Driveaway Offer' }">
                {{ offer.offerType === 'Driveaway Offer' ? 'DRIVE AWAY FROM' : 'VALUE OFFER' }}
              </span>
              <div class="hero-offer-amount">
                <span class="amount">{{ offer.offerAmount }}</span>
                <span v-if="offer.offerCode" class="code">[{{ offer.offerCode }}]</span>
              </div>
              <!-- Only show description if it's meaningful (not just "Driveaway" or similar) -->
              <p v-if="offer.offerDescription && !['driveaway', 'drive away', 'driveaway price'].includes(offer.offerDescription.toLowerCase().trim())" class="hero-offer-description">{{ offer.offerDescription }}</p>
            </div>
          </div>
          
          <!-- Right Side - Vehicle Image -->
          <div class="hero-image">
            <img 
              :src="offer.heroImage || offer.image" 
              :alt="offer.imageAltText || offer.model"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="offer-cta-section">
        <button class="btn-contact-dealer" @click="scrollToEnquiry">
          Contact a dealer
        </button>
        <button class="btn-test-drive" @click="showTestDriveModal = true">
          Book a test drive
        </button>
      </div>
      
      <!-- Variants with offers (if current has no offer) -->
      <div v-if="!offer.hasValueOffer && variantsWithOffers.length > 0" class="variants-with-offers-section">
        <h3>{{ offer.model }} variants with current offers:</h3>
        <div class="related-offers-list">
          <NuxtLink 
            v-for="variant in variantsWithOffers" 
            :key="variant.id"
            :to="getVariantLink(variant)"
            class="related-offer-item"
          >
            <span class="related-variant-name">{{ variant.name }}</span>
            <span class="related-offer-amount">{{ variant.offerAmount }} <span class="related-offer-code">[{{ variant.offerCode }}]</span></span>
          </NuxtLink>
        </div>
      </div>

      <!-- More Model Offers Carousel -->
      <div v-if="otherVariants && otherVariants.length > 0" class="more-offers-section">
        <h2 class="more-offers-title">More {{ offer.model }} offers.</h2>
        
        <div class="offers-carousel-container">
          <!-- Left Arrow -->
          <button 
            v-if="otherVariants.length > 3" 
            class="carousel-arrow carousel-arrow-left"
            @click="scrollCarousel('left')"
            :disabled="carouselAtStart"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <polyline fill="none" stroke="currentColor" stroke-width="2" points="15 6 9 12 15 18"></polyline>
            </svg>
          </button>
          
          <div class="offers-carousel" ref="offersCarouselRef">
            <div 
              v-for="variant in otherVariants" 
              :key="variant.id" 
              class="offer-card"
              :class="{ 'has-value-offer': variant.hasValueOffer }"
            >
              <div class="offer-card-content">
                <h3 class="offer-card-title">{{ getCardTitle(variant) }}</h3>
                <p class="offer-card-specs">{{ getVariantSpecs(variant) }}</p>
                
                <!-- Offer Display (or empty space) -->
                <div class="offer-card-offer">
                  <template v-if="variant.hasValueOffer">
                    <span class="offer-label" :class="{ 'value-offer': variant.offerType !== 'Driveaway Offer' }">
                      {{ variant.offerType === 'Driveaway Offer' ? 'DRIVE AWAY FROM' : 'VALUE OFFER' }}
                    </span>
                    <div class="offer-price-row">
                      <span class="offer-price">{{ variant.offerAmount }}</span>
                      <span v-if="variant.offerCode" class="offer-code-badge">[{{ variant.offerCode }}]</span>
                    </div>
                  </template>
                </div>
                
                <!-- Vehicle Image -->
                <div class="offer-card-image">
                  <img 
                    :src="variant.image || offer.modelImage" 
                    :alt="variant.name"
                    loading="lazy"
                  />
                </div>
                
                <!-- Footer Section - Sticks to bottom -->
                <div class="offer-card-footer">
                  <!-- Description -->
                  <div class="offer-card-description">
                    <p v-if="variant.offerDescription">{{ variant.offerDescription }}</p>
                    <p v-else>Interested in this offer? Click below to learn more.</p>
                  </div>
                  
                  <!-- CTA Button -->
                  <NuxtLink 
                    :to="getVariantLink(variant)"
                    class="offer-card-cta"
                  >
                    Go to offer
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Right Arrow -->
          <button 
            v-if="otherVariants.length > 3" 
            class="carousel-arrow carousel-arrow-right"
            @click="scrollCarousel('right')"
            :disabled="carouselAtEnd"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <polyline fill="none" stroke="currentColor" stroke-width="2" points="9 6 15 12 9 18"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <!-- Enquiry Form Section -->
      <div id="enquiry-form" class="enquiry-section">
        <div class="enquiry-container">
          <h2 class="enquiry-title">Enquire About This Offer</h2>
          
          <form @submit.prevent="handleSubmit" class="enquiry-form">
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">First Name *</label>
                <input v-model="form.firstName" type="text" class="form-input" required />
              </div>
              <div class="form-field">
                <label class="form-label">Last Name *</label>
                <input v-model="form.lastName" type="text" class="form-input" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Email *</label>
                <input v-model="form.email" type="email" class="form-input" required />
              </div>
              <div class="form-field">
                <label class="form-label">Phone *</label>
                <input v-model="form.phone" type="tel" class="form-input" required />
              </div>
            </div>

            <div class="form-field">
              <label class="form-label">Postcode</label>
              <input v-model="form.postcode" type="text" class="form-input form-input-small" maxlength="4" />
            </div>

            <div class="form-field">
              <label class="form-label">Message</label>
              <textarea v-model="form.message" class="form-textarea" rows="3"></textarea>
            </div>

            <div class="form-field">
              <label class="consent-checkbox">
                <input v-model="form.consent" type="checkbox" required />
                <span class="checkbox-custom"></span>
                <span class="consent-text">I agree to the <NuxtLink to="/privacy-policy" target="_blank">Privacy Policy</NuxtLink></span>
              </label>
            </div>

            <button type="submit" class="submit-button" :disabled="submitting">
              {{ submitting ? 'Sending...' : 'Submit Enquiry' }}
            </button>

            <div v-if="submitted" class="success-message">
              <p><strong>Thank you!</strong> We'll be in touch soon about this offer.</p>
            </div>
          </form>
        </div>
      </div>

      <!-- Disclaimers Section -->
      <div v-if="hasDisclaimers" class="disclaimers-section">
        <h4>Disclaimers</h4>
        
        <!-- Global disclaimer (first) -->
        <div v-for="(disclaimer, index) in globalDisclaimers" :key="'global-' + index" class="disclaimer-item">
          <p class="disclaimer-text">{{ disclaimer.disclaimer }}</p>
        </div>
        
        <!-- All model-specific disclaimers -->
        <div v-for="(disclaimer, index) in modelDisclaimers" :key="'model-' + index" class="disclaimer-item">
          <p class="disclaimer-code">[{{ disclaimer.code }}]</p>
          <p class="disclaimer-text">{{ disclaimer.text }}</p>
        </div>
        
        <!-- Static myHyundaiCare disclaimers -->
        <div v-for="disclaimer in staticDisclaimers" :key="'static-' + disclaimer.code" class="disclaimer-item">
          <p class="disclaimer-code">[{{ disclaimer.code }}] {{ disclaimer.title }}</p>
          <p class="disclaimer-text">{{ disclaimer.text }}</p>
        </div>
      </div>

      <!-- Back to Offers -->
      <div class="back-to-offers">
        <NuxtLink to="/special-offers" class="back-link">
          <svg width="16" height="16" viewBox="0 0 20 20">
            <polyline fill="none" stroke="currentColor" stroke-width="1.5" points="13 4 7 10 13 16"></polyline>
          </svg>
          Back to all offers
        </NuxtLink>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="not-found-container">
      <h2>Offer Not Found</h2>
      <p>This offer may have expired or is no longer available.</p>
      <NuxtLink to="/special-offers" class="back-button">
        View Current Offers
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const config = useRuntimeConfig();
const mainStore = useMainStore();

// Site config for dynamic SEO (vendor-agnostic)
const siteName = computed(() => mainStore.site?.name || config.public.siteName || 'Dealership');
const siteUrl = computed(() => config.public.siteUrl || '');
const dealerAddress = computed(() => mainStore.site?.address || '');
const dealerCity = computed(() => mainStore.site?.city || '');
const dealerState = computed(() => mainStore.site?.state || '');

// Route params
const offerId = computed(() => route.params.id as string);

// State (for UI interactions)
const showTestDriveModal = ref(false);
const carouselAtStart = ref(true);
const carouselAtEnd = ref(false);
const offersCarouselRef = ref<HTMLElement | null>(null);

// Form state
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  postcode: '',
  message: '',
  consent: false,
});
const submitting = ref(false);
const submitted = ref(false);

// Static myHyundaiCare disclaimers
const staticDisclaimers = [
  {
    code: 'H1',
    title: '7 Year Unlimited Km Warranty',
    text: 'In addition to the 5 Year Standard New Car Warranty, Hyundai provides an extended warranty for up to a further 2 years, when all servicing is with Hyundai, on passenger vehicles first registered from June 1, 2025. Maximum warranty is 7 years from date of first registration, on the condition that all scheduled services are completed within the specified service intervals at an authorised Hyundai dealer. Otherwise, the standard 5 year unlimited km warranty (from the date of first registration) applies. Service conditions apply. Excludes Hybrid & EV drive batteries, which are warranted for 8 years / 160,000km (whichever occurs first) from the date of first registration. Does not apply if the vehicle is used at any time during the warranty period used for a "commercial application" as defined in the warranty policy, which includes use as a taxi, hire, ride-share, rental, courier, delivery, security, driving school, tour, bus operator or emergency vehicle, or any other use in the course of trade for the purpose of carrying passengers or goods. Passenger vehicles used for a commercial application are provided with a 5 year/130,000km warranty (whichever occurs first). People Mover Vans used for a commercial application are provided with a 5 year/160,000km warranty (whichever occurs first). Commercial Vans are provided with a 5 year/160,000km warranty (whichever occurs first) regardless of its usage. Terms, conditions and exclusions apply, view the Warranty page.'
  },
  {
    code: 'H2',
    title: 'Genuine Service Plan',
    text: "For the benefit of Hyundai owners, Hyundai provides online quotes, which specify the maximum price applicable for a vehicle's next scheduled maintenance service at a participating authorised Hyundai dealer and using Hyundai Genuine Parts (where required). Online quotes are available at www.hyundai.com/au/en/find-a-dealer#service apply for a stated effective period only and may change after that effective period without notice. Standard scheduled maintenance services are of limited scope. The benefit of online quotes is available for all Hyundai's, for their lifetime. To see the full terms and conditions of the Hyundai Genuine Service Plan Program, please visit hyundai.com/au/en/owning/servicing."
  },
  {
    code: 'H3',
    title: 'Premium Roadside Support Plan',
    text: "12 months included Premium Roadside Support when you buy a new Hyundai internal combustion engine or hybrid vehicle from a participating authorised Hyundai Dealer. For purchases from a participating authorised Hyundai Dealer of new Hyundai battery electric vehicle Hyundai offers 24 months included Premium Roadside Support. Premium Roadside Support commences from the date of the vehicle's warranty commencement. When you have your Hyundai internal combustion engine or hybrid vehicle's scheduled service completed at a participating authorised Hyundai Dealer, you will receive 12 months of included Premium Roadside Support from the date of service. For Hyundai battery electric vehicles, that have their scheduled service completed at a participating authorised Hyundai Dealer, you will receive 24 months of included Premium Roadside Support from the date of service. Available for all Hyundai vehicles (excluding rental buyers and taxis). Terms, conditions and exclusions apply, visit hyundai.com/au/en/owning/myhyundaicare/roadside-support."
  },
  {
    code: 'H4',
    title: 'Sat Nav Update Plan',
    text: "Applies to new Hyundai vehicles with both 8\" and 10.25\" factory-fitted satellite navigation. Updates are delivered annually and are included if the vehicle completes a scheduled service at an authorised Hyundai Dealer. Updates must be undertaken within 10 years of the vehicle's first registration date, with a maximum number of 9 updates. Visit hyundai.com/au/en/owning/myhyundaicare/sat-nav-plan for full terms and conditions."
  }
];

/**
 * Normalize model name to base model slug for TestDriveModal
 * The TestDriveModal uses models from all-variants API which have base model names like "i30", "ioniq-5"
 * But offers API has full names like "I30 HATCH N LINE", "IONIQ 5 N Line"
 * This function extracts the base model slug to match TestDriveModal's dropdown
 */
const getBaseModelSlug = (modelName: string): string => {
  if (!modelName) return '';
  
  // Known model name mappings (full name -> base slug)
  const modelMappings: Record<string, string> = {
    // i30 variants
    'i30 hatch n line': 'i30',
    'i30 hatch': 'i30',
    'i30 sedan': 'i30-sedan',
    'i30 sedan n line': 'i30-sedan',
    'i30 n': 'i30-n',
    // IONIQ variants
    'ioniq 5': 'ioniq-5',
    'ioniq 5 n': 'ioniq-5-n',
    'ioniq 6': 'ioniq-6',
    'ioniq 6 n line': 'ioniq-6',
    // Santa Fe variants
    'santa fe': 'santa-fe',
    'santa fe hybrid': 'santa-fe-hybrid',
    // Tucson variants
    'tucson': 'tucson',
    'tucson n line': 'tucson',
    'tucson hybrid': 'tucson-hybrid',
    // KONA variants
    'kona': 'kona',
    'kona n line': 'kona',
    'kona electric': 'kona-electric',
    'kona hybrid': 'kona-hybrid',
    // INSTER
    'inster': 'inster',
    // Staria
    'staria': 'staria',
    'staria load': 'staria-load',
    // iMax
    'imax n': 'imax-n',
    // iLoad
    'iload': 'iload',
    // Palisade
    'palisade': 'palisade',
    // Venue
    'venue': 'venue',
  };
  
  const normalizedName = modelName.toLowerCase().trim();
  
  // First check exact mappings
  if (modelMappings[normalizedName]) {
    return modelMappings[normalizedName];
  }
  
  // Try to find a partial match (for cases like "2025 Santa Fe" -> "santa-fe")
  for (const [key, value] of Object.entries(modelMappings)) {
    if (normalizedName.includes(key)) {
      return value;
    }
  }
  
  // Fallback: Extract first word(s) that look like a model name
  // Remove year prefixes (2024, 2025, etc.)
  let cleaned = normalizedName.replace(/^20\d{2}\s+/, '');
  
  // Remove common variant suffixes
  const suffixes = [
    ' n line', ' n-line', ' hybrid', ' electric', ' premium', ' elite', 
    ' active', ' highlander', ' hatch', ' sedan', ' load'
  ];
  for (const suffix of suffixes) {
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.slice(0, -suffix.length).trim();
    }
  }
  
  // Convert to slug format
  return cleaned
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Transform function to build offer object from API data
const transformOfferData = (offersData: any, variantId: string) => {
  let foundVariant = offersData?.variantsById?.[variantId];
  let foundCategory = '';
  let modelId: string | null = null;
  
  // If not found by variantId, search through all variants
  if (!foundVariant && offersData?.variants) {
    foundVariant = offersData.variants.find((v: any) => v.id === variantId);
  }
  
  // Also search in category models
  if (!foundVariant && offersData?.categories) {
    for (const category of offersData.categories) {
      for (const model of category.models) {
        const variant = model.variants?.find((v: any) => v.id === variantId);
        if (variant) {
          foundVariant = {
            ...variant,
            modelName: model.name,
            modelGroup: model.name,
            modelImage: model.image,
          };
          // Get all variants of this model
          foundVariant.allVariants = model.variants;
          // Capture the category name and model ID
          foundCategory = category.name;
          modelId = model.id || null;
          break;
        }
      }
      if (foundVariant) break;
    }
  }
  
  // If we found the variant but not the category, try to find the category
  if (foundVariant && !foundCategory && offersData?.categories) {
    for (const category of offersData.categories) {
      const modelMatch = category.models.find((m: any) => 
        m.name === foundVariant.modelName || m.name === foundVariant.modelGroup
      );
      if (modelMatch) {
        foundCategory = category.name;
        modelId = modelMatch.id || null;
        break;
      }
    }
  }
  
  if (!foundVariant) {
    return null;
  }
  
  // Build the offer object with all necessary data
  return {
    modelId: modelId,
    id: foundVariant.id,
    model: foundVariant.modelName || foundVariant.modelGroup || 'Hyundai',
    variantName: foundVariant.name || foundVariant.variantGroup || foundVariant.variantName,
    specifications: foundVariant.specifications || foundVariant.variantName,
    engineType: foundVariant.engineType,
    transmission: foundVariant.transmission,
    fuelType: foundVariant.fuelType,
    image: foundVariant.image || foundVariant.modelImage,
    heroImage: foundVariant.image || foundVariant.modelImage,
    imageAltText: foundVariant.imageAltText,
    modelImage: foundVariant.modelImage,
    hasValueOffer: foundVariant.hasValueOffer || false,
    offerType: foundVariant.offerType,
    offerAmount: foundVariant.offerAmount,
    offerCode: foundVariant.offerCode,
    offerDescription: foundVariant.offerDescription,
    offerDisclaimer: foundVariant.offerDisclaimer,
    price: foundVariant.price,
    formattedPrice: foundVariant.formattedPrice,
    allVariants: foundVariant.allVariants || [],
    globalDisclaimers: offersData.globalDisclaimers || [],
    category: foundCategory,
  };
};

// Fetch offer details using useFetch for SSR support (SEO-optimized)
const { data: offersData, pending: loading, error: fetchError } = await useFetch<any>('/api/hyundai-offers', {
  key: `offer-${route.params.id}`,
});

// Transform the fetched data into offer object
const offer = computed(() => {
  if (!offersData.value) return null;
  return transformOfferData(offersData.value, offerId.value);
});

// Get the model ID and slug for TestDriveModal
const testDriveModelId = computed(() => {
  return offer.value?.modelId || '';
});

const testDriveModelSlug = computed(() => {
  return offer.value?.model ? getBaseModelSlug(offer.value.model) : '';
});

// Get offer category for breadcrumbs
const offerCategory = computed(() => offer.value?.category || '');

// Breadcrumb model name - avoids duplication when variant name includes model name
const breadcrumbModelName = computed(() => {
  if (!offer.value) return '';
  
  const modelName = offer.value.model || '';
  const variantName = offer.value.variantName || '';
  
  if (!variantName) return modelName;
  
  const modelUpper = modelName.toUpperCase();
  const variantUpper = variantName.toUpperCase();
  
  // If variant name already includes the model name, just use the variant name
  // e.g., model: "INSTER", variant: "INSTER" -> "INSTER"
  if (variantUpper.includes(modelUpper)) {
    return variantName;
  }
  
  // If model name includes the variant's base (first word), just use model name + variant suffix
  // e.g., model: "2025 SANTA FE", variant: "SANTA FE Hybrid" -> "2025 SANTA FE Hybrid"
  // Extract the base model name from variant (first significant word or two)
  const variantParts = variantName.split(' ');
  const modelParts = modelName.split(' ');
  
  // Check if model name ends with the start of variant name (overlapping parts)
  // e.g., "2025 SANTA FE" ends with "SANTA FE", and variant starts with "SANTA FE"
  for (let i = 1; i <= Math.min(variantParts.length, modelParts.length); i++) {
    const variantStart = variantParts.slice(0, i).join(' ').toUpperCase();
    const modelEnd = modelParts.slice(-i).join(' ').toUpperCase();
    
    if (variantStart === modelEnd) {
      // Found overlap - combine model name with the rest of variant
      const variantRest = variantParts.slice(i).join(' ');
      if (variantRest) {
        return `${modelName} ${variantRest}`;
      }
      return modelName;
    }
  }
  
  // No overlap found, combine them
  return `${modelName} ${variantName}`;
});

// Error state
const error = computed(() => {
  if (fetchError.value) return 'Failed to load offer details. Please try again.';
  if (!loading.value && !offer.value) return 'Offer not found';
  return null;
});

// Computed
const variantsWithOffers = computed(() => {
  if (!offer.value?.allVariants) return [];
  const currentId = offer.value.id?.toLowerCase();
  return offer.value.allVariants
    .filter((v: any) => v.hasValueOffer && v.id?.toLowerCase() !== currentId)
    .slice(0, 5);
});

const otherVariants = computed(() => {
  if (!offer.value?.allVariants) return [];
  const currentId = offer.value.id?.toLowerCase();
  return offer.value.allVariants.filter((v: any) => 
    v.id?.toLowerCase() !== currentId && 
    (v.hasValueOffer || v.price || v.formattedPrice)
  );
});

const globalDisclaimers = computed(() => offer.value?.globalDisclaimers || []);

const modelDisclaimers = computed(() => {
  if (!offer.value?.allVariants) return [];
  
  const seenCodes = new Set();
  const disclaimers: any[] = [];
  
  for (const variant of offer.value.allVariants) {
    // Get disclaimers from offers array
    if (variant.offers && Array.isArray(variant.offers)) {
      for (const o of variant.offers) {
        const code = o.disclaimerCode || o.disclaimerCitation;
        const text = o.disclaimer;
        if (code && text && !seenCodes.has(code)) {
          seenCodes.add(code);
          disclaimers.push({
            code,
            text,
            variantName: variant.name
          });
        }
      }
    }
    
    // Also check top-level offerDisclaimer
    if (variant.offerCode && variant.offerDisclaimer && !seenCodes.has(variant.offerCode)) {
      seenCodes.add(variant.offerCode);
      disclaimers.push({
        code: variant.offerCode,
        text: variant.offerDisclaimer,
        variantName: variant.name
      });
    }
  }
  
  return disclaimers;
});

const hasDisclaimers = computed(() => {
  return modelDisclaimers.value.length > 0 || 
         (globalDisclaimers.value && globalDisclaimers.value.length > 0);
});

// Methods
const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
};

const getVariantLink = (variant: any) => {
  const modelSlug = slugify(offer.value?.model || '');
  const variantSlug = slugify(variant.name || '');
  return `/offer/${variant.id}/${modelSlug}-${variantSlug}`;
};

const getCardTitle = (variant: any) => {
  const modelName = offer.value?.model || '';
  const variantName = variant.name || '';
  
  // If variant name already includes model name, just use variant name
  if (variantName.toUpperCase().includes(modelName.toUpperCase())) {
    return variantName;
  }
  
  // Otherwise combine them
  return `${modelName} ${variantName}`;
};

const getVariantSpecs = (variant: any) => {
  if (variant.specifications) {
    return variant.specifications;
  }
  
  if (variant.engineType || variant.transmission) {
    const parts = [variant.engineType, variant.transmission].filter(Boolean);
    return parts.join(' ');
  }
  
  const variantName = variant.name || '';
  if (variantName.includes('Hybrid')) {
    return 'Hybrid SUV';
  } else if (variantName.includes('Electric')) {
    return 'Electric SUV';
  }
  
  return 'SUV';
};

const scrollCarousel = (direction: 'left' | 'right') => {
  const carousel = offersCarouselRef.value;
  if (!carousel) return;
  
  const cardWidth = 380;
  const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
  
  carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  
  setTimeout(() => updateCarouselArrows(), 300);
};

const updateCarouselArrows = () => {
  const carousel = offersCarouselRef.value;
  if (!carousel) return;
  
  carouselAtStart.value = carousel.scrollLeft <= 10;
  carouselAtEnd.value = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 10;
};

const scrollToEnquiry = () => {
  const el = document.getElementById('enquiry-form');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
};

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
        message: form.message || undefined,
        vehicleInfo: {
          condition: 'new',
          make: 'Hyundai',
          model: offer.value?.model,
          variant: offer.value?.variantName,
          price: offer.value?.offerAmount ? parseInt(offer.value.offerAmount.replace(/[^0-9]/g, '')) : undefined,
        },
        source: `offer-page-${offerId.value}`,
      },
    });

    submitted.value = true;

    if (import.meta.client && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'FormSubmission',
        formType: 'vehicle',
        formStatus: 'submitted',
        enquiryId: response.enquiry.id,
        offerModel: offer.value?.model,
        offerVariant: offer.value?.variantName,
      });
    }
  } catch (err) {
    console.error('Form submission error:', err);
  } finally {
    submitting.value = false;
  }
};

const handleTestDriveSubmit = (formData: any) => {
  console.log('Test drive form submitted:', formData);
};

// SEO Meta - Optimized for Google Search with dynamic content
const seoTitle = computed(() => {
  if (!offer.value) return 'Special Offer';
  const model = offer.value.model || '';
  const variant = offer.value.variantName || '';
  const offerAmount = offer.value.offerAmount || '';
  
  if (offerAmount) {
    return `${model} ${variant} - ${offerAmount} Driveaway Offer`;
  }
  return `${model} ${variant} Special Offer`;
});

const seoDescription = computed(() => {
  const dealer = siteName.value;
  if (!offer.value) return `Check out the latest Hyundai special offers at ${dealer}.`;
  
  const model = offer.value.model || 'Hyundai';
  const variant = offer.value.variantName || '';
  const offerAmount = offer.value.offerAmount || '';
  const offerDesc = offer.value.offerDescription || '';
  
  if (offerAmount && offerDesc) {
    return `${model} ${variant} ${offerAmount}. ${offerDesc} Available now at ${dealer}.`;
  }
  if (offerAmount) {
    return `${model} ${variant} available from ${offerAmount} driveaway at ${dealer}. Explore our latest offers and book a test drive today.`;
  }
  return `Check out the ${model} ${variant} special offer at ${dealer}. Explore pricing, features and book a test drive today.`;
});

const seoKeywords = computed(() => {
  const dealer = siteName.value;
  if (!offer.value) return `Hyundai offers, ${dealer}`;
  
  const model = offer.value.model || '';
  const variant = offer.value.variantName || '';
  
  return `${model} ${variant}, ${model} price, ${model} offer, ${model} driveaway, Hyundai ${model}, ${dealer} ${model}`;
});

// Apply SEO meta
useSiteMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
  image: () => offer.value?.heroImage || offer.value?.image,
  keywords: () => seoKeywords.value,
});

// Add Product/Offer Schema.org markup for rich search results
// Uses dynamic site config for vendor-agnostic implementation
const offerSchemaScript = computed(() => {
  if (!offer.value) return null;
  
  const model = offer.value.model || 'Hyundai';
  const variant = offer.value.variantName || '';
  const price = offer.value.price || null;
  const image = offer.value.heroImage || offer.value.image;
  
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${model} ${variant}`,
    description: seoDescription.value,
    brand: {
      '@type': 'Brand',
      name: 'Hyundai',
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Hyundai Motor Company',
    },
    category: 'Automobiles',
    url: `${siteUrl.value}${route.fullPath}`,
  };
  
  // Add image if available
  if (image) {
    schema.image = image;
  }
  
  // Add offer information
  if (offer.value.hasValueOffer || price) {
    schema.offers = {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'AUD',
      price: price || undefined,
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
      seller: {
        '@type': 'AutoDealer',
        name: siteName.value,
        url: siteUrl.value,
        address: {
          '@type': 'PostalAddress',
          streetAddress: dealerAddress.value,
          addressLocality: dealerCity.value,
          addressRegion: dealerState.value,
          addressCountry: 'AU',
        },
      },
    };
    
    if (offer.value.offerDescription) {
      schema.offers.description = offer.value.offerDescription;
    }
  }
  
  // Add vehicle-specific properties
  schema.additionalProperty = [];
  
  if (offer.value.fuelType) {
    schema.additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'Fuel Type',
      value: offer.value.fuelType,
    });
  }
  
  if (offer.value.transmission) {
    schema.additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'Transmission',
      value: offer.value.transmission,
    });
  }
  
  if (offer.value.engineType) {
    schema.additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'Engine',
      value: offer.value.engineType,
    });
  }
  
  return schema;
});

// Helper to create URL slug
const categorySlug = computed(() => {
  if (!offerCategory.value) return '';
  return offerCategory.value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
});

// Add BreadcrumbList schema for better navigation in search results
const breadcrumbSchema = computed(() => {
  const items: any[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl.value,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Special Offers',
      item: `${siteUrl.value}/special-offers`,
    },
  ];
  
  // Add category if available
  let position = 3;
  if (offerCategory.value) {
    items.push({
      '@type': 'ListItem',
      position: position,
      name: offerCategory.value,
      item: `${siteUrl.value}/special-offers/${categorySlug.value}`,
    });
    position++;
  }
  
  // Add current offer
  items.push({
    '@type': 'ListItem',
    position: position,
    name: offer.value ? `${offer.value.model} ${offer.value.variantName || ''}`.trim() : 'Offer',
    item: `${siteUrl.value}${route.fullPath}`,
  });
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
});

// Add schemas to page head
useHead({
  script: computed(() => {
    const scripts: any[] = [];
    
    if (offerSchemaScript.value) {
      scripts.push({
        type: 'application/ld+json',
        children: JSON.stringify(offerSchemaScript.value),
      });
    }
    
    scripts.push({
      type: 'application/ld+json',
      children: JSON.stringify(breadcrumbSchema.value),
    });
    
    return scripts;
  }),
});

// Update carousel arrows when content changes
onUpdated(() => {
  nextTick(() => updateCarouselArrows());
});
</script>

<style lang="scss" scoped>
.offer-detail-page {
  font-family: 'HyundaiSansHead', 'Helvetica Neue', Arial, sans-serif;
  color: #1a1a1a;
  background: #fff;
  min-height: 100vh;
}

/* Loading & Error States */
.loading-container,
.error-container,
.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
  text-align: center;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: #002c5f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #d32f2f;
  margin-bottom: 20px;
  font-size: 16px;
}

.back-button {
  background: #002c5f;
  color: white;
  padding: 12px 32px;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 600;
}

/* Page Title */
.offer-page-title {
  text-align: center;
  padding: 40px 20px 0;
}

.offer-page-title h1 {
  font-size: 42px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

/* Hero Section with Diagonal Layout */
.offer-hero-section {
  position: relative;
  min-height: 500px;
  overflow: hidden;
  margin-top: 30px;
}

.hero-diagonal-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 55%;
  height: 100%;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  transform: skewX(-10deg);
  transform-origin: top left;
  z-index: 0;
}

.hero-content {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  padding: 60px 40px;
  z-index: 1;
}

.hero-info {
  flex: 0 0 45%;
  padding-right: 40px;
}

.hero-model-name {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.1;
}

.hero-variant-name {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 12px;
  line-height: 1.1;
}

.hero-specs {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px;
  line-height: 1.5;
}

.hero-offer {
  margin-top: 24px;
}

.hero-offer-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #333;
}

.hero-offer-label.value-offer {
  color: #e85d00;
}

.hero-offer-amount {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.hero-offer-amount .amount {
  font-size: 42px;
  font-weight: 700;
  color: #1a1a1a;
}

.hero-offer-amount .code {
  font-size: 16px;
  color: #666;
}

.hero-offer-description {
  font-size: 14px;
  color: #333;
  margin: 0;
  line-height: 1.5;
  max-width: 350px;
}

.hero-image {
  flex: 0 0 55%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-image img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}

/* CTA Section */
.offer-cta-section {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding: 40px 20px;
  background: #fff;
}

.offer-cta-section .btn-contact-dealer,
.offer-cta-section .btn-test-drive {
  padding: 14px 32px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.offer-cta-section .btn-contact-dealer {
  background: #002c5f;
  color: white;
}

.offer-cta-section .btn-contact-dealer:hover {
  background: #001a3a;
}

.offer-cta-section .btn-test-drive {
  background: white;
  color: #002c5f;
  border: 2px solid #002c5f;
}

.offer-cta-section .btn-test-drive:hover {
  background: #002c5f;
  color: white;
}

/* Variants with offers section */
.variants-with-offers-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
  background: #f8f8f8;
}

.variants-with-offers-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
  color: #333;
}

/* Related Offers List */
.related-offers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-offer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f0f5fa;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s;
}

.related-offer-item:hover {
  background: #002c5f;
}

.related-offer-item:hover .related-variant-name,
.related-offer-item:hover .related-offer-amount,
.related-offer-item:hover .related-offer-code {
  color: white;
}

.related-variant-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.related-offer-amount {
  font-size: 14px;
  font-weight: 600;
  color: #002c5f;
}

.related-offer-code {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* More Offers Carousel Section */
.more-offers-section {
  max-width: 100%;
  padding: 60px 0;
  background: #fff;
  border-top: 1px solid #e0e0e0;
}

.more-offers-title {
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 40px;
  color: #1a1a1a;
}

.offers-carousel-container {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 60px;
}

.offers-carousel {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 10px 0;
}

.offers-carousel::-webkit-scrollbar {
  display: none;
}

/* Carousel Arrows */
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border: none;
  background: transparent;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  transition: all 0.2s;
}

.carousel-arrow:hover:not(:disabled) {
  color: #002c5f;
}

.carousel-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.carousel-arrow-left {
  left: 0;
}

.carousel-arrow-right {
  right: 0;
}

/* Offer Card */
.offer-card {
  flex: 0 0 360px;
  scroll-snap-align: start;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.offer-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.offer-card-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
}

.offer-card-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px;
}

.offer-card-specs {
  font-size: 13px;
  color: #666;
  margin: 0 0 16px;
  min-height: 36px;
}

/* Offer Display - Fixed height area */
.offer-card-offer {
  min-height: 70px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 8px;
}

.offer-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #333;
  margin-bottom: 4px;
}

.offer-label.value-offer {
  color: #e85d00;
}

.offer-price-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
}

.offer-price {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
}

.offer-code-badge {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

/* Card Image */
.offer-card-image {
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
}

.offer-card-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Card Footer */
.offer-card-footer {
  margin-top: auto;
  width: 100%;
}

.offer-card-description {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  width: 100%;
  min-height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.offer-card-description p {
  font-size: 13px;
  color: #333;
  margin: 0;
  line-height: 1.5;
}

.offer-card-cta {
  display: block;
  width: 100%;
  padding: 14px 24px;
  background: #002c5f;
  color: white;
  text-align: center;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  border-radius: 4px;
  transition: background 0.2s;
}

.offer-card-cta:hover {
  background: #001a3a;
}

/* Enquiry Section */
.enquiry-section {
  background: #002c5f;
  padding: 60px 20px;
}

.enquiry-container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 8px;
}

.enquiry-title {
  font-size: 28px;
  font-weight: 700;
  color: #002c5f;
  text-align: center;
  margin: 0 0 30px;
}

.enquiry-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-input,
.form-textarea {
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #002c5f;
}

.form-input-small {
  max-width: 150px;
}

.consent-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}

.consent-checkbox input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 3px;
  position: relative;
  margin-top: 2px;
}

.consent-checkbox input[type="checkbox"]:checked + .checkbox-custom {
  background: #002c5f;
  border-color: #002c5f;
}

.consent-checkbox input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.consent-text {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.consent-text a {
  color: #002c5f;
}

.submit-button {
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  background: #002c5f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
}

.submit-button:hover:not(:disabled) {
  background: #001a3a;
}

.submit-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 16px;
  border-radius: 4px;
  text-align: center;
}

.success-message p {
  margin: 0;
}

/* Disclaimers Section */
.disclaimers-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
  background: #f8f8f8;
  border-top: 1px solid #e5e5e5;
}

.disclaimers-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}

.disclaimer-item {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.disclaimer-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.disclaimer-code {
  font-size: 12px;
  font-weight: 600;
  color: #002c5f;
  margin: 0 0 4px 0;
}

.disclaimers-section .disclaimer-text {
  font-size: 12px;
  line-height: 1.6;
  color: #666;
  margin: 0;
}

/* Back to Offers */
.back-to-offers {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 40px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #002c5f;
  text-decoration: none;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-content {
    flex-direction: column;
    padding: 40px 20px;
  }
  
  .hero-diagonal-bg {
    width: 100%;
    height: 50%;
    transform: skewY(-5deg);
    transform-origin: top left;
  }
  
  .hero-info {
    flex: none;
    width: 100%;
    padding-right: 0;
    text-align: center;
    margin-bottom: 30px;
  }
  
  .hero-offer-amount {
    justify-content: center;
  }
  
  .hero-offer-description {
    max-width: none;
  }
  
  .hero-image {
    flex: none;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .offer-page-title h1 {
    font-size: 28px;
  }
  
  .hero-model-name,
  .hero-variant-name {
    font-size: 28px;
  }
  
  .hero-offer-amount .amount {
    font-size: 32px;
  }
  
  .offer-cta-section {
    flex-direction: column;
    padding: 30px 20px;
  }
  
  .offer-cta-section .btn-contact-dealer,
  .offer-cta-section .btn-test-drive {
    text-align: center;
  }
  
  .back-to-offers {
    padding: 20px;
  }
  
  .more-offers-section {
    padding: 40px 0;
  }
  
  .more-offers-title {
    font-size: 24px;
    margin-bottom: 24px;
  }
  
  .offers-carousel-container {
    padding: 0 20px;
  }
  
  .offers-carousel {
    gap: 16px;
  }
  
  .offer-card {
    flex: 0 0 300px;
  }
  
  .carousel-arrow {
    display: none;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .enquiry-container {
    padding: 24px;
  }
}
</style>

