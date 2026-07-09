// Date-bounded platform metrics + CRM CPL join. Reads only from Neon (no platform APIs).
import { db } from '../../../utils/db';
import { dealers, enquiries, marketingMetricsDaily, marketingSyncRuns } from '../../../database/schema';
import { and, desc, eq, gte, isNull, lt, lte, sql } from 'drizzle-orm';
import { aggregateMarketingMetrics, type CrmCampaignCount, type MetricInput } from '../../../utils/metrics/aggregate';
import type { MarketingIntegrations } from '../../../utils/metrics/types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  const dealerId = user.dealerId;

  const { from, to, fromDate, dayAfterTo } = resolveRange(getQuery(event));

  const [dealer] = await db.select({ settings: dealers.settings }).from(dealers).where(eq(dealers.id, dealerId));
  const integrations: MarketingIntegrations =
    ((dealer?.settings as Record<string, any>)?.marketing?.integrations) || {};

  const connected = {
    ga4: Boolean(integrations.ga4PropertyId && process.env.GA4_SERVICE_ACCOUNT_KEY),
    meta_ads: Boolean(integrations.metaAdAccountId && process.env.META_SYSTEM_USER_TOKEN),
    google_ads: Boolean(
      integrations.googleAdsCustomerId &&
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      process.env.GOOGLE_ADS_CLIENT_ID &&
      process.env.GOOGLE_ADS_CLIENT_SECRET &&
      process.env.GOOGLE_ADS_REFRESH_TOKEN,
    ),
  };

  const [metricRows, crmRows, syncRows] = await Promise.all([
    db.select().from(marketingMetricsDaily)
      .where(and(
        eq(marketingMetricsDaily.dealerId, dealerId),
        gte(marketingMetricsDaily.date, from),
        lte(marketingMetricsDaily.date, to),
      )),
    db.select({
      utmSource: enquiries.utmSource,
      utmMedium: enquiries.utmMedium,
      utmCampaign: enquiries.utmCampaign,
      count: sql<number>`count(*)::int`,
    }).from(enquiries)
      .where(and(eq(enquiries.dealerId, dealerId), gte(enquiries.createdAt, fromDate), lt(enquiries.createdAt, dayAfterTo), isNull(enquiries.archivedAt)))
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

function resolveRange(query: Record<string, unknown>) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const defaultFrom = `${today.slice(0, 8)}01`;

  const from = parseDateQuery(query.from, defaultFrom, 'from');
  const to = parseDateQuery(query.to, today, 'to');
  const fromDate = toUtcDate(from);
  const toDate = toUtcDate(to);

  if (from > to) {
    throw createError({ statusCode: 400, message: 'from must be on or before to' });
  }

  const rangeDays = Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1;
  if (rangeDays > MAX_RANGE_DAYS) {
    throw createError({ statusCode: 400, message: `Date range cannot exceed ${MAX_RANGE_DAYS} days` });
  }

  const dayAfterTo = new Date(toDate);
  dayAfterTo.setUTCDate(dayAfterTo.getUTCDate() + 1);

  return { from, to, fromDate, dayAfterTo };
}

function parseDateQuery(value: unknown, fallback: string, name: string) {
  if (value == null || value === '') return fallback;
  if (Array.isArray(value)) {
    throw createError({ statusCode: 400, message: `${name} must be a single YYYY-MM-DD date` });
  }
  const str = String(value);
  const parsed = toUtcDate(str);
  if (!DATE_RE.test(str) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== str) {
    throw createError({ statusCode: 400, message: `${name} must be a valid YYYY-MM-DD date` });
  }
  return str;
}

function toUtcDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}
