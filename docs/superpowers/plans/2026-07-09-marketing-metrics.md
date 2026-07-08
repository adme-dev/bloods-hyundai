# Marketing Platform Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync GA4 / Meta Ads / Google Ads daily metrics into Neon and surface them in the admin MarketingTab with a CRM-joined cost-per-lead.

**Architecture:** Three per-platform fetchers (pure normalizer + thin API caller) feed an orchestrator that upserts into `marketing_metrics_daily` (daily scheduled Netlify function + admin "Refresh now"). A new read endpoint aggregates month-to-date totals and joins `enquiries.utm_campaign` for CPL. Spec: `docs/superpowers/specs/2026-07-09-marketing-metrics-design.md`.

**Tech Stack:** Nuxt 3/Nitro on Netlify, Drizzle + Neon Postgres, node:test, `google-auth-library` (only new dep), plain `$fetch` for Meta/Google REST.

## Global Constraints

- Tests: `node:test` + `node:assert/strict`, direct `.ts` imports of pure modules only (never import `server/utils/email.ts`-style heavy modules in tests). Run: `node --test test/<file>.test.ts`.
- Typecheck baseline is **532 errors** (`npm run typecheck 2>&1 | grep -c "error TS"`). Must not exceed 532 after any task.
- Only new dependency allowed: `google-auth-library`.
- Admin endpoints: auth = `event.context.user` else 401; dealer scope = `user.dealerId` (copy pattern from `server/api/admin/analytics/dashboard.get.ts:5-12`).
- `campaign_id = ''` means account/property-level row. Never NULL.
- Spend is AUD, `numeric(12,2)`; Drizzle returns numerics as strings — always `Number()` before math.
- CPL = spend / crmLeads; `null` when crmLeads is 0.
- Period everywhere: month-to-date (UTC).
- Never log tokens/credentials.
- Reference implementation for porting patterns: `/Users/paulgiurin/Documents/Projects/dashboard` (read-only; port code into this repo with adaptations, do not import across repos).

---

### Task 1: Migration SQL + Drizzle schema

**Files:**
- Create: `scripts/migrations/2026-07-09-marketing-metrics.sql`
- Modify: `server/database/schema.ts` (add two tables at end of file; extend the pg-core import on line 1)

**Interfaces:**
- Produces: Drizzle tables `marketingMetricsDaily`, `marketingSyncRuns` exported from `server/database/schema.ts`; later tasks import them as `import { marketingMetricsDaily, marketingSyncRuns } from '../database/schema'`.

- [ ] **Step 1: Write migration SQL**

```sql
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
```

- [ ] **Step 2: Add Drizzle tables**

In `server/database/schema.ts`, extend the line-1 import to include `integer`, `numeric`, `date`:

```ts
import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, index, inet, uniqueIndex, integer, numeric, date } from 'drizzle-orm/pg-core';
```

Append at end of file:

```ts
// ============================================================================
// MARKETING PLATFORM METRICS (GA4 / Meta Ads / Google Ads daily sync)
// ============================================================================

export const marketingMetricsDaily = pgTable('marketing_metrics_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 20 }).notNull(),
  date: date('date').notNull(),
  campaignId: varchar('campaign_id', { length: 100 }).notNull().default(''),
  campaignName: varchar('campaign_name', { length: 255 }),
  spend: numeric('spend', { precision: 12, scale: 2 }),
  impressions: integer('impressions'),
  clicks: integer('clicks'),
  platformLeads: integer('platform_leads'),
  sessions: integer('sessions'),
  users: integer('users'),
  conversions: integer('conversions'),
  raw: jsonb('raw'),
  syncedAt: timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('marketing_metrics_daily_uniq').on(t.dealerId, t.platform, t.date, t.campaignId),
  index('marketing_metrics_daily_dealer_date').on(t.dealerId, t.date),
]);

export const marketingSyncRuns = pgTable('marketing_sync_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 20 }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('running'),
  error: text('error'),
  rowsUpserted: integer('rows_upserted'),
});
```

NOTE: check how existing tables in this file declare indexes (object-return vs array-return third argument) and match that convention exactly.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck 2>&1 | grep -c "error TS"` — Expected: `532`

- [ ] **Step 4: Commit**

```bash
git add scripts/migrations/2026-07-09-marketing-metrics.sql server/database/schema.ts
git commit -m "feat(metrics): marketing_metrics_daily + marketing_sync_runs schema"
```

---

### Task 2: Types + GA4 normalizer (TDD)

**Files:**
- Create: `server/utils/metrics/types.ts`, `server/utils/metrics/ga4.ts`
- Test: `test/metrics-normalizers.test.ts`

**Interfaces:**
- Produces:
  - `types.ts`: `Platform = 'ga4' | 'meta_ads' | 'google_ads'`; `NormalizedRow { platform: Platform; date: string; campaignId: string; campaignName: string | null; spend: number | null; impressions: number | null; clicks: number | null; platformLeads: number | null; sessions: number | null; users: number | null; conversions: number | null; raw: unknown }`; `DateRange { from: string; to: string }` (ISO `YYYY-MM-DD`); `MarketingIntegrations { ga4PropertyId?: string; metaAdAccountId?: string; googleAdsCustomerId?: string; googleAdsLoginCustomerId?: string }`.
  - `ga4.ts`: `normalizeGa4Response(resp: unknown): NormalizedRow[]` (pure), `fetchGa4Daily(propertyId: string, range: DateRange): Promise<NormalizedRow[]>` (Task 5).

- [ ] **Step 1: Write `types.ts`**

```ts
// server/utils/metrics/types.ts
export type Platform = 'ga4' | 'meta_ads' | 'google_ads';

/** One platform-day(-campaign) row, ready to upsert into marketing_metrics_daily. */
export interface NormalizedRow {
  platform: Platform;
  date: string; // YYYY-MM-DD
  campaignId: string; // '' = account/property-level row
  campaignName: string | null;
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  platformLeads: number | null;
  sessions: number | null;
  users: number | null;
  conversions: number | null;
  raw: unknown;
}

export interface DateRange {
  from: string; // YYYY-MM-DD inclusive
  to: string;   // YYYY-MM-DD inclusive
}

/** dealers.settings.marketing.integrations */
export interface MarketingIntegrations {
  ga4PropertyId?: string;
  metaAdAccountId?: string;
  googleAdsCustomerId?: string;
  googleAdsLoginCustomerId?: string;
}
```

- [ ] **Step 2: Write the failing GA4 test**

```ts
// test/metrics-normalizers.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeGa4Response } from '../server/utils/metrics/ga4.ts';

describe('normalizeGa4Response', () => {
  it('maps runReport rows to property-level NormalizedRows', () => {
    const resp = {
      rows: [
        { dimensionValues: [{ value: '20260701' }], metricValues: [{ value: '120' }, { value: '95' }, { value: '7' }] },
        { dimensionValues: [{ value: '20260702' }], metricValues: [{ value: '80' }, { value: '60' }, { value: '3' }] },
      ],
    };
    const rows = normalizeGa4Response(resp);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      platform: 'ga4',
      date: '2026-07-01',
      campaignId: '',
      campaignName: null,
      spend: null,
      impressions: null,
      clicks: null,
      platformLeads: null,
      sessions: 120,
      users: 95,
      conversions: 7,
      raw: resp.rows[0],
    });
  });

  it('returns [] for empty/missing rows', () => {
    assert.deepEqual(normalizeGa4Response({}), []);
    assert.deepEqual(normalizeGa4Response({ rows: [] }), []);
  });
});
```

- [ ] **Step 3: Verify RED**

Run: `node --test test/metrics-normalizers.test.ts` — Expected: FAIL (module `ga4.ts` not found).

- [ ] **Step 4: Write minimal `ga4.ts` (normalizer only)**

```ts
// server/utils/metrics/ga4.ts
// GA4 Data API runReport. Metric order is the request<->parse contract
// (pattern ported from XeroFlow dashboard ga4Client.ts).
import type { NormalizedRow } from './types';

