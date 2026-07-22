<template>
  <article
    class="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-xl"
  >
    <!-- Vehicle Image -->
    <div class="relative aspect-[4/3] w-full overflow-hidden bg-muted">
      <component 
        :is="disableLink ? 'div' : NuxtLink" 
        :to="disableLink ? undefined : vehicleLink" 
        class="block h-full w-full"
        :class="{ 'cursor-pointer': !disableLink }"
        @click="disableLink ? openEnquire() : undefined"
      >
        <NuxtImg
          v-if="mainImage"
          :src="mainImage"
          :alt="vehicleTitle"
          width="400"
          height="300"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          format="webp"
          quality="80"
        />
        <div v-else class="flex h-full items-center justify-center bg-slate-100">
          <span class="text-lg font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {{ vehicleMake }}
          </span>
        </div>
      </component>

      <!-- Promo Badge - Top Right (admin managed) -->
      <div v-if="promoBadge" class="absolute right-3 top-3 z-10">
        <span
          class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md"
          :style="{ backgroundColor: promoBadge.color }"
        >
          {{ promoBadge.text }}
        </span>
      </div>

      <!-- Scrolling Promo Banner - Bottom of image (admin managed) -->
      <div
        v-if="marqueeText"
        class="promo-marquee absolute bottom-0 left-0 right-0 z-10"
        :style="{ backgroundColor: marqueeColor }"
        aria-hidden="true"
      >
        <div class="promo-marquee__track">
          <span v-for="n in 8" :key="n" class="promo-marquee__item">{{ marqueeText }}</span>
        </div>
      </div>

      <!-- Photo Count Badge - Bottom Left -->
      <div v-if="photoCount > 0" class="absolute left-3 z-10" :class="marqueeText ? 'bottom-10' : 'bottom-3'">
        <span class="inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="sr-only">Photo count:</span>{{ photoCount }}
        </span>
      </div>
    </div>

    <!-- Wishlist Button - Positioned between image and content -->
    <div class="relative">
      <button
        class="absolute -top-5 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
        :class="isInComparison ? 'text-red-500' : 'text-slate-400 hover:text-slate-600'"
        :aria-label="isInComparison ? 'Remove from saved vehicles' : 'Save vehicle'"
        :aria-pressed="isInComparison"
        @click.stop.prevent="toggleCompare"
      >
        <svg
          class="h-5 w-5"
          :fill="isInComparison ? 'currentColor' : 'none'"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="flex flex-1 flex-col px-4 pb-4 pt-2">
      <!-- Condition Label -->
      <div v-if="conditionDisplay" class="mb-0.5">
        <span class="text-xs font-medium text-slate-500">{{ conditionDisplay }}</span>
      </div>

      <!-- Title -->
      <h3 class="m-0 text-base font-bold leading-snug text-slate-900 line-clamp-1">
        <component 
          :is="disableLink ? 'span' : NuxtLink"
          :to="disableLink ? undefined : vehicleLink" 
          class="hover:text-primary transition-colors no-link-style"
          :class="{ 'cursor-pointer': disableLink }"
          @click="disableLink ? openEnquire() : undefined"
        >
          {{ shortTitle }}
        </component>
      </h3>

      <!-- Subtitle (Specs summary) -->
      <p class="my-1 text-sm leading-tight text-slate-500 line-clamp-1">
        {{ specsSubtitle }}
      </p>

      <!-- Price Section -->
      <div class="mb-3 flex items-start justify-between gap-2">
        <div>
          <div v-if="wasPriceDisplay" class="text-xs leading-tight text-slate-400">
            <span class="mr-1 font-medium">Was</span><span class="line-through">{{ wasPriceDisplay }}</span>
            <span v-if="saveDisplay" class="ml-1.5 font-semibold text-red-600">Save {{ saveDisplay }}</span>
          </div>
          <div class="text-2xl font-bold text-slate-900">
            <span v-if="wasPriceDisplay" class="mr-1 align-middle text-xs font-semibold uppercase text-red-600">Now</span>{{ priceDisplay }}
          </div>
          <div v-if="priceDisplay !== 'POA'" class="text-[10px] text-slate-500">Drive away*</div>
        </div>
        <div v-if="perWeekDisplay" class="text-right">
          <div class="text-base font-bold text-slate-900">{{ perWeekDisplay }}<span class="text-xs font-medium text-slate-600">p/w</span></div>
          <div class="text-[10px] text-slate-500">Est. repayments</div>
        </div>
      </div>

      <!-- Specifications Grid -->
      <div class="mb-3 flex-1 border-t border-slate-100 pt-3">
        <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[13px] text-slate-600">
          <div v-if="bodySeatsDisplay" class="flex items-center gap-1.5">
            <span class="h-1 w-1 flex-shrink-0 rounded-full bg-slate-300"></span>
            <span class="truncate">{{ bodySeatsDisplay }}</span>
          </div>
          <div v-if="fuelDisplay" class="flex items-center gap-1.5">
            <span class="h-1 w-1 flex-shrink-0 rounded-full bg-slate-300"></span>
            <span class="truncate">{{ fuelDisplay }}</span>
          </div>
          <div v-if="transmissionDisplay" class="flex items-center gap-1.5">
            <span class="h-1 w-1 flex-shrink-0 rounded-full bg-slate-300"></span>
            <span class="truncate">{{ transmissionDisplay }}</span>
          </div>
          <div v-if="registrationDisplay" class="flex items-center gap-1.5">
            <span class="h-1 w-1 flex-shrink-0 rounded-full bg-slate-300"></span>
            <span class="truncate">{{ registrationDisplay }}</span>
          </div>
          <div v-if="drivetrainDisplay" class="flex items-center gap-1.5">
            <span class="h-1 w-1 flex-shrink-0 rounded-full bg-slate-300"></span>
            <span class="truncate">{{ drivetrainDisplay }}</span>
          </div>
          <div v-if="kmsDisplay" class="flex items-center gap-1.5">
            <span class="h-1 w-1 flex-shrink-0 rounded-full bg-slate-300"></span>
            <span class="truncate">{{ kmsDisplay }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2">
        <button
          class="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-800 bg-slate-800 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
          @click="openEnquire"
          :aria-label="`Enquire about ${vehicleTitle}`"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Enquire
        </button>
        <!-- When links are disabled, show Enquire as the primary action -->
        <button
          v-if="disableLink"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          @click="openEnquire"
        >
          Get Details
        </button>
        <NuxtLink
          v-else
          :to="vehicleLink"
          class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          View Details
        </NuxtLink>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
interface Props {
  vehicle: any;
  viewMode?: 'grid' | 'list';
  disableLink?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'grid',
  disableLink: false,
});

