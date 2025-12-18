/**
 * Vehicle Enrichment Composable
 *
 * Fetches and manages AI-enriched vehicle data including specifications,
 * ANCAP ratings, features, and market intelligence.
 */

import type { Ref } from 'vue';

// Types matching server/types/enrichment.ts
export interface VehicleEnrichment {
  vehicleId: string;
  vehicleFingerprint: string;
  enrichedAt: string;
  description?: string;
  series?: string;
  generation?: string;
  modelCode?: string;
  features: VehicleFeatures;
  specifications: VehicleSpecifications;
  marketData: MarketData;
  australianData: AustralianData;
  confidence: 'high' | 'medium' | 'low';
  source: 'driveagent' | 'fallback' | 'cached' | 'ai_generated';
}

export interface VehicleFeatures {
  safety: FeatureCategory;
  comfort: FeatureCategory;
  technology: FeatureCategory;
  performance: FeatureCategory;
  electric?: FeatureCategory;
}

export interface FeatureCategory {
  items: string[];
  highlights?: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface VehicleSpecifications {
  structured?: boolean;
  engine?: {
    type?: string;
    displacement?: string;
    cylinders?: number;
    configuration?: string;
    aspiration?: string;
    powerKw?: number;
    powerHp?: number;
    powerRpm?: string;
    torqueNm?: number;
    torqueRpm?: string;
    compression?: string;
    valvesPerCylinder?: number;
    fuelSystem?: string;
  };
  electric?: {
    batteryCapacity?: string;
    batteryType?: string;
    motorType?: string;
    motorPowerKw?: number;
    motorTorqueNm?: number;
    rangeKm?: number;
    chargingTimeAc?: string;
    chargingTimeDc?: string;
    maxChargingPowerKw?: number;
    regenerativeBraking?: boolean;
    electricRange?: string;
  };
  dimensions?: {
    lengthMm?: number;
    widthMm?: number;
    heightMm?: number;
    wheelbaseMm?: number;
    groundClearanceMm?: number;
    kerbWeightKg?: number;
    grossVehicleMassKg?: number;
    bootCapacityL?: number;
    bootCapacityMaxL?: number;
    fuelTankL?: number;
    turningCircleM?: number;
    towingCapacityBrakedKg?: number;
    towingCapacityUnbrakedKg?: number;
    roofLoadKg?: number;
  };
  performance?: {
    acceleration0To100Sec?: number;
    topSpeedKmh?: number;
    maxPowerKw?: number;
    maxTorqueNm?: number;
    driveType?: string;
    transmission?: string;
    gearCount?: number;
  };
  efficiency?: {
    fuelConsumptionCombined?: number;
    fuelConsumptionUrban?: number;
    fuelConsumptionExtraUrban?: number;
    co2EmissionsGkm?: number;
    fuelType?: string;
    emissionStandard?: string;
    greenVehicleGuideRating?: number;
  };
  drivetrain?: {
    driveType?: string;
    transmission?: string;
    gearCount?: number;
    differentialType?: string;
    allWheelDriveSystem?: string;
  };
  suspension?: {
    front?: string;
    rear?: string;
    adaptiveDampers?: boolean;
    airSuspension?: boolean;
    rideModes?: string[];
  };
  brakes?: {
    front?: string;
    rear?: string;
    frontDiameterMm?: number;
    rearDiameterMm?: number;
    electronicBrakeDistribution?: boolean;
    brakeAssist?: boolean;
    hillHoldAssist?: boolean;
  };
  wheels?: {
    wheelSize?: string;
    tyreSize?: string;
    spareWheel?: string;
    tyrePressureMonitoring?: boolean;
  };
  safety?: {
    airbags?: number;
    airbagTypes?: string[];
    abs?: boolean;
    esc?: boolean;
    tractionControl?: boolean;
    isofixPoints?: number;
    reverseCamera?: boolean;
    parkingSensors?: string;
    blindSpotMonitor?: boolean;
    laneKeepAssist?: boolean;
    autonomousEmergencyBraking?: boolean;
    adaptiveCruiseControl?: boolean;
    rearCrossTrafficAlert?: boolean;
  };
  interior?: {
    seatingCapacity?: number;
    seatMaterial?: string;
    driverSeatAdjustment?: string;
    heatedSeats?: string;
    ventilatedSeats?: string;
    climateControl?: string;
    infotainmentScreen?: string;
    digitalInstrumentCluster?: boolean;
    headUpDisplay?: boolean;
    sunroof?: string;
    wirelessCharging?: boolean;
  };
  exterior?: {
    headlights?: string;
    daylightRunningLights?: string;
    fogLights?: boolean;
    tailLights?: string;
    mirrors?: string;
    roofRails?: boolean;
  };
  warranty?: {
    vehicleWarrantyYears?: number;
    vehicleWarrantyKm?: number;
    drivetrainWarrantyYears?: number;
    drivetrainWarrantyKm?: number;
    batteryWarrantyYears?: number;
    batteryWarrantyKm?: number;
    roadSideAssistYears?: number;
    rustWarrantyYears?: number;
  };
}

export interface MarketData {
  averagePrice?: number;
  medianPrice?: number;
  priceRange?: { min: number; max: number };
  marketPosition?: 'above' | 'below' | 'at';
  trend?: 'increasing' | 'decreasing' | 'stable';
  demandLevel?: 'high' | 'medium' | 'low';
  confidence: 'high' | 'medium' | 'low';
  dataSource?: string;
  lastUpdated?: string;
}

export interface AustralianData {
  ancapRating?: number;
  ancapYear?: string;
  ancapDetails?: {
    ancapId?: string;
    overallRating: number;
    testYear?: number;
    adultOccupantScore?: number;
    childOccupantScore?: number;
    vulnerableRoadUserScore?: number;
    safetyAssistScore?: number;
    collisionAvoidance?: string;
    technicalReportUrl?: string;
  };
  warrantyTerms?: string;
  recommendedFuel?: string;
}

export interface EnrichmentResponse {
  success: boolean;
  data?: VehicleEnrichment;
  error?: string;
  cached: boolean;
  processingTimeMs: number;
}

interface UseVehicleEnrichmentOptions {
  /** Use optimized endpoint with aggressive caching */
  optimized?: boolean;
  /** Fetch immediately on composable creation */
  immediate?: boolean;
  /** Force refresh even if cached */
  forceRefresh?: boolean;
}

interface UseVehicleEnrichmentReturn {
  /** Enrichment data */
  enrichment: Ref<VehicleEnrichment | null>;
  /** Loading state */
  loading: Ref<boolean>;
  /** Error message if any */
  error: Ref<string | null>;
  /** Whether data came from cache */
  cached: Ref<boolean>;
  /** Processing time in ms */
  processingTimeMs: Ref<number>;
  /** Fetch enrichment data */
  fetch: () => Promise<void>;
  /** Refresh with force flag */
  refresh: () => Promise<void>;
  /** Check if enrichment has useful data */
  hasData: ComputedRef<boolean>;
  /** Check if ANCAP data is available */
  hasANCAP: ComputedRef<boolean>;
  /** Check if detailed specs are available */
  hasDetailedSpecs: ComputedRef<boolean>;
}

/**
 * Composable for fetching vehicle enrichment data
 *
 * @param vehicleId - Vehicle identifier (stock ID or year-make-model format)
 * @param options - Configuration options
 */
export function useVehicleEnrichment(
  vehicleId: Ref<string> | string,
  options: UseVehicleEnrichmentOptions = {}
): UseVehicleEnrichmentReturn {
  const { optimized = true, immediate = true, forceRefresh = false } = options;

  const enrichment = ref<VehicleEnrichment | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const cached = ref(false);
  const processingTimeMs = ref(0);

  const idRef = isRef(vehicleId) ? vehicleId : ref(vehicleId);

  const hasData = computed(() => {
    return enrichment.value !== null && enrichment.value.confidence !== 'low';
  });

  const hasANCAP = computed(() => {
    return (
      enrichment.value?.australianData?.ancapRating !== undefined &&
      enrichment.value.australianData.ancapRating > 0
    );
  });

  const hasDetailedSpecs = computed(() => {
    const specs = enrichment.value?.specifications;
    if (!specs) return false;

    // Check if we have meaningful spec data beyond basics
    return !!(
      specs.engine?.powerKw ||
      specs.dimensions?.lengthMm ||
      specs.performance?.acceleration0To100Sec ||
      specs.efficiency?.fuelConsumptionCombined
    );
  });

  const fetchEnrichment = async (force = false) => {
    const id = idRef.value;
    if (!id) {
      error.value = 'Vehicle ID is required';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const endpoint = optimized
        ? `/api/vehicle-enrichment-optimized/${id}`
        : `/api/vehicle-enrichment/${id}`;

      const queryParams = force || forceRefresh ? '?force=true' : '';

      const response = await $fetch<EnrichmentResponse>(`${endpoint}${queryParams}`);

      if (response.success && response.data) {
        enrichment.value = response.data;
        cached.value = response.cached;
        processingTimeMs.value = response.processingTimeMs;
      } else {
        error.value = response.error || 'Failed to fetch enrichment data';
      }
    } catch (err: any) {
      console.error('[useVehicleEnrichment] Fetch error:', err);
      error.value = err.message || 'Failed to fetch enrichment data';
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => fetchEnrichment(true);

  // Fetch on mount if immediate
  if (immediate && idRef.value) {
    // Use onMounted for client-side only fetching to avoid hydration issues
    if (import.meta.client) {
      onMounted(() => {
        fetchEnrichment();
      });
    }
  }

  // Watch for ID changes - use immediate to catch the initial value when immediate option is false
  watch(idRef, (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchEnrichment();
    }
  }, { immediate: !immediate });

  return {
    enrichment,
    loading,
    error,
    cached,
    processingTimeMs,
    fetch: fetchEnrichment,
    refresh,
    hasData,
    hasANCAP,
    hasDetailedSpecs,
  };
}

/**
 * Build enrichment ID from vehicle data
 * Format: year-make-model[-variant][-transmission][-drivetrain]
 *
 * Enhanced format includes transmission and drivetrain for more accurate
 * specification lookups, especially for variants with different powertrains.
 */
export function buildEnrichmentId(vehicle: {
  year?: string | number | { value?: string[] };
  make?: string | { value?: string[] };
  model?: string | { value?: string[] };
  variant?: string | { value?: string[] };
  badge?: string | { value?: string[] };
  transmission?: string | { value?: string[] };
  drivetrain?: string | { value?: string[] };
  title?: string | { value?: string[] };
}): string {
  const getValue = (field: any): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'number') return String(field);
    if (Array.isArray(field?.value)) return field.value[0] || '';
    if (Array.isArray(field?.displayValue)) return field.displayValue[0] || '';
    return '';
  };