export const GA4_METRICS = ['sessions', 'totalUsers', 'keyEvents'] as const;

interface Ga4RunReportResponse {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
}

export function normalizeGa4Response(resp: unknown): NormalizedRow[] {
  const rows = (resp as Ga4RunReportResponse)?.rows || [];
  return rows.map((r) => {
    const rawDate = r.dimensionValues?.[0]?.value || '';
    const date = rawDate.length === 8
      ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      : rawDate;
    const m = (i: number) => Number(r.metricValues?.[i]?.value || 0);
    return {
      platform: 'ga4' as const,
      date,
      campaignId: '',
      campaignName: null,
      spend: null,
      impressions: null,
      clicks: null,
      platformLeads: null,
      sessions: m(0),
      users: m(1),
      conversions: m(2),
      raw: r,
    };
  });
}
```

- [ ] **Step 5: Verify GREEN**

Run: `node --test test/metrics-normalizers.test.ts` — Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add server/utils/metrics/types.ts server/utils/metrics/ga4.ts test/metrics-normalizers.test.ts
git commit -m "feat(metrics): NormalizedRow types + GA4 runReport normalizer"
```

---

### Task 3: Meta Ads normalizer (TDD)

**Files:**
- Create: `server/utils/metrics/metaAds.ts`
- Test: `test/metrics-normalizers.test.ts` (append)

**Interfaces:**
- Produces: `normalizeMetaInsights(insights: unknown[]): NormalizedRow[]` (pure), `META_LEAD_ACTION_TYPES`, and `fetchMetaDaily(adAccountId: string, range: DateRange): Promise<NormalizedRow[]>` (Task 5).

- [ ] **Step 1: Append failing tests**

```ts
// append to test/metrics-normalizers.test.ts
import { normalizeMetaInsights } from '../server/utils/metrics/metaAds.ts';

describe('normalizeMetaInsights', () => {
  const insight = {
    campaign_id: '238461',
    campaign_name: 'July i30 Runout',
    date_start: '2026-07-02',
    date_stop: '2026-07-02',
    spend: '142.57',
    impressions: '9021',
    clicks: '311',
    actions: [
      { action_type: 'lead', value: '4' },
      { action_type: 'offsite_conversion.fb_pixel_lead', value: '2' },
      { action_type: 'leads_retrieval', value: '1' },
      { action_type: 'link_click', value: '250' },
    ],
  };

  it('maps campaign-day insights and sums only lead action types', () => {
    const rows = normalizeMetaInsights([insight]);
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      platform: 'meta_ads',
      date: '2026-07-02',
      campaignId: '238461',
      campaignName: 'July i30 Runout',
      spend: 142.57,
      impressions: 9021,
      clicks: 311,
      platformLeads: 7,
      sessions: null,
      users: null,
      conversions: null,
      raw: insight,
    });
  });

  it('handles missing actions and empty input', () => {
    const rows = normalizeMetaInsights([{ ...insight, actions: undefined }]);
    assert.equal(rows[0]!.platformLeads, 0);
    assert.deepEqual(normalizeMetaInsights([]), []);
  });
});
```

- [ ] **Step 2: Verify RED** — Run: `node --test test/metrics-normalizers.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
// server/utils/metrics/metaAds.ts
// Meta Marketing API insights (level=campaign, time_increment=1).
// Lead action types ported from XeroFlow metaClient.ts (incl. leads_retrieval).
import type { NormalizedRow } from './types';

export const META_LEAD_ACTION_TYPES = new Set([
  'lead',
  'offsite_conversion.fb_pixel_lead',
  'leads_retrieval',
]);

interface MetaInsight {
  campaign_id?: string;
  campaign_name?: string;
  date_start?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: Array<{ action_type: string; value: string }>;
}

export function normalizeMetaInsights(insights: unknown[]): NormalizedRow[] {
  return (insights as MetaInsight[]).map((i) => {
    const leads = (i.actions || [])
      .filter((a) => META_LEAD_ACTION_TYPES.has(a.action_type))
      .reduce((sum, a) => sum + Number(a.value || 0), 0);
    return {
      platform: 'meta_ads' as const,
      date: i.date_start || '',
      campaignId: i.campaign_id || '',
      campaignName: i.campaign_name || null,
      spend: i.spend != null ? Number(i.spend) : null,
      impressions: i.impressions != null ? Number(i.impressions) : null,
      clicks: i.clicks != null ? Number(i.clicks) : null,
      platformLeads: leads,
      sessions: null,
      users: null,
      conversions: null,
      raw: i,
    };
  });
}
```

- [ ] **Step 4: Verify GREEN** — Run: `node --test test/metrics-normalizers.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/utils/metrics/metaAds.ts test/metrics-normalizers.test.ts
git commit -m "feat(metrics): Meta Ads insights normalizer with lead-action summing"
```

---

### Task 4: Google Ads normalizer (TDD)

**Files:**
- Create: `server/utils/metrics/googleAds.ts`
- Test: `test/metrics-normalizers.test.ts` (append)

**Interfaces:**
- Produces: `normalizeGoogleAdsResults(results: unknown[]): NormalizedRow[]` (pure), `flattenSearchStream(batches: unknown): unknown[]` (pure), `buildCampaignGaql(range: DateRange): string` (pure), `fetchGoogleAdsDaily(cfg, range): Promise<NormalizedRow[]>` (Task 5).

- [ ] **Step 1: Append failing tests**

```ts
// append to test/metrics-normalizers.test.ts
import {
  normalizeGoogleAdsResults,
  flattenSearchStream,
  buildCampaignGaql,
} from '../server/utils/metrics/googleAds.ts';

describe('googleAds helpers', () => {
  // REST searchStream returns camelCase (costMicros), NOT GAQL snake_case.
  const result = {
    campaign: { id: '99887', name: 'Brand - Werribee' },
    metrics: { costMicros: '84213000', impressions: '4100', clicks: '190', conversions: 5.0 },
    segments: { date: '2026-07-03' },
  };

  it('normalizes searchStream results (costMicros -> AUD spend)', () => {
    const rows = normalizeGoogleAdsResults([result]);
    assert.deepEqual(rows[0], {
      platform: 'google_ads',
      date: '2026-07-03',
      campaignId: '99887',
      campaignName: 'Brand - Werribee',
      spend: 84.21,
      impressions: 4100,
      clicks: 190,
      platformLeads: 5,
      sessions: null,
      users: null,
      conversions: null,
      raw: result,
    });
  });

  it('flattens searchStream batch arrays', () => {
    assert.deepEqual(
      flattenSearchStream([{ results: [1, 2] }, { results: [3] }, {}]),
      [1, 2, 3],
    );
    assert.deepEqual(flattenSearchStream(undefined), []);
  });

  it('builds a campaign GAQL query for the range', () => {
    const q = buildCampaignGaql({ from: '2026-07-01', to: '2026-07-09' });
    assert.match(q, /FROM campaign/);
    assert.match(q, /segments\.date BETWEEN '2026-07-01' AND '2026-07-09'/);
    assert.match(q, /metrics\.cost_micros/);
  });
});
```

