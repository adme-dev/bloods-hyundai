/**
 * Vehicle Enrichment System Type Definitions
 *
 * Comprehensive type definitions for the AI-powered vehicle enrichment system
 * that integrates with Supabase for caching and cross-application data sharing.
 */

// =============================================================================
// CORE ENRICHMENT TYPES
// =============================================================================

export interface VehicleEnrichment {
  vehicleId: string;
  vehicleFingerprint: string;
  enrichedAt: string;
  description?: string;

  // Vehicle identification
  series?: string;
  generation?: string;
  modelCode?: string;

  features: VehicleFeatures;
  specifications: VehicleSpecifications;
  marketData: MarketData;
  australianData: AustralianData;

  confidence: ConfidenceLevel;
  source: EnrichmentSource;
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
  confidence: ConfidenceLevel;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type EnrichmentSource = 'driveagent' | 'fallback' | 'cached' | 'ai_generated';

// =============================================================================
// SPECIFICATIONS
// =============================================================================

export interface VehicleSpecifications {
  structured?: boolean;
  engine?: EngineSpecs;
  electric?: ElectricSpecs;
  dimensions?: DimensionSpecs;
  performance?: PerformanceSpecs;
  efficiency?: EfficiencySpecs;
  drivetrain?: DrivetrainSpecs;
  suspension?: SuspensionSpecs;
  brakes?: BrakeSpecs;
  wheels?: WheelSpecs;
  safety?: SafetySpecs;
  interior?: InteriorSpecs;
  exterior?: ExteriorSpecs;
  warranty?: WarrantySpecs;
}

export interface EngineSpecs {
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
}

export interface ElectricSpecs {
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
}

export interface DimensionSpecs {
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
}

export interface PerformanceSpecs {
  acceleration0To100Sec?: number;
  topSpeedKmh?: number;
  maxPowerKw?: number;
  maxTorqueNm?: number;
  driveType?: string;
  transmission?: string;
  gearCount?: number;
}

export interface EfficiencySpecs {
  fuelConsumptionCombined?: number;
  fuelConsumptionUrban?: number;
  fuelConsumptionExtraUrban?: number;
  co2EmissionsGkm?: number;
  fuelType?: string;
  emissionStandard?: string;
  greenVehicleGuideRating?: number;
}

export interface DrivetrainSpecs {
  driveType?: string;
  transmission?: string;
  gearCount?: number;
  differentialType?: string;
  allWheelDriveSystem?: string;
}

export interface SuspensionSpecs {
  front?: string;
  rear?: string;
  adaptiveDampers?: boolean;
  airSuspension?: boolean;
  rideModes?: string[];
}

export interface BrakeSpecs {
  front?: string;
  rear?: string;
  frontDiameterMm?: number;
  rearDiameterMm?: number;
  electronicBrakeDistribution?: boolean;
  brakeAssist?: boolean;
  hillHoldAssist?: boolean;
  autoHold?: boolean;
}

export interface WheelSpecs {
  wheelSize?: string;
  tyreSize?: string;
  spareWheel?: string;
  tyrePressureMonitoring?: boolean;
}

export interface SafetySpecs {
  airbags?: number;
  airbagTypes?: string[];
  abs?: boolean;
  esc?: boolean;
  tractionControl?: boolean;
  hillDescentControl?: boolean;
  isofixPoints?: number;
  reverseCamera?: boolean;
  parkingSensors?: string;
  blindSpotMonitor?: boolean;
  laneKeepAssist?: boolean;
  autonomousEmergencyBraking?: boolean;
  adaptiveCruiseControl?: boolean;
  rearCrossTrafficAlert?: boolean;
  driverAttentionWarning?: boolean;
  trafficSignRecognition?: boolean;
}

export interface InteriorSpecs {
  seatingCapacity?: number;
  seatMaterial?: string;
  driverSeatAdjustment?: string;
  heatedSeats?: string;
  ventilatedSeats?: string;
  steeringWheelMaterial?: string;
  steeringWheelAdjustment?: string;
  climateControl?: string;
  infotainmentScreen?: string;
  digitalInstrumentCluster?: string;
  headUpDisplay?: boolean;
  sunroof?: string;
  ambientLighting?: boolean;
  wirelessCharging?: boolean;
}

export interface ExteriorSpecs {
  headlights?: string;
  daylightRunningLights?: string;
  fogLights?: boolean;
  tailLights?: string;
  mirrors?: string;
  roofRails?: boolean;
  spoiler?: boolean;
  paintType?: string;
}

export interface WarrantySpecs {
  vehicleWarrantyYears?: number;
  vehicleWarrantyKm?: number;
  drivetrainWarrantyYears?: number;
  drivetrainWarrantyKm?: number;
  roadSideAssistYears?: number;
  rustWarrantyYears?: number;
  batteryWarrantyYears?: number;
  batteryWarrantyKm?: number;
}

// =============================================================================
// MARKET DATA
// =============================================================================

export interface MarketData {
  averagePrice?: number;
  medianPrice?: number;
  priceRange?: PriceRange;
  marketPosition?: MarketPosition;
  trend?: PriceTrend;
  competitorCount?: number;
  demandLevel?: DemandLevel;
  estimatedDaysToSell?: number;
  valueRating?: number;
  valueCategory?: ValueCategory;
  lastUpdated?: string;
  confidence: ConfidenceLevel;
  dataSource?: string;
  insights?: MarketInsight[];
  recommendations?: string[];
}

export interface PriceRange {
  min: number;
  max: number;
}

export type MarketPosition = 'above' | 'below' | 'at';
export type PriceTrend = 'increasing' | 'decreasing' | 'stable';
export type DemandLevel = 'high' | 'medium' | 'low';
export type ValueCategory = 'excellent' | 'good' | 'fair' | 'poor';

export interface MarketInsight {
  type: string;
  message: string;
  impact?: 'positive' | 'negative' | 'neutral';
}

// =============================================================================
// AUSTRALIAN DATA (ANCAP, etc.)
// =============================================================================

export interface AustralianData {
  ancapRating?: number;
  ancapYear?: string;
  ancapDetails?: ANCAPDetails;
  warrantyTerms?: string;
  serviceCosts?: ServiceCostEstimate;
  recommendedFuel?: string;
  greenVehicleGuideRating?: number;
}

export interface ANCAPDetails {
  ancapId?: string;
  overallRating: number;
  testYear?: number;
  adultOccupantScore?: number;
  childOccupantScore?: number;
  vulnerableRoadUserScore?: number;
  safetyAssistScore?: number;
  collisionAvoidance?: CollisionAvoidanceRating;
  technicalReportUrl?: string;
  isCurrentModel?: boolean;
  energySources?: string;
  aeb?: AEBDetails;
  laneSupportSystem?: string;
}

export type CollisionAvoidanceRating = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Not Rated';

export interface AEBDetails {
  pedestrian?: boolean;
  cyclist?: boolean;
  junction?: boolean;
  interurban?: boolean;
}

export interface ServiceCostEstimate {
  annualEstimate?: number;
  firstServiceCost?: number;
  cappedPriceService?: boolean;
  serviceIntervalKm?: number;
  serviceIntervalMonths?: number;
}

// =============================================================================
// DATABASE CACHE TYPES (Supabase)
// =============================================================================

export interface VehicleSpecsCache {
  id?: string;
  make: string;
  model: string;
  year: number;
  variant?: string;

