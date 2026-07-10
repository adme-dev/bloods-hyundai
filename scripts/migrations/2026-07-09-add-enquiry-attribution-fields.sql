-- Adds durable marketing attribution fields to CRM enquiries.
-- Apply before deploying app code that writes these columns:
--   psql "$NEON_DATABASE_URL" -f scripts/migrations/2026-07-09-add-enquiry-attribution-fields.sql

ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS utm_term varchar(255),
  ADD COLUMN IF NOT EXISTS utm_content varchar(255),
  ADD COLUMN IF NOT EXISTS gclid varchar(255),
  ADD COLUMN IF NOT EXISTS gbraid varchar(255),
  ADD COLUMN IF NOT EXISTS wbraid varchar(255),
  ADD COLUMN IF NOT EXISTS fbclid varchar(255),
  ADD COLUMN IF NOT EXISTS msclkid varchar(255),
  ADD COLUMN IF NOT EXISTS landing_page text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS chat_source varchar(100),
  ADD COLUMN IF NOT EXISTS chat_intent varchar(100),
  ADD COLUMN IF NOT EXISTS attributed_platform varchar(30),
  ADD COLUMN IF NOT EXISTS attributed_campaign_id varchar(255),
  ADD COLUMN IF NOT EXISTS attributed_campaign_name varchar(255),
  ADD COLUMN IF NOT EXISTS attribution_confidence integer,
  ADD COLUMN IF NOT EXISTS attribution_method varchar(50),
  ADD COLUMN IF NOT EXISTS attribution_matched_at timestamptz,
  ADD COLUMN IF NOT EXISTS attribution_meta jsonb;

CREATE INDEX IF NOT EXISTS idx_enquiries_attribution
  ON enquiries (dealer_id, attributed_platform, attributed_campaign_id);

CREATE INDEX IF NOT EXISTS idx_enquiries_click_ids
  ON enquiries (dealer_id, gclid, fbclid, msclkid);
