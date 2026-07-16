CREATE TABLE IF NOT EXISTS dealer_integration_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  provider varchar(50) NOT NULL,
  credential_kind varchar(50) NOT NULL,
  encrypted_value text NOT NULL,
  credential_hint varchar(20) NOT NULL,
  key_version integer NOT NULL DEFAULT 1,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dealer_id, provider, credential_kind)
);

CREATE INDEX IF NOT EXISTS idx_dealer_integration_credentials_dealer_provider
  ON dealer_integration_credentials (dealer_id, provider);

CREATE TABLE IF NOT EXISTS dealer_integration_credential_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  provider varchar(50) NOT NULL,
  credential_kind varchar(50) NOT NULL,
  action varchar(30) NOT NULL,
  credential_hint varchar(20),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dealer_integration_credential_audit_dealer_created
  ON dealer_integration_credential_audit (dealer_id, created_at DESC);
