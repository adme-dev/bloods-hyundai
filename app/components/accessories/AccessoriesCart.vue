<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Cart Sidebar -->
    <Transition name="slide-right">
      <div
        v-if="show"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900">Your Cart</h2>
              <p class="text-sm text-slate-500">{{ itemCount }} item{{ itemCount !== 1 ? 's' : '' }}</p>
            </div>
          </div>
          <button
            class="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            @click="$emit('close')"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Cart Items -->
        <div class="flex-1 overflow-y-auto">
          <!-- Empty State -->
          <div v-if="items.length === 0" class="flex flex-col items-center justify-center gap-4 px-8 py-16 text-center">
            <div class="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <svg class="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Your cart is empty</h3>
              <p class="mt-1 text-sm text-slate-500">Browse accessories and add items to your cart</p>
            </div>
            <button
              class="mt-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              @click="$emit('close')"
            >
              Continue Shopping
            </button>
          </div>

          <!-- Items List -->
          <div v-else class="divide-y divide-slate-100 px-4">
            <div
              v-for="item in items"
              :key="item.accessory.id"
              class="flex gap-4 py-4"
            >
              <!-- Image -->
              <div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <img
                  v-if="item.accessory.image || item.accessory.thumbnail"
                  :src="item.accessory.image || item.accessory.thumbnail"
                  :alt="item.accessory.name"
                  class="h-full w-full object-contain p-2"
                >
                <div v-else class="flex h-full w-full items-center justify-center">
                  <svg class="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <!-- Details -->
              <div class="flex flex-1 flex-col">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <span 
                          v-if="item.type === 'pack'" 
                          class="mb-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700"
                        >
                          Value Pack
                        </span>
                        <h4 class="line-clamp-2 text-sm font-semibold text-slate-900">
                          {{ item.accessory.name }}
                        </h4>
                      </div>
                    </div>
                  </div>
                  <button
                    class="flex-shrink-0 p-1 text-slate-400 transition-colors hover:text-red-500"
                    title="Remove from cart"
                    @click="$emit('remove', item.accessory.id)"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div class="mt-auto flex items-end justify-between">
                  <!-- Quantity Controls -->
                  <div class="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50">
                    <button
                      class="flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50"
                      :disabled="item.quantity <= 1"
                      @click="$emit('update-quantity', item.accessory.id, item.quantity - 1)"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
                      </svg>
                    </button>
                    <span class="w-8 text-center text-sm font-semibold text-slate-700">
                      {{ item.quantity }}
                    </span>
                    <button
                      class="flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:text-slate-700"
                      @click="$emit('update-quantity', item.accessory.id, item.quantity + 1)"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>

                  <!-- Price -->
                  <div class="text-right">
                    <div class="text-base font-bold text-slate-900">
                      ${{ formatPrice(item.accessory.price * item.quantity) }}
                    </div>
                    <div v-if="item.quantity > 1" class="text-xs text-slate-400">
                      ${{ formatPrice(item.accessory.price) }} each
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="items.length > 0" class="border-t border-slate-200 bg-slate-50 px-4 py-4">
          <!-- Selected Model -->
          <div v-if="selectedModel" class="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm">
            <svg class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-blue-700">Accessories for <strong>Hyundai {{ selectedModel.name }}</strong></span>
          </div>

          <!-- Totals -->
          <div class="mb-4 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-slate-600">Subtotal ({{ itemCount }} items)</span>
              <span class="font-semibold text-slate-900">${{ formatPrice(total) }}</span>
            </div>
            <div class="flex justify-between text-xs text-slate-500">
              <span>Inc. GST & estimated fitment</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="space-y-2">
            <button
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
              @click="$emit('enquire')"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Enquire About Accessories
            </button>
            <button
              class="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              @click="$emit('clear')"
            >
              Clear Cart
            </button>
          </div>

          <!-- Disclaimer -->
          <p class="mt-3 text-center text-[10px] text-slate-400">
            *Prices include GST and estimated fitment. Final pricing confirmed at dealership.
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { CartItem, HyundaiModel } from '~/stores/accessories';

interface Props {
  show: boolean;
  items: CartItem[];
  total: number;
  selectedModel?: HyundaiModel | null;
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'close'): void;
  (e: 'remove', accessoryId: string): void;
  (e: 'update-quantity', accessoryId: string, quantity: number): void;
  (e: 'clear'): void;
  (e: 'enquire'): void;
}>();

const itemCount = computed(() => {
  return props.items.reduce((count, item) => count + item.quantity, 0);
});

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

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
</style>

