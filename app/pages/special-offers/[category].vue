<template>
  <div class="hyundai-offers">
    <LazyPageSchema />

    <!-- Breadcrumb Navigation -->
    <OffersBreadcrumb :category="categoryDisplayName" />

    <!-- Hero Banner from Hyundai OEM -->
    <div v-if="offersData?.heroBanner" class="offers-hero-banner">
      <img 
        :src="offersData.heroBanner" 
        alt="Surprisingly Big Offers on now! Unlock offers across a selected range."
        class="hero-banner-image"
      />
    </div>

    <!-- Intro Section -->
    <div class="offers-intro">
      <h1 class="intro-heading">{{ categoryDisplayName }} Offers</h1>
      <p class="intro-body">{{ categoryDescription }}</p>
    </div>

    <!-- Highlighted Card Section -->
    <div v-if="offersData?.highlightedCard" class="highlighted-section">
      <h2 class="highlighted-heading">{{ offersData.highlightedCard.heading }}</h2>
      <p class="highlighted-body">{{ offersData.highlightedCard.body }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading offers...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error || !categoryData" class="error-container">
      <p class="error-message">{{ error || 'Category not found' }}</p>
      <NuxtLink to="/special-offers" class="retry-button">View All Offers</NuxtLink>
    </div>

    <!-- Main Content -->
    <div v-else class="offers-content">
      <!-- Test Drive Modal -->
      <ClientOnly>
        <LazyTestDriveModal 
          :is-open="showTestDriveModal"
          :preselected-model-id="selectedModelId"
          :preselected-model="selectedModelSlug"
          @close="showTestDriveModal = false"
          @submit="handleTestDriveSubmit"
        />
      </ClientOnly>

      <!-- Category Filter Strip (OEM Style) - Links to category pages for SEO -->
      <div class="category-filter-strip" ref="categoryNavRef">
        <div class="filter-strip-inner">
          <span class="filter-label">Hyundai Offers</span>
          <div class="category-tabs">
            <NuxtLink
              to="/special-offers"
              class="tab-button tab-link"
              @click="handleCategoryClick"
            >
              All
            </NuxtLink>
            <NuxtLink
              v-for="cat in allCategories"
              :key="cat.slug"
              :to="`/special-offers/${cat.slug}`"
              :class="['tab-button tab-link', { active: cat.slug === categorySlug }]"
              @click="handleCategoryClick"
            >
              {{ cat.name }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Models Grid -->
      <div class="uk-container uk-container-large uk-margin-medium-top uk-margin-large-bottom">
        <div class="models-grid" :id="`category-${categorySlug}`" ref="modelsSectionRef">
          <div 
            v-for="model in categoryModels" 
            :key="model.id" 
            class="model-card"
          >
            <div class="model-image-container">
              <img 
                :src="model.image || undefined" 
                :alt="model.imageAltText || model.name"
                class="model-image"
                loading="lazy"
              />
            </div>
            
            <div class="model-info">
              <h3 class="model-name">{{ model.name }}</h3>
              
              <!-- Variants List -->
              <div v-if="model.variants && model.variants.length > 0" class="variants-list">
                <div 
                  v-for="variant in model.variants" 
                  :key="variant.id" 
                  class="variant-item"
                  :class="{ 'has-offer': variant.hasValueOffer }"
                >
                  <div class="variant-info">
                    <span class="variant-name">{{ variant.name }}</span>
                    <span v-if="variant.hasValueOffer && variant.offerAmount" class="variant-offer-badge">
                      {{ variant.offerAmount }}
                      <span v-if="variant.offerCode" class="offer-code">[{{ variant.offerCode }}]</span>
                    </span>
                  </div>
                  <NuxtLink 
                    :to="getVariantOfferLink(model, variant)"
                    class="variant-cta"
                    :class="{ 'cta-highlight': variant.hasValueOffer }"
                  >
                    {{ variant.hasValueOffer ? 'View Offer' : 'Learn More' }}
                  </NuxtLink>
                </div>
              </div>
            </div>
            
            <div class="model-actions">
              <button 
                class="btn-secondary"
                @click="openTestDriveModal(model)"
              >
                Book Test Drive
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="categoryModels.length === 0" class="empty-state">
          <p>No offers available in this category.</p>
          <NuxtLink to="/special-offers" class="back-button">View All Offers</NuxtLink>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="uk-padding uk-text-meta-xs uk-background-muted">
        *All prices listed are driveway price including on road costs such as registration and CTP
        insurance unless specified as ECG (ex government charges) or POA (price on application).
        {{ siteName }} may change pricing at any time (this includes where there are government
        changes in regulation and/or legislation). There may be a delay to any pricing updates
        displaying correctly on our materials. Always obtain confirmation on updated pricing from
        {{ siteName }}. All prices are subject to change at the discretion of {{ siteName }}.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Variant {
  id: string;
  name: string;
  price?: number | null;
  formattedPrice?: string | null;
  image?: string | null;
  hasValueOffer?: boolean;
  offerType?: string | null;
  offerAmount?: string | null;
  offerCode?: string | null;
  offerDescription?: string | null;
}

interface Model {
  id: string;
  name: string;
  image: string | null;
  imageAltText?: string;
  order?: number;
  variants: Variant[];
}

interface Category {
  name: string;
  description?: string;
  order?: number;
  models: Model[];
}

interface OffersData {
  heroBanner: string | null;
  highlightedCard: {
    label?: string;
    backgroundImage?: string;
    backgroundImageAltText?: string;
    heading?: string;
    body?: string;
  } | null;
  categories: Category[];
  [key: string]: any;
}

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const mainStore = useMainStore();
const categoryNavRef = ref<HTMLElement | null>(null);
const modelsSectionRef = ref<HTMLElement | null>(null);
const shouldScrollToModels = ref(false);

// Site config for dynamic content
const siteName = computed(() => mainStore.site?.name || config.public.siteName || 'Dealership');
const siteUrl = computed(() => config.public.siteUrl || '');
const dealerAddress = computed(() => mainStore.site?.address || '');
const dealerCity = computed(() => mainStore.site?.city || '');
const dealerState = computed(() => mainStore.site?.state || '');

// Test Drive Modal State
const showTestDriveModal = ref(false);
const selectedModelId = ref<string | undefined>(undefined);
const selectedModelSlug = ref<string | undefined>(undefined);

const openTestDriveModal = (model: Model) => {
  // Pass model ID (most reliable) and slug as fallback
  selectedModelId.value = model.id;
  selectedModelSlug.value = getBaseModelSlug(model.name);
  showTestDriveModal.value = true;
};

const handleTestDriveSubmit = (formData: any) => {
  console.log('Test drive form submitted:', formData);
  showTestDriveModal.value = false;
};

// Get category from route
const categorySlug = computed(() => route.params.category as string);

// Helper to convert slug to display name
const slugToName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper to convert name to slug
const nameToSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
};

// Fetch offers from API
const { data: offersData, pending, error } = await useFetch<OffersData>('/api/hyundai-offers', {
  key: `offers-category-${categorySlug.value}`,
});

// Get all categories for navigation
const allCategories = computed(() => {
  if (!offersData.value?.categories) return [];
  return offersData.value.categories.map(cat => ({
    name: cat.name,
    slug: nameToSlug(cat.name),
    description: cat.description,
  }));
});

// Find matching category
const categoryData = computed(() => {
  if (!offersData.value?.categories) return null;
  return offersData.value.categories.find(
    cat => nameToSlug(cat.name) === categorySlug.value
  );
});

// Category display name
const categoryDisplayName = computed(() => {
  return categoryData.value?.name || slugToName(categorySlug.value);
});

// Category description for SEO
const categoryDescription = computed(() => {
  const name = categoryDisplayName.value;
  const descriptions: Record<string, string> = {
    'SUVs and People Movers': `Explore special offers on Hyundai SUVs and People Movers at ${siteName.value}. From compact crossovers to large family SUVs, find your perfect vehicle.`,
    'Electric': `Discover electric vehicle offers at ${siteName.value}. Drive into the future with Hyundai's range of EVs including IONIQ 5, IONIQ 6, and KONA Electric.`,
    'Hatch and Sedan': `Browse Hyundai sedan and hatchback offers at ${siteName.value}. Fuel-efficient and stylish vehicles for everyday driving.`,
    'Vans and Trucks': `Find commercial vehicle offers at ${siteName.value}. Reliable vans and utility vehicles for your business needs.`,
    'Runout': `Don't miss out on runout offers at ${siteName.value}. Limited stock on outgoing models with exceptional value.`,
  };
  return descriptions[name] || `Browse ${name} offers at ${siteName.value}. Find great deals on new Hyundai vehicles.`;
});

// Models in this category
const categoryModels = computed<Model[]>(() => {
  return categoryData.value?.models || [];
});

// Helper functions
const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
};

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


