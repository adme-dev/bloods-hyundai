# Marketing Hub — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the marketing report singular and trustworthy — one canonical report, ROAS added, attribution activated, and a migration-on-deploy runner so code never ships ahead of its database again.

**Architecture:** Nuxt 3/Nitro on Netlify, Drizzle + Neon. Most of Phase 1 already exists (Codex): the canonical report `/admin/marketing-report` already uses the misattribution-safe `aggregateMarketingMetrics` and already computes CTR/CPC/CPL/CPM/conversion-value; `useUtmParams` already persists UTMs via sessionStorage; the attribution engine + intake wiring are complete. Net-new work: a build-time migration runner + ledger, ROAS, retiring the duplicate report, and verification. Spec: `docs/superpowers/specs/2026-07-10-marketing-hub-phase1-design.md`.

**Tech Stack:** tsx (build script), `@neondatabase/serverless` Pool, Drizzle, node:test, Vue 3 / Nuxt UI.

## Global Constraints

- Work from the healthy clone `/Users/paulgiurin/Documents/GitHub/bloods-hyundai-fix` (the original checkout is corrupted). Branch: create `feat/marketing-hub-phase1` off `main`.
- Tests: `node:test` + `node:assert/strict`, run `node --test test/<file>.test.ts`. Regression baseline: `node --test test/*.test.ts` = all pass except the 3 known pre-existing load failures (`crm-enquiry-activity`, `crm-intake-abuse`, `hyundai-model-slugs`).
- Typecheck must not regress: `npm run typecheck 2>&1 | grep -c "error TS"` ≤ current baseline (capture it in Task 0).
- DB is Neon prod `cold-sound-73227570`, dealer id `3e2d9601-d21e-4b86-bd77-6ba790de534a`. Money is `numeric` → `Number()` before math; currency renders with cents; ratios show "—" on zero denominator, never NaN/∞.
- Never fake a metric: ROAS renders only when a real value basis exists.
- Migrations are idempotent (`IF NOT EXISTS`); the runner records each in a `schema_migrations` ledger so it runs once.
- Do not touch chatbot/other-analytics files beyond what a task names (marketing ownership boundary).

---

### Task 0: Branch + baselines

**Files:** none (setup)

- [ ] **Step 1:** From the clone, `git checkout main && git pull && git checkout -b feat/marketing-hub-phase1`.
- [ ] **Step 2:** Capture baselines: `npm run typecheck 2>&1 | grep -c "error TS"` (record N) and `node --test test/*.test.ts 2>&1 | grep -E "^ℹ (tests|pass|fail)"` (record pass/fail). Write both into the PR description later.

---

### Task 1: Migration-on-deploy runner + ledger

**Files:**
- Create: `scripts/migrate.ts`
- Create: `test/migrate-runner.test.ts`
- Modify: `package.json` (add `migrate` script; chain into `build`)

**Interfaces:**
- Produces `scripts/migrate.ts` runnable via `tsx scripts/migrate.ts`. Pure helpers exported for test: `parseStatements(sql: string): string[]`, `isNonTransactional(sql: string): boolean`, `pendingMigrations(allFiles: string[], applied: Set<string>): string[]`.

- [ ] **Step 1: Write the failing test for the pure helpers**

```ts
// test/migrate-runner.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseStatements, isNonTransactional, pendingMigrations } from '../scripts/migrate.ts';

describe('migrate runner helpers', () => {
  it('splits SQL into statements, ignoring comments and blank lines', () => {
    const sql = `-- comment\nCREATE TABLE a (id int);\n\nCREATE INDEX i ON a (id);\n`;
    assert.deepEqual(parseStatements(sql), ['CREATE TABLE a (id int)', 'CREATE INDEX i ON a (id)']);
  });
  it('flags files that must run outside a transaction', () => {
    assert.equal(isNonTransactional('CREATE INDEX CONCURRENTLY x ON a (id);'), true);
    assert.equal(isNonTransactional('-- migrate:no-transaction\nUPDATE a SET id=1;'), true);
    assert.equal(isNonTransactional('CREATE TABLE a (id int);'), false);
  });
  it('returns only files not yet applied, in order', () => {
    const all = ['2026-07-08-a.sql', '2026-07-09-b.sql', '2026-07-10-c.sql'];
    const applied = new Set(['2026-07-08-a.sql']);
    assert.deepEqual(pendingMigrations(all, applied), ['2026-07-09-b.sql', '2026-07-10-c.sql']);
  });
});
```

