# Marketing Hub — Phase 1: One Trustworthy Report — Design

**Date:** 2026-07-10
**Status:** Approved (brainstorm 2026-07-10)
**Owner:** This effort owns the marketing-analytics area end-to-end. Codex is paused on marketing / report / attribution / analytics files for the duration.

---

## The big picture (why Phase 1 exists)

The ambition is a "full-blown, Supermetrics-like" marketing hub for the dealership:
a single blended report (GA4 + Meta + Google + CRM) with demographic/geo/time
breakdowns, ad creatives, richer metrics, and a **self-serve full pivot builder**
(any stored metric × any dimension, filters, date ranges, saved views).

That is too large for one spec, so it is decomposed into phases, each shipping value:

- **Phase 1 (this doc) — One trustworthy report.** Make the data correct and the
  report singular before making it fancy.
- **Phase 2 — Flexible data backbone.** A "long" breakdown fact table; ingest
  age/area/device/time breakdowns (Meta + Google) + ad creatives + richer metrics.
- **Phase 3 — The pivot builder.** Self-serve UI over the backbone.
- **Phase 4 — Alerts, comparisons, exports.** Zero-conversion/pacing alerts,
  period-over-period, scheduled email/Sheets exports.

**Reality check baked into the design:** ad platforms return breakdowns one or two
dimensions at a time (spend-by-age *or* spend-by-region, not a single
age×region×device×hour cube). The Phase 3 pivot is flexible *across* stored
dimensions, not an infinite cross-tab. Phase 2's data model is built around this.

## Phase 1 goal

One correct, trustworthy marketing report: a single canonical report, attribution
actually connecting CRM leads to campaigns, honest cost-per-lead / ROAS, and a
deploy process that stops shipping code ahead of its database migrations.

## Current state (grounded in the code, 2026-07-10)

- **Two competing reports exist.** (a) A "Platform Performance" section in the admin
  Marketing tab (`MarketingPlatformMetrics.vue` → `/api/admin/analytics/marketing-metrics`),
  and (b) Codex's richer standalone page `/admin/marketing-report` →
  `/api/admin/analytics/marketing-report` (GA4 website analytics, attribution
  scaffolding, sync history, lead-source classification). Codex's is further along.
- **The attribution pipeline is already fully built and wired** (Codex):
  - Frontend `app/composables/useUtmParams.ts` captures UTM/click-ID params.
  - `server/api/submit-enquiry.post.ts` + `enquiry.post.ts` accept `utmSource/Medium/
    Campaign, gclid, gbraid, wbraid, fbclid, msclkid, landingPage, referrer, chatSource`,
    call `inferLeadAttribution()` (`server/utils/metrics/attribution.ts` — a solid
    confidence-scored engine: stored → click_id → utm_campaign → utm_platform →
    referrer), and persist `attributed_platform/campaign_id/campaign_name/confidence/
    method/matched_at/meta`.
  - Enquiry columns for all of the above now exist in prod (applied 2026-07-10).
- **But attribution is dark:** this month 0 enquiries carry any Facebook UTM, 0 carry
  `fbclid`, 0 are attributed to `meta_ads` — while Meta shows $1,089 spend / 1,831
  clicks. The pipeline has nothing to work with because **the ad destination URLs are
  not tagged.**
- **Sync is live and healthy:** GA4 + Meta + Google syncing daily (cron 04:30 AEST);
  `marketing_metrics_daily` holds real spend (Meta $1,089 / Google $1,940).
- **Process gap that caused a production outage:** migrations are committed but not
  applied on deploy. On 2026-07-10 the `chat_source`/`chat_intent` columns were
  missing in prod, 500-ing every relational enquiries query (notifications + the
  marketing report). Fixed by hand; the process must be fixed so it can't recur.

## Phase 1 workstreams

### 1. Consolidate to a single report

- **Keep** `/admin/marketing-report` + `/api/admin/analytics/marketing-report` as the
  canonical report (most complete).
- **Fold in** the one thing the retired implementation did better: the platform-scoped
  campaign→CRM CPL join from `server/utils/metrics/aggregate.ts`
  (`aggregateMarketingMetrics`, with the platform-hinted matching that prevents
  cross-platform lead misattribution). Verify the canonical report's aggregation has
  equivalent protection; port it if not.
- **Retire** `MarketingPlatformMetrics.vue` and its Marketing-tab mount, and
  `/api/admin/analytics/marketing-metrics.get.ts`. Leave the shared, still-used utils
  (`ga4.ts`, `metaAds.ts`, `googleAds.ts`, `sync.ts`, `aggregate.ts`, `types.ts`).
- One entry point: the admin Marketing tab links to `/admin/marketing-report` (or the
  section is replaced by a link/summary that opens the full report).

### 2. Activate + verify attribution (do NOT rebuild it)

The engine exists; Phase 1 lights it up and proves it end-to-end.

