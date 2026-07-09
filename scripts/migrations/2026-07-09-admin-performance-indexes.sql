-- Admin CRM performance indexes for high-volume dashboard, enquiry,
-- notification, customer, service and marketing-report reads.
--
-- Important:
-- - Run with psql directly, not through a transaction-wrapping migration runner.
-- - CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
-- - Apply:
--     psql "$NEON_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/migrations/2026-07-09-admin-performance-indexes.sql

SET lock_timeout = '5s';
SET statement_timeout = '15min';

-- Enquiries inbox, dashboard, and notifications.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enquiries_active_dealer_created_desc
  ON enquiries (dealer_id, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enquiries_active_dealer_status_created_desc
  ON enquiries (dealer_id, status, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enquiries_active_dealer_type_created_desc
  ON enquiries (dealer_id, type, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enquiries_active_dealer_assigned_created_desc
  ON enquiries (dealer_id, assigned_to, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enquiries_active_dealer_assigned_updated_desc
  ON enquiries (dealer_id, assigned_to, updated_at DESC)
  WHERE archived_at IS NULL AND assigned_to IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enquiries_active_dealer_snoozed_desc
  ON enquiries (dealer_id, snoozed_until DESC)
  WHERE archived_at IS NULL AND snoozed_until IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enquiries_archived_dealer_created_desc
  ON enquiries (dealer_id, created_at DESC)
  WHERE archived_at IS NOT NULL;

-- Customer CRM list and retention filters.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_active_dealer_created_desc
  ON customers (dealer_id, created_at DESC)
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_vehicles_active_dealer_customer_created_desc
  ON customer_vehicles (dealer_id, customer_id, created_at DESC)
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_retention_profiles_dealer_customer
  ON customer_retention_profiles (dealer_id, customer_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_retention_profiles_dealer_risk_contact
  ON customer_retention_profiles (dealer_id, risk_level, last_contact_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_retention_profiles_dealer_lifecycle
  ON customer_retention_profiles (dealer_id, lifecycle_stage);

-- Service appointment list, calendar, and technician filters.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_appointments_dealer_scheduled_time
  ON service_appointments (dealer_id, scheduled_date, scheduled_time);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_appointments_dealer_status_scheduled
  ON service_appointments (dealer_id, status, scheduled_date);

-- Deferred: production service_appointments currently does not include
-- assigned_technician_id. Add the technician index with the technician
-- assignment column migration.

-- Marketing report and sync history.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketing_metrics_dealer_platform_date
  ON marketing_metrics_daily (dealer_id, platform, date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketing_sync_runs_dealer_started_desc
  ON marketing_sync_runs (dealer_id, started_at DESC);