- [ ] **Step 2: Verify RED** — `node --test test/migrate-runner.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement `scripts/migrate.ts`**

```ts
// scripts/migrate.ts
// Applies pending SQL migrations from scripts/migrations/ to NEON_DATABASE_URL,
// recording each in a schema_migrations ledger so it runs exactly once.
// Wired into the Netlify build so code never serves ahead of its database.
// Local builds without NEON_DATABASE_URL are a no-op (logged), so `npm run build`
// still works offline.
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

/** Split a SQL file into individual statements (naive `;` split — safe for this
 * repo's DDL/UPDATE migrations, which contain no dollar-quoted bodies). */
export function parseStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map(s => s.replace(/^\s*--.*$/gm, '').trim())
    .filter(Boolean);
}

/** True when the file must NOT be wrapped in a transaction (CONCURRENTLY, or an
 * explicit `-- migrate:no-transaction` header). */
export function isNonTransactional(sql: string): boolean {
  return /create\s+index\s+concurrently/i.test(sql) || /--\s*migrate:no-transaction/i.test(sql);
}

export function pendingMigrations(allFiles: string[], applied: Set<string>): string[] {
  return allFiles.filter(f => f.endsWith('.sql') && !applied.has(f)).sort();
}

async function main() {
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    console.log('[migrate] NEON_DATABASE_URL not set — skipping (local build).');
    return;
  }
  const { Pool, neonConfig } = await import('@neondatabase/serverless');
  const ws = (await import('ws')).default;
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString });
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename varchar(255) PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
    const appliedRows = await pool.query('SELECT filename FROM schema_migrations');
    const applied = new Set<string>(appliedRows.rows.map((r: any) => r.filename));
    const all = readdirSync(MIGRATIONS_DIR);
    const pending = pendingMigrations(all, applied);
    if (!pending.length) { console.log('[migrate] up to date.'); return; }
    for (const file of pending) {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`[migrate] applying ${file}`);
      if (isNonTransactional(sql)) {
        for (const stmt of parseStatements(sql)) await pool.query(stmt);
      } else {
        // wrap in an explicit transaction for atomicity
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          for (const stmt of parseStatements(sql)) await client.query(stmt);
          await client.query('COMMIT');
        } catch (e) { await client.query('ROLLBACK'); throw e; }
        finally { client.release(); }
      }
      await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
      console.log(`[migrate] ✓ ${file}`);
    }
  } finally { await pool.end(); }
}

// Only run when executed directly (not when imported by tests).
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  main().catch(err => { console.error('[migrate] FAILED:', err.message); process.exit(1); });
}
```

- [ ] **Step 4: Verify GREEN** — `node --test test/migrate-runner.test.ts` → 3 pass.

- [ ] **Step 5: Wire into build** — in `package.json`, add `"migrate": "tsx scripts/migrate.ts"` and change build to run it first:
`"build": "tsx scripts/migrate.ts && NODE_OPTIONS='--max-old-space-size=8192' nuxt build"`.

- [ ] **Step 6: Typecheck + commit**

Run `npm run typecheck 2>&1 | grep -c "error TS"` (≤ baseline). Commit:
```bash
git add scripts/migrate.ts test/migrate-runner.test.ts package.json
git commit -m "feat(deploy): migration-on-deploy runner + schema_migrations ledger"
```

---

### Task 2: Seed ledger with applied migrations + apply the two pending ones (production, MCP)

**Files:** none in-repo (production DB via Neon MCP). This task is executed by the controller using the Neon MCP, not a code subagent — the runner needs the ledger to reflect reality, and the two pending migrations must land.

- [ ] **Step 1:** Create the ledger and seed already-applied files so the runner won't re-run them:
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (filename varchar(255) PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
INSERT INTO schema_migrations (filename) VALUES
  ('2026-07-08-add-read-notification-ids.sql'),
  ('2026-07-08-normalize-enquiry-status.sql'),
  ('2026-07-09-add-enquiry-attribution-fields.sql'),
  ('2026-07-09-marketing-metrics.sql')
ON CONFLICT DO NOTHING;
```
- [ ] **Step 2:** Apply `2026-07-09-backfill-enquiry-attribution.sql` (data UPDATE — review output for row counts), then record it in the ledger.
- [ ] **Step 3:** Apply `2026-07-09-admin-performance-indexes.sql` — `CREATE INDEX CONCURRENTLY`, so run each statement **individually, not in a transaction** (Neon MCP `run_sql` per statement, not `run_sql_transaction`). Record it in the ledger.
- [ ] **Step 4:** Verify: `SELECT filename FROM schema_migrations ORDER BY filename;` lists all six; `SELECT count(*) FROM enquiries WHERE attributed_platform IS NOT NULL;` is now > 0 for any historically-taggable leads.

---

### Task 3: ROAS (configurable avgSaleValue)

