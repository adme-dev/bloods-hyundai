# Admin performance and database indexing report

Prepared: 2026-07-09

Scope reviewed:

- Admin notification feed, enquiries, dashboard analytics, marketing report, customers, and service appointments APIs.
- Current Drizzle schema indexes in `server/database/schema.ts`.
- Nuxt/Nitro config in `nuxt.config.ts`.
- Official Nuxt/Nitro guidance for data fetching, lazy hydration, images, and cache rules.

Execution status:

- Applied `scripts/migrations/2026-07-09-admin-performance-indexes.sql` to the configured Neon database on 2026-07-09.
- Verified 16 live-schema indexes as valid and ready in Postgres.
- Deferred `idx_service_appointments_dealer_technician_scheduled` because production `service_appointments` does not currently include `assigned_technician_id`; add it with the technician-assignment column migration.

## Executive summary

The platform has a solid first layer of tenant indexes: most admin tables already have `dealer_id` indexes, and the enquiries table has basic `dealer_id + status`, `dealer_id + type`, and `dealer_id + created_at` coverage.

The next performance improvement is not generic server tuning. It is targeted composite and partial indexes for the actual admin workflows:

- Inbox and notification reads need active-enquiry partial indexes.
- Customer and service screens need tenant + active/date/status composite indexes.
- Marketing reporting needs one additional platform/date index and one sync-history index.
- Text search should use `pg_trgm` only when row volume or search latency justifies the write overhead.
- The big dashboard endpoint should be refactored toward parallel DB reads and eventually precomputed daily rollups.

Do not add SWR caching to authenticated admin APIs. The public website APIs already use route-rule SWR where appropriate; admin data is user-specific and should stay uncached unless we build a user/dealer-aware cache key explicitly.

## Current strengths

- Public data routes such as `/api/site-config`, `/api/header-settings`, `/api/carsales-feed`, `/api/hyundai-offers/hero-banner`, and model/accessory endpoints already have SWR route rules.
- Admin routes are dealer-scoped through `event.context.user` / `event.context.dealerId`.
- `marketing_metrics_daily` already has a uniqueness index on `(dealer_id, platform, date, campaign_id)` and a dealer/date index.
- Enquiries already have baseline indexes for dealer, status, type, created date, assigned user, email, and attribution.
- Notification feed response size is capped.

## High-priority indexes

These are the indexes I would apply first after validating with `EXPLAIN (ANALYZE, BUFFERS)` on production-sized data. Use `CONCURRENTLY` outside a transaction for production.

```sql
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
```

Why:

- `server/api/admin/enquiries/index.get.ts` filters by inbox/snoozed/archived, status/type/assignment, and sorts by newest created date.
- `server/api/admin/notifications/index.get.ts` reads recent active enquiries, assignments by `updated_at`, and expired snoozes.
- `server/api/admin/analytics/dashboard.get.ts` repeatedly aggregates active and recent enquiries.

```sql
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
```

Why:

- `server/api/admin/customers/index.get.ts` pages active dealer customers, joins retention profiles, filters by lifecycle/risk/last contact, and attaches vehicles for the current page.
- Existing retention indexes are not tenant-composite, which becomes noisy as this becomes multi-tenant.

```sql
-- Service appointment list, calendar, and technician filters.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_appointments_dealer_scheduled_time
  ON service_appointments (dealer_id, scheduled_date, scheduled_time);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_appointments_dealer_status_scheduled
  ON service_appointments (dealer_id, status, scheduled_date);

-- Deferred until production has assigned_technician_id:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_appointments_dealer_technician_scheduled
--   ON service_appointments (dealer_id, assigned_technician_id, scheduled_date)
--   WHERE assigned_technician_id IS NOT NULL;
```

Why:

- `server/api/admin/service/appointments/index.get.ts` filters by dealer, date range, status, technician, and sorts by scheduled date.
- Current indexes are mostly single-column, so Postgres may still scan more rows per tenant than necessary.

```sql
-- Marketing report and sync history.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketing_metrics_dealer_platform_date
  ON marketing_metrics_daily (dealer_id, platform, date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketing_sync_runs_dealer_started_desc
  ON marketing_sync_runs (dealer_id, started_at DESC);
```

Why:

- `server/api/admin/analytics/marketing-report.get.ts` reads metrics by dealer/date range and then groups by platform/campaign.
- Sync history currently orders all dealer rows by start time; the existing dealer/platform/start index helps per-platform reads more than the combined history panel.

## Search indexes

