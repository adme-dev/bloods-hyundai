-- ============================================================================
-- ANCAP Ratings Cache Table
-- Migration: 002_create_ancap_ratings_cache.sql
-- Description: Stores official ANCAP safety ratings
-- Cache Expiry: 90 days
-- Source: https://www.ancap.com.au/
-- ============================================================================

-- Create the table
CREATE TABLE IF NOT EXISTS ancap_ratings (
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

  -- Safety scores (percentage scale 0-100)
  safety_score DECIMAL(5,2),
  adult_occupant DECIMAL(5,2),
  child_occupant DECIMAL(5,2),
  vulnerable_road_users DECIMAL(5,2),
  safety_assist DECIMAL(5,2),

  -- Additional details
  technical_report_url TEXT,
  energy_sources VARCHAR(100), -- Petrol, Diesel, Electric, Hybrid
  is_current_model BOOLEAN DEFAULT true,

  -- Safety technology details
  autonomous_emergency_braking VARCHAR(100),
  lane_support_system VARCHAR(100),
  aeb_pedestrian BOOLEAN,
  aeb_cyclist BOOLEAN,
  aeb_junction BOOLEAN,
  aeb_interurban BOOLEAN,

  -- Cache metadata
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  api_response JSONB,

  -- Constraints
  CONSTRAINT ancap_ratings_unique UNIQUE(make, model, year, variant),
  CONSTRAINT valid_ancap_year CHECK (year >= 1900 AND year <= 2100),
  CONSTRAINT valid_test_year CHECK (test_year IS NULL OR (test_year >= 2000 AND test_year <= 2100)),
  CONSTRAINT valid_adult_score CHECK (adult_occupant IS NULL OR (adult_occupant >= 0 AND adult_occupant <= 100)),
  CONSTRAINT valid_child_score CHECK (child_occupant IS NULL OR (child_occupant >= 0 AND child_occupant <= 100)),
  CONSTRAINT valid_vru_score CHECK (vulnerable_road_users IS NULL OR (vulnerable_road_users >= 0 AND vulnerable_road_users <= 100)),
  CONSTRAINT valid_safety_assist CHECK (safety_assist IS NULL OR (safety_assist >= 0 AND safety_assist <= 100))
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_ancap_make_model_year
  ON ancap_ratings(make, model, year);

CREATE INDEX IF NOT EXISTS idx_ancap_star_rating
  ON ancap_ratings(star_rating);

CREATE INDEX IF NOT EXISTS idx_ancap_test_year
  ON ancap_ratings(test_year DESC);

CREATE INDEX IF NOT EXISTS idx_ancap_lookup
  ON ancap_ratings(LOWER(make), LOWER(model));

CREATE INDEX IF NOT EXISTS idx_ancap_fetched_at
  ON ancap_ratings(fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_ancap_collision_avoidance
  ON ancap_ratings(collision_avoidance);

-- Add trigger for automatic last_verified_at update
DROP TRIGGER IF EXISTS update_ancap_ratings_updated_at ON ancap_ratings;
CREATE TRIGGER update_ancap_ratings_updated_at
    BEFORE UPDATE ON ancap_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your Supabase roles)
-- GRANT SELECT ON ancap_ratings TO anon;
-- GRANT ALL ON ancap_ratings TO service_role;

-- Add comments for documentation
COMMENT ON TABLE ancap_ratings IS 'Cached ANCAP safety ratings from official API. Expires after 90 days.';
COMMENT ON COLUMN ancap_ratings.star_rating IS 'ANCAP star rating (0-5 stars)';
COMMENT ON COLUMN ancap_ratings.collision_avoidance IS 'Collision avoidance technology rating: Platinum, Gold, Silver, Bronze';
COMMENT ON COLUMN ancap_ratings.adult_occupant IS 'Adult Occupant Protection score (0-100%)';
COMMENT ON COLUMN ancap_ratings.child_occupant IS 'Child Occupant Protection score (0-100%)';
COMMENT ON COLUMN ancap_ratings.vulnerable_road_users IS 'Vulnerable Road Users Protection score (0-100%)';
COMMENT ON COLUMN ancap_ratings.safety_assist IS 'Safety Assist score (0-100%)';
COMMENT ON COLUMN ancap_ratings.is_current_model IS 'Whether this rating applies to the current model generation';
COMMENT ON COLUMN ancap_ratings.energy_sources IS 'Vehicle energy sources: Petrol, Diesel, Electric, Hybrid';
