# Vehicle Enrichment System Documentation

A comprehensive guide to the AI-powered vehicle enrichment system integrated with Supabase for caching and cross-application data sharing.

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Type Definitions | ✅ Implemented | `/server/types/enrichment.ts` |
| Groq Enrichment Service | ✅ Implemented | `/server/services/groq-enrichment.ts` |
| Vehicle Enrichment Cache | ✅ Implemented | `/server/services/vehicle-enrichment-cache.ts` |
| API: `/api/vehicle-enrichment/[id]` | ✅ Implemented | Primary endpoint |
| API: `/api/vehicle-enrichment-optimized/[id]` | ✅ Implemented | With aggressive caching |
| API: `/api/test/vehicle-enrichment-cache` | ✅ Implemented | Diagnostic endpoint |
| Supabase Tables | ✅ Migrations Ready | See `/database/migrations/` |
| ANCAP Integration | ✅ Implemented | Public API integration |
| Market Data (Perplexity) | ⚠️ Optional | Requires `PERPLEXITY_API_KEY` |

**Last Updated**: December 2024

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Data Flow](#data-flow)
- [Supabase Database Schema](#supabase-database-schema)
- [API Endpoints](#api-endpoints)
- [Core Services](#core-services)
- [External Data Sources](#external-data-sources)
- [Integration Guide](#integration-guide)
- [Configuration](#configuration)
- [Performance Characteristics](#performance-characteristics)

---

## Overview

The Vehicle Enrichment System transforms basic vehicle inventory data into comprehensive vehicle profiles using AI and external data sources. Key capabilities:

- **AI-Generated Specifications**: Detailed engine, performance, and dimension specs
- **Safety Ratings**: ANCAP star ratings and safety assist scores
- **Market Intelligence**: Pricing trends, demand analysis, and value ratings
- **Feature Categorization**: Safety, comfort, technology, performance features
- **Cross-Application Caching**: Shared Supabase database serves multiple dealership sites

### Current Stack

| Component | Technology |
|-----------|------------|
| AI Provider | Groq (llama-3.1-8b-instant) |
| Database | Supabase (PostgreSQL) |
| Framework | Nuxt 3 / Node.js |
| Safety Data | ANCAP API |
| Market Data | Perplexity API (optional) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vehicle Enrichment System                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Frontend   │───▶│  API Layer   │───▶│  Enrichment      │  │
│  │   Request    │    │  /api/...    │    │  Orchestrator    │  │
│  └──────────────┘    └──────────────┘    └────────┬─────────┘  │
│                                                    │            │
│                      ┌────────────────────────────┼──────────┐ │
│                      │           Cache Check      ▼          │ │
│                      │    ┌─────────────────────────────┐    │ │
│                      │    │      Supabase Database      │    │ │
│                      │    │  ┌─────────────────────────┐│    │ │
│                      │    │  │ vehicle_specifications  ││    │ │
│                      │    │  │ ancap_ratings           ││    │ │
│                      │    │  │ market_data_cache       ││    │ │
│                      │    │  └─────────────────────────┘│    │ │
│                      │    └─────────────────────────────┘    │ │
│                      │              │ Cache Miss             │ │
│                      └──────────────┼────────────────────────┘ │
│                                     ▼                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              External Data Sources                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │  Groq AI   │  │ ANCAP API  │  │ Perplexity/Brave   │  │  │
│  │  │  (Specs)   │  │  (Safety)  │  │  (Market Data)     │  │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Complete Enrichment Flow

```
1. User visits vehicle page
         ↓
2. Frontend requests: GET /api/vehicle-enrichment/[id]
         ↓
3. Nuxt Server API validates request
         ↓
4. Generate vehicle fingerprint (e.g., "2025-skoda-superb-195tsi-sportline")
         ↓
5. Check Supabase cache using fingerprint
         ↓
   ┌─────────────────────────────────┐
   │          Cache Hit?             │
   └─────────────────────────────────┘
         │                    │
      [YES]                 [NO]
         │                    │
         ▼                    ▼
   Return cached         Fetch from APIs:
   data (<50ms)          ├─ Groq AI (specs/features)
         │               ├─ ANCAP API (safety)
         │               └─ Perplexity (market)
         │                    │
         │                    ▼
         │               Transform & validate
         │                    │
         │                    ▼
         │               Save to Supabase
         │                    │
         └────────────────────┘
                    │
                    ▼
         Return enriched data to frontend
```

### Vehicle Fingerprinting

The system uses fingerprinting to maximize cache efficiency:

```typescript
// Input: "2025 Skoda Superb 195TSI Sportline Manual"
// Process:
//   1. Convert to lowercase
//   2. Replace non-alphanumeric with hyphens
//   3. Remove leading/trailing hyphens
// Output: "2025-skoda-superb-195tsi-sportline-manual"
```

**Benefits**:
- Same vehicle across different dealerships = same enrichment
- 90%+ API cost reduction through cache hits
- Sub-50ms response times for cached data

---

## Supabase Database Schema

### Connection Details

| Property | Value |
|----------|-------|
| Project ID | `mdddirmntbuoumxbwrwr` |
| Purpose | Centralized enrichment cache |
| Access | Shared across dealership sites |

### Table: `vehicle_specifications`

Stores detailed vehicle specifications from AI enrichment.

```sql
CREATE TABLE vehicle_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vehicle identification
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  variant VARCHAR(100),

  -- Engine specifications
  engine_type VARCHAR(100),
  engine_size VARCHAR(50),
  cylinders INTEGER,
  power_kw DECIMAL(8,2),
  power_hp DECIMAL(8,2),
  torque_nm DECIMAL(8,2),
  fuel_type VARCHAR(50),
  transmission VARCHAR(100),
  drive_type VARCHAR(50),

  -- Dimensions (in mm and kg)
  length_mm INTEGER,
  width_mm INTEGER,
  height_mm INTEGER,
  wheelbase_mm INTEGER,
  ground_clearance_mm INTEGER,
  kerb_weight_kg INTEGER,
  gross_vehicle_mass_kg INTEGER,
  towing_capacity_kg INTEGER,

  -- Performance metrics
  acceleration_0_100_sec DECIMAL(5,2),
  top_speed_kmh INTEGER,
  fuel_consumption_combined DECIMAL(5,2),
  fuel_consumption_urban DECIMAL(5,2),
  fuel_consumption_extra_urban DECIMAL(5,2),
  co2_emissions_gkm INTEGER,

  -- Features (stored as JSONB arrays)
  standard_features JSONB,
  optional_features JSONB,
  safety_features JSONB,

  -- Cache metadata
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  source VARCHAR(100),
  api_response JSONB,

  -- Constraints
  UNIQUE(make, model, year, variant)
);

-- Performance indexes
CREATE INDEX idx_specs_make_model_year ON vehicle_specifications(make, model, year);
CREATE INDEX idx_specs_fetched_at ON vehicle_specifications(fetched_at DESC);
CREATE INDEX idx_specs_lookup ON vehicle_specifications(LOWER(make), LOWER(model));
```

**Cache Expiry**: 90 days

### Table: `ancap_ratings`

Stores official ANCAP safety ratings.

```sql
CREATE TABLE ancap_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vehicle identification
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  variant VARCHAR(100),

  -- ANCAP core data
  ancap_id VARCHAR(50),
  star_rating INTEGER CHECK (star_rating >= 0 AND star_rating <= 5),
  test_year INTEGER,
  collision_avoidance VARCHAR(20), -- Platinum/Gold/Silver/Bronze

  -- Safety scores (0-100 scale)
  safety_score DECIMAL(5,2),
  adult_occupant DECIMAL(5,2),
  child_occupant DECIMAL(5,2),
  vulnerable_road_users DECIMAL(5,2),
  safety_assist DECIMAL(5,2),

  -- Additional details
  technical_report_url TEXT,
  energy_sources VARCHAR(100),
  is_current_model BOOLEAN,
  autonomous_emergency_braking VARCHAR(100),
  lane_support_system VARCHAR(100),

  -- Cache metadata
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  api_response JSONB,

  -- Constraints
  UNIQUE(make, model, year, variant)
);

-- Performance indexes
CREATE INDEX idx_ancap_make_model_year ON ancap_ratings(make, model, year);
CREATE INDEX idx_ancap_star_rating ON ancap_ratings(star_rating);
CREATE INDEX idx_ancap_test_year ON ancap_ratings(test_year DESC);
```

**Cache Expiry**: 90 days

### Table: `market_data_cache`

Stores market pricing and demand intelligence.

```sql
CREATE TABLE market_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vehicle identification
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  variant VARCHAR(100),
  condition VARCHAR(50),        -- 'new', 'used', 'demo'
  kms_range VARCHAR(50),        -- '0-50000', '50000-100000', '100000+'
  location VARCHAR(100),        -- State/region

  -- Pricing metrics
  average_price DECIMAL(10,2),
  median_price DECIMAL(10,2),
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  market_position VARCHAR(20),  -- 'above', 'below', 'at'
  price_trend VARCHAR(20),      -- 'increasing', 'decreasing', 'stable'

  -- Demand metrics
  competitor_count INTEGER,
  demand_level VARCHAR(20),     -- 'high', 'medium', 'low'
  estimated_days_to_sell INTEGER,
  time_on_market_avg INTEGER,

  -- Value assessment
  value_rating DECIMAL(3,1),    -- 0.0-10.0 scale
  value_category VARCHAR(20),   -- 'excellent', 'good', 'fair', 'poor'

  -- Detailed insights (JSONB)
  market_insights JSONB,
  recommendations JSONB,
  seasonal_factors JSONB,
  competitor_sample JSONB,

  -- Cache metadata
  data_source VARCHAR(100),     -- 'brave_groq', 'autograb', 'combined'
  confidence VARCHAR(20),       -- 'high', 'medium', 'low'
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  cache_expires_at TIMESTAMPTZ, -- 7 days from fetch

  -- Constraints
  UNIQUE(make, model, year, variant, condition, kms_range, location)
);
```

**Cache Expiry**: 7 days (market data changes frequently)

---

## API Endpoints

### Primary Enrichment Endpoint

```
GET /api/vehicle-enrichment/[id]
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | path | Vehicle ID (UUID, stock number, or identifier) |
| `force` | query | Set to `true` to skip cache and refresh |

**Response**: Complete `VehicleEnrichment` object

**Headers**:
```http
Cache-Control: max-age=600, stale-while-revalidate=1800
```

**Example**:
```bash
curl https://your-site.com/api/vehicle-enrichment/abc123-uuid
curl https://your-site.com/api/vehicle-enrichment/abc123-uuid?force=true
```

### Optimized Enrichment Endpoint

```
GET /api/vehicle-enrichment-optimized/[id]
```

Combines specs, ANCAP, and market data with aggressive caching.

| Metric | Cache Hit | Cache Miss |
|--------|-----------|------------|
| Response Time | <100ms | 1-4s |
| Expected Hit Rate | 95%+ | - |

### Test/Diagnostic Endpoint

```
GET /api/test/vehicle-enrichment-cache
```

Returns cache health, performance benchmarks, and data validation results.

---

## Core Services

### Groq Enrichment Service

**Location**: `/server/services/groq-enrichment.ts`

Main orchestrator for the enrichment process.

```typescript
// Key methods
enrichVehicle(vehicle: Vehicle, forceRefresh?: boolean): Promise<VehicleEnrichment>
prepareEnrichmentRequest(vehicle: Vehicle): AIEnrichmentRequest
callGroqAPI(request: AIEnrichmentRequest): Promise<AIResponse>
transformAIResponse(vehicleId, aiData, request): Promise<VehicleEnrichment>
```

### Vehicle Enrichment Cache Service

**Location**: `/server/services/vehicle-enrichment-cache.ts`

Manages Supabase caching layer.

```typescript
// Key methods
getVehicleSpecs(make, model, year, variant?): Promise<VehicleSpecs | null>
getANCAPRating(make, model, year, variant?): Promise<ANCAPRating | null>
getMarketData(make, model, year, condition, kms?, location?): Promise<MarketData>
batchGetEnrichment(vehicles[]): Promise<EnrichmentResult[]>
getCacheStats(): Promise<CacheStats>
```

### Supabase Vehicle Service

**Location**: `/server/services/supabase-vehicle-service.ts`

Database access layer for vehicle data.

```typescript
// Key methods
getVehicleByAnyIdentifier(idOrStock, restrictToSellers?): Promise<Vehicle>
getVehiclesWithBadgeStatus(sellerIds, options): Promise<VehicleQueryResult>
transformVehicleToFrontendFormat(dbVehicle): Vehicle
```

---

## External Data Sources

### Groq AI

| Property | Value |
|----------|-------|
| Model | `llama-3.1-8b-instant` |
| Purpose | Specifications, features, descriptions |
| Endpoint | `https://api.groq.com/openai/v1/chat/completions` |
| Env Variable | `AI_API_KEY` |

### ANCAP API

| Property | Value |
|----------|-------|
| Purpose | Official Australian safety ratings |
| API Key Required | No (public API) |
| Data | Star ratings (0-5), safety scores, collision avoidance |
| Cache Duration | 90 days |

### Perplexity API (Optional)

| Property | Value |
|----------|-------|
| Purpose | Australian market intelligence |
| Env Variable | `PERPLEXITY_API_KEY` |
| Data | Pricing trends, demand analysis |

---

## Integration Guide

### Option 1: Direct API Integration

For any JavaScript/TypeScript application:

```javascript
// Fetch enriched vehicle data
const response = await fetch(
  'https://your-dealership-site.com/api/vehicle-enrichment/VEHICLE_ID'
);
const enrichedData = await response.json();

// Access enrichment data
console.log(enrichedData.features.safety);           // Safety features
console.log(enrichedData.specifications.engine);     // Engine specs
console.log(enrichedData.marketData.averagePrice);   // Market pricing
console.log(enrichedData.australianData.ancapRating); // ANCAP stars
```

### Option 2: Direct Supabase Access

For applications that need direct database access:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mdddirmntbuoumxbwrwr.supabase.co',
  'your-api-key'
);

// Get vehicle specifications
const { data: specs } = await supabase
  .from('vehicle_specifications')
  .select('*')
  .eq('make', 'Skoda')
  .eq('model', 'Superb')
  .eq('year', 2025)
  .single();

// Get ANCAP ratings
const { data: ancap } = await supabase
  .from('ancap_ratings')
  .select('*')
  .eq('make', 'Skoda')
  .eq('model', 'Superb')
  .eq('year', 2025)
  .single();

// Get market data
const { data: market } = await supabase
  .from('market_data_cache')
  .select('*')
  .eq('make', 'Skoda')
  .eq('model', 'Superb')
  .eq('year', 2025)
  .eq('condition', 'new')
  .single();
```

### Option 3: Backend Service Integration

For Nuxt/Node.js backends:

```typescript
import { vehicleEnrichmentCache } from '~/server/services/vehicle-enrichment-cache';

// Get individual data types
const specs = await vehicleEnrichmentCache.getVehicleSpecs(
  'Skoda', 'Superb', 2025, 'Sportline'
);

const ancap = await vehicleEnrichmentCache.getANCAPRating(
  'Skoda', 'Superb', 2025
);

const market = await vehicleEnrichmentCache.getMarketData(
  'Skoda', 'Superb', 2025, 'new'
);

// Batch fetch for multiple vehicles
const enrichmentResults = await vehicleEnrichmentCache.batchGetEnrichment([
  { make: 'Skoda', model: 'Superb', year: 2025 },
  { make: 'Toyota', model: 'Camry', year: 2024 },
]);
```

### Option 4: Adding Data to the Enrichment Database

To contribute new enrichment data:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mdddirmntbuoumxbwrwr.supabase.co',
  'YOUR_SERVICE_ROLE_KEY' // Requires write access
);

// Insert new vehicle specifications
const { data, error } = await supabase
  .from('vehicle_specifications')
  .upsert({
    make: 'NewBrand',
    model: 'NewModel',
    year: 2025,
    variant: 'Base',
    engine_type: 'Turbocharged Petrol',
    power_kw: 150,
    torque_nm: 300,
    fuel_type: 'Petrol',
    transmission: '8-Speed Automatic',
    standard_features: ['Apple CarPlay', 'Android Auto', 'LED Headlights'],
    safety_features: ['AEB', 'Lane Keep Assist', 'Blind Spot Monitoring'],
    source: 'manual_entry',
    fetched_at: new Date().toISOString()
  }, {
    onConflict: 'make,model,year,variant'
  });

// Insert ANCAP rating
const { data: ancapData, error: ancapError } = await supabase
  .from('ancap_ratings')
  .upsert({
    make: 'NewBrand',
    model: 'NewModel',
    year: 2025,
    star_rating: 5,
    test_year: 2024,
    adult_occupant: 92.5,
    child_occupant: 87.3,
    safety_assist: 85.0,
    source: 'manual_entry',
    fetched_at: new Date().toISOString()
  }, {
    onConflict: 'make,model,year,variant'
  });
```

---

## Configuration

### Environment Variables

```bash
# Enable/Disable System
DISABLE_ENRICHMENT=false              # Set to 'true' to disable

# API Keys (Required)
AI_API_KEY=gsk-xxxxxxxxxxxxx          # Groq AI key
PERPLEXITY_API_KEY=pplx-xxxxxx        # Market data (optional)

# Supabase Connection
NUXT_VEHICLE_SPECS_SUPABASE_URL=https://mdddirmntbuoumxbwrwr.supabase.co
NUXT_VEHICLE_SPECS_SUPABASE_KEY=eyJ...        # Anon key (read access)
NUXT_VEHICLE_SPECS_SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Service role (write access)

# Cache Configuration
ENRICHMENT_CACHE_DAYS=90              # Spec cache expiry (days)
ENRICHMENT_MIN_CONFIDENCE=medium      # Minimum AI confidence level
```

### Enabling/Disabling Enrichment

| Environment | Default | Override |
|-------------|---------|----------|
| Production | Enabled | `DISABLE_ENRICHMENT=true` |
| Development | Disabled | `DISABLE_ENRICHMENT=false` |

---

## Performance Characteristics

### Response Times

| Scenario | Response Time | Notes |
|----------|---------------|-------|
| Cache Hit | <50ms | Supabase query only |
| Cache Miss | 3-5 seconds | API calls + DB write |
| Optimized Endpoint Hit | <100ms | Aggressive caching |

### Cost Efficiency

| Metric | Value |
|--------|-------|
| Cache Hit Rate | 90%+ expected |
| API Cost (hit) | $0.00 |
| API Cost (miss) | $0.05-0.15 |

### HTTP Caching Headers

```http
Cache-Control: max-age=600, stale-while-revalidate=1800
# Browser: 10 minutes
# CDN: 30 minutes stale-while-revalidate
```

---

## Data Structure Reference

### VehicleEnrichment Type

```typescript
interface VehicleEnrichment {
  vehicleId: string;
  vehicleFingerprint: string;
  enrichedAt: string;
  description?: string;

  features: {
    safety: FeatureCategory;
    comfort: FeatureCategory;
    technology: FeatureCategory;
    performance: FeatureCategory;
    electric?: FeatureCategory;
  };

  specifications: {
    structured?: boolean;
    engine?: EngineSpecs;
    electric?: ElectricSpecs;
    dimensions: DimensionSpecs;
    performance: PerformanceSpecs;
    efficiency: EfficiencySpecs;
    drivetrain?: DrivetrainSpecs;
    suspension?: SuspensionSpecs;
    brakes?: BrakeSpecs;
    wheels?: WheelSpecs;
    safety?: SafetySpecs;
    interior?: InteriorSpecs;
    exterior?: ExteriorSpecs;
    warranty?: WarrantySpecs;
  };

  marketData: {
    averagePrice: number;
    priceRange: { min: number; max: number };
    marketPosition: 'above' | 'below' | 'at';
    trend: 'increasing' | 'decreasing' | 'stable';
    lastUpdated: string;
    confidence: 'high' | 'medium' | 'low';
    dataSource: string;
  };

  australianData: {
    ancapRating?: number;
    ancapYear?: string;
    ancapDetails?: ANCAPDetails;
    warrantyTerms?: string;
    serviceCosts?: ServiceCostEstimate;
    recommendedFuel?: string;
  };

  confidence: 'high' | 'medium' | 'low';
  source: 'driveagent' | 'fallback' | 'cached';
}
```

---

## Fault Tolerance

The system handles failures gracefully:

| Failure Type | Behavior |
|--------------|----------|
| API timeout | Returns fallback enrichment |
| Cache unavailable | Works without persistent caching |
| Missing fields | Uses defaults, handles nulls |
| Invalid ANCAP rating | Validates 0-5 range, rejects invalid |
| Stale data | Serves stale while revalidating |
| Network errors | Non-blocking, page works without enrichment |

---

## Migration Scripts

SQL migrations are available in `/database/migrations/`:

1. `001_create_vehicle_specifications_cache.sql` - Detailed vehicle specs (90-day cache)
2. `002_create_ancap_ratings_cache.sql` - Safety ratings (90-day cache)
3. `003_create_market_data_cache.sql` - Market intelligence (7-day cache)

### Running Migrations

**In Supabase Dashboard:**

1. Go to SQL Editor
2. Open each migration file in order
3. Execute each script

**Via CLI:**

```bash
# Using psql
psql -h db.mdddirmntbuoumxbwrwr.supabase.co -U postgres -d postgres \
  -f database/migrations/001_create_vehicle_specifications_cache.sql \
  -f database/migrations/002_create_ancap_ratings_cache.sql \
  -f database/migrations/003_create_market_data_cache.sql
```

Each migration includes:
- Table creation with proper types
- Unique constraints for upsert operations
- Performance indexes
- Updated_at triggers
- Comprehensive documentation comments

---

## Quick Start

### 1. Set Environment Variables

```bash
# .env
AI_API_KEY=gsk-xxxxxxxxxxxxx                    # Required: Groq API key
NUXT_VEHICLE_SPECS_SUPABASE_URL=https://xxx.supabase.co  # Required: Supabase URL
NUXT_VEHICLE_SPECS_SUPABASE_KEY=eyJ...          # Required: Supabase anon key
NUXT_VEHICLE_SPECS_SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Optional: For writes
PERPLEXITY_API_KEY=pplx-xxxxxx                  # Optional: Market data
```

### 2. Run Database Migrations

Execute the SQL files in `/database/migrations/` on your Supabase instance.

### 3. Test the System

```bash
# Test diagnostic endpoint
curl http://localhost:3000/api/test/vehicle-enrichment-cache

# Test enrichment (format: year-make-model)
curl http://localhost:3000/api/vehicle-enrichment-optimized/2024-toyota-camry-ascent
```

### 4. Integration Example

```typescript
// In your Vue component or composable
const { data: enrichment } = await useFetch(`/api/vehicle-enrichment/${vehicle.id}`);

// Access enriched data
console.log(enrichment.specifications.engine);     // Engine specs
console.log(enrichment.australianData.ancapRating); // ANCAP stars
console.log(enrichment.features.safety.items);     // Safety features
```