  // Engine
  engine_type?: string;
  engine_size?: string;
  cylinders?: number;
  power_kw?: number;
  power_hp?: number;
  torque_nm?: number;
  fuel_type?: string;
  transmission?: string;
  drive_type?: string;

  // Dimensions
  length_mm?: number;
  width_mm?: number;
  height_mm?: number;
  wheelbase_mm?: number;
  ground_clearance_mm?: number;
  kerb_weight_kg?: number;
  gross_vehicle_mass_kg?: number;
  towing_capacity_kg?: number;

  // Performance
  acceleration_0_100_sec?: number;
  top_speed_kmh?: number;
  fuel_consumption_combined?: number;
  fuel_consumption_urban?: number;
  fuel_consumption_extra_urban?: number;
  co2_emissions_gkm?: number;

  // Features (JSONB)
  standard_features?: string[];
  optional_features?: string[];
  safety_features?: string[];

  // Metadata
  fetched_at?: string;
  last_verified_at?: string;
  source?: string;
  api_response?: Record<string, unknown>;
}

export interface ANCAPRatingCache {
  id?: string;
  make: string;
  model: string;
  year: number;
  variant?: string;

  ancap_id?: string;
  star_rating: number;
  test_year?: number;
  collision_avoidance?: string;

  safety_score?: number;
  adult_occupant?: number;
  child_occupant?: number;
  vulnerable_road_users?: number;
  safety_assist?: number;