- [ ] **Step 2: Verify RED** — Run: `node --test test/metrics-normalizers.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// server/utils/metrics/googleAds.ts
// Google Ads REST searchStream + GAQL. Ported patterns from XeroFlow
// googleAdsClient.ts: dash-stripped IDs, batch flattening, camelCase results.
import type { DateRange, NormalizedRow } from './types';

export function buildCampaignGaql(range: DateRange): string {
  return `
    SELECT
      campaign.id,
      campaign.name,
      segments.date,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions
    FROM campaign
    WHERE segments.date BETWEEN '${range.from}' AND '${range.to}'
  `;
}

export function flattenSearchStream(batches: unknown): unknown[] {
  if (!Array.isArray(batches)) return [];
  const out: unknown[] = [];
  for (const b of batches) {
    const results = (b as { results?: unknown[] })?.results;
    if (Array.isArray(results)) out.push(...results);
  }
  return out;
}

interface GoogleAdsResult {
  campaign?: { id?: string | number; name?: string };
  metrics?: { costMicros?: string | number; impressions?: string | number; clicks?: string | number; conversions?: number };
  segments?: { date?: string };
}

export function normalizeGoogleAdsResults(results: unknown[]): NormalizedRow[] {
  return (results as GoogleAdsResult[]).map((r) => ({
    platform: 'google_ads' as const,
    date: r.segments?.date || '',
    campaignId: String(r.campaign?.id ?? ''),
    campaignName: r.campaign?.name || null,
    spend: r.metrics?.costMicros != null
      ? Math.round(Number(r.metrics.costMicros) / 10_000) / 100
      : null,
    impressions: r.metrics?.impressions != null ? Number(r.metrics.impressions) : null,
    clicks: r.metrics?.clicks != null ? Number(r.metrics.clicks) : null,
    platformLeads: r.metrics?.conversions != null ? Math.round(Number(r.metrics.conversions)) : null,
    sessions: null,
    users: null,
    conversions: null,
    raw: r,
  }));
}
```

- [ ] **Step 4: Verify GREEN** — Run: `node --test test/metrics-normalizers.test.ts` — Expected: PASS (all normalizer tests).

- [ ] **Step 5: Commit**

```bash
git add server/utils/metrics/googleAds.ts test/metrics-normalizers.test.ts
git commit -m "feat(metrics): Google Ads GAQL builder, searchStream flattener, normalizer"
```

---

### Task 5: Fetchers (network layer, no unit tests)

**Files:**
- Modify: `server/utils/metrics/ga4.ts`, `server/utils/metrics/metaAds.ts`, `server/utils/metrics/googleAds.ts`
- Modify: `package.json` (add `google-auth-library`)

**Interfaces:**
- Consumes: normalizers from Tasks 2-4.
- Produces:
  - `fetchGa4Daily(propertyId: string, range: DateRange): Promise<NormalizedRow[]>`
  - `fetchMetaDaily(adAccountId: string, range: DateRange): Promise<NormalizedRow[]>`
  - `fetchGoogleAdsDaily(cfg: { customerId: string; loginCustomerId?: string }, range: DateRange): Promise<NormalizedRow[]>`
  - Each throws `Error` with a human-readable message on missing env/config or API failure (the orchestrator catches per platform).

- [ ] **Step 1: Install dependency**

Run: `npm install google-auth-library` — then confirm it appears in `package.json` dependencies.

- [ ] **Step 2: Append GA4 fetcher to `ga4.ts`**

```ts
// append to server/utils/metrics/ga4.ts
import { JWT } from 'google-auth-library';
import type { DateRange } from './types';

function ga4Jwt(): JWT {
  const b64 = process.env.GA4_SERVICE_ACCOUNT_KEY;
  if (!b64) throw new Error('GA4_SERVICE_ACCOUNT_KEY not set');
  const key = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  return new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
}

/** propertyId accepts '123456789' or 'properties/123456789'. */
export async function fetchGa4Daily(propertyId: string, range: DateRange): Promise<NormalizedRow[]> {
  const prop = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
  const { token } = await ga4Jwt().getAccessToken();
  if (!token) throw new Error('GA4 auth failed: no access token');
  const resp = await $fetch<unknown>(
    `https://analyticsdata.googleapis.com/v1beta/${prop}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30_000,
      body: {
        dateRanges: [{ startDate: range.from, endDate: range.to }],
        dimensions: [{ name: 'date' }],
        metrics: GA4_METRICS.map((name) => ({ name })),
      },
    },
  );
  return normalizeGa4Response(resp);
}
```

- [ ] **Step 3: Append Meta fetcher to `metaAds.ts`**

```ts
// append to server/utils/metrics/metaAds.ts
import type { DateRange } from './types';

const META_GRAPH_BASE = 'https://graph.facebook.com/v23.0';

/** adAccountId accepts '1234567890' or 'act_1234567890'. Follows paging.next. */
export async function fetchMetaDaily(adAccountId: string, range: DateRange): Promise<NormalizedRow[]> {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) throw new Error('META_SYSTEM_USER_TOKEN not set');
  const account = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

  // Token goes in the Authorization header, NEVER the URL — error messages echo
  // URLs and sync_runs.error is persisted.
  const insights: unknown[] = [];
  let url: string | null = `${META_GRAPH_BASE}/${account}/insights?` + new URLSearchParams({
    level: 'campaign',
    time_increment: '1',
    time_range: JSON.stringify({ since: range.from, until: range.to }),
    fields: 'campaign_id,campaign_name,spend,impressions,clicks,actions',
    limit: '100',
  }).toString();

  let guard = 0;
  while (url && guard < 20) {
    const res: { data?: unknown[]; paging?: { next?: string } } = await $fetch(url, {
      timeout: 30_000,
      headers: { Authorization: `Bearer ${token}` },
    });
    insights.push(...(res.data || []));
    url = res.paging?.next || null;
    guard++;
  }
  return normalizeMetaInsights(insights);
}
```

- [ ] **Step 4: Append Google Ads fetcher to `googleAds.ts`**

```ts
// append to server/utils/metrics/googleAds.ts

const GOOGLE_ADS_BASE = 'https://googleads.googleapis.com/v20';

async function googleAdsAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Ads OAuth env vars not set (GOOGLE_ADS_CLIENT_ID/SECRET/REFRESH_TOKEN)');
  }
  const res = await $fetch<{ access_token?: string }>('https://oauth2.googleapis.com/token', {
    method: 'POST',
    timeout: 30_000,
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.access_token) throw new Error('Google Ads auth failed: no access token');
  return res.access_token;
}

export async function fetchGoogleAdsDaily(
  cfg: { customerId: string; loginCustomerId?: string },
  range: DateRange,
): Promise<NormalizedRow[]> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not set');
  const token = await googleAdsAccessToken();
  const customerId = cfg.customerId.replace(/-/g, '');

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'developer-token': developerToken,
  };
  if (cfg.loginCustomerId) headers['login-customer-id'] = cfg.loginCustomerId.replace(/-/g, '');

  // One retry on 429/5xx (ported backoff pattern, simplified to a single retry).
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const batches = await $fetch<unknown>(
        `${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:searchStream`,
        { method: 'POST', headers, timeout: 30_000, body: { query: buildCampaignGaql(range) } },
      );
      return normalizeGoogleAdsResults(flattenSearchStream(batches));
    } catch (err: any) {
      lastErr = err;
      const status = err?.status || err?.statusCode;
      if ((status === 429 || status === 500 || status === 503) && attempt === 0) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      // Surface GoogleAdsFailure detail when present (XeroFlow pattern).
      const detail = err?.data?.error?.details?.[0]?.errors?.[0]?.message
        || err?.data?.error?.message;
      throw new Error(`Google Ads API ${status || 'error'}: ${detail || err?.message || 'unknown'}`);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Google Ads API: retries exceeded');
}
```

- [ ] **Step 5: Normalizer tests still green + typecheck**

Run: `node --test test/metrics-normalizers.test.ts` — Expected: PASS.
Run: `npm run typecheck 2>&1 | grep -c "error TS"` — Expected: `532`.

- [ ] **Step 6: Commit**

```bash
git add server/utils/metrics/ package.json package-lock.json
git commit -m "feat(metrics): GA4/Meta/Google Ads API fetchers"
```

---

### Task 6: Sync orchestrator (TDD on window logic + isolation)

**Files:**
- Create: `server/utils/metrics/sync.ts`
- Test: `test/metrics-sync.test.ts`

**Interfaces:**
- Consumes: fetchers (Task 5), Drizzle tables (Task 1).
- Produces:
  - `resolveSyncWindow(latestDate: string | null, today: string): DateRange` (pure): no rows → 30-day backfill (`from = today - 29d`); else 3-day lookback (`from = today - 2d`); `to = today` in both cases.
  - `runMetricsSync(dealerId: string): Promise<Array<{ platform: Platform; status: 'success' | 'error' | 'skipped'; rows?: number; error?: string }>>` — used by both sync endpoints (Task 7).

- [ ] **Step 1: Write failing tests for window logic and isolation**

```ts
// test/metrics-sync.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveSyncWindow, syncPlatforms } from '../server/utils/metrics/sync.ts';

