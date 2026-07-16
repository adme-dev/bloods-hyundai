CREATE TABLE IF NOT EXISTS lead_export_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  enquiry_id uuid NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  provider varchar(50) NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  provider_lead_id varchar(100),
  provider_cluster_id varchar(100),
  last_http_status integer,
  last_error text,
  next_attempt_at timestamptz,
  last_attempt_at timestamptz,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, enquiry_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_export_deliveries_dealer_created
  ON lead_export_deliveries (dealer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_export_deliveries_due
  ON lead_export_deliveries (status, next_attempt_at);
