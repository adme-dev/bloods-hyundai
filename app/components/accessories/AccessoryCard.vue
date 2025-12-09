<template>
  <article
    class="group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-primary/50"
  >
    <!-- Popular Badge -->
    <div v-if="accessory.isPopular" class="absolute top-3 left-3 z-10">
      <span class="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Popular
      </span>
    </div>

    <!-- Image -->
    <div 
      class="relative aspect-[16/10] w-full cursor-pointer overflow-hidden bg-slate-50"
      @click="$emit('view-details', accessory)"
    >
      <img
        v-if="accessory.image || accessory.thumbnail"
        :src="accessory.image || accessory.thumbnail"
        :alt="accessory.name"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      >
      <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
        <svg class="h-20 w-20 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>

    <!-- Content -->
    <div class="flex flex-1 flex-col p-4">
      <!-- Category -->
      <span class="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        {{ accessory.categoryName || accessory.category }}
      </span>

      <!-- Name -->
      <h3 
        class="mb-2 line-clamp-2 cursor-pointer text-lg font-bold leading-snug text-slate-900 transition-colors hover:text-primary"
        @click="$emit('view-details', accessory)"
      >
        {{ accessory.name }}
      </h3>

      <!-- Description (truncated) -->
      <p v-if="accessory.description" class="mb-3 line-clamp-2 text-sm text-slate-600">
        {{ accessory.description }}
      </p>

      <!-- Fitted Badge -->
      <div v-if="accessory.isFitted" class="mb-3">
        <span class="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Includes Fitment
        </span>
      </div>

      <!-- Price & Action -->
      <div class="mt-auto flex items-end justify-between gap-2">
        <div>
          <div class="text-2xl font-bold text-primary">
            ${{ formatPrice(accessory.price) }}
          </div>
          <div class="text-xs text-slate-500">Price Inc. GST*</div>
        </div>

        <!-- Add to Cart Button -->
        <button
          v-if="!isInCart"
          class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
          title="Add to cart"
          @click="$emit('add-to-cart', accessory)"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          v-else
          class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white shadow-sm transition-all hover:bg-green-600 active:scale-95"
          title="In cart"
          @click="$emit('view-cart')"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Accessory } from '~/stores/accessories';

interface Props {
  accessory: Accessory;
  isInCart?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isInCart: false,
});

defineEmits<{
  (e: 'add-to-cart', accessory: Accessory): void;
  (e: 'view-details', accessory: Accessory): void;
  (e: 'view-cart'): void;
}>();

const formatPrice = (price: number) => {
  return price.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
</script>

