<template>
  <div class="variant-slider-wrapper">
    <!-- Loading State -->
    <div v-if="loading" class="uk-text-center uk-padding-large">
      <div uk-spinner="ratio: 2"></div>
      <p class="uk-margin-small-top">Loading {{ modelTitle }} variants...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="uk-text-center uk-padding-large">
      <p class="uk-text-danger">{{ error }}</p>
      <button @click="fetchVariants" class="uk-button uk-button-primary">Retry</button>
    </div>

    <!-- Content -->
    <div v-else-if="variantGroups.length > 0">
      <div class="uk-width-1-1 uk-text-center">
        <div class="uk-h2 uk-margin-remove uk-margin-large-top">
          <span class="uk-text-bold">{{ modelTitle }} </span>
          <span class="uk-text-light">Trims</span>
        </div>
        <div class="uk-width-1-1">Discover / Enquire: {{ modelTitle }} range below.</div>
      </div>

      <div class="uk-container uk-container-xsmall uk-text-center uk-margin-small-top uk-overflow-hidden">
        <div class="uk-text-meta uk-text-uppercase uk-margin-small-bottom space33">{{ totalCount }} variants available</div>
      </div>

      <!-- Powertrain Filter -->
      <ul v-if="powertrainOptions.length > 1" class="model--Category uk-tab uk-margin-medium-bottom uk-flex uk-flex-center">
        <li v-for="(powertrain, index) in powertrainOptions" :key="index">
          <label class="uk-button uk-text-uppercase uk-text-bold">
            <input
              class="uk-checkbox"
              type="checkbox"
              :value="powertrain"
              v-model="checkedPowertrain"
            />
            <span>{{ powertrain }}</span>
          </label>
        </li>
      </ul>

      <!-- Slider -->
      <div class="model-slider uk-position-relative" uk-slider>
        <div class="uk-flex uk-flex-center uk-position-relative uk-position-z-index">
          <a class="tm-slidenav" href="#" uk-slider-item="previous">
            <span uk-icon="icon: arrow-left; ratio: 2"></span>
          </a>
          <a class="tm-slidenav" href="#" uk-slider-item="next">
            <span uk-icon="icon: arrow-right; ratio: 2"></span>
          </a>
        </div>

        <div class="uk-width-1-1 uk-height-medium uk-position-top linear-gradient"></div>

        <ul
          class="uk-slider-items uk-grid-collapse uk-child-width-1-2@s uk-child-width-1-3@m uk-child-width-1-4@l uk-child-width-1-5@xl"
          :class="[itemsCount < 5 ? 'uk-flex uk-flex-center@m' : '']"
        >
          <li
            v-for="(item, index) in filteredVariants"
            :key="item.id || index"
            class="uk-position-relative uk-padding-small"
            tabindex="0"
          >
            <div class="variant-card">
              <!-- Offer Badge -->
              <div v-if="getVariantGroupOffers(item.name).length > 0" class="variant-offer-badge">
                SPECIAL OFFER
              </div>

              <!-- Variant Image -->
              <div class="variant-image-container">
                <NuxtImg
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.name"
                  class="variant-image"
                  loading="lazy"
                  width="320"
                  height="180"
                  format="webp"
                  quality="80"
                />
                <div v-else class="variant-image-placeholder">
                  <span uk-icon="icon: image; ratio: 2"></span>
                </div>
              </div>

              <!-- Variant Info -->
              <div class="variant-info">
                <h3 class="variant-name">{{ item.name }}</h3>
                <div v-if="item.priceEnabled && item.lowestPrice" class="variant-price">
                  From ${{ formatPrice(item.lowestPrice) }} <span class="price-label">Drive Away</span>
                </div>
              </div>

              <!-- Offer Cards -->
              <div v-if="getVariantGroupOffers(item.name).length > 0" class="variant-offers">
                <div
                  v-for="offer in getVariantGroupOffers(item.name).slice(0, 2)"
                  :key="offer.offerId"
                  class="offer-item"
                >
                  <span class="offer-type-badge">{{ offer.type }}</span>
                  <div class="offer-content">
                    <span class="offer-value">{{ offer.formattedValue }}</span>
                    <span class="offer-title">{{ offer.title }}</span>
                  </div>
                </div>
              </div>

              <!-- Features List -->
              <div v-if="item.features && item.features.length > 0" class="variant-features">
                <div class="features-header">Key Features</div>
                <ul class="features-list">
                  <li
                    v-for="(feature, fIndex) in getVisibleFeatures(item.features, index)"
                    :key="fIndex"
                    v-html="getFeatureText(feature)"
                  ></li>
                </ul>
                <button
                  v-if="item.features.length > 5"
                  class="features-toggle"
                  @click="toggleFeatures(index)"
                >
                  <span :uk-icon="showAllFeatures[index] ? 'chevron-up' : 'chevron-down'"></span>
                  {{ showAllFeatures[index] ? 'Show less' : 'Show more' }}
                </button>
              </div>

              <!-- SmartSense Badge -->
              <div v-if="item.smartSenseIncluded" class="smartsense-badge">
                <span>SmartSense™ Included</span>
              </div>

              <!-- CTA Button -->
              <div class="variant-cta">
                <NuxtLink
                  :to="`/calculator/${model}`"
                  class="hyundai-btn hyundai-btn-primary"
                >
                  Enquire Today
                </NuxtLink>
              </div>
            </div>
          </li>
        </ul>

        <div class="uk-padding uk-flex uk-flex-center">
          <a class="tm-slidenav" href="#" uk-slider-item="previous">
            <span uk-icon="icon: arrow-left; ratio: 2"></span>
          </a>
          <a class="tm-slidenav" href="#" uk-slider-item="next">
            <span uk-icon="icon: arrow-right; ratio: 2"></span>
          </a>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="uk-padding uk-text-meta-xs">
        *All prices listed are driveway price including on road costs such as registration and CTP
        insurance unless specified as ECG (ex government charges) or POA (price on application).
        {{ siteName }} may change pricing at any time (this includes where there are government
        changes in regulation and/or legislation). There may be a delay to any pricing updates
        displaying correctly on our materials. Always obtain confirmation on updated pricing from
        {{ siteName }}. All prices are subject to change at the discretion of {{ siteName }}.
      </div>
    </div>

    <!-- No variants found - hidden, component simply doesn't render anything -->
    <div v-else></div>
  </div>