const getVariantOfferLink = (model: Model, variant: Variant) => {
  const modelSlug = slugify(model.name);
  const variantSlug = slugify(variant.name);
  return `/special-offer/${variant.id}/${modelSlug}-${variantSlug}`;
};

// SEO Meta
useSiteMeta({
  title: () => `${categoryDisplayName.value} Offers`,
  description: () => categoryDescription.value,
  keywords: () => `Hyundai ${categoryDisplayName.value}, ${categoryDisplayName.value} offers, ${categoryDisplayName.value} deals, ${siteName.value} ${categoryDisplayName.value}, Hyundai specials`,
});

// Schema.org - OfferCatalog for category
const categorySchemaScript = computed(() => {
  if (!categoryData.value) return null;
  
  const offerItems: any[] = [];
  
  for (const model of categoryData.value.models) {
    for (const variant of (model.variants || [])) {
      if (variant.hasValueOffer) {
        offerItems.push({
          '@type': 'Offer',
          name: `${model.name} ${variant.name}`,
          description: variant.offerDescription || `Special offer on ${model.name} ${variant.name}`,
          price: variant.price || undefined,
          priceCurrency: 'AUD',
          availability: 'https://schema.org/InStock',
          url: `${siteUrl.value}/special-offer/${variant.id}/${slugify(model.name)}-${slugify(variant.name)}`,
          itemOffered: {
            '@type': 'Car',
            name: `${model.name} ${variant.name}`,
            brand: {
              '@type': 'Brand',
              name: 'Hyundai',
            },
            image: variant.image || model.image,
          },
        });
      }
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: `Hyundai ${categoryDisplayName.value} Offers at ${siteName.value}`,
    description: categoryDescription.value,
    numberOfItems: offerItems.length,
    itemListElement: offerItems.slice(0, 20),
    provider: {
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
});

// Schema.org - BreadcrumbList
const breadcrumbSchema = computed(() => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
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
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryDisplayName.value,
        item: `${siteUrl.value}/special-offers/${categorySlug.value}`,
      },
    ],
  };
});