// Need to resolve NuxtLink for dynamic component usage
const NuxtLink = resolveComponent('NuxtLink');

// Expose disableLink as a computed for template usage
const disableLink = computed(() => props.disableLink);

const vehiclesStore = useVehiclesStore();

// Comparison state using array persistence to avoid Set serialization issues
// Note: useLocalStorage only returns meaningful data on client, so we track mount state
const comparisonIds = useLocalStorage<any>('comparisonVehicles', []);
const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});

const normalizeComparisonIds = (raw: any): (string | number)[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    if (raw instanceof Set) return Array.from(raw);
    // handle serialized sets like { _set: [...] } or objects with numeric keys
    const maybeValues = raw._set || Object.values(raw);
    if (Array.isArray(maybeValues)) return maybeValues as (string | number)[];
  }
  return [];
};

const comparisonSet = computed(() => new Set(normalizeComparisonIds(comparisonIds.value)));
const isInComparison = computed(() => {
  // Return false during SSR to prevent hydration mismatch
  if (!isMounted.value) return false;
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

const shortTitle = computed(() => {
  const make = getMake(props.vehicle);
  const model = getModel(props.vehicle);
  const badge = getBadge(props.vehicle);
  
  if (make && model) {
    return badge ? `${make} ${model} / ${badge}` : `${make} ${model}`;
  }
  return vehicleTitle.value;
});

const vehicleSubtitle = computed(() => {
  const year = getYear(props.vehicle);
  const make = getMake(props.vehicle);
  const model = getModel(props.vehicle);
  const badge = getBadge(props.vehicle);
  const variant = props.vehicle.variant?.displayValue?.[0] || props.vehicle.variant?.value?.[0] || '';
  
  const parts = [year, make, model, badge, variant].filter(Boolean);
  return parts.join(' ') || vehicleTitle.value;
});

// Specs-based subtitle (e.g., "~20 km, Piston, Front Wheel Drive, BLACK Interior")
const specsSubtitle = computed(() => {
  const parts: string[] = [];
  
  // Kms
  const kms = props.vehicle.kms;
  if (kms !== undefined && kms !== null) {
    if (kms === 0) {
      parts.push('0 km');
    } else {
      parts.push(`~${kms.toLocaleString()} km`);
    }
  }
  
  // Engine type
  const engine = props.vehicle.engine?.displayValue?.[0] || props.vehicle.engine?.value?.[0] || '';
  if (engine) parts.push(engine);
  
  // Drivetrain
  const drivetrain = props.vehicle.drivetrain?.displayValue?.[0] || props.vehicle.drivetrain?.value?.[0] || '';
  if (drivetrain) parts.push(drivetrain);
  
  // Interior colour
  const interiorColour = props.vehicle.interiorcolour || props.vehicle.interior_colour || '';
  if (interiorColour) parts.push(`${interiorColour.toUpperCase()} Interior`);
  
  return parts.join(', ') || vehicleTitle.value;
});

const vehicleMake = computed(() => {
  return getMake(props.vehicle) || 'Vehicle';
});

const mainImage = computed(() => {
  return props.vehicle.images?.[0] || 
         props.vehicle.thumb || 
         props.vehicle.main_photo_url || 
         '';
});

const photoCount = computed(() => {
  return props.vehicle.images?.length || props.vehicle.photo_count || 0;
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
  // Shorten common transmission names
  if (trans.toLowerCase().includes('automatic')) {
    const match = trans.match(/(\d+)\s*speed/i);
    if (match) return `${match[1]} Speed Automatic`;
    return 'Automatic';
  }
  return trans;
});

const fuelDisplay = computed(() => {
  return props.vehicle.fuel?.displayValue?.[0] || 
         props.vehicle.fuel?.value?.[0] || 
         '';
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
const numericPrice = computed(() => {
  const price = props.vehicle.price;
  if (!price || price === '' || price === 0) return 0;
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numPrice) ? 0 : numPrice;
});

const priceDisplay = computed(() => {
  if (!numericPrice.value) return 'POA';
  return `$${numericPrice.value.toLocaleString()}`;
});

// Admin-managed stock card promotions (was/now, badge, comment, scroller)
const { settings: promoSettings, promoFor, scrollerFor } = useStockCardPromo();
const promoOffer = computed(() => promoFor(props.vehicle));
const cardScroller = computed(() => scrollerFor(props.vehicle));

const wasPriceDisplay = computed(() => {
  if (!promoSettings.value?.wasNowEnabled) return '';
  const wasPrice = promoOffer.value?.wasPrice;
  if (!wasPrice || !numericPrice.value || wasPrice <= numericPrice.value) return '';
  return `$${wasPrice.toLocaleString()}`;
});

const saveDisplay = computed(() => {
  if (!wasPriceDisplay.value) return '';
  const saving = (promoOffer.value?.wasPrice || 0) - numericPrice.value;
  return saving > 0 ? `$${saving.toLocaleString()}` : '';
});

const promoBadge = computed(() => {
  if (!promoSettings.value?.badgesEnabled) return null;
  const offer = promoOffer.value;
  if (!offer?.badgeText) return null;
  return { text: offer.badgeText, color: offer.badgeColor };
});

const marqueeText = computed(() => {
  const settings = promoSettings.value;
  if (!settings) return '';
  if (settings.commentsEnabled && promoOffer.value?.comment) return promoOffer.value.comment;
  return cardScroller.value?.text || '';
});

const marqueeColor = computed(() => {
  const settings = promoSettings.value;
  if (settings?.commentsEnabled && promoOffer.value?.comment) {
    return promoOffer.value.badgeColor || cardScroller.value?.color || '#e11d48';
  }
  return cardScroller.value?.color || '#e11d48';
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
  const badge = vehicle.badge?.displayValue?.[0] ||
         vehicle.badge?.value?.[0] ||
         '';
  // Filter out "No Badge" or "(No Badge)" as it's not meaningful to display
  if (badge.toLowerCase().includes('no badge')) return '';
  return badge;
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

<style scoped>
.promo-marquee {
  overflow: hidden;
  padding: 5px 0;
  /* Decorative strip — clicks pass through to the image link beneath. */
  pointer-events: none;
}

.promo-marquee__track {
  display: flex;
  width: max-content;
  animation: promo-marquee-scroll 12s linear infinite;
}

.promo-marquee__item {
  padding: 0 1.5rem;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

@keyframes promo-marquee-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@media (prefers-reduced-motion: reduce) {
  .promo-marquee__track { animation: none; }
}
</style>
