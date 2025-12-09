<template>
  <article
    class="group flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg md:flex-row"
  >
    <!-- Vehicle Image Section -->
    <div class="relative w-full flex-shrink-0 flex flex-col md:w-80">
      <!-- Main Image -->
      <NuxtLink :to="vehicleLink" class="block relative">
        <div class="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            v-if="displayImage"
            :src="displayImage"
            :alt="vehicleTitle"
            class="h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
          >
          <div v-else class="flex h-full items-center justify-center">
            <span class="text-lg font-semibold uppercase tracking-[0.3em] text-slate-400">
              {{ vehicleMake }}
            </span>
          </div>
        </div>

        <!-- Photo Count Badge -->
        <div v-if="photoCount > 0" class="absolute bottom-3 left-3 z-10">
          <span class="inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ photoCount }}
          </span>
        </div>
      </NuxtLink>

      <!-- Thumbnail Gallery Strip - Hidden on mobile -->
      <div v-if="allThumbnails.length > 1" class="hidden gap-1 p-1.5 bg-slate-100 md:flex">
        <div
          v-for="(thumb, index) in displayThumbnails"
          :key="index"
          class="flex-1 h-14 overflow-hidden rounded-md cursor-pointer border-2 transition-all"
          :class="selectedImageIndex === index ? 'border-primary ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'"
          @click.prevent="selectImage(index)"
        >
          <img
            :src="thumb"
            :alt="`${vehicleTitle} thumbnail ${index + 1}`"
            class="h-full w-full object-cover transition-opacity"
            :class="selectedImageIndex === index ? 'opacity-100' : 'opacity-70 hover:opacity-100'"
          >
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="flex flex-1 flex-col p-4 md:p-5">
      <!-- Top Section: Condition & Title -->
      <div class="mb-2 md:mb-3">
        <span v-if="conditionDisplay" class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {{ conditionDisplay }}
        </span>
        <h3 class="mt-1 text-lg font-bold text-slate-900 md:text-xl">
          <NuxtLink :to="vehicleLink" class="hover:text-primary transition-colors">
            {{ vehicleYear }} {{ shortTitle }}
          </NuxtLink>
        </h3>
        <p class="mt-0.5 text-sm text-slate-500 line-clamp-1">{{ fullTitle }}</p>
      </div>

      <!-- Price Section - Mobile Only -->
      <div class="mb-3 flex items-start justify-between md:hidden">
        <div>
          <div class="text-2xl font-bold text-slate-900">{{ priceDisplay }}<span v-if="priceDisplay !== 'POA'" class="text-sm font-normal text-slate-400">*</span></div>
          <div v-if="priceDisplay !== 'POA'" class="text-xs text-slate-400 uppercase tracking-wide">Drive away</div>
        </div>
        <div v-if="perWeekDisplay" class="text-right">
          <div class="text-base font-bold text-slate-900">{{ perWeekDisplay }}<span class="text-xs font-medium text-slate-400">p/w</span></div>
          <div class="text-[10px] text-slate-400">Est. repayments</div>
        </div>
      </div>

      <!-- Specifications Grid -->
      <div class="flex-1">
        <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-slate-600 md:gap-x-6 md:gap-y-2">
          <div v-if="bodySeatsDisplay" class="flex items-center gap-2">
            <span class="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300"></span>
            <span class="truncate">{{ bodySeatsDisplay }}</span>
          </div>
          <div v-if="fuelDisplay" class="flex items-center gap-2">
            <span class="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300"></span>
            <span class="truncate">{{ fuelDisplay }}</span>
          </div>
          <div v-if="transmissionDisplay" class="flex items-center gap-2">
            <span class="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300"></span>
            <span class="truncate">{{ transmissionDisplay }}</span>
          </div>
          <div v-if="registrationDisplay" class="flex items-center gap-2">
            <span class="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300"></span>
            <span class="truncate">{{ registrationDisplay }}</span>
          </div>
          <div v-if="drivetrainDisplay" class="flex items-center gap-2">
            <span class="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300"></span>
            <span class="truncate">{{ drivetrainDisplay }}</span>
          </div>
          <div v-if="kmsDisplay" class="flex items-center gap-2">
            <span class="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300"></span>
            <span class="truncate">{{ kmsDisplay }}</span>
          </div>
        </div>
      </div>

      <!-- Bottom Action Row -->
      <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 md:mt-4 md:gap-3 md:pt-4">
        <button
          class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 md:px-4"
          :class="isInComparison ? 'text-red-500 border-red-200' : ''"
          @click.stop.prevent="toggleCompare"
        >
          <svg 
            class="h-4 w-4" 
            :fill="isInComparison ? 'currentColor' : 'none'" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            stroke-width="1.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span class="hidden sm:inline">Save</span>
        </button>
        <button
          class="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-slate-800 bg-slate-800 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-slate-700 sm:flex-none md:px-4"
          @click="openEnquire"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Enquire
        </button>
        <NuxtLink
          :to="vehicleLink"
          class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-3 py-2 text-sm font-medium text-white transition-all hover:bg-primary/90 sm:flex-none md:px-4"
        >
          <span class="hidden md:inline">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          View Details
        </NuxtLink>
      </div>
    </div>

    <!-- Price Section - Desktop Only -->
    <div class="hidden flex-col items-end justify-between border-l border-slate-100 p-5 bg-slate-50/50 md:flex">
      <div class="text-right">
        <div class="text-2xl font-bold text-slate-900">{{ priceDisplay }}<span v-if="priceDisplay !== 'POA'" class="text-sm font-normal text-slate-400">*</span></div>
        <div v-if="priceDisplay !== 'POA'" class="text-xs text-slate-400 uppercase tracking-wide">Drive away</div>
      </div>
      <div v-if="perWeekDisplay" class="text-right">
        <div class="text-base font-bold text-slate-900">{{ perWeekDisplay }}<span class="text-xs font-medium text-slate-400">p/w</span></div>
        <div class="text-[10px] text-slate-400">Est. repayments</div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
