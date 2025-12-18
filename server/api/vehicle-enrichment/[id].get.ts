/**
 * Vehicle Enrichment API Endpoint
 *
 * GET /api/vehicle-enrichment/[id]
 *
 * Returns enriched vehicle data including AI-generated specifications,
 * ANCAP safety ratings, and market intelligence.
 *
 * Query Parameters:
 * - force: Set to 'true' to skip cache and refresh data
 */

import { groqEnrichmentService } from '../../services/groq-enrichment';
import { vehicleEnrichmentCache } from '../../services/vehicle-enrichment-cache';
import type { VehicleInput, EnrichmentResponse } from '../../types/enrichment';

export default defineEventHandler(async (event): Promise<EnrichmentResponse> => {
  const startTime = Date.now();
  const id = getRouterParam(event, 'id');
  const query = getQuery(event);
  const forceRefresh = query.force === 'true';

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
    // Get vehicle data from your inventory system
    // This is a placeholder - replace with your actual vehicle lookup
    const vehicle = await getVehicleById(id);

    if (!vehicle) {
      throw createError({
        statusCode: 404,
        message: 'Vehicle not found',
      });
    }

    // Perform enrichment
    const enrichment = await groqEnrichmentService.enrichVehicle(vehicle, forceRefresh);

    // Set cache headers
    setResponseHeaders(event, {
      'Cache-Control': 'max-age=600, stale-while-revalidate=1800',
      'X-Enrichment-Source': enrichment.source,
      'X-Enrichment-Confidence': enrichment.confidence,
    });

    return {
      success: true,
      data: enrichment,
      cached: enrichment.source === 'cached',
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error('[VehicleEnrichmentAPI] Error:', error);

    // Don't expose internal errors
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
 * Get vehicle by ID from your inventory system
 * Replace this with your actual implementation
 */
async function getVehicleById(id: string): Promise<VehicleInput | null> {
  // Try to get from Supabase vehicle inventory
  // This is a placeholder - implement based on your data source

  // Option 1: Direct database lookup
  // const db = await useDatabase();
  // const vehicle = await db.select().from(vehicles).where(eq(vehicles.id, id)).get();

  // Option 2: API call to your vehicle service
  // const response = await $fetch(`/api/vehicle/${id}`);

  // Option 3: Supabase lookup
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Try UUID lookup first
      let query = supabase
        .from('vehicles')
        .select('*')
        .or(`id.eq.${id},stock_number.eq.${id}`)
        .limit(1);

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('[VehicleEnrichmentAPI] Supabase error:', error);
        return null;
      }

      if (data) {
        return transformDatabaseVehicle(data);
      }
    }
  } catch (error) {
    console.error('[VehicleEnrichmentAPI] Database lookup error:', error);
  }

  // Fallback: Parse ID as vehicle info if in format "year-make-model-variant"
  const parts = id.split('-');
  if (parts.length >= 3) {
    const year = parseInt(parts[0]!, 10);
    if (!isNaN(year) && year > 1900 && year < 2100) {
      return {
        id,
        make: parts[1]!,
        model: parts.slice(2, -1).join(' ') || parts[2]!,
        year,
        variant: parts.length > 3 ? parts[parts.length - 1] : undefined,
      };
    }
  }

  return null;
}

/**
 * Transform database vehicle record to VehicleInput
 */
function transformDatabaseVehicle(dbVehicle: any): VehicleInput {
  return {
    id: dbVehicle.id,
    stockNumber: dbVehicle.stock_number,
    make: dbVehicle.make,
    model: dbVehicle.model,
    year: dbVehicle.year || new Date().getFullYear(),
    variant: dbVehicle.variant || dbVehicle.badge,
    badge: dbVehicle.badge,
    series: dbVehicle.series,
    bodyType: dbVehicle.body_type,
    fuelType: dbVehicle.fuel_type,
    transmission: dbVehicle.transmission,
    driveType: dbVehicle.drive_type,
    engineSize: dbVehicle.engine_size,
    colour: dbVehicle.colour || dbVehicle.color,
    odometer: dbVehicle.odometer,
    price: dbVehicle.price || dbVehicle.advertised_price,
    condition: dbVehicle.condition || 'used',
    location: dbVehicle.location || dbVehicle.state,
    registrationState: dbVehicle.registration_state,
  };
}