</template>

<script setup lang="ts">
interface Offer {
  offerId: string;
  formattedValue: string;
  title: string;
  subtitle?: string;
  type: string;
  disclaimerCitation?: string;
  priority?: number;
}

interface Variant {
  id: string;
  name: string;
  variantGroup: string;
  offerPackages?: Array<{
    offers?: Offer[];
  }>;
}

interface Props {
  model: string;
  modelTitle?: string;
  powertrainFilter?: string | null; // Optional: 'Electric', 'Hybrid', or null for all
}

const props = defineProps<Props>();
const config = useRuntimeConfig();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const variantGroups = ref<any[]>([]);
const variants = ref<Variant[]>([]);
const checkedPowertrain = ref<string[]>([]);
const showAllFeatures = ref<Record<number, boolean>>({});

// Site name from config or default
const siteName = computed(() => config.public.siteName || 'Sale Hyundai');

// Apply powertrainFilter prop to pre-filter variant groups when set
const baseFilteredVariantGroups = computed(() => {
  if (!variantGroups.value.length) return [];

  // If a powertrainFilter prop is provided, filter to only that powertrain
  if (props.powertrainFilter) {
    return variantGroups.value.filter(v => v.powertrain === props.powertrainFilter);
  }

  return variantGroups.value;
});

// Computed
const powertrainOptions = computed(() => {
  if (!baseFilteredVariantGroups.value.length) return [];
  const powertrains = [...new Set(baseFilteredVariantGroups.value.map(v => v.powertrain).filter(Boolean))];
  return powertrains;
});

const filteredVariants = computed(() => {
  // Start with base filtered groups (already filtered by powertrainFilter prop if set)
  if (checkedPowertrain.value.length === 0) return baseFilteredVariantGroups.value;
  return baseFilteredVariantGroups.value.filter(variant =>
    checkedPowertrain.value.includes(variant.powertrain)
  );
});

const itemsCount = computed(() => filteredVariants.value.length);
const totalCount = computed(() => baseFilteredVariantGroups.value.length);

// Get offers for a specific variant group by matching variants
const getVariantGroupOffers = (variantGroupName: string): Offer[] => {
  const offers: Offer[] = [];
  const seenOfferIds = new Set<string>();

  // Find all variants that belong to this variant group
  const matchingVariants = variants.value.filter(v =>
    v.variantGroup === variantGroupName || v.name === variantGroupName
  );

  // Collect all unique offers from matching variants
  matchingVariants.forEach(variant => {
    (variant.offerPackages || []).forEach(pkg => {
      (pkg.offers || []).forEach(offer => {
        if (!seenOfferIds.has(offer.offerId)) {
          seenOfferIds.add(offer.offerId);
          offers.push(offer);
        }
      });
    });
  });

  // Sort by priority
  return offers.sort((a, b) => (a.priority || 0) - (b.priority || 0));
};

