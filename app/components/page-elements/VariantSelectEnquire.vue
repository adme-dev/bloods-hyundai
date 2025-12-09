<template>
  <div id="modal-variants" class="uk-modal" uk-modal>
    <div class="uk-modal-dialog uk-modal-body uk-padding-small uk-border-rounded">
      <button class="uk-modal-close-default uk-icon-button uk-background-muted" type="button" uk-close></button>

      <h2 class="uk-h4 uk-text-bold uk-margin-remove">Enquire</h2>
      <hr class="uk-margin-small" />

      <!-- Loading State -->
      <div v-if="loading" class="uk-flex uk-flex-center uk-height-small">
        <div class="uk-margin-auto uk-margin-auto-vertical">
          <div uk-spinner></div>
        </div>
      </div>

      <!-- Variant Selection -->
      <div v-else>
        <!-- Model Toggle Section -->
        <div v-if="!showModelToggle" class="uk-margin-small">
          <p class="uk-text-secondary uk-text-small">
            Are you ready to experience your next 
            <span class="uk-text-bold">{{ formattedModel }}</span>? 
            Book a test drive with us today!
          </p>
          <a class="uk-text-bold uk-text-small" href="#" @click.prevent="showModelToggle = true">
            or Choose Another Hyundai
          </a>
        </div>

        <!-- Model Selection Grid -->
        <div v-else class="uk-margin-small">
          <button class="uk-button uk-button-primary uk-button-small" @click="showModelToggle = false">
            <span uk-icon="chevron-left"></span> Back
          </button>
          
          <div v-for="(models, category) in groupedModels" :key="category" class="uk-margin-small-top">
            <h4 class="uk-h5 uk-margin-small-bottom">{{ category }}</h4>
            <hr class="uk-margin-remove" />
            <div class="uk-grid uk-grid-small uk-child-width-1-2" uk-grid>
              <label 
                v-for="entry in models" 
                :key="entry.id"
                class="uk-text-center uk-padding-small uk-card uk-card-default uk-card-hover"
                :class="{ 'uk-card-primary': selectedModelId === entry.id }"
              >
                <img :src="entry.image" :alt="entry.title" width="120" class="uk-margin-small-bottom" />
                <div class="uk-text-bold uk-text-small">
                  <input 
                    type="radio" 
                    :value="entry.slug" 
                    class="uk-hidden"
                    @change="selectModel(entry)"
                  />
                  {{ entry.title }}
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Variant Dropdown -->
        <div v-if="!showModelToggle && variants.length" class="uk-margin-small">
          <label class="uk-text-bold uk-text-secondary uk-text-small">
            Select your {{ formattedModel }}:
          </label>
          <select v-model="selectedVariant" class="uk-select uk-form-large uk-margin-small-top uk-border-rounded">
            <option value="">Select Variant</option>
            <option v-for="variant in variants" :key="variant.id" :value="variant.id">
              {{ variant.name }}
            </option>
          </select>
        </div>

        <!-- Variant Details Card -->
        <div v-if="selectedVariantDetails" class="uk-card uk-card-default uk-card-body uk-card-small uk-margin-small-top">
          <div class="uk-grid uk-grid-small" uk-grid>
            <div class="uk-width-1-3">
              <img 
                :src="selectedVariantDetails.image || selectedVariantDetails.thumbnail"
                :alt="selectedVariantDetails.name"
                class="uk-width-1-1"
              />
            </div>
            <div class="uk-width-2-3">
              <h4 class="uk-h5 uk-margin-remove">{{ selectedVariantDetails.name }}</h4>
              <p v-if="selectedVariantDetails.price" class="uk-h4 uk-text-primary uk-margin-small-top uk-margin-remove-bottom">
                ${{ selectedVariantDetails.price.toLocaleString() }}
              </p>
              <p class="uk-text-meta">{{ selectedVariantDetails.driveType || selectedVariantDetails.transmission }}</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="uk-margin-top uk-grid uk-grid-small uk-child-width-1-2" uk-grid>
          <div>
            <NuxtLink 
              :to="`/test-drive?model=${itemModel}`"
              class="uk-button uk-button-default uk-width-1-1"
            >
              Test Drive
            </NuxtLink>
          </div>
          <div>
            <NuxtLink 
              :to="`/variant/${itemModel}`"
              class="uk-button uk-button-primary uk-width-1-1"
            >
              Enquire
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  itemModel: string;
}

const props = defineProps<Props>();
const mainStore = useMainStore();

// State
const loading = ref(true);
const showModelToggle = ref(false);
const selectedModelId = ref<string | null>(null);
const selectedVariant = ref('');
const variants = ref<any[]>([]);
const range = ref<any>({});

// Computed
const formattedModel = computed(() => {
  return props.itemModel?.replace(/-/g, ' ') || '';
});

const groupedModels = computed(() => {
  const models = mainStore.models || [];
  return models.reduce((acc: Record<string, any[]>, model: any) => {
    const category = model.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(model);
    return acc;
  }, {});
});

const selectedVariantDetails = computed(() => {
  if (!selectedVariant.value) return null;
  return variants.value.find((v) => v.id === selectedVariant.value);
});

// Methods
const selectModel = (model: any) => {
  selectedModelId.value = model.id;
  fetchVariants(model.slug);
  showModelToggle.value = false;
};

const fetchVariants = async (modelSlug?: string) => {
  const model = modelSlug || props.itemModel;
  if (!model) return;
  
  loading.value = true;
  
  try {
    const response = await $fetch<any>(`/api/car-calculator`, {
      params: {
        modelname: model,
        postcode: '3000',
      },
    });
    
    // Prefer variants array as it has more detail
    if (response.variants && response.variants.length > 0) {
      variants.value = response.variants.map((v: any) => ({
        ...v,
        image: v.colours?.[0]?.image || null,
        thumbnail: v.colours?.[0]?.image || null,
        transmission: v.transmissionType,
      }));
    } else if (response.variantGroups && response.variantGroups.length > 0) {
      // Fallback to variantGroups if no variants
      variants.value = response.variantGroups.map((g: any) => ({
        id: g.id,
        name: g.name,
        image: g.image,
        thumbnail: g.image,
        price: parseFloat(g.lowestPrice) || 0,
        transmission: g.powertrain,
      }));
    }
  } catch (err) {
    console.error('Failed to fetch variants:', err);
    variants.value = [];
  } finally {
    loading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  fetchVariants();
});

watch(() => props.itemModel, () => {
  fetchVariants();
});
</script>

<style scoped>
.uk-card-hover:hover {
  cursor: pointer;
}
</style>