describe('resolveSyncWindow', () => {
  it('backfills 30 days when no rows exist', () => {
    assert.deepEqual(resolveSyncWindow(null, '2026-07-09'), { from: '2026-06-10', to: '2026-07-09' });
  });
  it('re-fetches trailing 3 days when rows exist', () => {
    assert.deepEqual(resolveSyncWindow('2026-07-08', '2026-07-09'), { from: '2026-07-07', to: '2026-07-09' });
  });
});

describe('syncPlatforms isolation', () => {
  it('one failing platform does not block the others', async () => {
    const calls: string[] = [];
    const results = await syncPlatforms([
      { platform: 'ga4', fetch: async () => { calls.push('ga4'); return []; } },
      { platform: 'meta_ads', fetch: async () => { throw new Error('token expired'); } },
      { platform: 'google_ads', fetch: async () => { calls.push('google_ads'); return []; } },
    ], async () => 0);
    assert.deepEqual(calls, ['ga4', 'google_ads']);
    assert.equal(results.find(r => r.platform === 'meta_ads')?.status, 'error');
    assert.match(results.find(r => r.platform === 'meta_ads')?.error || '', /token expired/);
    assert.equal(results.find(r => r.platform === 'ga4')?.status, 'success');
  });
});
```

- [ ] **Step 2: Verify RED** — Run: `node --test test/metrics-sync.test.ts` — Expected: FAIL (module not found).

CAUTION: `sync.ts` will import Drizzle tables; keep DB imports lazy inside `runMetricsSync` (dynamic `await import`) so the pure exports (`resolveSyncWindow`, `syncPlatforms`) are testable without a DB — same constraint that keeps other tests off heavy modules.

- [ ] **Step 3: Implement `sync.ts`**

```ts
// server/utils/metrics/sync.ts
// Orchestrates per-platform metric syncs with isolation, sync_runs bookkeeping,
// idempotent upserts, and a 10-minute concurrency guard.
import type { DateRange, MarketingIntegrations, NormalizedRow, Platform } from './types';

export function resolveSyncWindow(latestDate: string | null, today: string): DateRange {
  const base = new Date(`${today}T00:00:00Z`);
  const daysBack = latestDate === null ? 29 : 2;
  const from = new Date(base);
  from.setUTCDate(from.getUTCDate() - daysBack);
  return { from: from.toISOString().slice(0, 10), to: today };
}

export interface PlatformJob {
  platform: Platform;
  fetch: () => Promise<NormalizedRow[]>;
}

export interface PlatformResult {
  platform: Platform;
  status: 'success' | 'error' | 'skipped';
  rows?: number;
  error?: string;
}

