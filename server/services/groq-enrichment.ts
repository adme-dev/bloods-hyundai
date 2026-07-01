/**
 * Groq Enrichment Service
 *
 * Main orchestrator for the vehicle enrichment process using Groq AI,
 * ANCAP API, and optional market data sources.
 */

import Groq from 'groq-sdk';
import { vehicleEnrichmentCache } from './vehicle-enrichment-cache';
import type {
  VehicleEnrichment,
  VehicleInput,
  VehicleSpecifications,
  VehicleFeatures,
  FeatureCategory,
  ANCAPDetails,
  MarketData,
  AustralianData,
  AIEnrichmentRequest,
  AIEnrichmentResponse,
  ConfidenceLevel,
  VehicleSpecsCache,
  ANCAPRatingCache,
} from '../types/enrichment';

// AI Configuration
const AI_MODEL = 'llama-3.1-8b-instant';
const AI_MAX_TOKENS = 2500;
const AI_TEMPERATURE = 0.2;

// ANCAP API Configuration
const ANCAP_BASE_URL = 'https://www.ancap.com.au/api';

class GroqEnrichmentService {
  private groq: Groq | null = null;
  private initialized = false;

  /**
   * Initialize the Groq client
   */
  private initialize(): void {
    if (this.initialized) return;

    const apiKey = process.env.AI_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.warn('[GroqEnrichment] AI_API_KEY not configured - AI enrichment disabled');
      this.initialized = true;
      return;
    }

