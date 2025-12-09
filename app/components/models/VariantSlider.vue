<template>
  <div class="uk-background-default">
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
          <span class="uk-text-bold"><span class="uk-text-capitalize">{{ modelTitle }}</span> </span>
          <span class="uk-text-light">trims</span>
        </div>
        <div class="uk-width-1-1">Discover / Enquire: <span class="uk-text-capitalize">{{ modelTitle }}</span> range below.</div>
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
            <div class="uk-link-heading">
              <div class="uk-pane">
                <!-- Variant Image -->
                <div class="uk-text-center uk-margin-bottom">
                  <img 
                    v-if="item.image" 
                    :src="item.image" 
                    :alt="item.name" 
                    class="uk-width-1-1"
                    style="max-height: 200px; object-fit: contain;"
                    loading="lazy"
                  />
                  <div v-else class="uk-background-muted uk-width-1-1 uk-flex uk-flex-center uk-flex-middle" style="height: 200px;">
                    <span uk-icon="icon: image; ratio: 2" class="uk-text-muted"></span>
                  </div>
                  <div class="uk-h4 uk-text-bold uk-margin-small-top">{{ item.name }}</div>
                  <div v-if="item.priceEnabled && item.lowestPrice" class="uk-text-primary uk-text-bold">
                    From ${{ formatPrice(item.lowestPrice) }} Drive Away
                  </div>
                </div>

                <div class="uk-width-1-1">
                  <div class="uk-padding-small uk-padding-remove-top uk-text-center">
                    <NuxtLink
                      :to="`/calculator/${model}`"
                      class="uk-button uk-button-default uk-button-border uk-text-primary border-radius-50 uk-width-auto uk-margin-small-top"
                    >
                      <strong>Enquire</strong> Today
                    </NuxtLink>
                  </div>

                  <!-- Features List -->
                  <div v-if="item.features && item.features.length > 0" class="uk-padding-small">
                    <div class="uk-text-bold">Key Features</div>
                    <hr class="uk-margin-small">
                    <ul class="uk-list uk-list-bullet uk-text-small">
                      <li 
                        v-for="(feature, fIndex) in getVisibleFeatures(item.features, index)" 
                        :key="fIndex" 
                        v-html="getFeatureText(feature)"
                      ></li>
                    </ul>
                    <button
                      v-if="item.features.length > 5"
                      class="uk-button uk-button-link uk-margin-small-bottom"
                      @click="toggleFeatures(index)"
                    >
                      <span :uk-icon="showAllFeatures[index] ? 'chevron-up' : 'chevron-down'"></span>
                      {{ showAllFeatures[index] ? 'SHOW LESS' : 'SHOW MORE' }}
                    </button>
                  </div>

                  <!-- SmartSense Badge -->
                  <div v-if="item.smartSenseIncluded" class="uk-text-center uk-margin-small">
                    <span class="uk-badge uk-background-primary">SmartSense™ Included</span>
                  </div>
                </div>
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

    <!-- No variants found -->
    <div v-else class="uk-text-center uk-padding-large">
      <p class="uk-text-muted">No variants available for {{ modelTitle }}.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  model: string;
  modelTitle?: string;
}

const props = defineProps<Props>();
const config = useRuntimeConfig();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const variantGroups = ref<any[]>([]);
const checkedPowertrain = ref<string[]>([]);
const showAllFeatures = ref<Record<number, boolean>>({});

// Site name from config or default
const siteName = computed(() => config.public.siteName || 'Sale Hyundai');

// Computed
const powertrainOptions = computed(() => {
  if (!variantGroups.value.length) return [];
  const powertrains = [...new Set(variantGroups.value.map(v => v.powertrain).filter(Boolean))];
  return powertrains;
});

const filteredVariants = computed(() => {
  if (checkedPowertrain.value.length === 0) return variantGroups.value;
  return variantGroups.value.filter(variant => 
    checkedPowertrain.value.includes(variant.powertrain)
  );
});

const itemsCount = computed(() => filteredVariants.value.length);
const totalCount = computed(() => variantGroups.value.length);

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

<style lang="css" scoped>
.uk-button-border {
  border: 2px solid rgb(0, 30, 80);
}

.border-radius-50 {
  border-radius: 50px;
}

.rotate-svg {
  display: none;
}

.model-slider .uk-slider-items li {
  opacity: 1;
  transition: opacity 0.3s;
  -webkit-transition: opacity 0.3s;
}

.counter-top-center,
.model-slider-action {
  opacity: 0;
  transition: opacity 1.9s;
  -webkit-transition: opacity 1.9s;
}

.model-slider .uk-slider-items li {
  cursor: pointer;
}

.model-slider .uk-slider-items li.uk-active,
.model-slider .uk-slider-items li.uk-active .counter-top-center,
.model-slider .uk-slider-items li.uk-active .model-slider-action {
  opacity: 1;
  cursor: default;
}

.model-slider .uk-slider-items li:hover:not(.uk-active) {
  opacity: 0.4;
}

.sl-position-bottom-nav {
  position: absolute;
  bottom: 55%;
  left: 0;
  right: 0;
  z-index: 0;
}

@media (max-width: 960px) {
  .model_image_lg {
    margin-bottom: -220px;
  }
}

.model--Category input[type="checkbox"] {
  display: none;
}

.model--Category :checked + span {
  color: #000;
  border-bottom: 4px solid #ed0000;
  font-weight: bold;
}

.model-slider-left,
.model-slider-right {
  margin-top: -30px;
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

.uk-list-bullet li {
  color: #000;
}

.uk-text-meta-xs {
  font-size: 0.75rem;
  color: #999;
}

.tm-slidenav {
  padding: 10px;
  color: #333;
}

.tm-slidenav:hover {
  color: #000;
}

.space33 {
  letter-spacing: 0.33em;
}
</style>