**Files:**
- Modify: `server/api/admin/analytics/marketing-report.get.ts` (add roas to paidMedia + per-platform blocks)
- Modify: `app/pages/admin/marketing-report.vue` (display ROAS + a settings hint when unset)
- Modify: `test/metrics-cpl.test.ts` or a small new `test/roas.test.ts` (pure roas helper)

**Interfaces:**
- Produces a pure helper `computeRoas(revenueOrLeadValue: number, spend: number): number | null` (null when spend ≤ 0). Revenue basis: prefer summed `conversionsValue` when > 0; else `crmLeads × avgSaleValue` when `avgSaleValue` set; else null.
- Reads `settings.marketing.avgSaleValue` (number) from the dealer settings already loaded in the endpoint.

- [ ] **Step 1: Write the failing test**

```ts
// test/roas.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { roasBasis, computeRoas } from '../server/utils/metrics/roas.ts';

describe('roas', () => {
  it('is null when spend is zero', () => assert.equal(computeRoas(500, 0), null));
  it('divides revenue by spend, rounded to 2dp', () => assert.equal(computeRoas(1500, 1000), 1.5));
  it('prefers platform conversion value when present', () => {
    assert.equal(roasBasis({ conversionsValue: 900, crmLeads: 3, avgSaleValue: 40000 }), 900);
  });
  it('falls back to crmLeads x avgSaleValue', () => {
    assert.equal(roasBasis({ conversionsValue: 0, crmLeads: 2, avgSaleValue: 40000 }), 80000);
  });
  it('is null with no basis', () => {
    assert.equal(roasBasis({ conversionsValue: 0, crmLeads: 2, avgSaleValue: null }), null);
  });
});
```

- [ ] **Step 2: Verify RED** — `node --test test/roas.test.ts` → FAIL.

- [ ] **Step 3: Implement `server/utils/metrics/roas.ts`**

```ts
// server/utils/metrics/roas.ts
export function roasBasis(input: { conversionsValue: number; crmLeads: number; avgSaleValue: number | null }): number | null {
  if (input.conversionsValue > 0) return input.conversionsValue;
  if (input.avgSaleValue && input.crmLeads > 0) return input.crmLeads * input.avgSaleValue;
  return null;
}
export function computeRoas(revenue: number | null, spend: number): number | null {
  if (revenue == null || spend <= 0) return null;
  return Math.round((revenue / spend) * 100) / 100;
}
```

- [ ] **Step 4: Verify GREEN** — `node --test test/roas.test.ts` → 5 pass.

