-- ============================================================================
-- Market Data Cache Table
-- Migration: 003_create_market_data_cache.sql
-- Description: Stores market pricing and demand intelligence
-- Cache Expiry: 7 days (market data changes frequently)
-- ============================================================================

-- Create the table
CREATE TABLE IF NOT EXISTS market_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vehicle identification
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  variant VARCHAR(100),
  condition VARCHAR(50), -- 'new', 'used', 'demo'
  kms_range VARCHAR(50), -- '0-50000', '50000-100000', '100000+'
  location VARCHAR(100), -- State/region (e.g., 'VIC', 'NSW', 'Australia')

  -- Pricing metrics
  average_price DECIMAL(10,2),
  median_price DECIMAL(10,2),
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  market_position VARCHAR(20), -- 'above', 'below', 'at'
  price_trend VARCHAR(20), -- 'increasing', 'decreasing', 'stable'

  -- Demand metrics
  competitor_count INTEGER,
  demand_level VARCHAR(20), -- 'high', 'medium', 'low'
  estimated_days_to_sell INTEGER,
  time_on_market_avg INTEGER,

  -- Value assessment
  value_rating DECIMAL(3,1), -- 0.0-10.0 scale
  value_category VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'

  -- Detailed insights (JSONB)
  market_insights JSONB DEFAULT '[]'::JSONB,
  recommendations JSONB DEFAULT '[]'::JSONB,
  seasonal_factors JSONB DEFAULT '{}'::JSONB,
  competitor_sample JSONB DEFAULT '[]'::JSONB,

  -- Cache metadata
  data_source VARCHAR(100), -- 'brave_groq', 'perplexity', 'autograb', 'combined'
  confidence VARCHAR(20), -- 'high', 'medium', 'low'
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  cache_expires_at TIMESTAMPTZ, -- 7 days from fetch

  -- Constraints
  CONSTRAINT market_data_unique UNIQUE(make, model, year, variant, condition, kms_range, location),
  CONSTRAINT valid_market_year CHECK (year >= 1900 AND year <= 2100),
  CONSTRAINT valid_value_rating CHECK (value_rating IS NULL OR (value_rating >= 0 AND value_rating <= 10)),
  CONSTRAINT valid_condition CHECK (condition IS NULL OR condition IN ('new', 'used', 'demo')),
  CONSTRAINT valid_market_position CHECK (market_position IS NULL OR market_position IN ('above', 'below', 'at')),
  CONSTRAINT valid_price_trend CHECK (price_trend IS NULL OR price_trend IN ('increasing', 'decreasing', 'stable')),
  CONSTRAINT valid_demand_level CHECK (demand_level IS NULL OR demand_level IN ('high', 'medium', 'low')),
  CONSTRAINT valid_value_category CHECK (value_category IS NULL OR value_category IN ('excellent', 'good', 'fair', 'poor')),
  CONSTRAINT valid_confidence CHECK (confidence IS NULL OR confidence IN ('high', 'medium', 'low'))
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_market_make_model_year
  ON market_data_cache(make, model, year);

CREATE INDEX IF NOT EXISTS idx_market_condition
  ON market_data_cache(condition);

CREATE INDEX IF NOT EXISTS idx_market_location
  ON market_data_cache(location);

CREATE INDEX IF NOT EXISTS idx_market_fetched_at
  ON market_data_cache(fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_expires_at
  ON market_data_cache(cache_expires_at);

CREATE INDEX IF NOT EXISTS idx_market_demand_level
  ON market_data_cache(demand_level);

CREATE INDEX IF NOT EXISTS idx_market_value_category
  ON market_data_cache(value_category);

CREATE INDEX IF NOT EXISTS idx_market_lookup
  ON market_data_cache(LOWER(make), LOWER(model), year, condition);

-- Add trigger for automatic cache_expires_at on insert
CREATE OR REPLACE FUNCTION set_market_cache_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cache_expires_at IS NULL THEN
        NEW.cache_expires_at = NOW() + INTERVAL '7 days';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_market_data_cache_expiry ON market_data_cache;
CREATE TRIGGER set_market_data_cache_expiry
    BEFORE INSERT ON market_data_cache
    FOR EACH ROW
    EXECUTE FUNCTION set_market_cache_expiry();

-- Add trigger for automatic last_verified_at update
DROP TRIGGER IF EXISTS update_market_data_cache_updated_at ON market_data_cache;
CREATE TRIGGER update_market_data_cache_updated_at
    BEFORE UPDATE ON market_data_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your Supabase roles)
-- GRANT SELECT ON market_data_cache TO anon;
-- GRANT ALL ON market_data_cache TO service_role;

-- Add comments for documentation
COMMENT ON TABLE market_data_cache IS 'Cached market pricing and demand data. Expires after 7 days.';
COMMENT ON COLUMN market_data_cache.condition IS 'Vehicle condition: new, used, demo';
COMMENT ON COLUMN market_data_cache.kms_range IS 'Odometer range category: 0-50000, 50000-100000, 100000+';
COMMENT ON COLUMN market_data_cache.location IS 'Geographic region: State code (VIC, NSW, etc.) or Australia';
COMMENT ON COLUMN market_data_cache.market_position IS 'Price position vs market: above, below, at';
COMMENT ON COLUMN market_data_cache.price_trend IS 'Price trend direction: increasing, decreasing, stable';
COMMENT ON COLUMN market_data_cache.demand_level IS 'Market demand: high, medium, low';
COMMENT ON COLUMN market_data_cache.value_rating IS 'Value for money rating (0.0-10.0)';
COMMENT ON COLUMN market_data_cache.value_category IS 'Value category: excellent, good, fair, poor';
COMMENT ON COLUMN market_data_cache.data_source IS 'Data source: brave_groq, perplexity, autograb, combined';
COMMENT ON COLUMN market_data_cache.cache_expires_at IS 'When this cache entry expires (7 days from fetch)';