interface Props {
  vehicle: any;
}

const props = defineProps<Props>();

const vehiclesStore = useVehiclesStore();

// Comparison state using array persistence to avoid Set serialization issues
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

const comparisonSet = computed(() => new Set(normalizeComparisonIds(comparisonIds.value)));
const isInComparison = computed(() => {
  const vehicleId = props.vehicle.stockid || props.vehicle.identifier || props.vehicle.id;
  return comparisonSet.value.has(vehicleId);
});

const toggleCompare = () => {
  const vehicleId = props.vehicle.stockid || props.vehicle.identifier || props.vehicle.id;
  if (!vehicleId) return;

  const ids = comparisonSet.value;
  if (ids.has(vehicleId)) {
    comparisonIds.value = normalizeComparisonIds(comparisonIds.value).filter(id => id !== vehicleId);
  } else {
    if (ids.size >= 3) {
      if (process.client && window.UIkit) {
        window.UIkit.notification({
          message: `You can save up to 3 vehicles at once`,
          status: 'warning',
          pos: 'top-center',
          timeout: 3000
        });
      }
      return;
    }
    comparisonIds.value = [...normalizeComparisonIds(comparisonIds.value), vehicleId];

    if (process.client && window.UIkit) {
      window.UIkit.notification({
        message: 'Vehicle saved! <a href="/favorites" class="uk-link-reset uk-text-bold" style="text-decoration: underline;">View saved vehicles</a>',
        status: 'success',
        pos: 'top-center',
        timeout: 3000
      });
    }
  }
};

// Vehicle data helpers
const vehicleTitle = computed(() => {
  return props.vehicle.title || 
    `${getYear(props.vehicle)} ${getMake(props.vehicle)} ${getModel(props.vehicle)}`.trim() ||
    'Vehicle';
});

const vehicleYear = computed(() => getYear(props.vehicle));

const shortTitle = computed(() => {
  const make = getMake(props.vehicle);
  const model = getModel(props.vehicle);
  const badge = getBadge(props.vehicle);
  
  if (make && model) {
    return badge ? `${make} ${model} / ${badge}` : `${make} ${model}`;
  }
  return vehicleTitle.value;
});

// Full title from API (e.g., "2023 Ford F-150 Lariat SWB Auto 4X4 MY23")
const fullTitle = computed(() => {
  return props.vehicle.title || vehicleTitle.value;
});

const vehicleMake = computed(() => {
  return getMake(props.vehicle) || 'Vehicle';
});

// Image gallery state
const selectedImageIndex = ref(0);

const mainImage = computed(() => {
  return props.vehicle.thumb || 
         props.vehicle.photos?.[0] ||
         props.vehicle.images?.[0] || 
         props.vehicle.main_photo_url || 
         '';
});

// All available images/photos
const allThumbnails = computed(() => {
  return props.vehicle.photos || props.vehicle.images || [];
});

// Display up to 4 thumbnails for the gallery strip
const displayThumbnails = computed(() => {
  const images = allThumbnails.value;
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }
  return images.slice(0, 4); // Show first 4 images
});