/** Runs each job in its own try/catch; upsert(rows) persists and returns count. */
export async function syncPlatforms(
  jobs: PlatformJob[],
  upsert: (rows: NormalizedRow[]) => Promise<number>,
): Promise<PlatformResult[]> {
  const results: PlatformResult[] = [];
  for (const job of jobs) {
    try {
      const rows = await job.fetch();
      const count = await upsert(rows);
      results.push({ platform: job.platform, status: 'success', rows: count });
    } catch (err) {
      results.push({
        platform: job.platform,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

/** Full sync for a dealer: reads settings, builds jobs, records sync_runs. */
export async function runMetricsSync(dealerId: string): Promise<PlatformResult[]> {
  const { db } = await import('../db');
  const { dealers, marketingMetricsDaily, marketingSyncRuns } = await import('../../database/schema');
  const { and, eq, gte, max, sql } = await import('drizzle-orm');

  const [dealer] = await db.select({ settings: dealers.settings }).from(dealers).where(eq(dealers.id, dealerId));
  const integrations: MarketingIntegrations =
    ((dealer?.settings as Record<string, any>)?.marketing?.integrations) || {};

  const today = new Date().toISOString().slice(0, 10);

  const jobs: PlatformJob[] = [];
  if (integrations.ga4PropertyId && process.env.GA4_SERVICE_ACCOUNT_KEY) {
    const { fetchGa4Daily } = await import('./ga4');
    const propertyId = integrations.ga4PropertyId;
    jobs.push({
      platform: 'ga4',
      fetch: async () => fetchGa4Daily(propertyId, await windowFor('ga4')),
    });
  }
  if (integrations.metaAdAccountId && process.env.META_SYSTEM_USER_TOKEN) {
    const { fetchMetaDaily } = await import('./metaAds');
    const accountId = integrations.metaAdAccountId;
    jobs.push({
      platform: 'meta_ads',
      fetch: async () => fetchMetaDaily(accountId, await windowFor('meta_ads')),
    });
  }
  if (integrations.googleAdsCustomerId && process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    const { fetchGoogleAdsDaily } = await import('./googleAds');
    const cfg = {
      customerId: integrations.googleAdsCustomerId,
      loginCustomerId: integrations.googleAdsLoginCustomerId,
    };
    jobs.push({
      platform: 'google_ads',
      fetch: async () => fetchGoogleAdsDaily(cfg, await windowFor('google_ads')),
    });
  }

  async function windowFor(platform: Platform): Promise<DateRange> {
    const [row] = await db
      .select({ latest: max(marketingMetricsDaily.date) })
      .from(marketingMetricsDaily)
      .where(and(eq(marketingMetricsDaily.dealerId, dealerId), eq(marketingMetricsDaily.platform, platform)));
    return resolveSyncWindow(row?.latest ?? null, today);
  }

  const results: PlatformResult[] = [];
  for (const job of jobs) {
    // Concurrency guard: skip if a running sync younger than 10 min exists.
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const [running] = await db.select({ id: marketingSyncRuns.id }).from(marketingSyncRuns)
      .where(and(
        eq(marketingSyncRuns.dealerId, dealerId),
        eq(marketingSyncRuns.platform, job.platform),
        eq(marketingSyncRuns.status, 'running'),
        gte(marketingSyncRuns.startedAt, tenMinAgo),
      ));
    if (running) {
      results.push({ platform: job.platform, status: 'skipped', error: 'sync already running' });
      continue;
    }

    const [run] = await db.insert(marketingSyncRuns)
      .values({ dealerId, platform: job.platform, status: 'running' })
      .returning({ id: marketingSyncRuns.id });

    const [result] = await syncPlatforms([job], async (rows) => {
      if (rows.length === 0) return 0;
      for (const r of rows) {
        await db.insert(marketingMetricsDaily)
          .values({
            dealerId,
            platform: r.platform,
            date: r.date,
            campaignId: r.campaignId,
            campaignName: r.campaignName,
            spend: r.spend != null ? String(r.spend) : null,
            impressions: r.impressions,
            clicks: r.clicks,
            platformLeads: r.platformLeads,
            sessions: r.sessions,
            users: r.users,
            conversions: r.conversions,
            raw: r.raw,
            syncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [marketingMetricsDaily.dealerId, marketingMetricsDaily.platform, marketingMetricsDaily.date, marketingMetricsDaily.campaignId],
            set: {
              campaignName: r.campaignName,
              spend: r.spend != null ? String(r.spend) : null,
              impressions: r.impressions,
              clicks: r.clicks,
              platformLeads: r.platformLeads,
              sessions: r.sessions,
              users: r.users,
              conversions: r.conversions,
              raw: r.raw,
              syncedAt: new Date(),
            },
          });
      }
      return rows.length;
    });

    await db.update(marketingSyncRuns)
      .set({
        finishedAt: new Date(),
        status: result!.status === 'success' ? 'success' : 'error',
        error: result!.error ?? null,
        rowsUpserted: result!.rows ?? null,
      })
      .where(eq(marketingSyncRuns.id, run!.id));

    // Retention: keep latest 20 runs for this dealer+platform.
    await db.execute(sql`
      DELETE FROM marketing_sync_runs
      WHERE dealer_id = ${dealerId} AND platform = ${job.platform}
        AND id NOT IN (
          SELECT id FROM marketing_sync_runs
          WHERE dealer_id = ${dealerId} AND platform = ${job.platform}
          ORDER BY started_at DESC LIMIT 20
        )
    `);

    results.push(result!);
  }
  return results;
}
```

NOTE: verify `db.execute(sql...)` matches this repo's Drizzle driver usage (grep for `db.execute` in `server/`; if the codebase uses a different raw-SQL call, match it).

- [ ] **Step 4: Verify GREEN** — Run: `node --test test/metrics-sync.test.ts` — Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck** — Run: `npm run typecheck 2>&1 | grep -c "error TS"` — Expected: `532`.

- [ ] **Step 6: Commit**

```bash
git add server/utils/metrics/sync.ts test/metrics-sync.test.ts
git commit -m "feat(metrics): sync orchestrator with window logic, isolation, sync_runs"
```

---

### Task 7: Sync endpoints (internal cron + admin)

**Files:**
- Create: `server/api/internal/metrics-sync.post.ts`
- Create: `server/api/admin/metrics/sync.post.ts`

**Interfaces:**
- Consumes: `runMetricsSync(dealerId)` from Task 6.
- Produces: `POST /api/internal/metrics-sync` (header `x-cron-secret`; syncs ALL dealers that have integrations); `POST /api/admin/metrics/sync` (session auth; syncs caller's dealer). Both return `{ results: PlatformResult[] }`.

- [ ] **Step 1: Internal endpoint**

```ts
// server/api/internal/metrics-sync.post.ts
// Called by the Netlify scheduled function. Guarded by METRICS_CRON_SECRET.
import { db } from '../../utils/db';
import { dealers } from '../../database/schema';
import { runMetricsSync } from '../../utils/metrics/sync';

export default defineEventHandler(async (event) => {
  const secret = getHeader(event, 'x-cron-secret');
  if (!process.env.METRICS_CRON_SECRET || secret !== process.env.METRICS_CRON_SECRET) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const allDealers = await db.select({ id: dealers.id, settings: dealers.settings }).from(dealers);
  const results = [];
  for (const dealer of allDealers) {
    const integrations = (dealer.settings as Record<string, any>)?.marketing?.integrations;
    if (!integrations) continue;
    const dealerResults = await runMetricsSync(dealer.id);
    results.push({ dealerId: dealer.id, results: dealerResults });
  }
  return { results };
});
```

- [ ] **Step 2: Admin endpoint**

```ts
// server/api/admin/metrics/sync.post.ts
// "Refresh now" from the MarketingTab. Dealer-scoped session auth.
import { runMetricsSync } from '../../../utils/metrics/sync';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  const results = await runMetricsSync(user.dealerId);
  return { results };
});
```

- [ ] **Step 3: Typecheck** — Run: `npm run typecheck 2>&1 | grep -c "error TS"` — Expected: `532`.

- [ ] **Step 4: Commit**

```bash
git add server/api/internal/metrics-sync.post.ts server/api/admin/metrics/sync.post.ts
git commit -m "feat(metrics): cron-guarded internal sync endpoint + admin refresh endpoint"
```

---

### Task 8: CPL aggregation helper (TDD)

**Files:**
- Create: `server/utils/metrics/aggregate.ts`
- Test: `test/metrics-cpl.test.ts`

**Interfaces:**
- Consumes: nothing (pure).
- Produces (consumed by Task 9's endpoint):

```ts
export interface MetricInput {
  platform: 'ga4' | 'meta_ads' | 'google_ads';
  campaignId: string; campaignName: string | null;
  spend: number; impressions: number; clicks: number; platformLeads: number;
  sessions: number; users: number; conversions: number;
}
export interface CrmCampaignCount { utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; count: number }
export function aggregateMarketingMetrics(rows: MetricInput[], crm: CrmCampaignCount[]): {
  platforms: {
    ga4: { sessions: number; users: number; conversions: number };
    meta_ads: { spend: number; impressions: number; clicks: number; platformLeads: number; crmLeads: number; cpl: number | null };
    google_ads: { spend: number; impressions: number; clicks: number; platformLeads: number; crmLeads: number; cpl: number | null };
  };
  campaigns: Array<{ platform: string; campaignId: string; campaignName: string | null; spend: number; clicks: number; platformLeads: number; crmLeads: number; cpl: number | null }>;
}
```

- Source-mapping constants: `META_UTM_SOURCES = ['facebook','fb','meta','instagram','ig']`, `GOOGLE_UTM_SOURCES = ['google','googleads','google_ads']`, `PAID_UTM_MEDIUMS = ['cpc','ppc','paid','paid_social']`.

- [ ] **Step 1: Write failing tests**

```ts
// test/metrics-cpl.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aggregateMarketingMetrics } from '../server/utils/metrics/aggregate.ts';

const meta = (over: Record<string, unknown> = {}) => ({
  platform: 'meta_ads' as const, campaignId: '111', campaignName: 'July i30 Runout',
  spend: 100, impressions: 5000, clicks: 200, platformLeads: 10,
  sessions: 0, users: 0, conversions: 0, ...over,
});

describe('aggregateMarketingMetrics', () => {
  it('sums per-campaign rows across days and computes CPL from CRM leads', () => {
    const out = aggregateMarketingMetrics(
      [meta(), meta({ spend: 50, clicks: 100, platformLeads: 5 })],
      [{ utmSource: 'facebook', utmMedium: 'paid', utmCampaign: 'july i30 runout', count: 6 }],
    );
    const c = out.campaigns.find(c => c.campaignId === '111')!;
    assert.equal(c.spend, 150);
    assert.equal(c.platformLeads, 15);
    assert.equal(c.crmLeads, 6);
    assert.equal(c.cpl, 25);
    assert.equal(out.platforms.meta_ads.spend, 150);
    assert.equal(out.platforms.meta_ads.crmLeads, 6);
  });

  it('matches CRM campaign by campaignId too, case-insensitive names', () => {
    const out = aggregateMarketingMetrics(
      [meta({ campaignName: 'BRAND Campaign' })],
      [{ utmSource: 'fb', utmMedium: 'cpc', utmCampaign: '111', count: 2 }],
    );
    assert.equal(out.campaigns[0]!.crmLeads, 2);
  });

  it('cpl is null when no CRM leads', () => {
    const out = aggregateMarketingMetrics([meta()], []);
    assert.equal(out.campaigns[0]!.cpl, null);
  });

  it('unmatched paid CRM campaigns land in an Other/untagged row', () => {
    const out = aggregateMarketingMetrics(
      [meta()],
      [
        { utmSource: 'facebook', utmMedium: 'paid', utmCampaign: 'july i30 runout', count: 3 },
        { utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'mystery-campaign', count: 4 },
      ],
    );
    const other = out.campaigns.find(c => c.campaignId === '__other__')!;
    assert.equal(other.crmLeads, 4);
    assert.equal(other.cpl, null);
    assert.equal(other.spend, 0);
  });

  it('platform-level crmLeads uses utm source/medium mapping', () => {
    const out = aggregateMarketingMetrics(
      [meta(), { ...meta({ platform: 'google_ads' as const, campaignId: '999', campaignName: 'Brand' }) }],
      [
        { utmSource: 'instagram', utmMedium: 'paid_social', utmCampaign: null, count: 5 },
        { utmSource: 'google', utmMedium: 'cpc', utmCampaign: null, count: 7 },
        { utmSource: 'newsletter', utmMedium: 'email', utmCampaign: null, count: 99 },
      ],
    );
    assert.equal(out.platforms.meta_ads.crmLeads, 5);
    assert.equal(out.platforms.google_ads.crmLeads, 7);
  });

  it('GA4 rows aggregate into platform totals only, never campaigns', () => {
    const out = aggregateMarketingMetrics(
      [{ platform: 'ga4', campaignId: '', campaignName: null, spend: 0, impressions: 0, clicks: 0, platformLeads: 0, sessions: 120, users: 90, conversions: 4 },
       { platform: 'ga4', campaignId: '', campaignName: null, spend: 0, impressions: 0, clicks: 0, platformLeads: 0, sessions: 80, users: 60, conversions: 2 }],
      [],
    );
    assert.deepEqual(out.platforms.ga4, { sessions: 200, users: 150, conversions: 6 });
    assert.equal(out.campaigns.length, 0);
  });
});
```

- [ ] **Step 2: Verify RED** — Run: `node --test test/metrics-cpl.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement `aggregate.ts`**

```ts
// server/utils/metrics/aggregate.ts
// Pure month-to-date aggregation + CRM CPL join. No DB imports.

export interface MetricInput {
  platform: 'ga4' | 'meta_ads' | 'google_ads';
  campaignId: string;
  campaignName: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  platformLeads: number;
  sessions: number;
  users: number;
  conversions: number;
}

export interface CrmCampaignCount {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  count: number;
}

export const META_UTM_SOURCES = ['facebook', 'fb', 'meta', 'instagram', 'ig'];
export const GOOGLE_UTM_SOURCES = ['google', 'googleads', 'google_ads'];
export const PAID_UTM_MEDIUMS = ['cpc', 'ppc', 'paid', 'paid_social'];

interface CampaignAgg {
  platform: string;
  campaignId: string;
  campaignName: string | null;
  spend: number;
  clicks: number;
  platformLeads: number;
  crmLeads: number;
  cpl: number | null;
}

export function aggregateMarketingMetrics(rows: MetricInput[], crm: CrmCampaignCount[]) {
  const ga4 = { sessions: 0, users: 0, conversions: 0 };
  const adTotals = {
    meta_ads: { spend: 0, impressions: 0, clicks: 0, platformLeads: 0, crmLeads: 0, cpl: null as number | null },
    google_ads: { spend: 0, impressions: 0, clicks: 0, platformLeads: 0, crmLeads: 0, cpl: null as number | null },
  };
  const campaignMap = new Map<string, CampaignAgg>();

  for (const r of rows) {
    if (r.platform === 'ga4') {
      ga4.sessions += r.sessions;
      ga4.users += r.users;
      ga4.conversions += r.conversions;
      continue;
    }
    const t = adTotals[r.platform];
    t.spend += r.spend;
    t.impressions += r.impressions;
    t.clicks += r.clicks;
    t.platformLeads += r.platformLeads;

    const key = `${r.platform}:${r.campaignId}`;
    const c = campaignMap.get(key) || {
      platform: r.platform, campaignId: r.campaignId, campaignName: r.campaignName,
      spend: 0, clicks: 0, platformLeads: 0, crmLeads: 0, cpl: null,
    };
    c.spend += r.spend;
    c.clicks += r.clicks;
    c.platformLeads += r.platformLeads;
    if (r.campaignName) c.campaignName = r.campaignName;
    campaignMap.set(key, c);
  }

  // CRM campaign-level join: utm_campaign matches campaignId or campaignName (lowercased).
  const byId = new Map<string, CampaignAgg>();
  const byName = new Map<string, CampaignAgg>();
  for (const c of campaignMap.values()) {
    byId.set(c.campaignId.toLowerCase(), c);
    if (c.campaignName) byName.set(c.campaignName.toLowerCase(), c);
  }

  let otherPaidLeads = 0;
  for (const row of crm) {
    const source = (row.utmSource || '').toLowerCase();
    const medium = (row.utmMedium || '').toLowerCase();

    // Platform-level attribution by source (+ paid medium for Google).
    if (META_UTM_SOURCES.includes(source)) {
      adTotals.meta_ads.crmLeads += row.count;
    } else if (GOOGLE_UTM_SOURCES.includes(source) && PAID_UTM_MEDIUMS.includes(medium)) {
      adTotals.google_ads.crmLeads += row.count;
    }

    // Campaign-level match.
    const campaignKey = (row.utmCampaign || '').toLowerCase();
    if (!campaignKey) continue;
    const match = byId.get(campaignKey) || byName.get(campaignKey);
    if (match) {
      match.crmLeads += row.count;
    } else if (
      META_UTM_SOURCES.includes(source)
      || (GOOGLE_UTM_SOURCES.includes(source) && PAID_UTM_MEDIUMS.includes(medium))
    ) {
      otherPaidLeads += row.count;
    }
  }

  for (const c of campaignMap.values()) {
    c.cpl = c.crmLeads > 0 ? Math.round((c.spend / c.crmLeads) * 100) / 100 : null;
  }
  for (const t of [adTotals.meta_ads, adTotals.google_ads]) {
    t.spend = Math.round(t.spend * 100) / 100;
    t.cpl = t.crmLeads > 0 ? Math.round((t.spend / t.crmLeads) * 100) / 100 : null;
  }

  const campaigns = [...campaignMap.values()]
    .map(c => ({ ...c, spend: Math.round(c.spend * 100) / 100 }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 15);

  if (otherPaidLeads > 0) {
    campaigns.push({
      platform: 'crm', campaignId: '__other__', campaignName: 'Other / untagged',
      spend: 0, clicks: 0, platformLeads: 0, crmLeads: otherPaidLeads, cpl: null,
    });
  }

  return { platforms: { ga4, ...adTotals }, campaigns };
}
```

- [ ] **Step 4: Verify GREEN** — Run: `node --test test/metrics-cpl.test.ts` — Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add server/utils/metrics/aggregate.ts test/metrics-cpl.test.ts
git commit -m "feat(metrics): pure CPL aggregation with campaign matching and Other row"
```

---

### Task 9: Read endpoint `GET /api/admin/analytics/marketing-metrics`

**Files:**
- Create: `server/api/admin/analytics/marketing-metrics.get.ts`

**Interfaces:**
- Consumes: `aggregateMarketingMetrics` (Task 8), Drizzle tables (Task 1).
- Produces the JSON contract consumed by the UI (Task 10):

```ts
{
  period: { from: string; to: string };
  platforms: {
    ga4: { connected: boolean; sessions; users; conversions; lastSync: string | null; lastError: string | null };
    meta_ads: { connected: boolean; spend; impressions; clicks; platformLeads; crmLeads; cpl; lastSync; lastError };
    google_ads: { /* same shape as meta_ads */ };
  };
  campaigns: Array<{ platform; campaignId; campaignName; spend; clicks; platformLeads; crmLeads; cpl }>;
}
```

- [ ] **Step 1: Implement endpoint**

```ts
// server/api/admin/analytics/marketing-metrics.get.ts
// Month-to-date platform metrics + CRM CPL join. Reads only from Neon (no platform APIs).
import { db } from '../../../utils/db';
import { dealers, enquiries, marketingMetricsDaily, marketingSyncRuns } from '../../../database/schema';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { aggregateMarketingMetrics, type CrmCampaignCount, type MetricInput } from '../../../utils/metrics/aggregate';
import type { MarketingIntegrations } from '../../../utils/metrics/types';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  const dealerId = user.dealerId;

  const now = new Date();
  const from = `${now.toISOString().slice(0, 8)}01`; // YYYY-MM-01
  const to = now.toISOString().slice(0, 10);
  const monthStart = new Date(`${from}T00:00:00Z`);

  const [dealer] = await db.select({ settings: dealers.settings }).from(dealers).where(eq(dealers.id, dealerId));
  const integrations: MarketingIntegrations =
    ((dealer?.settings as Record<string, any>)?.marketing?.integrations) || {};

  const connected = {
    ga4: Boolean(integrations.ga4PropertyId && process.env.GA4_SERVICE_ACCOUNT_KEY),
    meta_ads: Boolean(integrations.metaAdAccountId && process.env.META_SYSTEM_USER_TOKEN),
    google_ads: Boolean(integrations.googleAdsCustomerId && process.env.GOOGLE_ADS_DEVELOPER_TOKEN),
  };

  const [metricRows, crmRows, syncRows] = await Promise.all([
    db.select().from(marketingMetricsDaily)
      .where(and(eq(marketingMetricsDaily.dealerId, dealerId), gte(marketingMetricsDaily.date, from))),
    db.select({
      utmSource: enquiries.utmSource,
      utmMedium: enquiries.utmMedium,
      utmCampaign: enquiries.utmCampaign,
      count: sql<number>`count(*)::int`,
    }).from(enquiries)
      .where(and(eq(enquiries.dealerId, dealerId), gte(enquiries.createdAt, monthStart)))
      .groupBy(enquiries.utmSource, enquiries.utmMedium, enquiries.utmCampaign),
    db.select().from(marketingSyncRuns)
      .where(eq(marketingSyncRuns.dealerId, dealerId))
      .orderBy(desc(marketingSyncRuns.startedAt))
      .limit(60),
  ]);

  const inputs: MetricInput[] = metricRows.map((r) => ({
    platform: r.platform as MetricInput['platform'],
    campaignId: r.campaignId,
    campaignName: r.campaignName,
    spend: Number(r.spend || 0),
    impressions: r.impressions || 0,
    clicks: r.clicks || 0,
    platformLeads: r.platformLeads || 0,
    sessions: r.sessions || 0,
    users: r.users || 0,
    conversions: r.conversions || 0,
  }));

  const crm: CrmCampaignCount[] = crmRows.map((r) => ({
    utmSource: r.utmSource, utmMedium: r.utmMedium, utmCampaign: r.utmCampaign, count: r.count,
  }));

  const agg = aggregateMarketingMetrics(inputs, crm);

  const syncMeta = (platform: string) => {
    const lastSuccess = syncRows.find((s) => s.platform === platform && s.status === 'success');
    const latest = syncRows.find((s) => s.platform === platform);
    return {
      lastSync: lastSuccess?.finishedAt?.toISOString() ?? null,
      lastError: latest?.status === 'error' ? (latest.error || 'sync failed') : null,
    };
  };

  return {
    period: { from, to },
    platforms: {
      ga4: { connected: connected.ga4, ...agg.platforms.ga4, ...syncMeta('ga4') },
      meta_ads: { connected: connected.meta_ads, ...agg.platforms.meta_ads, ...syncMeta('meta_ads') },
      google_ads: { connected: connected.google_ads, ...agg.platforms.google_ads, ...syncMeta('google_ads') },
    },
    campaigns: agg.campaigns,
  };
});
```

- [ ] **Step 2: All tests + typecheck**

Run: `node --test test/*.test.ts 2>&1 | grep -E "^ℹ (tests|pass|fail)"` — Expected: `fail 3` (the 3 pre-existing load failures only; all metrics tests pass).
Run: `npm run typecheck 2>&1 | grep -c "error TS"` — Expected: `532`.

- [ ] **Step 3: Commit**

```bash
git add server/api/admin/analytics/marketing-metrics.get.ts
git commit -m "feat(metrics): month-to-date marketing metrics read endpoint with CPL join"
```

---

### Task 10: MarketingTab UI

**Files:**
- Create: `app/components/admin/dashboard/MarketingPlatformMetrics.vue`
- Modify: `app/components/admin/dashboard/MarketingTab.vue` (insert `<MarketingPlatformMetrics />` as the FIRST child inside the root `<div class="space-y-6">`, and add the import in its `<script setup>` block)

**Interfaces:**
- Consumes: `GET /api/admin/analytics/marketing-metrics` (Task 9), `POST /api/admin/metrics/sync` (Task 7). Existing UI components: `Card, CardHeader, CardTitle, CardDescription, CardContent` (grep MarketingTab.vue for their import style and copy it), `Button` from `~/components/ui/button`, lucide-vue-next icons, `formatCurrency` auto-imported from `app/utils`.

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/admin/dashboard/MarketingPlatformMetrics.vue -->
<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="flex items-center gap-2">
            <BarChart3 class="h-5 w-5 text-indigo-500" />
            Platform Performance
          </CardTitle>
          <CardDescription>
            GA4, Meta Ads and Google Ads — month to date
            <span v-if="lastSyncLabel" class="ml-1 text-xs">· last synced {{ lastSyncLabel }}</span>
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" :disabled="syncing" @click="refreshNow">
          <RefreshCw class="mr-1 h-3 w-3" :class="syncing ? 'animate-spin' : ''" />
          {{ syncing ? 'Syncing…' : 'Refresh' }}
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="pending" class="py-8 text-center text-sm text-muted-foreground">Loading platform metrics…</div>
      <template v-else-if="data">
        <!-- Platform cards -->
        <div class="grid gap-3 sm:grid-cols-3 mb-6">
          <!-- GA4 -->
          <div class="rounded-lg border p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold">GA4 Website</span>
              <span v-if="data.platforms.ga4.lastError" class="text-[10px] rounded bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">sync failed</span>
            </div>
            <template v-if="data.platforms.ga4.connected">
              <div class="grid grid-cols-3 gap-2 text-center">
                <div><div class="text-lg font-bold">{{ n(data.platforms.ga4.sessions) }}</div><div class="text-[10px] text-muted-foreground">Sessions</div></div>
                <div><div class="text-lg font-bold">{{ n(data.platforms.ga4.users) }}</div><div class="text-[10px] text-muted-foreground">Users</div></div>
                <div><div class="text-lg font-bold">{{ n(data.platforms.ga4.conversions) }}</div><div class="text-[10px] text-muted-foreground">Key events</div></div>
              </div>
            </template>
            <p v-else class="text-xs text-muted-foreground">Not connected — set the GA4 property ID and service-account key (see marketing metrics runbook).</p>
          </div>
          <!-- Meta Ads -->
          <div class="rounded-lg border p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold">Meta Ads</span>
              <span v-if="data.platforms.meta_ads.lastError" class="text-[10px] rounded bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">sync failed</span>
            </div>
            <template v-if="data.platforms.meta_ads.connected">
              <div class="grid grid-cols-2 gap-2 text-center">
                <div><div class="text-lg font-bold">{{ formatCurrency(data.platforms.meta_ads.spend) }}</div><div class="text-[10px] text-muted-foreground">Spend</div></div>
                <div><div class="text-lg font-bold">{{ n(data.platforms.meta_ads.clicks) }}</div><div class="text-[10px] text-muted-foreground">Clicks</div></div>
                <div><div class="text-lg font-bold">{{ n(data.platforms.meta_ads.crmLeads) }}<span class="text-xs text-muted-foreground font-normal"> / {{ n(data.platforms.meta_ads.platformLeads) }}</span></div><div class="text-[10px] text-muted-foreground">CRM / platform leads</div></div>
                <div><div class="text-lg font-bold">{{ cpl(data.platforms.meta_ads.cpl) }}</div><div class="text-[10px] text-muted-foreground">CPL</div></div>
              </div>
            </template>
            <p v-else class="text-xs text-muted-foreground">Not connected — set the Meta ad account ID and system-user token.</p>
          </div>
          <!-- Google Ads -->
          <div class="rounded-lg border p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold">Google Ads</span>
              <span v-if="data.platforms.google_ads.lastError" class="text-[10px] rounded bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">sync failed</span>
            </div>
            <template v-if="data.platforms.google_ads.connected">
              <div class="grid grid-cols-2 gap-2 text-center">
                <div><div class="text-lg font-bold">{{ formatCurrency(data.platforms.google_ads.spend) }}</div><div class="text-[10px] text-muted-foreground">Spend</div></div>
                <div><div class="text-lg font-bold">{{ n(data.platforms.google_ads.clicks) }}</div><div class="text-[10px] text-muted-foreground">Clicks</div></div>
                <div><div class="text-lg font-bold">{{ n(data.platforms.google_ads.crmLeads) }}<span class="text-xs text-muted-foreground font-normal"> / {{ n(data.platforms.google_ads.platformLeads) }}</span></div><div class="text-[10px] text-muted-foreground">CRM / platform leads</div></div>
                <div><div class="text-lg font-bold">{{ cpl(data.platforms.google_ads.cpl) }}</div><div class="text-[10px] text-muted-foreground">CPL</div></div>
              </div>
            </template>
            <p v-else class="text-xs text-muted-foreground">Not connected — set the Google Ads customer ID and API tokens.</p>
          </div>
        </div>

        <!-- Campaign table -->
        <div v-if="data.campaigns.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-xs text-muted-foreground">
                <th class="py-2 pr-2 font-medium">Campaign</th>
                <th class="py-2 pr-2 font-medium text-right">Spend</th>
                <th class="py-2 pr-2 font-medium text-right">Clicks</th>
                <th class="py-2 pr-2 font-medium text-right">Platform leads</th>
                <th class="py-2 pr-2 font-medium text-right">CRM leads</th>
                <th class="py-2 font-medium text-right">CPL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in data.campaigns" :key="`${c.platform}:${c.campaignId}`" class="border-b last:border-0">
                <td class="py-2 pr-2">
                  <span class="mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
                        :class="c.platform === 'meta_ads' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : c.platform === 'google_ads' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'">
                    {{ c.platform === 'meta_ads' ? 'Meta' : c.platform === 'google_ads' ? 'Google' : 'CRM' }}
                  </span>
                  {{ c.campaignName || c.campaignId }}
                </td>
                <td class="py-2 pr-2 text-right">{{ c.spend ? formatCurrency(c.spend) : '—' }}</td>
                <td class="py-2 pr-2 text-right">{{ c.clicks ? n(c.clicks) : '—' }}</td>
                <td class="py-2 pr-2 text-right">{{ n(c.platformLeads) }}</td>
                <td class="py-2 pr-2 text-right font-medium">{{ n(c.crmLeads) }}</td>
                <td class="py-2 text-right font-medium">{{ cpl(c.cpl) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-xs text-muted-foreground">No campaign data yet — connect a platform and run a sync.</p>
      </template>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { BarChart3, RefreshCw } from 'lucide-vue-next';
// NOTE: copy the Card/Button import lines exactly as MarketingTab.vue does them.

const { data, pending, refresh } = useFetch('/api/admin/analytics/marketing-metrics', { lazy: true });

const syncing = ref(false);
async function refreshNow() {
  syncing.value = true;
  try {
    await $fetch('/api/admin/metrics/sync', { method: 'POST' });
    await refresh();
  } finally {
    syncing.value = false;
  }
}

const lastSyncLabel = computed(() => {
  const stamps = data.value
    ? [data.value.platforms.ga4.lastSync, data.value.platforms.meta_ads.lastSync, data.value.platforms.google_ads.lastSync].filter(Boolean) as string[]
    : [];
  if (!stamps.length) return null;
  const latest = new Date(stamps.sort().at(-1)!);
  const mins = Math.round((Date.now() - latest.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
});

const n = (v: number) => new Intl.NumberFormat('en-AU').format(v || 0);
const cpl = (v: number | null) => (v == null ? '—' : formatCurrency(v));
</script>
```

- [ ] **Step 2: Wire into MarketingTab**

In `app/components/admin/dashboard/MarketingTab.vue`: add `<MarketingPlatformMetrics />` as the first element inside the root `space-y-6` div; import it in script setup (match the file's existing component import style — check whether dashboard components are auto-imported; if `MarketingTab` is imported explicitly in `admin/index.vue`, add an explicit import here too).

- [ ] **Step 3: Typecheck + visual smoke**

Run: `npm run typecheck 2>&1 | grep -c "error TS"` — Expected: `532`.
Run `npm run dev`, open `/admin` → Marketing tab: all three cards render in "Not connected" state (no credentials locally), Refresh button disabled-cycles without errors, no console errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/admin/dashboard/MarketingPlatformMetrics.vue app/components/admin/dashboard/MarketingTab.vue
git commit -m "feat(dashboard): platform performance section in MarketingTab"
```

---

### Task 11: Netlify scheduled function + runbook

**Files:**
- Create: `netlify/functions/metrics-sync-cron.mts`
- Modify: `netlify.toml` (schedule config)
- Create: `docs/ops/marketing-metrics-setup.md`

**Interfaces:**
- Consumes: `POST /api/internal/metrics-sync` (Task 7).

- [ ] **Step 1: Scheduled function**

```ts
// netlify/functions/metrics-sync-cron.mts
// Daily marketing metrics sync. Calls the site's internal endpoint with the cron secret.
export default async () => {
  const base = process.env.URL || 'https://bloodhyundai.com.au';
  const secret = process.env.METRICS_CRON_SECRET;
  if (!secret) {
    console.error('[metrics-sync-cron] METRICS_CRON_SECRET not set — skipping');
    return;
  }
  const res = await fetch(`${base}/api/internal/metrics-sync`, {
    method: 'POST',
    headers: { 'x-cron-secret': secret },
  });
  console.log(`[metrics-sync-cron] status ${res.status}`);
};

export const config = { schedule: '30 18 * * *' }; // 18:30 UTC = 04:30 AEST, after ad platforms settle the prior day
```

- [ ] **Step 2: netlify.toml**

Check whether the `config.schedule` export is honored with this Netlify setup (esbuild functions). If a TOML entry is preferred, add:

```toml
[functions."metrics-sync-cron"]
  schedule = "30 18 * * *"
```

- [ ] **Step 3: Runbook `docs/ops/marketing-metrics-setup.md`**

Write a complete operator runbook covering, with exact console click-paths and commands:
1. GA4: create Google Cloud service account → enable Analytics Data API → add the SA email as Viewer on the GA4 property → `base64 -i key.json` → set `GA4_SERVICE_ACCOUNT_KEY` in Netlify env.
2. Meta: Business Manager → system user (admin) → generate token with `ads_read` scoped to the ad account → set `META_SYSTEM_USER_TOKEN`.
3. Google Ads: developer token (API Center), OAuth client (web app), one-time refresh-token mint via OAuth playground with `https://www.googleapis.com/auth/adwords` scope → set `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`.
4. `METRICS_CRON_SECRET`: `openssl rand -hex 24` → Netlify env.
5. Per-dealer settings SQL:

```sql
UPDATE dealers SET settings = jsonb_set(settings, '{marketing,integrations}', '{
  "ga4PropertyId": "properties/XXXXXXXXX",
  "metaAdAccountId": "act_XXXXXXXXXX",
  "googleAdsCustomerId": "XXX-XXX-XXXX"
}'::jsonb, true) WHERE id = '<dealer-uuid>';
```

6. Apply `scripts/migrations/2026-07-09-marketing-metrics.sql` to Neon prod (project `cold-sound-73227570`).
7. First sync: press Refresh in the MarketingTab (or `curl -X POST -H "x-cron-secret: $SECRET" https://bloodhyundai.com.au/api/internal/metrics-sync`) and verify rows in `marketing_metrics_daily` + a success row per platform in `marketing_sync_runs`.

- [ ] **Step 4: Commit**

```bash
git add netlify/functions/metrics-sync-cron.mts netlify.toml docs/ops/marketing-metrics-setup.md
git commit -m "feat(metrics): daily Netlify scheduled sync + operator runbook"
```

---

### Task 12: Final verification

- [ ] **Step 1: Full test suite**

Run: `node --test test/*.test.ts 2>&1 | grep -E "^ℹ (tests|pass|fail)"`
Expected: all metrics tests pass; total failures = 3 (pre-existing `crm-enquiry-activity`, `crm-intake-abuse`, `hyundai-model-slugs` load failures — extensionless imports, unrelated).

- [ ] **Step 2: Typecheck baseline**

Run: `npm run typecheck 2>&1 | grep -c "error TS"` — Expected: `532` (or lower).

- [ ] **Step 3: Production build**

Run: `npm run build` — Expected: completes without new errors.

- [ ] **Step 4: Verify the change end-to-end (use superpowers:verification-before-completion)**

Dev server → `/admin` → Marketing tab → section renders in not-connected state; `POST /api/admin/metrics/sync` returns `{ results: [] }` (no integrations configured locally); no console errors.

- [ ] **Step 5: Commit any stragglers; report**

Migration application to prod Neon and credential provisioning are OPERATOR steps (runbook) — do not apply to prod from this plan.