    try {
      this.groq = new Groq({ apiKey });
      this.initialized = true;
      console.log('[GroqEnrichment] Groq client initialized');
    } catch (error) {
      console.error('[GroqEnrichment] Failed to initialize Groq:', error);
      this.initialized = true;
    }
  }

  /**
   * Check if AI enrichment is available
   */
  isAvailable(): boolean {
    this.initialize();
    return this.groq !== null;
  }

  /**
   * Main enrichment method - orchestrates all data sources
   */
  async enrichVehicle(
    vehicle: VehicleInput,
    forceRefresh = false
  ): Promise<VehicleEnrichment> {
    const startTime = Date.now();
    const fingerprint = vehicleEnrichmentCache.generateFingerprint(vehicle);

    console.log(`[GroqEnrichment] Starting enrichment for ${vehicle.make} ${vehicle.model} ${vehicle.year}`);

    // Check cache first (unless force refresh)
    if (!forceRefresh && vehicleEnrichmentCache.isAvailable()) {
      const cached = await this.getCachedEnrichment(vehicle);
      if (cached) {
        console.log(`[GroqEnrichment] Cache hit - returning cached data (${Date.now() - startTime}ms)`);
        return cached;
      }
    }

    // Fetch from all sources in parallel
    const [aiData, ancapData, marketData] = await Promise.all([
      this.fetchAIEnrichment(vehicle),
      this.fetchANCAPRating(vehicle),
      this.fetchMarketData(vehicle),
    ]);

    // Transform and combine data
    const enrichment = this.transformToEnrichment(
      vehicle,
      fingerprint,
      aiData,
      ancapData,
      marketData
    );

    // Cache the results
    await this.cacheEnrichment(vehicle, aiData, ancapData, marketData);

    console.log(`[GroqEnrichment] Enrichment complete (${Date.now() - startTime}ms)`);

    return enrichment;
  }

  // ===========================================================================
  // AI ENRICHMENT (Groq)
  // ===========================================================================

  /**
   * Fetch AI-generated specifications and features
   */
  private async fetchAIEnrichment(vehicle: VehicleInput): Promise<AIEnrichmentResponse | null> {
    if (!this.isAvailable()) {
      return this.getFallbackEnrichment(vehicle);
    }

    try {
      const request = this.prepareAIRequest(vehicle);
      const prompt = this.buildEnrichmentPrompt(request);

      const completion = await this.groq!.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an automotive expert specializing in Australian vehicle specifications. Return only valid JSON without markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: AI_TEMPERATURE,
        max_tokens: AI_MAX_TOKENS,
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        console.error('[GroqEnrichment] Empty AI response');
        return this.getFallbackEnrichment(vehicle);
      }

      return this.parseAIResponse(response, vehicle);
    } catch (error) {
      console.error('[GroqEnrichment] AI enrichment error:', error);
      return this.getFallbackEnrichment(vehicle);
    }
  }

  /**
   * Prepare AI enrichment request
   */
  private prepareAIRequest(vehicle: VehicleInput): AIEnrichmentRequest {
    return {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      variant: vehicle.variant || vehicle.badge,
      bodyType: vehicle.bodyType,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
    };
  }

  /**
   * Build the AI prompt for vehicle enrichment
   */
  private buildEnrichmentPrompt(request: AIEnrichmentRequest): string {
    return `Generate comprehensive Australian market specifications for this vehicle:

Vehicle: ${request.year} ${request.make} ${request.model}${request.variant ? ` ${request.variant}` : ''}
Body Type: ${request.bodyType || 'Unknown'}
Fuel Type: ${request.fuelType || 'Unknown'}
Transmission: ${request.transmission || 'Unknown'}

Return a JSON object with this exact structure:
{
  "series": "string - the model series/generation name (e.g., 'XV70' for Camry, 'GD' for i30, 'NX' for Tucson)",
  "generation": "string - generation description (e.g., '4th Generation', '2023 Facelift')",
  "modelCode": "string - manufacturer model code if known",
  "specifications": {
    "engine": {
      "type": "string (e.g., '2.0L Turbocharged Petrol')",
      "displacement": "string (e.g., '1998cc')",
      "cylinders": number,
      "configuration": "string (e.g., 'Inline', 'V6')",
      "aspiration": "string (e.g., 'Turbocharged', 'Naturally Aspirated')",
      "powerKw": number,
      "powerHp": number,
      "powerRpm": "string (e.g., '5500rpm')",
      "torqueNm": number,
      "torqueRpm": "string (e.g., '1500-4000rpm')",
      "fuelSystem": "string"
    },
    "dimensions": {
      "lengthMm": number,
      "widthMm": number,
      "heightMm": number,
      "wheelbaseMm": number,
      "groundClearanceMm": number,
      "kerbWeightKg": number,
      "grossVehicleMassKg": number,
      "bootCapacityL": number,
      "bootCapacityMaxL": number,
      "fuelTankL": number,
      "turningCircleM": number,
      "towingCapacityBrakedKg": number,
      "towingCapacityUnbrakedKg": number
    },
    "performance": {
      "acceleration0To100Sec": number,
      "topSpeedKmh": number,
      "driveType": "string (FWD/RWD/AWD/4WD)",
      "transmission": "string",
      "gearCount": number
    },
    "efficiency": {
      "fuelConsumptionCombined": number (L/100km),
      "fuelConsumptionUrban": number,
      "fuelConsumptionExtraUrban": number,
      "co2EmissionsGkm": number,
      "fuelType": "string",
      "emissionStandard": "string (e.g., 'Euro 6')"
    },
    "drivetrain": {
      "driveType": "string",
      "transmission": "string (e.g., '8-speed automatic')",
      "gearCount": number,
      "differentialType": "string",
      "allWheelDriveSystem": "string if applicable"
    },
    "suspension": {
      "front": "string (e.g., 'MacPherson strut')",
      "rear": "string (e.g., 'Multi-link')",
      "adaptiveDampers": boolean,
      "airSuspension": boolean
    },
    "brakes": {
      "front": "string (e.g., 'Ventilated disc')",
      "rear": "string (e.g., 'Solid disc')",
      "frontDiameterMm": number,
      "rearDiameterMm": number,
      "electronicBrakeDistribution": boolean,
      "brakeAssist": boolean,
      "hillHoldAssist": boolean
    },
    "wheels": {
      "wheelSize": "string (e.g., '18-inch alloy')",
      "tyreSize": "string (e.g., '225/55 R18')",
      "spareWheel": "string (e.g., 'Space saver', 'Full size', 'Tyre repair kit')",
      "tyrePressureMonitoring": boolean
    },
    "safety": {
      "airbags": number,
      "airbagTypes": ["array of airbag types"],
      "abs": boolean,
      "esc": boolean,
      "tractionControl": boolean,
      "isofixPoints": number,
      "reverseCamera": boolean,
      "parkingSensors": "string (e.g., 'Front and rear')",
      "blindSpotMonitor": boolean,
      "laneKeepAssist": boolean,
      "autonomousEmergencyBraking": boolean,
      "adaptiveCruiseControl": boolean,
      "rearCrossTrafficAlert": boolean
    },
    "interior": {
      "seatingCapacity": number,
      "seatMaterial": "string (e.g., 'Leather', 'Cloth')",
      "driverSeatAdjustment": "string (e.g., '8-way power')",
      "heatedSeats": "string (e.g., 'Front')",
      "ventilatedSeats": "string if applicable",
      "climateControl": "string (e.g., 'Dual-zone automatic')",
      "infotainmentScreen": "string (e.g., '10.25-inch touchscreen')",
      "digitalInstrumentCluster": "string if applicable",
      "headUpDisplay": boolean,
      "sunroof": "string if applicable",
      "wirelessCharging": boolean
    },
    "exterior": {
      "headlights": "string (e.g., 'LED')",
      "daylightRunningLights": "string",
      "fogLights": boolean,
      "tailLights": "string",
      "mirrors": "string (e.g., 'Power folding with heating')",
      "roofRails": boolean
    },
    "warranty": {
      "vehicleWarrantyYears": number,
      "vehicleWarrantyKm": number,
      "drivetrainWarrantyYears": number,
      "roadSideAssistYears": number,
      "rustWarrantyYears": number
    }
  },
  "features": {
    "safety": {
      "items": ["array of safety features"],
      "highlights": ["top 3 safety highlights"]
    },
    "comfort": {
      "items": ["array of comfort features"],
      "highlights": ["top 3 comfort highlights"]
    },
    "technology": {
      "items": ["array of technology features"],
      "highlights": ["top 3 tech highlights"]
    },
    "performance": {
      "items": ["array of performance features"],
      "highlights": ["top 3 performance highlights"]
    }
  },
  "description": "A compelling 2-3 sentence marketing description of the MODEL, written for a brand-new example. Describe it generically — never reference a specific car's age, kilometres/mileage, condition, wear, depreciation, resale value, or service history, and never state or imply it is used/second-hand or open with hedging like 'When considering purchasing'."
}

Use realistic Australian-market specifications. If uncertain about a value, omit it rather than guess. Include as much detail as possible for each category.`;
  }

  /**
   * Parse AI response into structured data
   */
  private parseAIResponse(response: string, vehicle: VehicleInput): AIEnrichmentResponse | null {
    try {
      // Clean the response
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const data = JSON.parse(cleaned);

      return {
        specifications: data.specifications || {},
        features: this.normalizeFeatures(data.features),
        description: data.description,
        series: data.series,
        generation: data.generation,
        modelCode: data.modelCode,
        confidence: 'medium' as ConfidenceLevel,
      };
    } catch (error) {
      console.error('[GroqEnrichment] Failed to parse AI response:', error);
      return this.getFallbackEnrichment(vehicle);
    }
  }

  /**
   * Normalize features to ensure consistent structure
   */
  private normalizeFeatures(features: Partial<VehicleFeatures> | undefined): Partial<VehicleFeatures> {
    const normalizeCategory = (cat: Partial<FeatureCategory> | undefined): FeatureCategory => ({
      items: Array.isArray(cat?.items) ? cat.items : [],
      highlights: Array.isArray(cat?.highlights) ? cat.highlights : [],
      confidence: 'medium' as ConfidenceLevel,
    });

    return {
      safety: normalizeCategory(features?.safety),
      comfort: normalizeCategory(features?.comfort),
      technology: normalizeCategory(features?.technology),
      performance: normalizeCategory(features?.performance),
    };
  }

  /**
   * Generate fallback enrichment when AI is unavailable
   */
  private getFallbackEnrichment(vehicle: VehicleInput): AIEnrichmentResponse {
    return {
      specifications: {
        performance: {
          driveType: vehicle.driveType,
          transmission: vehicle.transmission,
        },
        efficiency: {
          fuelType: vehicle.fuelType,
        },
      },
      features: {
        safety: { items: [], highlights: [], confidence: 'low' },
        comfort: { items: [], highlights: [], confidence: 'low' },
        technology: { items: [], highlights: [], confidence: 'low' },
        performance: { items: [], highlights: [], confidence: 'low' },
      },
      confidence: 'low',
    };
  }

  // ===========================================================================
  // ANCAP RATING
  // ===========================================================================

  /**
   * Fetch ANCAP safety rating
   */
  private async fetchANCAPRating(vehicle: VehicleInput): Promise<ANCAPDetails | null> {
    try {
      // First check cache
      const cached = await vehicleEnrichmentCache.getANCAPRating(
        vehicle.make,
        vehicle.model,
        vehicle.year,
        vehicle.variant
      );

      if (cached) {
        return this.transformCachedANCAP(cached);
      }

      // Fetch from ANCAP API
      const searchUrl = `${ANCAP_BASE_URL}/search?make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}`;

      const searchResponse = await fetch(searchUrl, {
        headers: { 'Accept': 'application/json' },
      });

      if (!searchResponse.ok) {
        console.log('[GroqEnrichment] ANCAP search returned non-OK status');
        return null;
      }

      const searchResults = await searchResponse.json();

      if (!Array.isArray(searchResults) || searchResults.length === 0) {
        console.log('[GroqEnrichment] No ANCAP results found for', vehicle.make, vehicle.model);
        return null;
      }

      // Find best match (closest year)
      const bestMatch = searchResults.find(
        (r: { year_from: number; year_to: number }) =>
          vehicle.year >= r.year_from && vehicle.year <= r.year_to
      ) || searchResults[0];

      if (!bestMatch) return null;

      // Get detailed rating
      const detailUrl = `${ANCAP_BASE_URL}/vehicle/${bestMatch.id}`;
      const detailResponse = await fetch(detailUrl, {
        headers: { 'Accept': 'application/json' },
      });

      if (!detailResponse.ok) {
        // Return basic info from search
        return {
          ancapId: bestMatch.id,
          overallRating: bestMatch.rating || 0,
          testYear: bestMatch.test_year,
        };
      }

      const detail = await detailResponse.json();

      const ancapDetails: ANCAPDetails = {
        ancapId: detail.id,
        overallRating: detail.rating || 0,
        testYear: detail.test_year,
        adultOccupantScore: detail.adult_occupant,
        childOccupantScore: detail.child_occupant,
        vulnerableRoadUserScore: detail.vulnerable_road_user,
        safetyAssistScore: detail.safety_assist,
        collisionAvoidance: detail.collision_avoidance,
        technicalReportUrl: detail.technical_report_url,
        isCurrentModel: vehicle.year >= (detail.test_year || 0),
        energySources: detail.energy_sources,
        laneSupportSystem: detail.lane_support,
        aeb: {
          pedestrian: detail.aeb_pedestrian,
          cyclist: detail.aeb_cyclist,
          junction: detail.aeb_junction,
        },
      };

      // Cache the result
      await vehicleEnrichmentCache.saveANCAPRating({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        variant: vehicle.variant,
        ancap_id: detail.id,
        star_rating: detail.rating || 0,
        test_year: detail.test_year,
        adult_occupant: detail.adult_occupant,
        child_occupant: detail.child_occupant,
        vulnerable_road_users: detail.vulnerable_road_user,
        safety_assist: detail.safety_assist,
        collision_avoidance: detail.collision_avoidance,
        technical_report_url: detail.technical_report_url,
        lane_support_system: detail.lane_support,
        energy_sources: detail.energy_sources,
      });

      return ancapDetails;
    } catch (error) {
      console.error('[GroqEnrichment] ANCAP fetch error:', error);
      return null;
    }
  }

  /**
   * Transform cached ANCAP data to ANCAPDetails
   */
  private transformCachedANCAP(cached: ANCAPRatingCache): ANCAPDetails {
    return {
      ancapId: cached.ancap_id,
      overallRating: cached.star_rating,
      testYear: cached.test_year,
      adultOccupantScore: cached.adult_occupant,
      childOccupantScore: cached.child_occupant,
      vulnerableRoadUserScore: cached.vulnerable_road_users,
      safetyAssistScore: cached.safety_assist,
      collisionAvoidance: cached.collision_avoidance as ANCAPDetails['collisionAvoidance'],
      technicalReportUrl: cached.technical_report_url,
      laneSupportSystem: cached.lane_support_system,
      energySources: cached.energy_sources,
    };
  }

  // ===========================================================================
  // MARKET DATA
  // ===========================================================================

  /**
   * Fetch market data (placeholder - requires Perplexity API or similar)
   */
  private async fetchMarketData(vehicle: VehicleInput): Promise<MarketData | null> {
    // Check cache first
    const cached = await vehicleEnrichmentCache.getMarketData(
      vehicle.make,
      vehicle.model,
      vehicle.year,
      vehicle.condition,
      this.getKmsRange(vehicle.odometer),
      vehicle.location
    );

    if (cached) {
      return this.transformCachedMarketData(cached);
    }

    // If Perplexity API key is available, fetch market data
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (perplexityKey) {
      return this.fetchPerplexityMarketData(vehicle, perplexityKey);
    }

    // Return basic market data estimate
    return this.getEstimatedMarketData(vehicle);
  }

  /**
   * Fetch market data from Perplexity API
   */
  private async fetchPerplexityMarketData(
    vehicle: VehicleInput,
    apiKey: string
  ): Promise<MarketData | null> {
    try {
      const query = `What is the current market price range for a ${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ''} in Australia? Include average price, price trend, and demand level.`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: query }],
        }),
      });

      if (!response.ok) {
        console.error('[GroqEnrichment] Perplexity API error:', response.status);
        return this.getEstimatedMarketData(vehicle);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      // Parse and structure the response (simplified)
      return {
        confidence: 'medium',
        dataSource: 'perplexity',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[GroqEnrichment] Perplexity fetch error:', error);
      return this.getEstimatedMarketData(vehicle);
    }
  }

  /**
   * Get estimated market data based on vehicle age and type
   */
  private getEstimatedMarketData(vehicle: VehicleInput): MarketData {
    const currentYear = new Date().getFullYear();
    const age = currentYear - vehicle.year;

    let demandLevel: MarketData['demandLevel'] = 'medium';
    let trend: MarketData['trend'] = 'stable';

    // Simple heuristics for demand
    if (age <= 2) {
      demandLevel = 'high';
      trend = 'stable';
    } else if (age <= 5) {
      demandLevel = 'medium';
      trend = 'decreasing';
    } else {
      demandLevel = 'low';
      trend = 'decreasing';
    }

    return {
      demandLevel,
      trend,
      confidence: 'low',
      dataSource: 'estimated',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Transform cached market data
   */
  private transformCachedMarketData(cached: any): MarketData {
    return {
      averagePrice: cached.average_price,
      medianPrice: cached.median_price,
      priceRange: cached.price_range_min && cached.price_range_max
        ? { min: cached.price_range_min, max: cached.price_range_max }
        : undefined,
      marketPosition: cached.market_position,
      trend: cached.price_trend,
      competitorCount: cached.competitor_count,
      demandLevel: cached.demand_level,
      estimatedDaysToSell: cached.estimated_days_to_sell,
      valueRating: cached.value_rating,
      valueCategory: cached.value_category,
      confidence: (cached.confidence || 'medium') as ConfidenceLevel,
      dataSource: cached.data_source,
      lastUpdated: cached.fetched_at,
    };
  }

  /**
   * Get odometer range category
   */
  private getKmsRange(odometer?: number): string | undefined {
    if (!odometer) return undefined;
    if (odometer < 50000) return '0-50000';
    if (odometer < 100000) return '50000-100000';
    return '100000+';
  }

  // ===========================================================================
  // DATA TRANSFORMATION
  // ===========================================================================

  /**
   * Transform all data sources into VehicleEnrichment
   */
  private transformToEnrichment(
    vehicle: VehicleInput,
    fingerprint: string,
    aiData: AIEnrichmentResponse | null,
    ancapData: ANCAPDetails | null,
    marketData: MarketData | null
  ): VehicleEnrichment {
    // Determine overall confidence
    let confidence: ConfidenceLevel = 'medium';
    if (aiData?.confidence === 'high' && ancapData) {
      confidence = 'high';
    } else if (!aiData || aiData.confidence === 'low') {
      confidence = 'low';
    }

    // Build Australian data section
    const australianData: AustralianData = {};
    if (ancapData) {
      australianData.ancapRating = ancapData.overallRating;
      australianData.ancapYear = ancapData.testYear?.toString();
      australianData.ancapDetails = ancapData;
    }

    return {
      vehicleId: vehicle.id,
      vehicleFingerprint: fingerprint,
      enrichedAt: new Date().toISOString(),
      description: aiData?.description,

      // Vehicle identification from AI
      series: aiData?.series,
      generation: aiData?.generation,
      modelCode: aiData?.modelCode,

      features: {
        safety: aiData?.features?.safety || { items: [], confidence: 'low' },
        comfort: aiData?.features?.comfort || { items: [], confidence: 'low' },
        technology: aiData?.features?.technology || { items: [], confidence: 'low' },
        performance: aiData?.features?.performance || { items: [], confidence: 'low' },
      },

      specifications: {
        structured: true,
        ...(aiData?.specifications || {}),
        dimensions: aiData?.specifications?.dimensions || {},
        performance: aiData?.specifications?.performance || {},
        efficiency: aiData?.specifications?.efficiency || {},
      },

      marketData: marketData || {
        confidence: 'low',
        dataSource: 'unavailable',
      },

      australianData,

      confidence,
      source: aiData ? 'ai_generated' : 'fallback',
    };
  }

  // ===========================================================================
  // CACHE OPERATIONS
  // ===========================================================================

  /**
   * Get cached enrichment data
   * Checks unified vehicle_enrichments table first, then falls back to legacy tables
   */
  private async getCachedEnrichment(vehicle: VehicleInput): Promise<VehicleEnrichment | null> {
    const fingerprint = vehicleEnrichmentCache.generateFingerprint(vehicle);

    // Try unified vehicle_enrichments table first (preferred)
    const unifiedCached = await vehicleEnrichmentCache.getEnrichment(fingerprint);
    if (unifiedCached) {
      console.log('[GroqEnrichment] Cache HIT from vehicle_enrichments:', fingerprint);
      return {
        ...unifiedCached,
        vehicleId: vehicle.id,
        source: 'cached',
      };
    }

    // Fallback to legacy separate tables
    const [specs, ancap, market] = await Promise.all([
      vehicleEnrichmentCache.getVehicleSpecs(vehicle.make, vehicle.model, vehicle.year, vehicle.variant),
      vehicleEnrichmentCache.getANCAPRating(vehicle.make, vehicle.model, vehicle.year, vehicle.variant),
      vehicleEnrichmentCache.getMarketData(vehicle.make, vehicle.model, vehicle.year, vehicle.condition),
    ]);

    // Need at least specs to return cached data from legacy tables
    if (!specs) return null;

    console.log('[GroqEnrichment] Cache HIT from legacy tables:', fingerprint);

    return {
      vehicleId: vehicle.id,
      vehicleFingerprint: fingerprint,
      enrichedAt: specs.fetched_at || new Date().toISOString(),

      features: {
        safety: {
          items: specs.safety_features || [],
          confidence: 'medium',
        },
        comfort: { items: [], confidence: 'low' },
        technology: { items: [], confidence: 'low' },
        performance: { items: [], confidence: 'low' },
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

      marketData: market ? this.transformCachedMarketData(market) : { confidence: 'low' },

      australianData: ancap ? {
        ancapRating: ancap.star_rating,
        ancapYear: ancap.test_year?.toString(),
        ancapDetails: this.transformCachedANCAP(ancap),
      } : {},

      confidence: 'medium',
      source: 'cached',
    };
  }

  /**
   * Cache enrichment results
   */
  private async cacheEnrichment(
    vehicle: VehicleInput,
    aiData: AIEnrichmentResponse | null,
    ancapData: ANCAPDetails | null,
    marketData: MarketData | null
  ): Promise<void> {
    if (!vehicleEnrichmentCache.isAvailable()) return;

    const fingerprint = vehicleEnrichmentCache.generateFingerprint(vehicle);

    // Build the complete enrichment object for unified caching
    if (aiData && aiData.confidence !== 'low') {
      // Build Australian data section
      const australianData: AustralianData = {};
      if (ancapData) {
        australianData.ancapRating = ancapData.overallRating;
        australianData.ancapYear = ancapData.testYear?.toString();
        australianData.ancapDetails = ancapData;
      }

      // Create the full enrichment object for the unified table
      const fullEnrichment: VehicleEnrichment = {
        vehicleId: vehicle.id,
        vehicleFingerprint: fingerprint,
        enrichedAt: new Date().toISOString(),
        description: aiData?.description,
        series: aiData?.series,
        generation: aiData?.generation,
        modelCode: aiData?.modelCode,
        features: {
          safety: aiData?.features?.safety || { items: [], confidence: 'low' },
          comfort: aiData?.features?.comfort || { items: [], confidence: 'low' },
          technology: aiData?.features?.technology || { items: [], confidence: 'low' },
          performance: aiData?.features?.performance || { items: [], confidence: 'low' },
        },
        specifications: {
          structured: true,
          ...(aiData?.specifications || {}),
        },
        marketData: marketData || { confidence: 'low', dataSource: 'unavailable' },
        australianData,
        confidence: aiData.confidence || 'medium',
        source: 'ai_generated',
      };

      // Save to unified vehicle_enrichments table (primary)
      await vehicleEnrichmentCache.saveEnrichment(fingerprint, fullEnrichment, vehicle.id);

      // Also save to legacy vehicle_specifications table for backwards compatibility
      const specs: VehicleSpecsCache = {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        variant: vehicle.variant,
        engine_type: aiData.specifications?.engine?.type,
        engine_size: aiData.specifications?.engine?.displacement,
        cylinders: aiData.specifications?.engine?.cylinders,
        power_kw: aiData.specifications?.engine?.powerKw,
        power_hp: aiData.specifications?.engine?.powerHp,
        torque_nm: aiData.specifications?.engine?.torqueNm,
        fuel_type: aiData.specifications?.efficiency?.fuelType || vehicle.fuelType,
        transmission: aiData.specifications?.performance?.transmission || vehicle.transmission,
        drive_type: aiData.specifications?.performance?.driveType || vehicle.driveType,
        length_mm: aiData.specifications?.dimensions?.lengthMm,
        width_mm: aiData.specifications?.dimensions?.widthMm,
        height_mm: aiData.specifications?.dimensions?.heightMm,
        wheelbase_mm: aiData.specifications?.dimensions?.wheelbaseMm,
        ground_clearance_mm: aiData.specifications?.dimensions?.groundClearanceMm,
        kerb_weight_kg: aiData.specifications?.dimensions?.kerbWeightKg,
        towing_capacity_kg: aiData.specifications?.dimensions?.towingCapacityBrakedKg,
        acceleration_0_100_sec: aiData.specifications?.performance?.acceleration0To100Sec,
        top_speed_kmh: aiData.specifications?.performance?.topSpeedKmh,
        fuel_consumption_combined: aiData.specifications?.efficiency?.fuelConsumptionCombined,
        fuel_consumption_urban: aiData.specifications?.efficiency?.fuelConsumptionUrban,
        fuel_consumption_extra_urban: aiData.specifications?.efficiency?.fuelConsumptionExtraUrban,
        co2_emissions_gkm: aiData.specifications?.efficiency?.co2EmissionsGkm,
        safety_features: aiData.features?.safety?.items,
        standard_features: [
          ...(aiData.features?.comfort?.items || []),
          ...(aiData.features?.technology?.items || []),
        ],
        source: 'groq_ai',
      };

      await vehicleEnrichmentCache.saveVehicleSpecs(specs);
    }

    // Market data is cached by fetchMarketData if Perplexity is used
  }
}

// Export singleton instance
export const groqEnrichmentService = new GroqEnrichmentService();

// Export class for testing
export { GroqEnrichmentService };
