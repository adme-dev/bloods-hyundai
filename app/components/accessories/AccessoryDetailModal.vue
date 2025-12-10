<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Modal -->
    <Transition name="zoom">
      <div
        v-if="show && accessory"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 lg:items-center lg:p-10"
      >
        <div
          class="relative my-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl lg:max-h-[90vh]"
          @click.stop
        >
          <!-- Close Button -->
          <button
            class="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-slate-700 hover:shadow-md"
            @click="$emit('close')"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="flex flex-col lg:flex-row lg:overflow-hidden">
            <!-- Image Section -->
            <div class="relative flex-shrink-0 overflow-hidden bg-slate-50 lg:w-1/2 lg:overflow-y-auto">
              <!-- Badges -->
              <div class="absolute left-2 top-2 z-10 flex flex-wrap gap-2 sm:left-4 sm:top-4">
                <span 
                  v-if="accessory.isPopular"
                  class="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                >
                  <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Popular
                </span>
                <span 
                  v-if="accessory.isFitted"
                  class="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Inc. Fitment
                </span>
                <span 
                  v-if="accessory.savingsAmount && accessory.savingsAmount > 0"
                  class="inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                >
                  Save ${{ formatPrice(accessory.savingsAmount) }}
                </span>
              </div>

              <!-- Image Gallery -->
              <div class="flex flex-col">
                <!-- Main Image -->
                <div class="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-white lg:aspect-auto lg:h-96">
                  <img
                    v-if="currentImage"
                    :src="currentImage"
                    :alt="accessory.name"
                    class="h-full w-full object-contain p-4"
                  >
                  <div v-else class="flex flex-col items-center gap-2 text-slate-300">
                    <svg class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-sm">No image available</span>
                  </div>
                </div>

                <!-- Thumbnail Gallery (if multiple images) -->
                <div v-if="allImages.length > 1" class="flex gap-2 overflow-x-auto border-t border-slate-200 bg-white px-2 py-2 sm:px-4 sm:py-3">
                  <button
                    v-for="(img, index) in allImages"
                    :key="index"
                    class="flex-shrink-0 overflow-hidden rounded border-2 transition-all"
                    :class="[
                      currentImage === img 
                        ? 'border-primary' 
                        : 'border-transparent hover:border-slate-300'
                    ]"
                    @click="currentImage = img"
                  >
                    <img
                      :src="img"
                      :alt="`${accessory.name} - Image ${index + 1}`"
                      class="h-16 w-16 object-cover sm:h-20 sm:w-20 lg:h-20 lg:w-20"
                    >
                  </button>
                </div>
              </div>
            </div>

            <!-- Content Section -->
            <div class="flex flex-1 flex-col p-6 lg:overflow-y-auto lg:p-8">
              <!-- Category -->
              <span class="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {{ accessory.categoryName || accessory.category }}
              </span>

              <!-- Name -->
              <h2 class="mb-2 text-2xl font-bold text-slate-900 lg:text-3xl">
                {{ accessory.name }}
              </h2>

              <!-- Part Number -->
              <p v-if="accessory.partNumber" class="mb-4 text-sm text-slate-400">
                Part Number: {{ accessory.partNumber }}
              </p>

              <!-- Price -->
              <div class="mb-6 rounded-xl bg-slate-50 p-4">
                <div class="flex items-end gap-3">
                  <span class="text-3xl font-bold text-slate-900">
                    ${{ formatPrice(accessory.price) }}
                  </span>
                  <!-- Only show RRP if it's higher than the sale price (indicates a discount) -->
                  <span v-if="accessory.rrp && accessory.rrp > accessory.price" class="text-lg text-slate-400 line-through">
                    ${{ formatPrice(accessory.rrp) }}
                  </span>
                </div>
                <p class="mt-1 text-xs text-slate-500">Price includes GST and fitment.</p>
                <p v-if="accessory.savingsAmount && accessory.savingsAmount > 0" class="mt-1 text-sm font-semibold text-green-600">
                  Pack savings: ${{ formatPrice(accessory.savingsAmount) }}
                </p>
              </div>

              <!-- Description -->
              <div v-if="accessory.description" class="mb-6">
                <h3 class="mb-2 text-sm font-semibold text-slate-700">Description</h3>
                <p class="text-sm leading-relaxed text-slate-600">
                  {{ accessory.description }}
                </p>
              </div>

              <!-- Included Accessories (for packs) -->
              <div v-if="'includedAccessories' in accessory && accessory.includedAccessories?.length" class="mb-6">
                <h3 class="mb-2 text-sm font-semibold text-slate-700">Accessories include:</h3>
                <ul class="space-y-2">
                  <li 
                    v-for="(item, index) in sortedIncludedAccessories" 
                    :key="index"
                    class="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <span>
                      {{ item.name }}
                      {{ item.citation ? ` [${item.citation}]` : '' }}
                    </span>
                  </li>
                </ul>
              </div>

              <!-- Features -->
              <div v-if="accessory.features?.length" class="mb-6">
                <h3 class="mb-2 text-sm font-semibold text-slate-700">Features</h3>
                <ul class="space-y-2">
                  <li 
                    v-for="(feature, index) in accessory.features" 
                    :key="index"
                    class="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    {{ feature }}
                  </li>
                </ul>
              </div>

              <!-- Spacer -->
              <div class="flex-1"></div>

              <!-- Actions -->
              <div class="flex gap-3">
                <button
                  v-if="!isInCart"
                  class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
                  @click="$emit('add-to-cart', accessory)"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </button>
                <button
                  v-else
                  class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 py-3.5 text-base font-semibold text-white"
                  @click="$emit('view-cart')"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  View in Cart
                </button>
                <button
                  class="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                  @click="$emit('close')"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Disclaimer -->
              <p v-if="accessory.disclaimer" class="mt-4 text-[10px] text-slate-400">
                {{ accessory.disclaimer }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Accessory } from '~/stores/accessories';
