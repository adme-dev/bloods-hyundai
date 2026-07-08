-- Data-only migration: normalize legacy enquiry.status values to the canonical
-- sales-funnel vocabulary (shared/constants/salesFunnel.ts).
--
-- Mapping:
--   new         -> new_lead
--   in_progress -> appointment_set   (service appointment created from enquiry)
--   contacted   -> appointment_set   (service booking confirmed)
--   closed      -> sold              (no rows expected; safety only)
--
-- Idempotent: after the first run no rows remain in the legacy set, so re-running
-- is a no-op. The pre-image of every changed row is snapshotted into
-- enquiry_activity_log (action = 'status_migrated') for reversibility.
--
-- Apply against the target database (Neon branch first, then production):
--   psql "$NEON_DATABASE_URL" -f scripts/migrations/2026-07-08-normalize-enquiry-status.sql
-- or via the Neon MCP run_sql.

BEGIN;

INSERT INTO "enquiry_activity_log" ("dealer_id", "enquiry_id", "action", "entity_type", "old_value", "new_value")
SELECT
  "dealer_id",
  "id",
  'status_migrated',
  'status',
  jsonb_build_object('status', "status"),
  jsonb_build_object('status', CASE "status"
    WHEN 'new'         THEN 'new_lead'
    WHEN 'in_progress' THEN 'appointment_set'
    WHEN 'contacted'   THEN 'appointment_set'
    WHEN 'closed'      THEN 'sold'
  END)
FROM "enquiries"
WHERE "status" IN ('new', 'in_progress', 'contacted', 'closed');

UPDATE "enquiries" SET "status" = 'new_lead'        WHERE "status" = 'new';
UPDATE "enquiries" SET "status" = 'appointment_set' WHERE "status" = 'in_progress';
UPDATE "enquiries" SET "status" = 'appointment_set' WHERE "status" = 'contacted';
UPDATE "enquiries" SET "status" = 'sold'            WHERE "status" = 'closed';

COMMIT;
