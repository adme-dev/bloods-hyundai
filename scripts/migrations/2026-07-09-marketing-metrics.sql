-- scripts/migrations/2026-07-09-marketing-metrics.sql
-- Marketing platform metrics (GA4 / Meta Ads / Google Ads) daily sync tables.
-- Apply to Neon prod (project cold-sound-73227570) via MCP run_sql after review.

CREATE TABLE IF NOT EXISTS marketing_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  platform varchar(20) NOT NULL,
  date date NOT NULL,
  campaign_id varchar(100) NOT NULL DEFAULT '',
  campaign_name varchar(255),
  spend numeric(12,2),
  impressions integer,
  clicks integer,
  platform_leads integer,
  sessions integer,
  users integer,
  conversions integer,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS marketing_metrics_daily_uniq
  ON marketing_metrics_daily (dealer_id, platform, date, campaign_id);
CREATE INDEX IF NOT EXISTS marketing_metrics_daily_dealer_date
  ON marketing_metrics_daily (dealer_id, date);

CREATE TABLE IF NOT EXISTS marketing_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  platform varchar(20) NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status varchar(20) NOT NULL DEFAULT 'running',
  error text,
  rows_upserted integer
);

CREATE INDEX IF NOT EXISTS marketing_sync_runs_dealer_platform
  ON marketing_sync_runs (dealer_id, platform, started_at DESC);
