# Handoff → Codex: activate marketing-metrics secrets & go live

**Date:** 2026-07-09
**For:** Codex (or any operator with Netlify + Neon access)
**Feature:** Marketing platform metrics (GA4 / Meta Ads / Google Ads → admin MarketingTab)
**Full runbook (console click-paths):** `docs/ops/marketing-metrics-setup.md` — this handoff is the condensed execution checklist; defer to the runbook for how to mint each credential.

---

## State (already done — do NOT repeat)

- Code merged to `main` and pushed (`9be1004`); Netlify deploying/deployed.
- DB migration **already applied** to prod Neon `cold-sound-73227570`: tables `marketing_metrics_daily`, `marketing_sync_runs` + 6 indexes live. **Do not re-run the migration.**
- Feature is **dormant**: every platform reads "Not connected" and sync skips it until the steps below are done. Endpoints are safe in this state (return `{results: []}` / 401 on unauth).

## The split of labour (read this first)

**A human must mint every credential value** in the GA4 / Meta / Google Ads consoles — these require OAuth consent screens, Business-Manager UI, and token minting that no agent can complete. Codex/agents **cannot** produce these values.

**Codex's executable job** = take the already-minted values from the human and (1) set them as Netlify env vars, (2) run the dealer settings SQL, (3) trigger + verify the first sync. Steps 1–3 below.

> Security note: do not paste secret values into chat, commits, logs, or this file. Use `netlify env:set` (values via stdin/args in the operator's own shell) or the Netlify UI. `GA4_SERVICE_ACCOUNT_KEY` is the whole service-account JSON, base64-encoded.

---

## Step 1 — Netlify env vars

Seven vars, exact names (consumed in `server/utils/metrics/*` and `netlify/functions/metrics-sync-cron.mts`):

| Env var | What it is | Source (see runbook §) |
|---|---|---|
| `GA4_SERVICE_ACCOUNT_KEY` | base64 of the service-account JSON key | GA4 §1 |
| `META_SYSTEM_USER_TOKEN` | Meta system-user token, `ads_read` on the ad account | Meta §2 |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads API developer token | Google Ads §3 |
| `GOOGLE_ADS_CLIENT_ID` | OAuth client id | Google Ads §3 |
| `GOOGLE_ADS_CLIENT_SECRET` | OAuth client secret | Google Ads §3 |
| `GOOGLE_ADS_REFRESH_TOKEN` | OAuth refresh token (minted once via Playground) | Google Ads §3 |
| `METRICS_CRON_SECRET` | shared secret guarding the internal sync endpoint | `openssl rand -hex 24` |

**Gotchas:**
- The four `GOOGLE_ADS_*` vars are **all-or-nothing** — the code only enables Google Ads when all four are present. Setting only the developer token makes Google Ads show connected + "sync failed" (a misconfig, not an outage). Set all four together or none.
- `GA4_SERVICE_ACCOUNT_KEY` must be base64. Mint: `base64 -i service-account.json | tr -d '\n'` (macOS) → set the output. The code does `Buffer.from(b64,'base64')` and throws a clean error if it isn't valid base64 JSON.

**Which site(s):** Two Netlify sites deploy this repo from `main`:
- **`bloodhyundai`** (primary, custom domain bloodhyundai.com.au) — Site ID **`5188455b-0ee6-4a34-8b79-3b054ed9d899`** (confirmed by owner 2026-07-09).
- **`bloods-hyundai`** (secondary, `bloods-hyundai.netlify.app`) — Site ID not yet confirmed; get it from `netlify sites:list`.

Set the vars on **both** so the admin UI + cron work regardless of which serves a request. Duplicate cron firing is safe — the `marketing_sync_runs_one_running` partial unique index prevents concurrent duplicate syncs. If you'd rather the cron run on only one site, that's fine too; the env vars still need to be on whichever site serves the admin UI (the primary).

**CLI — primary site (link by ID, non-interactive; `--context production`):**
```bash
netlify link --id 5188455b-0ee6-4a34-8b79-3b054ed9d899
netlify env:set METRICS_CRON_SECRET "<value>" --context production
netlify env:set GA4_SERVICE_ACCOUNT_KEY "<base64>" --context production
netlify env:set META_SYSTEM_USER_TOKEN "<value>" --context production
netlify env:set GOOGLE_ADS_DEVELOPER_TOKEN "<value>" --context production
netlify env:set GOOGLE_ADS_CLIENT_ID "<value>" --context production
netlify env:set GOOGLE_ADS_CLIENT_SECRET "<value>" --context production
netlify env:set GOOGLE_ADS_REFRESH_TOKEN "<value>" --context production
```
Then repeat for the secondary site: `netlify link --id <bloods-hyundai-site-id>` (from `sites:list`) and re-run the seven `env:set` lines. `METRICS_CRON_SECRET` should be the **same value on both sites** so either site's cron/curl authenticates against the shared internal endpoint.
After setting env vars, **trigger a redeploy** (env changes don't apply to the running deploy): `netlify deploy --build --prod` or push an empty commit / use the Netlify UI "Trigger deploy".

## Step 2 — Dealer settings SQL (Neon prod `cold-sound-73227570`)

Only one dealer exists. Fill in the real IDs (GA4 property, Meta ad account, Google Ads customer). `googleAdsLoginCustomerId` only if the account sits under an MCC.

> ⚠️ This `jsonb_set` **replaces** the whole `integrations` object — include every key you want set, every time.

```sql
UPDATE dealers
SET settings = jsonb_set(settings, '{marketing,integrations}', '{
  "ga4PropertyId": "properties/XXXXXXXXX",
  "metaAdAccountId": "act_XXXXXXXXXX",
  "googleAdsCustomerId": "XXX-XXX-XXXX"
}'::jsonb, true)
WHERE id = '3e2d9601-d21e-4b86-bd77-6ba790de534a';  -- Bloods Hyundai
```
Verify: `SELECT settings->'marketing'->'integrations' FROM dealers WHERE id = '3e2d9601-d21e-4b86-bd77-6ba790de534a';`

## Step 3 — First sync + verify

Option A (UI): admin → Marketing tab → **Refresh**. Cards flip from "Not connected" to live numbers.

Option B (curl, uses the cron secret):
```bash
curl -X POST -H "x-cron-secret: <METRICS_CRON_SECRET>" https://bloodhyundai.com.au/api/internal/metrics-sync
```

Confirm rows landed (Neon `cold-sound-73227570`):
```sql
SELECT platform, count(*), max(date) FROM marketing_metrics_daily GROUP BY platform;
SELECT platform, status, error, rows_upserted, finished_at
  FROM marketing_sync_runs ORDER BY started_at DESC LIMIT 10;
```
A `status='error'` row shows the reason in `error` (e.g. token/permission). First run backfills 30 days; the Netlify scheduled function then refreshes daily at 04:30 AEST (`30 18 * * *` UTC).

---

## Deferred backlog (not blocking go-live; noted in `.superpowers/sdd/progress.md`)
- Batched multi-row upserts before onboarding a campaign-heavy account (currently one round-trip per row).
- Per-dealer try/catch in the internal cron endpoint before a **second** dealer is added (today one dealer, so a single failure can't strand others).
- Cosmetic schema-metadata polish (`startedAt` index `.desc()`, `metricsDealeDate` typo key).
