<template>
  <div v-if="hasFeatures" class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
    <!-- Tab Header -->
    <div class="border-b border-slate-200">
      <div class="flex">
        <button
          class="flex-1 px-6 py-3.5 text-sm font-semibold transition-colors relative"
          :class="activeTab === 'features'
            ? 'text-slate-900 bg-white'
            : 'text-slate-500 bg-slate-50 hover:text-slate-700'"
          @click="activeTab = 'features'"
        >
          Features
          <span
            v-if="activeTab === 'features'"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          ></span>
        </button>
        <button
          class="flex-1 px-6 py-3.5 text-sm font-semibold transition-colors relative"
          :class="activeTab === 'specifications'
            ? 'text-slate-900 bg-white'
            : 'text-slate-500 bg-slate-50 hover:text-slate-700'"
          @click="activeTab = 'specifications'"
        >
          Specifications
          <span
            v-if="activeTab === 'specifications'"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          ></span>
        </button>
      </div>
    </div>

    <!-- Features Tab Content -->
    <div v-if="activeTab === 'features'" class="p-5">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Safety & Security -->
        <div v-if="safetyItems.length > 0">
          <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
            <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Safety & Security
          </h3>
          <ul class="space-y-2">
            <li
              v-for="item in safetyItems"
              :key="item"
              class="flex items-start gap-2 text-sm text-slate-700"
            >
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Comfort & Convenience -->
        <div v-if="comfortItems.length > 0">
          <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
            <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Comfort & Convenience
          </h3>
          <ul class="space-y-2">
            <li
              v-for="item in comfortItems"
              :key="item"
              class="flex items-start gap-2 text-sm text-slate-700"
            >
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Technology & Infotainment -->
        <div v-if="technologyItems.length > 0">
          <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
            <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Technology & Infotainment
          </h3>
          <ul class="space-y-2">
            <li
              v-for="item in technologyItems"
              :key="item"
              class="flex items-start gap-2 text-sm text-slate-700"
            >
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Performance & Drivetrain -->
        <div v-if="performanceItems.length > 0">
          <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
            <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Performance & Drivetrain
          </h3>
          <ul class="space-y-2">
            <li
              v-for="item in performanceItems"
              :key="item"
              class="flex items-start gap-2 text-sm text-slate-700"
            >
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Specifications Tab Content -->
    <div v-if="activeTab === 'specifications'" class="p-5">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Engine & Power -->
        <div v-if="hasEngineSpecs">
          <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
            <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Engine & Power
          </h3>
          <ul class="space-y-2">
            <li v-if="specs?.engine?.powerKw" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ specs.engine.powerKw }}kW @ {{ specs.engine.powerRpm || 'N/A' }}rpm
            </li>
            <li v-if="specs?.engine?.torqueNm" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ specs.engine.torqueNm }}Nm @ {{ specs.engine.torqueRpm || 'N/A' }}
            </li>
            <li v-if="specs?.performance?.acceleration0To100Sec" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              0-100km/h in {{ specs.performance.acceleration0To100Sec }} seconds
            </li>
            <li v-if="transmissionDisplay" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ transmissionDisplay }}
            </li>
            <li v-if="driveTypeDisplay" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ driveTypeDisplay }}
            </li>
          </ul>
        </div>

        <!-- Fuel Economy -->
        <div v-if="hasEfficiencySpecs">
          <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
            <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
            Fuel Economy
          </h3>
          <ul class="space-y-2">
            <li v-if="specs?.efficiency?.fuelConsumptionCombined" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ specs.efficiency.fuelConsumptionCombined }}L/100km (Combined)
            </li>
            <li v-if="specs?.efficiency?.fuelConsumptionUrban" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ specs.efficiency.fuelConsumptionUrban }}L/100km (Urban)
            </li>
            <li v-if="specs?.efficiency?.fuelConsumptionExtraUrban" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ specs.efficiency.fuelConsumptionExtraUrban }}L/100km (Extra Urban)
            </li>
            <li v-if="specs?.efficiency?.co2EmissionsGkm" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ specs.efficiency.co2EmissionsGkm }}g/km CO2 Emissions
            </li>
          </ul>
        </div>

        <!-- Dimensions -->
        <div v-if="hasDimensionSpecs">
          <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
            <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Dimensions
          </h3>
          <ul class="space-y-2">
            <li v-if="specs?.dimensions?.lengthMm" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Length: {{ specs.dimensions.lengthMm }}mm
            </li>
            <li v-if="specs?.dimensions?.widthMm" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Width: {{ specs.dimensions.widthMm }}mm
            </li>
            <li v-if="specs?.dimensions?.heightMm" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Height: {{ specs.dimensions.heightMm }}mm
            </li>
            <li v-if="specs?.dimensions?.wheelbaseMm" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Wheelbase: {{ specs.dimensions.wheelbaseMm }}mm
            </li>
            <li v-if="specs?.dimensions?.bootCapacityL" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Boot Capacity: {{ specs.dimensions.bootCapacityL }}L{{ specs.dimensions.bootCapacityMaxL ? ` (max ${specs.dimensions.bootCapacityMaxL}L)` : '' }}
            </li>
          </ul>
        </div>

        <!-- Capacity & Towing -->
        <div v-if="hasCapacitySpecs">
          <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
            <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Capacity & Towing
          </h3>
          <ul class="space-y-2">
            <li v-if="specs?.dimensions?.kerbWeightKg" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Kerb Weight: {{ specs.dimensions.kerbWeightKg }}kg
            </li>
            <li v-if="specs?.dimensions?.grossVehicleMassKg" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              GVM: {{ specs.dimensions.grossVehicleMassKg }}kg
            </li>
            <li v-if="specs?.dimensions?.towingCapacityBrakedKg" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Towing (Braked): {{ specs.dimensions.towingCapacityBrakedKg }}kg
            </li>
            <li v-if="specs?.dimensions?.towingCapacityUnbrakedKg" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Towing (Unbraked): {{ specs.dimensions.towingCapacityUnbrakedKg }}kg
            </li>
            <li v-if="specs?.dimensions?.fuelTankL" class="flex items-start gap-2 text-sm text-slate-700">
              <svg class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Fuel Tank: {{ specs.dimensions.fuelTankL }}L
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VehicleFeatures, VehicleSpecifications } from '~/composables/useVehicleEnrichment';