// Methods
const fetchVariants = async () => {
  if (!props.model) {
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await $fetch<any>(`/api/car-calculator`, {
      params: {
        modelname: props.model,
        postcode: '3000',
        displaypowertrain: true,
      },
    });

    if (response.success) {
      variantGroups.value = response.variantGroups || [];
      variants.value = response.variants || [];
    } else {
      error.value = response.error || 'Failed to load variants';
      console.error('[VariantSlider] Error:', error.value);
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch variants';
    console.error('[VariantSlider] Fetch error:', err);
  } finally {
    loading.value = false;
  }
};

const formatPrice = (value: string | number) => {
  if (!value) return '0';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-AU').format(numValue);
};

const toggleFeatures = (index: number) => {
  showAllFeatures.value[index] = !showAllFeatures.value[index];
};

const getVisibleFeatures = (features: any[], index: number) => {
  if (showAllFeatures.value[index]) {
    return features;
  }
  return features.slice(0, 5);
};

const getFeatureText = (feature: any): string => {
  if (typeof feature === 'string') {
    return feature;
  }
  if (feature && typeof feature === 'object') {
    return feature.text || feature.name || '';
  }
  return '';
};

// Lifecycle
onMounted(() => {
  fetchVariants();
});

// Watch for model changes
watch(() => props.model, (newVal) => {
  if (newVal) {
    fetchVariants();
  }
});
</script>

<style lang="scss" scoped>
// Hyundai brand colors
$primary-blue: #002c5f;
$accent-blue: #00aad2;
$text-dark: #1a1a1a;
$text-gray: #666;
$border-color: #e5e5e5;
$bg-light: #f8f9fa;

.variant-slider-wrapper {
  background: #fff;
}

// Variant Card
.variant-card {
  position: relative;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  text-align: left;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

// Offer Badge
.variant-offer-badge {
  position: absolute;
  top: 0;
  left: 0;
  background: $accent-blue;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.35rem 0.6rem;
  letter-spacing: 0.5px;
  z-index: 10;
}

// Image
.variant-image-container {
  width: 100%;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.variant-image {
  max-width: 100%;
  max-height: 140px;
  object-fit: contain;
}

.variant-image-placeholder {
  width: 100%;
  height: 140px;
  background: $bg-light;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
}

// Info
.variant-info {
  margin-bottom: 0.75rem;
}

.variant-name {
  font-size: 1rem;
  font-weight: 700;
  color: $text-dark;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.variant-price {
  font-size: 0.95rem;
  font-weight: 700;
  color: $primary-blue;

  .price-label {
    font-weight: 400;
    font-size: 0.8rem;
    color: $text-gray;
  }
}

// Offers
.variant-offers {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: linear-gradient(135deg, rgba($accent-blue, 0.06) 0%, rgba($accent-blue, 0.02) 100%);
  border-radius: 4px;
}

.offer-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.offer-type-badge {
  background: $accent-blue;
  color: #fff;
  font-size: 0.5rem;
  font-weight: 700;
  padding: 0.2rem 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.offer-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.offer-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: $primary-blue;
  line-height: 1.2;
}

.offer-title {
  font-size: 0.65rem;
  color: $text-gray;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

// CTA Button
.variant-cta {
  margin-top: auto;
  padding-top: 0.75rem;
}

.hyundai-btn {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.85rem;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.hyundai-btn-primary {
  background: $primary-blue;
  color: #fff;

  &:hover {
    background: color.adjust($primary-blue, $lightness: -10%);
    color: #fff;
  }
}

// Features
.variant-features {
  flex: 1;
  border-top: 1px solid $border-color;
  padding-top: 0.75rem;
}

.features-header {
  font-size: 0.8rem;
  font-weight: 700;
  color: $text-dark;
  margin-bottom: 0.5rem;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    position: relative;
    padding-left: 1rem;
    font-size: 0.75rem;
    color: $text-dark;
    line-height: 1.5;
    margin-bottom: 0.25rem;

    &::before {
      content: "•";
      position: absolute;
      left: 0;
      color: $primary-blue;
      font-weight: bold;
    }
  }
}

.features-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: $primary-blue;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0;
  cursor: pointer;
  margin-top: 0.25rem;

  &:hover {
    text-decoration: underline;
  }
}

// SmartSense Badge
.smartsense-badge {
  padding-top: 0.5rem;

  span {
    display: inline-block;
    background: $primary-blue;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.3rem 0.6rem;
    border-radius: 2px;
  }
}

// Slider styles
.model-slider .uk-slider-items li {
  opacity: 1;
  transition: opacity 0.3s;
}

.model-slider .uk-slider-items li {
  cursor: pointer;
}

.model-slider .uk-slider-items li.uk-active {
  opacity: 1;
  cursor: default;
}

.model-slider .uk-slider-items li:hover:not(.uk-active) {
  opacity: 0.7;
}

.model-slider .linear-gradient {
  background: linear-gradient(
    rgba(238, 241, 245, 0) 0.42%,
    rgba(239, 242, 245, 0.827) 36.97%,
    #bfc2c4 64.29%,
    rgba(236, 239, 242, 1) 70.59%,
    hsla(0, 0%, 84.7%, 0)
  );
}

// Filter
.model--Category input[type="checkbox"] {
  display: none;
}

.model--Category :checked + span {
  color: #000;
  border-bottom: 4px solid #ed0000;
  font-weight: bold;
}

// Navigation
.tm-slidenav {
  padding: 10px;
  color: #333;

  &:hover {
    color: #000;
  }
}

// Utilities
.space33 {
  letter-spacing: 0.33em;
}

.uk-text-meta-xs {
  font-size: 0.75rem;
  color: #999;
}
</style>

