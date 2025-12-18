-- ============================================================================
-- Vehicle Specifications Cache Table
-- Migration: 001_create_vehicle_specifications_cache.sql
-- Description: Stores detailed vehicle specifications from AI enrichment
-- Cache Expiry: 90 days
-- ============================================================================

-- Create the table
CREATE TABLE IF NOT EXISTS vehicle_specifications (
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
  boot_capacity_l INTEGER,
  fuel_tank_l INTEGER,

  -- Performance metrics
  acceleration_0_100_sec DECIMAL(5,2),
  top_speed_kmh INTEGER,
  fuel_consumption_combined DECIMAL(5,2),
  fuel_consumption_urban DECIMAL(5,2),
  fuel_consumption_extra_urban DECIMAL(5,2),
  co2_emissions_gkm INTEGER,

  -- Features (stored as JSONB arrays)
  standard_features JSONB DEFAULT '[]'::JSONB,
  optional_features JSONB DEFAULT '[]'::JSONB,
  safety_features JSONB DEFAULT '[]'::JSONB,

  -- Cache metadata
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  source VARCHAR(100),
  api_response JSONB,

  -- Constraints
  CONSTRAINT vehicle_specs_unique UNIQUE(make, model, year, variant),
  CONSTRAINT valid_year CHECK (year >= 1900 AND year <= 2100),
  CONSTRAINT valid_star_rating CHECK (cylinders IS NULL OR (cylinders >= 0 AND cylinders <= 16))
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_specs_make_model_year
  ON vehicle_specifications(make, model, year);

CREATE INDEX IF NOT EXISTS idx_specs_fetched_at
  ON vehicle_specifications(fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_specs_lookup
  ON vehicle_specifications(LOWER(make), LOWER(model));

CREATE INDEX IF NOT EXISTS idx_specs_fuel_type
  ON vehicle_specifications(fuel_type);

CREATE INDEX IF NOT EXISTS idx_specs_drive_type
  ON vehicle_specifications(drive_type);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_verified_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for automatic last_verified_at update
DROP TRIGGER IF EXISTS update_vehicle_specifications_updated_at ON vehicle_specifications;
CREATE TRIGGER update_vehicle_specifications_updated_at
    BEFORE UPDATE ON vehicle_specifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional - configure based on your needs)
-- ALTER TABLE vehicle_specifications ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust based on your Supabase roles)
-- GRANT SELECT ON vehicle_specifications TO anon;
-- GRANT ALL ON vehicle_specifications TO service_role;

-- Add comments for documentation
COMMENT ON TABLE vehicle_specifications IS 'Cached vehicle specifications from AI enrichment. Expires after 90 days.';
COMMENT ON COLUMN vehicle_specifications.make IS 'Vehicle manufacturer (e.g., Toyota, Honda)';
COMMENT ON COLUMN vehicle_specifications.model IS 'Vehicle model name (e.g., Camry, Civic)';
COMMENT ON COLUMN vehicle_specifications.year IS 'Model year';
COMMENT ON COLUMN vehicle_specifications.variant IS 'Variant/trim level (e.g., Sportline, Platinum)';
COMMENT ON COLUMN vehicle_specifications.source IS 'Data source: groq_ai, manual_entry, api_sync';
COMMENT ON COLUMN vehicle_specifications.fetched_at IS 'When the data was originally fetched';
COMMENT ON COLUMN vehicle_specifications.last_verified_at IS 'When the data was last verified/updated';