- **Marketing action (owner):** tag every Meta and Google ad destination URL. This
  effort generates the exact tagged URLs per active campaign, e.g.
  `…?utm_source=facebook&utm_medium=paid_social&utm_campaign=<campaign>` (Meta) and
  enable Meta's URL-parameter / auto-`fbclid`; Google auto-tagging (`gclid`) on.
  Deliverable: a one-page "tag your ads" sheet with copy-paste URLs.
- **Verify the capture survives navigation (code):** confirm `useUtmParams` persists
  first-touch UTMs/click-IDs from the landing page through internal navigation to the
  form submit (common failure: captured on landing, lost by the time the user submits
  from a vehicle page). Add a test / storage (sessionStorage or cookie) if it doesn't.
- **Backfill history:** apply `scripts/migrations/2026-07-09-backfill-enquiry-attribution.sql`
  (idempotent-safe review first) to attribute existing paid leads where signals exist,
  then optionally run the app-level `/api/admin/analytics/attribution-backfill` refine.
- **Prove it:** after tagging, submit a test enquiry through a tagged Meta URL and
  confirm the enquiry row lands with `attributed_platform='meta_ads'` and a matched
  campaign; confirm it appears in the report's Meta CPL.

### 3. Honest computed metrics

Add to the canonical report, derived from data already stored (no new ingestion except
one Google field):

- **CTR** = clicks / impressions; **CPC** = spend / clicks;
  **CPL (true)** = spend / CRM-attributed leads (null when 0 — never NaN/∞);
  **conversion rate** = CRM leads / clicks.
- **ROAS** requires (a) `metrics.conversions_value` added to the Google Ads fetch
  (one GAQL field + one nullable numeric column), and (b) a per-lead/per-sale value
  input in dealer settings (`settings.marketing.avgSaleValue` or use CRM sale value if
  present). ROAS shown only when a value basis exists; otherwise hidden, not faked.
- Every metric renders with the correct precision (cents for currency) and shows "—"
  when its denominator is 0.

### 4. Fix the migration-on-deploy process (foundational)

Root cause of the outage. Choose and implement one:

- **Preferred:** a Netlify build/postbuild step (or a `predeploy` script) that runs
  pending SQL migrations against `NEON_DATABASE_URL` before the new code serves —
  with a lightweight `schema_migrations` ledger table so each file runs once.
- **Minimum:** a CI check that fails the build if a migration file is committed but its
  columns/objects are absent from a schema snapshot, forcing manual application first.
- Document the chosen flow in `docs/ops/` and backfill-apply the two currently-unapplied
  migrations (`admin-performance-indexes` via `CREATE INDEX CONCURRENTLY` outside a txn;
  `backfill-enquiry-attribution`).

## Data flow (Phase 1, unchanged shape — just made correct)

```
Ad platforms (GA4/Meta/Google) ──daily sync──► marketing_metrics_daily
Tagged ad URL ─► landing (useUtmParams captures) ─► form submit
     ─► submit-enquiry.post.ts (inferLeadAttribution) ─► enquiries.attributed_*
canonical report endpoint: marketing_metrics_daily ⋈ enquiries (attribution/UTM)
     ─► spend, platform metrics, CRM leads, true CPL/ROAS  ─► /admin/marketing-report
```

## Testing / verification

- **Attribution engine** already has (or gets) unit coverage on `inferLeadAttribution`
  fixtures; keep/extend for click-id, utm, referrer, and no-signal paths.
- **CPL aggregation**: reuse `test/metrics-cpl.test.ts` coverage; ensure the canonical
  report path is covered for platform-scoped matching + `__other__` reconciliation.
- **Computed metrics**: pure helpers, fixture-tested (CTR/CPC/CPL/ROAS incl. zero
  denominators and missing sale-value basis).
- **End-to-end proof**: a real tagged-URL test enquiry appears attributed in the report
  (manual, documented).
- **Regression**: full `node --test test/*.test.ts` green (minus the 3 known pre-existing
  load failures); typecheck at or below current baseline; production build passes.

## Non-goals (explicitly Phase 2+)

- Demographic/geo/time/device breakdowns and the flexible fact table (Phase 2).
- Ad creative/artwork ingestion + gallery (Phase 2).
- The self-serve pivot builder UI + saved views (Phase 3).
- Alerts, period-over-period comparisons, scheduled exports, multi-dealer (Phase 4+).
- New ad platforms (Microsoft/Bing, GBP) — the attribution engine already anticipates
  `microsoft_ads`, but ingestion is out of scope here.

## Open decisions

1. Confirm retiring the Marketing-tab section in favour of the standalone report page
   (vs. keeping a compact summary in the tab that links out).
2. ROAS value basis: fixed `avgSaleValue` in settings vs. real per-deal CRM sale value
   (if the CRM captures closed-deal value) — pick during spec review.
3. Migration-on-deploy mechanism: Netlify predeploy runner (preferred) vs. CI guard.