The admin search boxes use leading-wildcard `ILIKE '%term%'`. Normal B-tree indexes do not help much there. Add trigram indexes only after search volume warrants it, because GIN indexes add write cost.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enquiries_first_name_trgm
  ON enquiries USING gin (first_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enquiries_last_name_trgm
  ON enquiries USING gin (last_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enquiries_email_trgm
  ON enquiries USING gin (email gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_first_name_trgm
  ON customers USING gin (first_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_last_name_trgm
  ON customers USING gin (last_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_email_trgm
  ON customers USING gin (email gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone_trgm
  ON customers USING gin (phone gin_trgm_ops);
```

For service appointment search, either add per-column trigram indexes on customer name/email/registration/make/model, or better, create a generated searchable field and index that once. The generated-field approach is cleaner if service search becomes important.

## Query and endpoint findings

### Notifications

Current shape:

- Reads user notification state.
- Reads recent enquiries.
- Reads assigned enquiries.
- Reads expired snoozes.

Action taken in code:

- These independent reads were changed to run in parallel with `Promise.all`.

Follow-up:

- Add the active enquiry indexes above so the polling endpoint stays cheap as lead volume grows.
- Keep the notification limit capped. It is already capped at 50 server-side.

### Enquiries

Current shape:

- List query plus count query for the same filters.
- Three additional tab-count queries for inbox, snoozed, archived.

Follow-up:

- Add active/archived partial indexes above.
- Consider returning approximate counts or caching tab counts per dealer for very large inboxes.
- For search, add trigram only after measuring.

### Dashboard analytics

Current shape:

- `server/api/admin/analytics/dashboard.get.ts` performs many aggregate reads over the enquiries table.
- Several of those reads are independent but currently structured sequentially.

Follow-up:

- Group independent aggregate queries with `Promise.all` once the dealer settings and time boundaries are known.
- Merge compatible aggregates where possible.
- If data volume becomes large, create a daily rollup table such as `admin_daily_metrics` keyed by `(dealer_id, date)` for dashboard cards and trends.

### Marketing report

Current shape:

- Good separation: platform metrics come from `marketing_metrics_daily`; lead attribution comes from enquiries.
- Report date range is bounded to 366 days.
- Sync history is limited to 60 rows.

Follow-up:

- Add `(dealer_id, platform, date)` for platform-sliced reads.
- Add `(dealer_id, started_at DESC)` for the recent sync panel.
- Keep the existing daily metrics model; it is the right approach versus calling GA4/Google/Meta live on every page view.

### Customers

Current shape:

- Active dealer customers are paged newest-first.
- Retention profile filters are joined into the list query.
- Active vehicles are fetched for the current page.

Follow-up:

- Add the customer/retention/vehicle tenant-composite indexes above.
- Consider cursor pagination later if customer rows get large and deep offset pages are common.

### Service appointments

Current shape:

- Filters by dealer/date/status/technician and sorts by scheduled date.
- Status counts are recalculated from the full dealer appointment set.

Follow-up:

- Add service appointment composite indexes above.
- If status counts become slow, calculate them over a bounded date window or precompute daily status summaries.

## Nuxt/Nitro R&D recommendations

Official Nuxt guidance relevant to this codebase:

- Use `useFetch` / `useAsyncData` for initial page data to avoid fetching once on the server and again on the client.
- Use `$fetch` for event-driven interactions such as button clicks and form submits.
- Use `pick` or `transform` to keep Nuxt payloads smaller when a page only renders part of a large API response.
- Use stable keys for shared async data so Nuxt can avoid duplicate refetches.
- Use lazy hydration for non-critical below-the-fold admin sections and heavy charts.
- Nitro route rules support SWR caching, but authenticated admin APIs should not be globally cached.

Recommended Nuxt work:

1. Keep public website SWR route rules as they are, but do not cache `/api/admin/**` globally.
2. Split the admin dashboard into smaller fetchable sections, for example `summary`, `sales`, `marketing`, `team`, `customers`, `inventory`.
3. Fetch the initial summary eagerly and load lower-priority tabs lazily.
4. Add `transform` on large admin `useFetch` calls where the page only needs a subset of response fields.
5. Lazy-load chart components and hydrate them on visible, especially in the marketing report.
6. Keep using `NuxtImg` for public website images, with preload/fetch priority only for the real LCP image.
7. Use Nitro `defineCachedFunction` for public catalog/offer helpers where the data is not user-specific.

## Measurement plan

Before applying indexes:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM enquiries
WHERE dealer_id = '<dealer-id>'
  AND archived_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

Repeat for:

- Enquiry inbox with status/type/assigned filters.
- Notification recent enquiries and expired snoozes.
- Customer list with risk/lifecycle filters.
- Service appointment date range.
- Marketing report date range.

After applying indexes:

- Compare query planning time, execution time, rows scanned, and buffer reads.
- Watch insert/update latency on enquiries and customers for any write overhead.
- Keep any index that materially improves p95 admin latency; remove indexes that are unused after a reasonable observation period.

Recommended operational metrics:

- p50/p95/p99 latency per admin endpoint.
- DB query count per admin page load.
- Slowest SQL statements via `pg_stat_statements` if available in Neon.
- Browser bundle size for admin marketing/dashboard pages.
- Client hydration time for chart-heavy pages.

## Priority order

1. Apply the high-priority B-tree partial/composite indexes.
2. Parallelize independent reads in the dashboard endpoint.
3. Split/lazy-load admin dashboard and marketing report sections.
4. Add trigram search indexes if search is slow after row growth.
5. Add daily rollup tables only when aggregate reads become the bottleneck.

## References

- Nuxt data fetching: https://nuxt.com/docs/4.x/getting-started/data-fetching
- Nuxt performance best practices: https://nuxt.com/docs/4.x/guide/best-practices/performance
- Nitro cache and route rules: https://nitro.build/docs/cache
