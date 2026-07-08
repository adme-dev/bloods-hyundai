# Marketing Platform Metrics — Design

**Date:** 2026-07-09
**Status:** Approved (brainstorm 2026-07-08/09)
**Target:** bloods-hyundai admin dashboard, MarketingTab

## Goal

Bring GA4, Meta Ads, and Google Ads metrics into the existing dashboard MarketingTab,
joined against CRM enquiries to produce true cost-per-lead. Platform data is synced
daily into Neon; the dashboard never calls platform APIs directly.

## Non-goals (v1)

- Time-series charts, date-range pickers (month-to-date only, matching the tab's framing)
- GA4 campaign-level rows (GA4 contributes property-level traffic KPIs only)
- Multi-tenant port to toyota-theme-nuxt (design keeps it portable via dealer settings)
- Admin UI for entering credentials (env vars + settings SQL for now)
- ROAS (no revenue attribution exists in the CRM yet)

## Data model

### `marketing_metrics_daily`

| column | type | notes |
|---|---|---|
| id | uuid PK default gen_random_uuid() | |
| dealer_id | uuid NOT NULL → dealers(id) ON DELETE CASCADE | |
| platform | varchar(20) NOT NULL | `'ga4' \| 'meta_ads' \| 'google_ads'` |
| date | date NOT NULL | platform-local day |
| campaign_id | varchar(100) NOT NULL DEFAULT '' | `''` = property/account-level row (GA4) |
| campaign_name | varchar(255) NULL | |
| spend | numeric(12,2) NULL | AUD; Google Ads `cost_micros / 1e6` |
| impressions | integer NULL | |
| clicks | integer NULL | |
| platform_leads | integer NULL | Meta `actions[action_type=lead]`; Google Ads `metrics.conversions` |
| sessions | integer NULL | GA4 only |
| users | integer NULL | GA4 `totalUsers` |
| conversions | integer NULL | GA4 key events |
| raw | jsonb NULL | raw API row for debugging/backfill |
| synced_at | timestamptz NOT NULL default now() | |

Unique index: `(dealer_id, platform, date, campaign_id)` — syncs are idempotent
upserts (`ON CONFLICT ... DO UPDATE`).

Row granularity: Meta/Google Ads write one row per campaign per day; account totals
are computed at read time by summing. GA4 writes one row per day with `campaign_id`
`''`.

### `marketing_sync_runs`

`(id uuid PK, dealer_id uuid NOT NULL, platform varchar(20) NOT NULL,
started_at timestamptz NOT NULL, finished_at timestamptz NULL,
status varchar(20) NOT NULL 'running'|'success'|'error',
error text NULL, rows_upserted integer NULL)`

Feeds the UI's "last synced / failed because X" states. Keep the latest 20 rows per
platform (each sync deletes older ones for its platform).

Migration SQL lives in `scripts/migrations/` (same convention as CRM remediation
migrations); applied to Neon prod (`cold-sound-73227570`) after review.

## Sync architecture

```
Netlify scheduled fn (daily) ──► POST /api/internal/metrics-sync  (CRON_SECRET header)
Admin "Refresh now" button  ──► POST /api/admin/metrics/sync      (admin session auth)
                                        │
                                        ▼
                          server/utils/metrics/sync.ts
                       (orchestrator, per-platform isolation)
                    ┌──────────────┼──────────────────┐
                    ▼              ▼                  ▼
              metrics/ga4.ts  metrics/metaAds.ts  metrics/googleAds.ts
              fetchDaily(cfg, {from, to}) → NormalizedRow[]
                    └──────────────┴──────────────────┘
                                        ▼
                     upsert marketing_metrics_daily + sync_runs
```

- **Window:** first run (no rows for platform) backfills 30 days; subsequent runs
  re-fetch the last 3 days (ad platforms restate recent figures within attribution
  windows).
- **Isolation:** each platform syncs in its own try/catch with its own `sync_runs`
  row; one platform failing never blocks the others.
- **Concurrency guard:** skip a platform if a `running` sync_run younger than 10
  minutes exists.
- **Normalized row:** `{ platform, date, campaignId?, campaignName?, spend?,
  impressions?, clicks?, platformLeads?, sessions?, users?, conversions?, raw }`.
- Each fetcher is split into an API-calling function and a **pure normalizer**
  (`normalizeGa4Response(json)`, etc.) so normalizers are unit-testable on fixtures.

## Credentials & configuration

**Netlify env vars (secrets):**

| var | used by |
|---|---|
| `GA4_SERVICE_ACCOUNT_KEY` | GA4 — base64-encoded service-account JSON |
| `META_SYSTEM_USER_TOKEN` | Meta Marketing API (ads_read on the ad account) |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads API |
| `GOOGLE_ADS_CLIENT_ID` / `GOOGLE_ADS_CLIENT_SECRET` / `GOOGLE_ADS_REFRESH_TOKEN` | Google Ads OAuth |
| `METRICS_CRON_SECRET` | internal sync endpoint auth |

**Per-dealer IDs** in `dealers.settings.marketing.integrations`:

```json
{
  "ga4PropertyId": "properties/123456789",
  "metaAdAccountId": "act_1234567890",
  "googleAdsCustomerId": "123-456-7890",
  "googleAdsLoginCustomerId": "optional MCC id"
}
```

A platform is **enabled** iff its secret(s) AND its dealer ID are present. Missing
either → UI shows "Not connected" with a one-line setup hint; sync skips it silently.

**New dependency:** `google-auth-library` only (JWT for GA4, refresh-token flow for
Google Ads). Meta uses plain `fetch`.

## Platform queries

- **GA4** — Data API `POST https://analyticsdata.googleapis.com/v1beta/{property}:runReport`
  with `dimensions:[date]`, `metrics:[sessions, totalUsers, keyEvents]`, JWT-authed
  via service account (`https://www.googleapis.com/auth/analytics.readonly`).
- **Meta** — `GET https://graph.facebook.com/v23.0/{adAccountId}/insights` with
  `level=campaign&time_increment=1&time_range={since,until}` and
  `fields=campaign_id,campaign_name,spend,impressions,clicks,actions`; leads = sum of
  `actions` entries whose `action_type` is `lead` or `offsite_conversion.fb_pixel_lead`;
  follow `paging.next` until exhausted.
- **Google Ads** — `POST https://googleads.googleapis.com/v20/customers/{cid}/googleAds:searchStream`
  with GAQL:
  `SELECT campaign.id, campaign.name, segments.date, metrics.cost_micros,
  metrics.impressions, metrics.clicks, metrics.conversions FROM campaign
  WHERE segments.date BETWEEN '{from}' AND '{to}'`
  Headers: `developer-token`, `login-customer-id` (if set), OAuth bearer from refresh
  token. API version is a constant in `googleAds.ts` — bump deliberately, Google
  sunsets versions roughly yearly.

## Read API & CPL join

`GET /api/admin/analytics/marketing-metrics` (admin auth, dealer-scoped; separate from
the existing large `dashboard.get.ts`). Returns for **month-to-date**:

```ts
{
  period: { from, to },
  platforms: {
    ga4:        { connected, sessions, users, conversions, lastSync, lastError },
    meta_ads:   { connected, spend, impressions, clicks, platformLeads, crmLeads, cpl, lastSync, lastError },
    google_ads: { connected, spend, impressions, clicks, platformLeads, crmLeads, cpl, lastSync, lastError },
  },
  campaigns: [{ platform, campaignId, campaignName, spend, clicks,
                platformLeads, crmLeads, cpl }],   // sorted by spend desc, top 15
}
```

**CRM join:** for the same period, `SELECT lower(utm_campaign), count(*) FROM enquiries
WHERE dealer_id = $1 AND created_at >= $from GROUP BY 1`, matched in code against
`lower(campaign_name)` OR `campaign_id`. Unmatched CRM campaign counts are summed into
an "Other / untagged" table row (no spend, no CPL) so numbers visibly reconcile.
`cpl = spend / crmLeads`, null when `crmLeads = 0` (UI shows "—", never division noise).
Platform-level `crmLeads` for Meta = enquiries with `utm_source` in
('facebook','fb','meta','instagram'); for Google Ads = `utm_source` in ('google','googleads')
AND `utm_medium` in ('cpc','ppc','paid') — constants in one place, adjustable.

## UI (MarketingTab)

New "Platform Performance" section above the existing channel summary:

1. **Three platform cards** — GA4 (sessions, users, conversions), Meta and Google Ads
   (spend, clicks, leads: platform vs CRM, CPL). States: *connected* (metrics),
   *not connected* (muted, setup hint), *error* (last-good metrics + amber "sync failed
   Xh ago" badge from `sync_runs`).
2. **Campaign table** — platform badge, campaign name, spend, clicks, platform leads,
   CRM leads, CPL; top 15 by spend + "Other / untagged" reconciliation row.
3. **Header row** — "Last synced X ago" + **Refresh** button → `POST /api/admin/metrics/sync`,
   spinner while running, refetches on completion, disabled while a sync is running.

Fetched lazily via the new endpoint when the tab opens (tab is already lazy).
Currency formatted with the existing dashboard `formatCurrency` util.

## Error handling

- Fetchers: 30s timeout. Google Ads retries once on 429/5xx with backoff; GA4/Meta
  don't retry inline — the daily schedule plus the manual Refresh button self-heal
  transient failures. Auth errors (401/403) are recorded in `sync_runs.error` — the
  UI hint distinguishes "token expired / permission missing" from transient failures.
  Tokens are sent in headers only (never URLs) so persisted errors can't leak them.
- Upserts are transactional per platform; a failed platform leaves prior rows intact
  (dashboard shows stale-but-honest data + error badge).
- The internal sync endpoint requires `METRICS_CRON_SECRET`; the admin endpoint reuses
  existing dealer-scoped admin session auth (same pattern as other /api/admin routes).
- Never log tokens or raw credential material; `raw` jsonb stores response rows only.

## Testing (node:test, fixtures, no live APIs)

- `test/metrics-normalizers.test.ts` — fixture JSON per platform → NormalizedRow[]
  (happy path, empty response, Meta paging page, missing actions, cost_micros
  conversion, GA4 row shape).
- `test/metrics-cpl.test.ts` — pure aggregation helper: campaign matching by id/name
  case-insensitivity, "Other / untagged" reconciliation, cpl null on zero leads,
  platform-level source-mapping constants.
- Orchestrator logic (window selection: 30-day backfill vs 3-day lookback; isolation)
  tested with injected fake fetchers.
- Existing suite + typecheck baseline (532) must hold.

## Reference implementation (cherry-pick source)

`/Users/paulgiurin/Documents/Projects/dashboard` (XeroFlow Agency, same owner) has
production-tested versions of these integrations. Port patterns, not files — its stack
is Cloudflare/agency-multi-client; ours is Netlify/single-dealer.

**Port directly (adapt names/config only):**
- `server/utils/googleAdsClient.ts` → `gaqlQuery()` (dash-stripped IDs,
  `developer-token` + `login-customer-id` headers, searchStream batch flattening,
  `GoogleAdsFailure` detail extraction on 400/403, exponential backoff on 429/5xx)
  and `refreshGoogleToken()`. **Gotcha it encodes: REST searchStream returns
  camelCase (`metrics.costMicros`), not GAQL snake_case.**
- `server/utils/ga4Client.ts` → `parseGa4Report()` index-mapped metric contract and
  YYYYMMDD→ISO date normalization; the "metric array order is the request↔parse
  contract" convention.
- `server/utils/metaClient.ts` → insights fetch with `paging.next` loop and
  `actions[]` extraction; note it counts `leads_retrieval` (lead-gen form) actions —
  include alongside `lead` / `offsite_conversion.fb_pixel_lead` in our lead sum.
- `server/api/cron/ga4-sync.post.ts` → cron endpoint guarded by `x-cron-secret`
  header (identical to our `METRICS_CRON_SECRET` design).

**Deliberate differences (do NOT port):**
- Their GA4/Google auth is interactive user-OAuth (agency connects many clients'
  accounts). We keep the service-account (GA4) / stored-refresh-token (Google Ads)
  model — no OAuth UI needed for one dealer.
- Their storage splits `media_spend` + `daily_spend` with budget management. We keep
  the single `marketing_metrics_daily` table — budgets are out of scope.
- Their trailing-48h re-sync validates our 3-day lookback; keep 3 days.

## Delivery order

1. Migration + schema + normalizers with tests (pure layer)
2. Fetchers + orchestrator + internal/admin sync endpoints
3. Read API with CPL join + tests
4. MarketingTab UI
5. Netlify scheduled function + runbook doc (`docs/ops/marketing-metrics-setup.md`:
   creating the service account, Meta system user, Google Ads token, env vars,
   settings SQL)