  const year = getValue(vehicle.year);
  const make = getValue(vehicle.make);
  const model = getValue(vehicle.model);
  const variant = getValue(vehicle.variant) || getValue(vehicle.badge);
  const transmission = getValue(vehicle.transmission);
  const drivetrain = getValue(vehicle.drivetrain);

  if (!year || !make || !model) {
    return '';
  }

  const parts = [year, make, model];

  // Add variant if meaningful
  if (variant && !variant.toLowerCase().includes('no badge')) {
    parts.push(variant);
  }

  // Normalize and add transmission (auto/manual)
  if (transmission) {
    const transNorm = transmission.toLowerCase();
    if (transNorm.includes('auto')) {
      parts.push('auto');
    } else if (transNorm.includes('manual')) {
      parts.push('manual');
    }
  }

  // Normalize and add drivetrain (fwd/rwd/awd/4wd)
  if (drivetrain) {
    const driveNorm = drivetrain.toLowerCase();
    if (driveNorm.includes('front')) {
      parts.push('fwd');
    } else if (driveNorm.includes('rear')) {
      parts.push('rwd');
    } else if (driveNorm.includes('all') || driveNorm.includes('awd')) {
      parts.push('awd');
    } else if (driveNorm.includes('4wd') || driveNorm.includes('four')) {
      parts.push('4wd');
    }
  }

  return parts
    .map((p) => p.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    .join('-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