  technical_report_url?: string;
  energy_sources?: string;
  is_current_model?: boolean;
  autonomous_emergency_braking?: string;
  lane_support_system?: string;

  fetched_at?: string;
  last_verified_at?: string;
  api_response?: Record<string, unknown>;
}

export interface MarketDataCache {
  id?: string;
  make: string;
  model: string;
  year: number;
  variant?: string;
  condition?: string;
  kms_range?: string;
  location?: string;

  average_price?: number;
  median_price?: number;
  price_range_min?: number;
  price_range_max?: number;
  market_position?: string;
  price_trend?: string;

  competitor_count?: number;
  demand_level?: string;
  estimated_days_to_sell?: number;
  time_on_market_avg?: number;

  value_rating?: number;
  value_category?: string;

  market_insights?: Record<string, unknown>;
  recommendations?: string[];
  seasonal_factors?: Record<string, unknown>;
  competitor_sample?: Record<string, unknown>[];

  data_source?: string;
  confidence?: string;
  fetched_at?: string;
  last_verified_at?: string;
  cache_expires_at?: string;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

export interface EnrichmentRequest {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  variant?: string;
  condition?: 'new' | 'used' | 'demo';
  odometer?: number;
  location?: string;
  forceRefresh?: boolean;
}

export interface EnrichmentResponse {
  success: boolean;
  data?: VehicleEnrichment;
  error?: string;
  cached: boolean;
  processingTimeMs: number;
}

export interface AIEnrichmentRequest {
  make: string;
  model: string;
  year: number;
  variant?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  existingData?: Partial<VehicleSpecifications>;
}

export interface AIEnrichmentResponse {
  specifications: Partial<VehicleSpecifications>;
  features: Partial<VehicleFeatures>;
  description?: string;
  series?: string;
  generation?: string;
  modelCode?: string;
  confidence: ConfidenceLevel;
  tokensUsed?: number;
}

// =============================================================================
// CACHE STATISTICS
// =============================================================================

export interface CacheStats {
  totalSpecsRecords: number;
  totalAncapRecords: number;
  totalMarketRecords: number;
  cacheHitRate: number;
  avgResponseTimeMs: number;
  lastUpdated: string;
  oldestRecord?: string;
  newestRecord?: string;
}

// =============================================================================
// VEHICLE INPUT (from inventory system)
// =============================================================================

export interface VehicleInput {
  id: string;
  stockNumber?: string;
  make: string;
  model: string;
  year: number;
  variant?: string;
  badge?: string;
  series?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  driveType?: string;
  engineSize?: string;
  colour?: string;
  odometer?: number;
  price?: number;
  condition?: 'new' | 'used' | 'demo';
  location?: string;
  registrationState?: string;
}

// =============================================================================
// ANCAP API TYPES
// =============================================================================

export interface ANCAPSearchResult {
  id: string;
  make: string;
  model: string;
  variant?: string;
  year_from: number;
  year_to: number;
  rating: number;
  test_year: number;
}

export interface ANCAPVehicleDetail {
  id: string;
  make: string;
  model: string;
  variant?: string;
  rating: number;
  test_year: number;
  adult_occupant: number;
  child_occupant: number;
  vulnerable_road_user: number;
  safety_assist: number;
  collision_avoidance?: string;
  technical_report_url?: string;
  aeb_pedestrian?: boolean;
  aeb_cyclist?: boolean;
  aeb_junction?: boolean;
  lane_support?: string;
  energy_sources?: string;
}