interface Props {
  features: VehicleFeatures;
  specs?: VehicleSpecifications;
}

const props = defineProps<Props>();

const activeTab = ref<'features' | 'specifications'>('features');

// Feature items
const safetyItems = computed(() => {
  const items: string[] = [];
  const safety = props.features?.safety;
  if (safety?.highlights?.length) items.push(...safety.highlights);
  if (safety?.items?.length) items.push(...safety.items.filter(i => !safety.highlights?.includes(i)));
  return items;
});

const comfortItems = computed(() => {
  const items: string[] = [];
  const comfort = props.features?.comfort;
  if (comfort?.highlights?.length) items.push(...comfort.highlights);
  if (comfort?.items?.length) items.push(...comfort.items.filter(i => !comfort.highlights?.includes(i)));
  return items;
});

const technologyItems = computed(() => {
  const items: string[] = [];
  const tech = props.features?.technology;
  if (tech?.highlights?.length) items.push(...tech.highlights);
  if (tech?.items?.length) items.push(...tech.items.filter(i => !tech.highlights?.includes(i)));
  return items;
});

const performanceItems = computed(() => {
  const items: string[] = [];
  const perf = props.features?.performance;
  if (perf?.highlights?.length) items.push(...perf.highlights);
  if (perf?.items?.length) items.push(...perf.items.filter(i => !perf.highlights?.includes(i)));
  return items;
});

// Check if we have features
const hasFeatures = computed(() => {
  return safetyItems.value.length > 0 ||
         comfortItems.value.length > 0 ||
         technologyItems.value.length > 0 ||
         performanceItems.value.length > 0;
});

// Specs checks
const hasEngineSpecs = computed(() => {
  return props.specs?.engine?.powerKw ||
         props.specs?.engine?.torqueNm ||
         props.specs?.performance?.acceleration0To100Sec ||
         props.specs?.drivetrain?.transmission;
});

const hasEfficiencySpecs = computed(() => {
  return props.specs?.efficiency?.fuelConsumptionCombined ||
         props.specs?.efficiency?.co2EmissionsGkm;
});

const hasDimensionSpecs = computed(() => {
  return props.specs?.dimensions?.lengthMm ||
         props.specs?.dimensions?.widthMm ||
         props.specs?.dimensions?.bootCapacityL;
});

const hasCapacitySpecs = computed(() => {
  return props.specs?.dimensions?.kerbWeightKg ||
         props.specs?.dimensions?.towingCapacityBrakedKg ||
         props.specs?.dimensions?.fuelTankL;
});

// Display helpers
const transmissionDisplay = computed(() => {
  const trans = props.specs?.performance?.transmission || props.specs?.drivetrain?.transmission;
  const gears = props.specs?.performance?.gearCount || props.specs?.drivetrain?.gearCount;
  if (trans && gears) return `${gears}-Speed ${trans}`;
  return trans || '';
});

const driveTypeDisplay = computed(() => {
  return props.specs?.performance?.driveType || props.specs?.drivetrain?.driveType || '';
});
</script>
