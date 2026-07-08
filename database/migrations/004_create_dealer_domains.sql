-- ============================================================================
-- Dealer Domains
-- Migration: 004_create_dealer_domains.sql
-- Description: Maps request hostnames to tenant dealer records.
-- Safety: Additive only. Seeds Blood Hyundai and Sale Hyundai if dealers exist.
-- ============================================================================

CREATE TABLE IF NOT EXISTS dealer_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  hostname VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT dealer_domains_hostname_lowercase CHECK (
    hostname = LOWER(TRIM(hostname))
    AND hostname <> ''
    AND hostname NOT LIKE 'http://%'
    AND hostname NOT LIKE 'https://%'
    AND hostname NOT LIKE '%/%'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dealer_domains_hostname
  ON dealer_domains(hostname);

CREATE INDEX IF NOT EXISTS idx_dealer_domains_dealer
  ON dealer_domains(dealer_id);

CREATE INDEX IF NOT EXISTS idx_dealer_domains_active_hostname
  ON dealer_domains(hostname)
  WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_dealer_domains_primary
  ON dealer_domains(dealer_id)
  WHERE is_primary = true AND is_active = true;

DROP TRIGGER IF EXISTS update_dealer_domains_updated_at ON dealer_domains;
CREATE TRIGGER update_dealer_domains_updated_at
  BEFORE UPDATE ON dealer_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO dealer_domains (dealer_id, hostname, is_primary, is_active)
SELECT id, 'bloodhyundai.com.au', true, true
FROM dealers
WHERE slug = 'bloods-hyundai'
ON CONFLICT (hostname) DO UPDATE SET
  dealer_id = EXCLUDED.dealer_id,
  is_primary = EXCLUDED.is_primary,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO dealer_domains (dealer_id, hostname, is_primary, is_active)
SELECT id, 'www.bloodhyundai.com.au', false, true
FROM dealers
WHERE slug = 'bloods-hyundai'
ON CONFLICT (hostname) DO UPDATE SET
  dealer_id = EXCLUDED.dealer_id,
  is_primary = EXCLUDED.is_primary,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO dealer_domains (dealer_id, hostname, is_primary, is_active)
SELECT id, 'salehyundai.com.au', true, true
FROM dealers
WHERE slug = 'sale-hyundai'
ON CONFLICT (hostname) DO UPDATE SET
  dealer_id = EXCLUDED.dealer_id,
  is_primary = EXCLUDED.is_primary,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO dealer_domains (dealer_id, hostname, is_primary, is_active)
SELECT id, 'www.salehyundai.com.au', false, true
FROM dealers
WHERE slug = 'sale-hyundai'
ON CONFLICT (hostname) DO UPDATE SET
  dealer_id = EXCLUDED.dealer_id,
  is_primary = EXCLUDED.is_primary,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

COMMENT ON TABLE dealer_domains IS 'Tenant hostname mappings for Hyundai universal theme deployments.';
COMMENT ON COLUMN dealer_domains.hostname IS 'Lowercase hostname only, without protocol, path, or port.';