- [ ] **Step 5: Wire into the endpoint** — in `buildProfessionalMetrics` (marketing-report.get.ts:410 `paidMedia` block and the per-platform `buildAdPlatformMetrics`), read `avgSaleValue` (thread it in from the handler's `dealerSettings.marketing?.avgSaleValue ?? null`) and add:
```ts
// in paidMedia:
roas: computeRoas(roasBasis({ conversionsValue: <summed paid conversionsValue>, crmLeads: paidCrmLeads, avgSaleValue }), paidSpend),
```
Add the analogous `roas` field to each per-platform block. Import the helpers at the top.

- [ ] **Step 6: Display** — in `app/pages/admin/marketing-report.vue`, render ROAS wherever CPL is shown; when it's null AND `avgSaleValue` is unset, show a one-line hint linking to settings ("Set an average sale value to see ROAS"). Currency/×-format consistent with the page.

- [ ] **Step 7: Typecheck + regression + commit**

`npm run typecheck` (≤ baseline); `node --test test/*.test.ts` (baseline). Commit:
```bash
git add server/utils/metrics/roas.ts test/roas.test.ts server/api/admin/analytics/marketing-report.get.ts app/pages/admin/marketing-report.vue
git commit -m "feat(marketing): ROAS from conversion value or avgSaleValue, hidden until basis exists"
```

---

### Task 4: Retire the duplicate report; add a summary card that links out

**Files:**
- Delete: `app/components/admin/dashboard/MarketingPlatformMetrics.vue`, `server/api/admin/analytics/marketing-metrics.get.ts`
- Create: `app/components/admin/dashboard/MarketingSummaryCard.vue`
- Modify: `app/components/admin/dashboard/MarketingTab.vue` (swap the section for the summary card)

**Interfaces:**
- `MarketingSummaryCard.vue` fetches `/api/admin/analytics/marketing-report` (the canonical endpoint), shows a compact headline (paid spend, CRM leads, true CPL, ROAS-if-present), and a button linking to `/admin/marketing-report`. Reuses the endpoint's existing response shape — no new endpoint.

- [ ] **Step 1:** Grep for every importer of the deleted files so nothing dangles:
`grep -rn "MarketingPlatformMetrics\|analytics/marketing-metrics" app server` — expect only `MarketingTab.vue` + the deleted endpoint's own references. Note any other consumer and update it.
- [ ] **Step 2:** Create `MarketingSummaryCard.vue` — a `Card` with headline stats from `useFetch('/api/admin/analytics/marketing-report')` (guard pending/error like the existing component did) and a `Button as-child` link to `/admin/marketing-report` (use the `ui-button` marker fix already in the codebase; no per-call color workarounds).
- [ ] **Step 3:** In `MarketingTab.vue`, replace the `<MarketingPlatformMetrics />` import + mount with `<MarketingSummaryCard />`.
- [ ] **Step 4:** Delete `MarketingPlatformMetrics.vue` and `server/api/admin/analytics/marketing-metrics.get.ts`.
- [ ] **Step 5:** Typecheck (≤ baseline), dev-server boots without errors referencing the removed files, `node --test test/*.test.ts` baseline. Commit:
```bash
git add -A
git commit -m "refactor(marketing): single canonical report; Marketing tab shows summary card linking to it"
```

---

### Task 5: Activate attribution — tagged-URL sheet, persistence test, end-to-end proof

**Files:**
- Create: `docs/ops/tag-your-ads.md` (operator deliverable)
- Create: `test/utm-persistence.test.ts` (guards the sessionStorage capture contract)

**Interfaces:** no endpoint changes — the pipeline already exists. This task produces the operator sheet, a regression test around `useUtmParams`, and a documented end-to-end proof.

- [ ] **Step 1: Generate the tagged-URL sheet** — from the live campaigns in `marketing_metrics_daily` (3 Meta, N Google), write `docs/ops/tag-your-ads.md` with the exact destination URL per campaign, e.g. `https://bloodhyundai.com.au/?utm_source=facebook&utm_medium=paid_social&utm_campaign=<slug>` for Meta, plus: enable Meta URL parameters/auto-fbclid, and confirm Google auto-tagging (`gclid`) is on. Include a "how to verify" checklist.
- [ ] **Step 2: Persistence test** — read `app/composables/useUtmParams.ts`; write `test/utm-persistence.test.ts` asserting the pure read/merge logic (first-touch precedence, sessionStorage round-trip via a mock storage). If the composable's logic isn't unit-testable as-is, extract the pure merge into a helper and test that (minimal refactor, note it).
- [ ] **Step 3: End-to-end proof (documented, manual)** — after the owner tags at least one Meta ad: submit a test enquiry through the tagged URL; confirm the `enquiries` row lands with `utm_source='facebook'`, an `fbclid`, `attributed_platform='meta_ads'`, and a matched campaign; confirm it surfaces in `/admin/marketing-report` Meta CPL. Record the result (row id + screenshot) in `docs/ops/tag-your-ads.md` under "Verified".
- [ ] **Step 4: Commit**
```bash
git add docs/ops/tag-your-ads.md test/utm-persistence.test.ts
git commit -m "docs+test(marketing): ad URL tagging guide + UTM capture persistence test"
```

---

### Task 6: Final verification

- [ ] **Step 1:** `node --test test/*.test.ts 2>&1 | grep -E "^ℹ (tests|pass|fail)"` — all new tests pass; total failures = 3 pre-existing only.
- [ ] **Step 2:** `npm run typecheck 2>&1 | grep -c "error TS"` ≤ baseline from Task 0.
- [ ] **Step 3:** `npm run build` — completes; confirm the migrate step runs (logs `[migrate] up to date.` locally with no DB, or applies pending on Netlify).
- [ ] **Step 4:** Verify end-to-end per superpowers:verification-before-completion — dev server `/admin` → Marketing tab shows the summary card linking to `/admin/marketing-report`; the report loads with spend, CRM leads, CPL, and ROAS (or its "set avgSaleValue" hint); no console 500s.
- [ ] **Step 5:** Open PR `feat/marketing-hub-phase1` → `main` with the Task 0 baselines, the migration-runner note, and the two owner actions (tag ads, set avgSaleValue). Do NOT self-merge; this ships to production.

## Self-review notes (author)

- **Spec coverage:** consolidation (T4), attribution activation (T5) + backfill (T2), computed metrics — CTR/CPC/CPL pre-exist, ROAS added (T3), migration-on-deploy (T1+T2). All four spec workstreams covered.
- **Ordering:** T1 (runner) before T2 (which seeds its ledger) before deploys; T3/T4 independent; T5 depends on the owner tagging ads (async — the code/test parts don't block).
- **Owner actions (not code):** tag ad URLs (T5), set `avgSaleValue` in settings (T3), pause Codex on marketing (already requested).