import { useAccessoriesStore } from '~/stores/accessories';

interface Props {
  show: boolean;
  accessory: Accessory | null;
  isInCart?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isInCart: false,
});

defineEmits<{
  (e: 'close'): void;
  (e: 'add-to-cart', accessory: Accessory): void;
  (e: 'view-cart'): void;
}>();

const accessoriesStore = useAccessoriesStore();

// Image gallery management
const currentImage = ref<string | null>(null);

const allImages = computed(() => {
  if (!props.accessory) return [];
  
  const images: string[] = [];
  
  // Add main image
  if (props.accessory.image) images.push(props.accessory.image);
  
  // Add additional images for packs
  if ('imageHero' in props.accessory && props.accessory.imageHero) {
    images.push(props.accessory.imageHero);
  }
  if ('imageCloseUp1' in props.accessory && props.accessory.imageCloseUp1) {
    images.push(props.accessory.imageCloseUp1);
  }
  if ('imageCloseUp2' in props.accessory && props.accessory.imageCloseUp2) {
    images.push(props.accessory.imageCloseUp2);
  }
  
  // Add thumbnail if different from main image
  if (props.accessory.thumbnail && props.accessory.thumbnail !== props.accessory.image) {
    images.push(props.accessory.thumbnail);
  }
  
  return images;
});

// Get full accessory details for included items in packs
const sortedIncludedAccessories = computed(() => {
  if (!props.accessory || !('includedAccessories' in props.accessory)) return [];
  
  const items = props.accessory.includedAccessories?.map(item => {
    const fullAccessory = accessoriesStore.getAccessoryById(item.id);
    return {
      name: fullAccessory?.name || 'Unknown accessory',
      citation: item.citation,
      quantity: item.quantity,
      order: item.order || 999,
    };
  }) || [];
  
  // Sort by order field
  return items.sort((a, b) => a.order - b.order);
});

// Set initial image when accessory changes
watch(() => props.accessory, (newAccessory) => {
  if (newAccessory && allImages.value.length > 0) {
    currentImage.value = allImages.value[0];
  }
}, { immediate: true });

const formatPrice = (price: number) => {
  return price.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.zoom-enter-active,
.zoom-leave-active {
  transition: all 0.3s ease;
}

.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>


