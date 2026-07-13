// Orchestrates per-platform metric syncs with isolation, sync_runs bookkeeping,
// idempotent upserts, and a 10-minute concurrency guard.
//
// Top-level imports here MUST stay type-only. test/metrics-sync.test.ts imports
// this module directly under node:test to unit-test resolveSyncWindow and
// syncPlatforms without a DB connection — any value-level import of ../db,
// ../../database/schema, or a fetcher would pull in the Neon driver / heavy
// deps and break that test's ability to load. All such imports are dynamic
// `await import(...)` calls scoped inside runMetricsSync below.
import type { DateRange, MarketingIntegrations, NormalizedRow, Platform } from './types';

export function resolveSyncWindow(latestDate: string | null, today: string): DateRange {
  const base = new Date(`${today}T00:00:00Z`);
  const lookback = new Date(base);
  lookback.setUTCDate(lookback.getUTCDate() - 2);
  let from: Date;
  if (latestDate === null) {
    from = new Date(base);
    from.setUTCDate(from.getUTCDate() - 29);
  } else {
    const next = new Date(`${latestDate}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    from = next < lookback ? next : lookback;
  }
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

type CredentialEnvironment = { [key: string]: string | undefined };

export function credentialErrorsForIntegrations(
  integrations: MarketingIntegrations,
  env: CredentialEnvironment,
): PlatformResult[] {
  const results: PlatformResult[] = [];
  if (integrations.ga4PropertyId && !env.GA4_SERVICE_ACCOUNT_KEY) {
    results.push({ platform: 'ga4', status: 'error', error: 'GA4_SERVICE_ACCOUNT_KEY is not configured' });
  }
  if (integrations.metaAdAccountId && !env.META_SYSTEM_USER_TOKEN) {
    results.push({ platform: 'meta_ads', status: 'error', error: 'META_SYSTEM_USER_TOKEN is not configured' });
  }
  const googleCredentials = [
    env.GOOGLE_ADS_DEVELOPER_TOKEN,
    env.GOOGLE_ADS_CLIENT_ID,
    env.GOOGLE_ADS_CLIENT_SECRET,
    env.GOOGLE_ADS_REFRESH_TOKEN,
  ];
  if (integrations.googleAdsCustomerId && googleCredentials.some(value => !value)) {
    results.push({ platform: 'google_ads', status: 'error', error: 'Google Ads runtime credentials are not fully configured' });
  }
  return results;
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
  const { and, desc, eq, lt, sql } = await import('drizzle-orm');

  const [dealer] = await db.select({ settings: dealers.settings }).from(dealers).where(eq(dealers.id, dealerId));
  const integrations: MarketingIntegrations =
    ((dealer?.settings as Record<string, any>)?.marketing?.integrations) || {};

  const today = new Date().toISOString().slice(0, 10);

  const jobs: PlatformJob[] = [];
  if (integrations.ga4PropertyId && process.env.GA4_SERVICE_ACCOUNT_KEY) {
    const { fetchGa4DailyWithBreakdowns } = await import('./ga4');
    const propertyId = integrations.ga4PropertyId;
    jobs.push({
      platform: 'ga4',
      fetch: async () => fetchGa4DailyWithBreakdowns(propertyId, await windowFor('ga4')),
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
  if (
    integrations.googleAdsCustomerId &&
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN
  ) {
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
    const [latest] = await db
      .select({ date: marketingMetricsDaily.date, raw: marketingMetricsDaily.raw })
      .from(marketingMetricsDaily)
      .where(and(eq(marketingMetricsDaily.dealerId, dealerId), eq(marketingMetricsDaily.platform, platform)))
      .orderBy(desc(marketingMetricsDaily.date))
      .limit(1);
    const raw = latest?.raw as { ga4Breakdowns?: unknown; providerBreakdowns?: unknown } | null;
    const hasRequiredCache = platform === 'ga4'
      ? Boolean(raw?.ga4Breakdowns)
      : Array.isArray(raw?.providerBreakdowns);
    return resolveSyncWindow(hasRequiredCache ? latest?.date ?? null : null, today);
  }

  const results: PlatformResult[] = credentialErrorsForIntegrations(integrations, process.env);
  for (const job of jobs) {
    // Expire stale 'running' rows (crashed/never-finished syncs) before
    // attempting the insert below, so a dead row can't hold the
    // constraint-backed slot forever.
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    await db.update(marketingSyncRuns)
      .set({ status: 'error', error: 'stale: never finished', finishedAt: new Date() })
      .where(and(
        eq(marketingSyncRuns.dealerId, dealerId),
        eq(marketingSyncRuns.platform, job.platform),
        eq(marketingSyncRuns.status, 'running'),
        lt(marketingSyncRuns.startedAt, tenMinAgo),
      ));

    // Constraint-backed concurrency guard: marketing_sync_runs_one_running
    // (partial unique index on dealer_id, platform WHERE status = 'running')
    // ensures only one live sync per dealer+platform can hold this slot, even
    // when runMetricsSync is invoked concurrently (cron + manual refresh).
    const [run] = await db.insert(marketingSyncRuns)
      .values({ dealerId, platform: job.platform, status: 'running' })
      .onConflictDoNothing()
      .returning({ id: marketingSyncRuns.id });

    if (!run) {
      results.push({ platform: job.platform, status: 'skipped', error: 'sync already running' });
      continue;
    }

    const [result] = await syncPlatforms([job], async (rows) => {
      if (rows.length === 0) return 0;
      // Transactional: a failure partway through leaves NO rows written for
      // this platform's batch, so max(date) stays at its prior value and the
      // next run's resolveSyncWindow re-attempts the same window cleanly
      // instead of silently skipping the rows that failed to write.
      await db.transaction(async (tx) => {
        for (const r of rows) {
          await tx.insert(marketingMetricsDaily)
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
      });
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

    // Retention: keep latest 20 runs for this dealer+platform. db.execute(sql`...`)
    // matches this repo's convention — server/utils/db.ts already calls
    // `tx.execute(sql\`...\`)` inside withRlsTenantContext, and `tx` there is the
    // same NeonDatabase instance type as `db` (drizzle-orm/neon-serverless), so
    // `.execute()` is available directly on `db` too.
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