// Add schemas to page head
useHead({
  script: computed(() => {
    const scripts: any[] = [];
    
    if (categorySchemaScript.value) {
      scripts.push({
        type: 'application/ld+json',
        children: JSON.stringify(categorySchemaScript.value),
      });
    }
    
    scripts.push({
      type: 'application/ld+json',
      children: JSON.stringify(breadcrumbSchema.value),
    });
    
    return scripts;
  }),
});

// Scroll to models section helper
const scrollToModelsSection = () => {
  if (modelsSectionRef.value && categoryNavRef.value) {
    const navHeight = categoryNavRef.value.offsetHeight;
    const elementPosition = modelsSectionRef.value.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - navHeight - 20; // Extra 20px padding
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

// Handle category link clicks - scroll to models section after navigation
const handleCategoryClick = (event: MouseEvent) => {
  // Set flag to indicate we should scroll after navigation
  shouldScrollToModels.value = true;
};

// Track if this is initial load or navigation
const isInitialLoad = ref(true);

// Handle hash links for scrolling to sections
onMounted(() => {
  // Check if there's a hash in the URL
  const handleHashScroll = () => {
    const hash = route.hash;
    if (hash) {
      // Remove the # symbol
      const targetId = hash.substring(1);
      // Wait for next tick to ensure DOM is ready
      nextTick(() => {
        const targetElement = document.getElementById(targetId);
        if (targetElement && categoryNavRef.value) {
          // Calculate offset for sticky nav
          const navHeight = categoryNavRef.value.offsetHeight;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navHeight;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    }
  };
  
  // Handle initial hash only
  handleHashScroll();
  
  // Mark initial load as complete after a short delay
  setTimeout(() => {
    isInitialLoad.value = false;
  }, 500);
  
  // Listen for hash changes
  window.addEventListener('hashchange', handleHashScroll);
  
  // Use router.afterEach to handle scroll after navigation
  const stopWatcher = router.afterEach((to, from) => {
    // Only handle special-offers routes
    if (to.path.startsWith('/special-offers') && shouldScrollToModels.value) {
      // Wait for DOM to update
      nextTick(() => {
        setTimeout(() => {
          scrollToModelsSection();
          shouldScrollToModels.value = false;
        }, 300);
      });
    }
  });
  
  // Watch for route changes (category navigation) as fallback
  watch(() => route.params.category, () => {
    // Scroll if we clicked a category link or if not initial load
    if (shouldScrollToModels.value || !isInitialLoad.value) {
      // Wait for content to load
      nextTick(() => {
        setTimeout(() => {
          scrollToModelsSection();
          shouldScrollToModels.value = false;
        }, 200);
      });
    }
  });
  
  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('hashchange', handleHashScroll);
    stopWatcher();
  });
});
</script>

<style lang="scss" scoped>
/* Base Styles */
.hyundai-offers {
  font-family: 'HyundaiSansHead', 'Helvetica Neue', Arial, sans-serif;
  color: #1a1a1a;
  min-height: 100vh;
  background: #fff;
}

/* Hero Banner from OEM */
.offers-hero-banner {
  width: 100%;
  overflow: hidden;
}

.hero-banner-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

/* Intro Section */
.offers-intro {
  text-align: center;
  padding: 60px 40px;
  max-width: 900px;
  margin: 0 auto;
}

.intro-heading {
  font-size: 36px;
  font-weight: 700;
  color: #002c5f;
  margin: 0 0 20px;
  line-height: 1.3;
}

.intro-body {
  font-size: 16px;
  line-height: 1.7;
  color: #333;
  margin: 0;
}

/* Highlighted Section */
.highlighted-section {
  background: #f5f5f5;
  padding: 40px;
  text-align: center;
}

.highlighted-heading {
  font-size: 32px;
  font-weight: 700;
  color: #002c5f;
  margin: 0 0 16px;
}

.highlighted-body {
  font-size: 16px;
  line-height: 1.6;
  color: #555;
  margin: 0;
  max-width: 700px;
  margin: 0 auto;
}

/* Loading & Error States */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 40px;
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
  margin-bottom: 16px;
}

.retry-button,
.back-button {
  background: #002c5f;
  color: white;
  border: none;
  padding: 12px 32px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 4px;
  text-decoration: none;
  display: inline-block;
}

.retry-button:hover,
.back-button:hover {
  background: #004080;
}

/* Category Filter Strip - OEM Style */
.category-filter-strip {
  background: #002c5f;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-strip-inner {
  display: flex;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
}

.filter-label {
  font-size: 18px;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  padding: 16px 0;
  margin-right: 24px;
}

.category-tabs {
  display: flex;
  flex-wrap: nowrap;
  gap: 0;
  white-space: nowrap;
}

.tab-button {
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 16px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  position: relative;
  text-decoration: none;
}

.tab-button:hover {
  color: white;
}

.tab-button.active {
  color: white;
  font-weight: 600;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: #00aad2;
  border-radius: 2px 2px 0 0;
}

/* Models Grid */
.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 32px;
  padding: 40px 0;
}

/* Model Card */
.model-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}

