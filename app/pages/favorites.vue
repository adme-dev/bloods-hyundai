<template>
  <div class="favorites-page min-h-screen bg-slate-50 text-slate-900">
    <LazyPageSchema />

    <!-- Hero / Breadcrumb -->
    <section class="favorites-header relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-[#001E50]/95 via-[#001E50]/85 to-[#001E50]/70"></div>
      <div class="relative z-10 max-w-7xl mx-auto px-4 py-6 lg:px-6 lg:py-8">
        <nav class="flex items-center gap-2 text-sm text-white/70 mb-4" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-white transition-colors">Home</NuxtLink>
          <span>›</span>
          <NuxtLink to="/car-sales" class="hover:text-white transition-colors">Cars for Sale</NuxtLink>
          <span>›</span>
          <span class="text-white">Saved Vehicles</span>
        </nav>
        
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
          Saved Vehicles
        </h1>
        <p class="text-lg text-white/80">
          {{ savedVehicles.length === 0 
            ? 'Save vehicles you like to compare them later' 
            : `You have ${savedVehicles.length} saved vehicle${savedVehicles.length !== 1 ? 's' : ''}` 
          }}
        </p>
      </div>
    </section>

    <section class="relative mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
      <!-- Loading State -->
      <div v-if="loading" class="grid gap-4 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
        <div v-for="n in 3" :key="`skeleton-${n}`" class="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="mb-3 h-40 rounded-xl bg-slate-200"></div>
          <div class="mb-2 h-4 rounded bg-slate-200"></div>
          <div class="mb-2 h-4 w-2/3 rounded bg-slate-200"></div>
          <div class="flex gap-2">
            <div class="h-6 w-16 rounded bg-slate-200"></div>
            <div class="h-6 w-20 rounded bg-slate-200"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="savedVehicles.length === 0" class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
        <div class="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <svg class="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-slate-800">No Saved Vehicles</h2>
        <p class="max-w-md text-slate-600">
          You haven't saved any vehicles yet. Browse our inventory and click the heart icon on any vehicle to save it for later.
        </p>
        <NuxtLink 
          to="/car-sales" 
          class="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Browse Vehicles
        </NuxtLink>
      </div>

      <!-- Saved Vehicles -->
      <div v-else class="space-y-6">
        <!-- Actions Bar -->
        <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div class="flex items-center gap-3 text-sm text-slate-600">
            <span class="text-base font-semibold text-slate-800">{{ savedVehicles.length }} saved vehicle{{ savedVehicles.length !== 1 ? 's' : '' }}</span>
            <span class="hidden h-4 w-px bg-slate-200 md:block"></span>
            <span class="text-xs text-slate-500">Maximum 3 vehicles</span>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="clearAllFavorites"
              class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
            </button>
            <NuxtLink
              to="/car-sales"
              class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add More
            </NuxtLink>
          </div>
        </div>

        <!-- Vehicle Grid -->
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
          <div
            v-for="vehicle in savedVehicles"
            :key="vehicle.stockid || vehicle.identifier || vehicle.id"
            class="h-full"
          >
            <ModernVehicleCard class="h-full" :vehicle="vehicle" view-mode="grid" />
          </div>
        </div>

        <!-- Comparison Table (if 2+ vehicles) -->
        <div v-if="savedVehicles.length >= 2" class="mt-8">
          <h2 class="mb-4 text-xl font-bold text-slate-900">Quick Comparison</h2>
          <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table class="w-full min-w-[600px]">
              <thead>
                <tr class="border-b border-slate-100 bg-slate-50">
                  <th class="px-4 py-3 text-left text-sm font-semibold text-slate-600">Feature</th>
                  <th
                    v-for="vehicle in savedVehicles"
                    :key="`header-${vehicle.stockid || vehicle.id}`"
                    class="px-4 py-3 text-left text-sm font-semibold text-slate-800"
                  >
                    {{ getShortTitle(vehicle) }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="field in comparisonFields" :key="field.key">
                  <td class="px-4 py-3 text-sm font-medium text-slate-600">{{ field.label }}</td>
                  <td
                    v-for="vehicle in savedVehicles"
                    :key="`${field.key}-${vehicle.stockid || vehicle.id}`"
                    class="px-4 py-3 text-sm text-slate-800"
                  >
                    {{ getFieldValue(vehicle, field.key) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- Vehicle Enquiry Modal -->
    <VehicleEnquiryModal
      :is-open="vehiclesStore.vehicleEnquiryPopUp.show"
      :vehicle="vehiclesStore.vehicleEnquiryPopUp.item"
      @close="closeEnquiryModal"
    />
  </div>
</template>

<script setup lang="ts">
import { getRuntimeTenantCacheKey } from '~/utils/tenantCacheKey';

const { siteName } = useSiteIdentity();

// SEO
useSiteMeta({
  title: 'Saved Vehicles',
  description: () => `View and compare your saved vehicles at ${siteName.value}. Save up to 3 vehicles to compare side by side.`,
});

const vehiclesStore = useVehiclesStore();
const carsalesFeedCacheKey = getRuntimeTenantCacheKey('carsales-feed-data');

// Use the same localStorage key as ModernVehicleCard
const comparisonIds = useLocalStorage<any>('comparisonVehicles', []);

const normalizeComparisonIds = (raw: any): (string | number)[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    if (raw instanceof Set) return Array.from(raw);
    const maybeValues = raw._set || Object.values(raw);
    if (Array.isArray(maybeValues)) return maybeValues as (string | number)[];
  }
  return [];
};

// SSR-only data fetching - hidden from browser network tab, 10-min server cache
const { data: carsalesFeedData, status } = await useFetch<{ vehiclesData: any[] }>('/api/carsales-feed', {
  key: carsalesFeedCacheKey,
  dedupe: 'defer',
  // Return cached data on client - prevents network request
  getCachedData: (key, nuxtApp) => {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
  },
});

// State
const loading = computed(() => status.value === 'pending');
const allVehiclesData = computed(() => carsalesFeedData.value?.vehiclesData || []);

// Computed: Get full vehicle data for saved IDs
const savedVehicles = computed(() => {
  const ids = normalizeComparisonIds(comparisonIds.value);
  return allVehiclesData.value.filter((v: any) => {
    const vehicleId = v.stockid || v.identifier || v.id;
    return ids.includes(vehicleId);
  });
});

// Comparison table fields
const comparisonFields = [
  { key: 'price', label: 'Price' },
  { key: 'year', label: 'Year' },
  { key: 'kms', label: 'Odometer' },
  { key: 'body', label: 'Body Type' },
  { key: 'transmission', label: 'Transmission' },
  { key: 'fuel', label: 'Fuel Type' },
  { key: 'drivetrain', label: 'Drive Type' },
  { key: 'colour', label: 'Colour' },
  { key: 'seats', label: 'Seats' },
];


// Helper functions
const getShortTitle = (vehicle: any) => {
  const make = vehicle.make?.displayValue?.[0] || vehicle.make?.value?.[0] || '';
  const model = vehicle.model?.displayValue?.[0] || vehicle.model?.value?.[0] || '';
  return `${make} ${model}`.trim() || 'Vehicle';
};

const getFieldValue = (vehicle: any, key: string) => {
  switch (key) {
    case 'price': {
      const price = vehicle.price;
      if (!price || price === 0) return 'POA';
      return `$${Number(price).toLocaleString()}`;
    }
    case 'year':
      return vehicle.year?.displayValue?.[0] || vehicle.year?.value?.[0] || vehicle.releaseyear || '-';
    case 'kms': {
      const kms = vehicle.kms;
      if (kms === 0) return '0 km';
      if (!kms) return '-';
      return `${Number(kms).toLocaleString()} km`;
    }
    case 'body':
      return vehicle.body?.displayValue?.[0] || vehicle.body?.value?.[0] || '-';
    case 'transmission':
      return vehicle.transmission?.displayValue?.[0] || vehicle.transmission?.value?.[0] || '-';
    case 'fuel':
      return vehicle.fuel?.displayValue?.[0] || vehicle.fuel?.value?.[0] || '-';
    case 'drivetrain':
      return vehicle.drivetrain?.displayValue?.[0] || vehicle.drivetrain?.value?.[0] || '-';
    case 'colour':
      return vehicle.colour?.displayValue?.[0] || vehicle.colour?.value?.[0] || '-';
    case 'seats':
      return vehicle.seats?.displayValue?.[0] || vehicle.seats?.value?.[0] || '-';
    default:
      return '-';
  }
};

const clearAllFavorites = () => {
  if (process.client && window.UIkit) {
    window.UIkit.modal.confirm('Are you sure you want to remove all saved vehicles?').then(
      () => {
        comparisonIds.value = [];
        window.UIkit.notification({
          message: 'All saved vehicles removed',
          status: 'success',
          pos: 'top-center',
          timeout: 2000
        });
      },
      () => {
        // Cancelled - do nothing
      }
    );
  } else {
    // Fallback without UIkit
    if (confirm('Are you sure you want to remove all saved vehicles?')) {
      comparisonIds.value = [];
    }
  }
};

// Close enquiry modal
const closeEnquiryModal = () => {
  vehiclesStore.setVehicleEnquiryPopUp(false, null);
};

</script>

<style scoped>
.favorites-header {
  background: linear-gradient(135deg, #001E50 0%, #1a4a8a 100%);
}
</style>








