<template>
  <article
    class="group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm transition-all hover:shadow-lg hover:border-amber-400"
  >
    <!-- Value Pack Badge -->
    <div class="absolute top-3 left-3 z-10">
      <span class="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clip-rule="evenodd" />
        </svg>
        Value Pack
      </span>
    </div>

    <!-- Savings Badge -->
    <div v-if="pack.savingsAmount > 0" class="absolute top-3 right-3 z-10">
      <span class="inline-flex items-center rounded-full bg-green-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
        Save ${{ formatPrice(pack.savingsAmount) }}
      </span>
    </div>

    <!-- Image -->
    <div 
      class="relative aspect-[16/10] w-full cursor-pointer overflow-hidden bg-slate-50"
      @click="$emit('view-details', pack)"
    >
      <img
        v-if="pack.image"
        :src="pack.image"
        :alt="pack.name"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      >
      <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-amber-50">
        <svg class="h-20 w-20 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>

    <!-- Content -->
    <div class="flex flex-1 flex-col p-4">
      <!-- Name -->
      <h3 
        class="mb-2 line-clamp-2 cursor-pointer text-lg font-bold leading-snug text-slate-900 transition-colors hover:text-amber-600"
        @click="$emit('view-details', pack)"
      >
        {{ pack.title || pack.name }}
      </h3>

      <!-- Description -->
      <p v-if="pack.description" class="mb-3 line-clamp-2 text-sm text-slate-600">
        {{ pack.description }}
      </p>

      <!-- Included Items Count -->
      <div v-if="pack.includedAccessories?.length" class="mb-3">
        <span class="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-800">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {{ pack.includedAccessories.length }} items included
        </span>
      </div>

      <!-- Price -->
      <div class="mt-auto flex items-end justify-between gap-2">
        <div>
          <div class="text-2xl font-bold text-amber-600">
            ${{ formatPrice(pack.price) }}
          </div>
          <div class="text-xs text-slate-500">Pack Price Inc. GST*</div>
        </div>

        <!-- Add to Cart Button -->
        <button
          v-if="!isInCart"
          class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm transition-all hover:bg-amber-600 hover:shadow-md active:scale-95"
          title="Add pack to cart"
          @click="$emit('add-to-cart', pack)"
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
import type { AccessoryPack } from '~/stores/accessories';

interface Props {
  pack: AccessoryPack;
  isInCart?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isInCart: false,
});

defineEmits<{
  (e: 'add-to-cart', pack: AccessoryPack): void;
  (e: 'view-details', pack: AccessoryPack): void;
  (e: 'view-cart'): void;
}>();

const formatPrice = (price: number) => {
  return price.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
</script>



