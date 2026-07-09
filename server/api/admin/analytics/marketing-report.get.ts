import { and, desc, eq, gte, lt, lte, sql } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers, enquiries, marketingMetricsDaily, marketingSyncRuns, type MarketingMetricsDaily } from '../../../database/schema';
import { aggregateMarketingMetrics, type CrmCampaignCount, type MetricInput } from '../../../utils/metrics/aggregate';
import {
  calculateLeadSignalCoverage,
  classifyCrmLeadSource,
  summarizeLeadSources,
  type CrmLeadSignal,
} from '../../../utils/metrics/crmReport';
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

  const [metricRows, leadRows, dailyLeadRows, syncRows] = await Promise.all([
    db.select().from(marketingMetricsDaily)
      .where(and(
        eq(marketingMetricsDaily.dealerId, dealerId),
        gte(marketingMetricsDaily.date, from),
        lte(marketingMetricsDaily.date, to),
      )),
    db.select({
      id: enquiries.id,
      createdAt: enquiries.createdAt,
      type: enquiries.type,
      status: enquiries.status,
      source: enquiries.source,
      utmSource: enquiries.utmSource,
      utmMedium: enquiries.utmMedium,
      utmCampaign: enquiries.utmCampaign,
      vehicleStockId: enquiries.vehicleStockId,
      testDrive: enquiries.testDrive,
      financeInterest: enquiries.financeInterest,
      syncedToCrm: enquiries.syncedToCrm,
      crmRef: enquiries.crmRef,
      externalRef: enquiries.externalRef,
    }).from(enquiries)
      .where(and(eq(enquiries.dealerId, dealerId), gte(enquiries.createdAt, fromDate), lt(enquiries.createdAt, dayAfterTo)))
      .orderBy(desc(enquiries.createdAt)),
    db.select({
      date: sql<string>`date_trunc('day', ${enquiries.createdAt})::date`,
      total: sql<number>`count(*)::int`,
      withUtm: sql<number>`count(*) filter (where ${enquiries.utmSource} is not null or ${enquiries.utmMedium} is not null or ${enquiries.utmCampaign} is not null)::int`,
      withCampaign: sql<number>`count(*) filter (where ${enquiries.utmCampaign} is not null and ${enquiries.utmCampaign} <> '')::int`,
      syncedToCrm: sql<number>`count(*) filter (where ${enquiries.syncedToCrm} = true)::int`,
    }).from(enquiries)
      .where(and(eq(enquiries.dealerId, dealerId), gte(enquiries.createdAt, fromDate), lt(enquiries.createdAt, dayAfterTo)))
      .groupBy(sql`date_trunc('day', ${enquiries.createdAt})::date`)
      .orderBy(sql`date_trunc('day', ${enquiries.createdAt})::date`),
    db.select().from(marketingSyncRuns)
      .where(eq(marketingSyncRuns.dealerId, dealerId))
      .orderBy(desc(marketingSyncRuns.startedAt))
      .limit(60),
  ]);

  const crmSignals: CrmLeadSignal[] = leadRows.map((lead) => ({
    source: lead.source,
    type: lead.type,
    status: lead.status,
    utmSource: lead.utmSource,
    utmMedium: lead.utmMedium,
    utmCampaign: lead.utmCampaign,
    vehicleStockId: lead.vehicleStockId,
    syncedToCrm: lead.syncedToCrm,
    crmRef: lead.crmRef,
    externalRef: lead.externalRef,
  }));

  const crmCampaigns = summarizeCrmCampaigns(crmSignals);
  const metrics = aggregateMarketingMetrics(toMetricInputs(metricRows), crmCampaigns);
  const coverage = calculateLeadSignalCoverage(crmSignals);
  const leadSources = summarizeLeadSources(crmSignals);
  const typeBreakdown = summarizeBy(crmSignals, lead => lead.type || 'unknown');
  const statusBreakdown = summarizeBy(crmSignals, lead => lead.status || 'unknown');

  return {
    period: { from, to },
    connected: {
      ga4: Boolean(integrations.ga4PropertyId && process.env.GA4_SERVICE_ACCOUNT_KEY),
      meta_ads: Boolean(integrations.metaAdAccountId && process.env.META_SYSTEM_USER_TOKEN),
      google_ads: Boolean(
        integrations.googleAdsCustomerId &&
        process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
        process.env.GOOGLE_ADS_CLIENT_ID &&
        process.env.GOOGLE_ADS_CLIENT_SECRET &&
        process.env.GOOGLE_ADS_REFRESH_TOKEN,
      ),
    },
    summary: {
      totalCrmLeads: coverage.total,
      paidCrmLeads: metrics.platforms.meta_ads.crmLeads + metrics.platforms.google_ads.crmLeads,
      syncedToCrm: coverage.syncedToCrm,
      externalMarketplaceLeads: leadSources
        .filter(source => source.category === 'external_marketplace')
        .reduce((sum, source) => sum + source.total, 0),
      crmSyncCoverage: coverage.crmSyncCoverage,
      utmCoverage: coverage.utmCoverage,
      campaignCoverage: coverage.campaignCoverage,
      paidAttributionCoverage: coverage.paidAttributionCoverage,
      sourceCoverage: coverage.sourceCoverage,
    },
    platformMetrics: metrics.platforms,
    campaigns: metrics.campaigns,
    crm: {
      coverage,
      leadSources,
      typeBreakdown,
      statusBreakdown,
      daily: dailyLeadRows,
      recentLeads: leadRows.slice(0, 30).map((lead) => ({
        id: lead.id,
        createdAt: lead.createdAt.toISOString(),
        type: lead.type,
        status: lead.status,
        source: lead.source,
        utmSource: lead.utmSource,
        utmMedium: lead.utmMedium,
        utmCampaign: lead.utmCampaign,
        vehicleStockId: lead.vehicleStockId,
        testDrive: lead.testDrive,
        financeInterest: lead.financeInterest,
        syncedToCrm: lead.syncedToCrm,
        hasCrmRef: Boolean(lead.crmRef),
        hasExternalRef: Boolean(lead.externalRef),
        sourceBucket: classifyCrmLeadSource(lead),
      })),
    },
    dataLayer: {
      status: dataLayerStatus(coverage.utmCoverage, coverage.sourceCoverage),
      expectedEvents: [
        { event: 'formSubmission', destination: 'GTM dataLayer', status: 'implemented' },
        { event: 'FormSubmission', destination: 'GTM dataLayer compatibility', status: 'implemented' },
        { event: 'generate_lead', destination: 'GA4', status: 'implemented' },
        { event: 'Lead', destination: 'Meta Pixel', status: 'implemented' },
      ],
      requiredLeadFields: [
        'enquiryId',
        'formType',
        'formLocation',
        'source',
        'utmSource',
        'utmMedium',
        'utmCampaign',
        'vehicleStockId',
      ],
    },
    syncRuns: syncRows.slice(0, 12).map((run) => ({
      platform: run.platform,
      status: run.status,
      rowsUpserted: run.rowsUpserted,
      error: run.error,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null,
    })),
  };
});

function summarizeCrmCampaigns(leads: CrmLeadSignal[]): CrmCampaignCount[] {
  const counts = new Map<string, CrmCampaignCount>();
  for (const lead of leads) {
    const key = [
      lead.utmSource || '',
      lead.utmMedium || '',
      lead.utmCampaign || '',
    ].join('\u0000');
    const existing = counts.get(key) || {
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      count: 0,
    };
    existing.count += 1;
    counts.set(key, existing);
  }
  return [...counts.values()];
}

function toMetricInputs(rows: MarketingMetricsDaily[]): MetricInput[] {
  return rows.map((r) => ({
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
}

function summarizeBy(leads: CrmLeadSignal[], keyFn: (lead: CrmLeadSignal) => string) {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const key = keyFn(lead);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, total]) => ({ key, total }))
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));
}

function dataLayerStatus(utmCoverage: number, sourceCoverage: number) {
  if (utmCoverage >= 80 && sourceCoverage >= 95) return 'healthy';
  if (utmCoverage >= 50 && sourceCoverage >= 80) return 'needs_attention';
  return 'poor_coverage';
}

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
