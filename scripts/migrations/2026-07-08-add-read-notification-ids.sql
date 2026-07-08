-- Schema migration: per-notification read state.
-- Adds users.read_notification_ids so a single notification can be marked read
-- without bumping last_seen_notifications_at (which marks everything read).
-- Idempotent via IF NOT EXISTS.
--
-- Apply: psql "$NEON_DATABASE_URL" -f scripts/migrations/2026-07-08-add-read-notification-ids.sql

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "read_notification_ids" jsonb NOT NULL DEFAULT '[]'::jsonb;
