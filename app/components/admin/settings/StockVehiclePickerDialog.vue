<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="flex max-h-[85vh] flex-col sm:max-w-5xl">
      <DialogHeader>
        <DialogTitle>Pick a vehicle from stock</DialogTitle>
        <DialogDescription>Live stock from your feed. Click a car to use it for this offer.</DialogDescription>
      </DialogHeader>

      <Input
        v-model="search"
        placeholder="Search by stock number, make or model…"
        aria-label="Search stock"
      />

      <div class="min-h-0 flex-1 overflow-y-auto pr-1">
        <div v-if="!vehicles.length" class="py-12 text-center text-sm text-muted-foreground">
          Loading stock…
        </div>
        <div v-else-if="!filteredVehicles.length" class="py-12 text-center text-sm text-muted-foreground">
          No vehicles match "{{ search }}".
        </div>
        <div v-else class="grid items-stretch gap-4 py-1 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="option in filteredVehicles"
            :key="option.stockNumber"
            type="button"
            class="group relative rounded-2xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :aria-label="`Select ${option.title}, stock number ${option.stockNumber}`"
            @click="pick(option)"
          >
            <!-- The real car-sales card, rendered inert so all clicks select the vehicle -->
            <div class="pointer-events-none h-full">
              <ModernVehicleCard :vehicle="option.vehicle" disable-link />
            </div>
            <span
              class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 opacity-0 ring-blue-500 transition-all group-hover:bg-black/25 group-hover:opacity-100 group-hover:ring-2"
            >
              <span class="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-lg">
                Select this car
              </span>
            </span>
          </button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import ModernVehicleCard from '~/components/search/ModernVehicleCard.vue';
import { Input } from '~/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';

export interface StockPickerOption {
  stockNumber: string;
  title: string;
  priceDisplay: string;
  image: string;
  vehicle: any;
}

const props = defineProps<{
  open: boolean;
  vehicles: StockPickerOption[];
}>();

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void;
  (event: 'select', option: StockPickerOption): void;
}>();

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const search = ref('');

const filteredVehicles = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return props.vehicles;
  return props.vehicles.filter((option) =>
    option.stockNumber.toLowerCase().includes(term)
    || option.title.toLowerCase().includes(term),
  );
});

function pick(option: StockPickerOption) {
  emit('select', option);
  isOpen.value = false;
  search.value = '';
}
</script>
