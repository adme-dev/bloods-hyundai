/**
 * Optimized Vehicle Enrichment API Endpoint
 *
 * GET /api/vehicle-enrichment-optimized/[id]
 *
 * Combines specs, ANCAP, and market data with aggressive caching.
 * Designed for high-traffic scenarios with 95%+ cache hit rate.
 *
 * Response times:
 * - Cache hit: <100ms
 * - Cache miss: 1-4s
 */

import { vehicleEnrichmentCache } from '../../services/vehicle-enrichment-cache';
import { groqEnrichmentService } from '../../services/groq-enrichment';
import type { VehicleInput, EnrichmentResponse, VehicleEnrichment, ConfidenceLevel, EnrichmentSource, MarketData, AustralianData, MarketPosition, PriceTrend, DemandLevel } from '../../types/enrichment';

// In-memory request deduplication
const pendingRequests = new Map<string, Promise<any>>();

export default defineEventHandler(async (event): Promise<EnrichmentResponse> => {
  const startTime = Date.now();
  const id = getRouterParam(event, 'id');

  // Check if enrichment is disabled
  if (process.env.DISABLE_ENRICHMENT === 'true') {
    return {
      success: false,
      error: 'Vehicle enrichment is disabled',
      cached: false,
      processingTimeMs: Date.now() - startTime,
    };
  }

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Vehicle ID is required',
    });
  }

  try {
    // Parse vehicle info from ID (format: year-make-model or year-make-model-variant)
    const vehicleInfo = parseVehicleId(id);

    if (!vehicleInfo) {
      throw createError({
        statusCode: 400,
        message: 'Invalid vehicle ID format. Expected: year-make-model[-variant]',
      });
    }

    const fingerprint = vehicleEnrichmentCache.generateFingerprint(vehicleInfo);

    // Check for pending request (deduplication)
    if (pendingRequests.has(fingerprint)) {
      console.log('[OptimizedEnrichment] Waiting for pending request:', fingerprint);
      const result = await pendingRequests.get(fingerprint);
      return {
        success: true,
        data: result,
        cached: true,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Check cache first
    const cachedData = await getCachedEnrichment(vehicleInfo);

    if (cachedData) {
      setResponseHeaders(event, {
        'Cache-Control': 'max-age=3600, stale-while-revalidate=7200',
        'X-Cache': 'HIT',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      });

      return {
        success: true,
        data: cachedData,
        cached: true,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Cache miss - fetch fresh data with deduplication
    const enrichmentPromise = groqEnrichmentService.enrichVehicle(vehicleInfo, false);
    pendingRequests.set(fingerprint, enrichmentPromise);

    try {
      const enrichment = await enrichmentPromise;

      setResponseHeaders(event, {
        'Cache-Control': 'max-age=600, stale-while-revalidate=1800',
        'X-Cache': 'MISS',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      });

      return {
        success: true,
        data: enrichment,
        cached: false,
        processingTimeMs: Date.now() - startTime,
      };
    } finally {
      // Clean up pending request after a delay to catch rapid duplicates
      setTimeout(() => pendingRequests.delete(fingerprint), 5000);
    }
  } catch (error: any) {
    console.error('[OptimizedEnrichment] Error:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to enrich vehicle data',
    });
  }
});

/**
 * Parse vehicle ID in format: year-make-model[-variant][-transmission][-drivetrain]
 *
 * Supports enhanced format with transmission (auto/manual) and drivetrain (fwd/rwd/awd/4wd).
 * Falls back gracefully for older format IDs.
 */
function parseVehicleId(id: string): VehicleInput | null {
  const parts = id.toLowerCase().split('-');

  if (parts.length < 3) {
    return null;
  }

  const year = parseInt(parts[0]!, 10);

  if (isNaN(year) || year < 1900 || year > 2100) {
    return null;
  }

  const make = parts[1]!;

  // Known suffixes for transmission and drivetrain
  const transmissionSuffixes = ['auto', 'manual'];
  const drivetrainSuffixes = ['fwd', 'rwd', 'awd', '4wd'];

  // Work backwards from the end to extract known suffixes
  let transmission: string | undefined;
  let driveType: string | undefined;
  let remainingParts = [...parts.slice(2)]; // Everything after year-make

  // Check last part for drivetrain
  if (remainingParts.length > 0) {
    const lastPart = remainingParts[remainingParts.length - 1]!;
    if (drivetrainSuffixes.includes(lastPart)) {
      driveType = lastPart;
      remainingParts = remainingParts.slice(0, -1);
    }
  }

  // Check new last part for transmission
  if (remainingParts.length > 0) {
    const lastPart = remainingParts[remainingParts.length - 1]!;
    if (transmissionSuffixes.includes(lastPart)) {
      transmission = lastPart;
      remainingParts = remainingParts.slice(0, -1);
    }
  }

  // What's left is model and possibly variant
  const model = remainingParts.length >= 1 ? remainingParts[0]! : '';
  const variant = remainingParts.length > 1 ? remainingParts.slice(1).join('-') : undefined;

  if (!model) {
    return null;
  }

  return {
    id,
    make: capitalize(make),
    model: capitalize(model.replace(/-/g, ' ')),
    year,
    variant: variant ? capitalize(variant.replace(/-/g, ' ')) : undefined,
    transmission: transmission ? capitalize(transmission) : undefined,
    driveType: driveType ? driveType.toUpperCase() : undefined,
  };
}

/**
 * Capitalize first letter of each word
 */
function capitalize(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get cached enrichment data from Supabase
 * Checks unified vehicle_enrichments table first, then falls back to legacy tables
 */
async function getCachedEnrichment(vehicle: VehicleInput): Promise<VehicleEnrichment | null> {
  if (!vehicleEnrichmentCache.isAvailable()) {
    return null;
  }

  const fingerprint = vehicleEnrichmentCache.generateFingerprint(vehicle);

  // Try unified vehicle_enrichments table first (preferred)
  const unifiedCached = await vehicleEnrichmentCache.getEnrichment(fingerprint);
  if (unifiedCached) {
    console.log('[OptimizedEnrichment] Cache HIT from vehicle_enrichments:', fingerprint);
    return {
      ...unifiedCached,
      vehicleId: vehicle.id,
      source: 'cached' as EnrichmentSource,
    };
  }

  // Fallback to legacy separate tables
  const [specs, ancap, market] = await Promise.all([
    vehicleEnrichmentCache.getVehicleSpecs(vehicle.make, vehicle.model, vehicle.year, vehicle.variant),
    vehicleEnrichmentCache.getANCAPRating(vehicle.make, vehicle.model, vehicle.year, vehicle.variant),
    vehicleEnrichmentCache.getMarketData(vehicle.make, vehicle.model, vehicle.year),
  ]);

  // Need at least specs for a valid cached response from legacy tables
  if (!specs) {
    return null;
  }

  console.log('[OptimizedEnrichment] Cache HIT from legacy tables:', fingerprint);

  return {
    vehicleId: vehicle.id,
    vehicleFingerprint: fingerprint,
    enrichedAt: specs.fetched_at || new Date().toISOString(),

    features: {
      safety: {
        items: specs.safety_features || [],
        confidence: 'medium' as ConfidenceLevel,
      },
      comfort: {
        items: specs.standard_features?.filter((f: string) =>
          f.toLowerCase().includes('seat') ||
          f.toLowerCase().includes('climate') ||
          f.toLowerCase().includes('comfort')
        ) || [],
        confidence: 'medium' as ConfidenceLevel,
      },
      technology: {
        items: specs.standard_features?.filter((f: string) =>
          f.toLowerCase().includes('screen') ||
          f.toLowerCase().includes('apple') ||
          f.toLowerCase().includes('android') ||
          f.toLowerCase().includes('bluetooth')
        ) || [],
        confidence: 'medium' as ConfidenceLevel,
      },
      performance: {
        items: specs.optional_features || [],
        confidence: 'medium' as ConfidenceLevel,
      },
    },

    specifications: {
      structured: true,
      engine: specs.engine_type ? {
        type: specs.engine_type,
        displacement: specs.engine_size,
        cylinders: specs.cylinders,
        powerKw: specs.power_kw,
        powerHp: specs.power_hp,
        torqueNm: specs.torque_nm,
      } : undefined,
      dimensions: {
        lengthMm: specs.length_mm,
        widthMm: specs.width_mm,
        heightMm: specs.height_mm,
        wheelbaseMm: specs.wheelbase_mm,
        groundClearanceMm: specs.ground_clearance_mm,
        kerbWeightKg: specs.kerb_weight_kg,
        grossVehicleMassKg: specs.gross_vehicle_mass_kg,
        towingCapacityBrakedKg: specs.towing_capacity_kg,
      },
      performance: {
        acceleration0To100Sec: specs.acceleration_0_100_sec,
        topSpeedKmh: specs.top_speed_kmh,
        driveType: specs.drive_type,
        transmission: specs.transmission,
      },
      efficiency: {
        fuelConsumptionCombined: specs.fuel_consumption_combined,
        fuelConsumptionUrban: specs.fuel_consumption_urban,
        fuelConsumptionExtraUrban: specs.fuel_consumption_extra_urban,
        co2EmissionsGkm: specs.co2_emissions_gkm,
        fuelType: specs.fuel_type,
      },
    },

    marketData: (market ? {
      averagePrice: market.average_price,
      medianPrice: market.median_price,
      priceRange: market.price_range_min && market.price_range_max
        ? { min: market.price_range_min, max: market.price_range_max }
        : undefined,
      marketPosition: market.market_position as MarketPosition | undefined,
      trend: market.price_trend as PriceTrend | undefined,
      demandLevel: market.demand_level as DemandLevel | undefined,
      confidence: (market.confidence || 'medium') as ConfidenceLevel,
      dataSource: market.data_source,
      lastUpdated: market.fetched_at,
    } : {
      confidence: 'low' as ConfidenceLevel,
    }) as MarketData,

    australianData: (ancap ? {
      ancapRating: ancap.star_rating,
      ancapYear: ancap.test_year?.toString(),
      ancapDetails: {
        ancapId: ancap.ancap_id,
        overallRating: ancap.star_rating,
        testYear: ancap.test_year,
        adultOccupantScore: ancap.adult_occupant,
        childOccupantScore: ancap.child_occupant,
        vulnerableRoadUserScore: ancap.vulnerable_road_users,
        safetyAssistScore: ancap.safety_assist,
        collisionAvoidance: ancap.collision_avoidance,
        technicalReportUrl: ancap.technical_report_url,
      },
    } : {}) as AustralianData,

    confidence: (specs ? 'medium' : 'low') as ConfidenceLevel,
    source: 'cached' as EnrichmentSource,
  };
}