.model-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.model-image-container {
  position: relative;
  padding-top: 56.25%; /* 16:9 aspect ratio */
  background: #f9f9f9;
  overflow: hidden;
}

.model-image {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

.model-info {
  padding: 24px;
  flex: 1;
}

.model-name {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 16px;
  color: #002c5f;
  text-transform: uppercase;
}

/* Variants List */
.variants-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.variant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.variant-item:last-child {
  border-bottom: none;
}

.variant-item.has-offer {
  background: linear-gradient(90deg, rgba(0, 44, 95, 0.03) 0%, transparent 100%);
  margin: 0 -16px;
  padding: 12px 16px;
  border-radius: 4px;
}

.variant-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.variant-name {
  font-size: 14px;
  color: #333;
}

.variant-offer-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #002c5f;
}

.variant-offer-badge .offer-code {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.variant-cta {
  background: transparent;
  border: 1px solid #002c5f;
  color: #002c5f;
  padding: 6px 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  border-radius: 4px;
}

.variant-cta:hover {
  background: #002c5f;
  color: white;
}

.variant-cta.cta-highlight {
  background: #002c5f;
  color: white;
  font-weight: 600;
}

.variant-cta.cta-highlight:hover {
  background: #001a3a;
}

/* Model Actions */
.model-actions {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px;
}

.btn-secondary {
  flex: 1;
  padding: 14px 20px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
  border-radius: 4px;
  background: white;
  color: #002c5f;
  border: 2px solid #002c5f;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f0f4f8;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 40px;
  color: #666;
  
  p {
    margin-bottom: 20px;
  }
}

/* Responsive Styles */
@media (max-width: 768px) {
  .offers-intro {
    padding: 40px 20px;
  }
  
  .intro-heading {
    font-size: 24px;
  }
  
  .intro-body {
    font-size: 14px;
  }
  
  .highlighted-section {
    padding: 30px 20px;
  }
  
  .highlighted-heading {
    font-size: 24px;
  }
  
  .filter-strip-inner {
    padding: 0 16px;
  }
  
  .filter-label {
    font-size: 16px;
    margin-right: 16px;
  }
  
  .tab-button {
    padding: 14px 12px;
    font-size: 13px;
  }
  
  .models-grid {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 20px 0;
  }
  
  .model-actions {
    flex-direction: column;
  }
  
  .model-info {
    padding: 20px;
  }
  
  .model-name {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .filter-strip-inner {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px 16px;
  }
  
  .filter-label {
    margin-right: 0;
    margin-bottom: 8px;
    padding: 0;
  }
  
  .category-tabs {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 4px;
  }
}
</style>