// The currently displayed hero image
const displayImage = computed(() => {
  const images = allThumbnails.value;
  if (Array.isArray(images) && images.length > 0 && selectedImageIndex.value < images.length) {
    return images[selectedImageIndex.value];
  }
  return mainImage.value;
});

// Select an image by index
const selectImage = (index: number) => {
  selectedImageIndex.value = index;
};

const photoCount = computed(() => {
  return props.vehicle.photos?.length || props.vehicle.images?.length || props.vehicle.photo_count || 0;
});

const vehicleLink = computed(() => {
  const stockId = props.vehicle.stockid || props.vehicle.identifier || props.vehicle.id;
  const slug = props.vehicle.slug || '';
  return `/vehicle-for-sale/${stockId}/${slug}`;
});

// Condition badge
const conditionDisplay = computed(() => {
  const condition = props.vehicle.condition?.displayValue?.[0] || 
                    props.vehicle.condition?.value?.[0] || 
                    '';
  return condition ? condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase() : '';
});

// Specs
const transmissionDisplay = computed(() => {
  const trans = props.vehicle.transmission?.displayValue?.[0] || 
         props.vehicle.transmission?.value?.[0] || 
         '';
  if (trans.toLowerCase().includes('automatic')) {
    const match = trans.match(/(\d+)\s*speed/i);
    if (match) return `Sports Automatic Dual Clutch`;
    return 'Automatic';
  }
  return trans;
});

const fuelDisplay = computed(() => {
  const fuel = props.vehicle.fuel?.displayValue?.[0] || 
         props.vehicle.fuel?.value?.[0] || 
         '';
  return fuel ? `Petrol - ${fuel}` : '';
});

const kmsDisplay = computed(() => {
  const kms = props.vehicle.kms || 
              props.vehicle.odometer?.value?.[0] || 
              props.vehicle.odometer?.displayValue?.[0] ||
              props.vehicle.odometer;
  if (kms === 0) return '0 km';
  if (!kms) return '';
  const numKms = typeof kms === 'number' ? kms : parseFloat(String(kms));
  if (isNaN(numKms)) return '';
  return `${numKms.toLocaleString()} km`;
});

const bodySeatsDisplay = computed(() => {
  const body = props.vehicle.body?.displayValue?.[0] || 
               props.vehicle.body?.value?.[0] || 
               '';
  const seats = props.vehicle.seats?.displayValue?.[0] || 
                props.vehicle.seats?.value?.[0] || 
                '';
  
  if (body && seats) return `${body} / ${seats} seats`;
  if (body) return body;
  if (seats) return `${seats} seats`;
  return '';
});

const drivetrainDisplay = computed(() => {
  return props.vehicle.drivetrain?.displayValue?.[0] || 
         props.vehicle.drivetrain?.value?.[0] || 
         '';
});

const registrationDisplay = computed(() => {
  const rego = props.vehicle.registration?.displayValue?.[0] || 
               props.vehicle.registration?.value?.[0] ||
               props.vehicle.rego_status?.displayValue?.[0] ||
               props.vehicle.rego_status?.value?.[0] ||
               '';
  return rego || 'Unregistered';
});

// Price
const priceDisplay = computed(() => {
  const price = props.vehicle.price;
  if (!price || price === '' || price === 0) return 'POA';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice) || numPrice === 0) return 'POA';
  return `$${numPrice.toLocaleString()}`;
});

const perWeekDisplay = computed(() => {
  const perweek = props.vehicle.perweek;
  if (!perweek || perweek === 0) return '';
  return `$${perweek.toLocaleString()}`;
});

// Helper functions
const getYear = (vehicle: any) => {
  return vehicle.year?.displayValue?.[0] || 
         vehicle.year?.value?.[0] || 
         vehicle.releaseyear || 
         '';
};

const getMake = (vehicle: any) => {
  return vehicle.make?.displayValue?.[0] || 
         vehicle.make?.value?.[0] || 
         vehicle.model?.displayMake?.[0]?.displayValue?.[0] || 
         '';
};

const getModel = (vehicle: any) => {
  return vehicle.model?.displayValue?.[0] || 
         vehicle.model?.value?.[0] || 
         '';
};

const getBadge = (vehicle: any) => {
  return vehicle.badge?.displayValue?.[0] || 
         vehicle.badge?.value?.[0] || 
         '';
};

// Analytics tracking
const { trackEnquiryModalOpen } = useAnalytics();

// Enquire modal
const openEnquire = () => {
  trackEnquiryModalOpen({
    vehicle: props.vehicle,
    source: 'card_click',
  });
  vehiclesStore.setVehicleEnquiryPopUp(true, props.vehicle);
};
</script>

