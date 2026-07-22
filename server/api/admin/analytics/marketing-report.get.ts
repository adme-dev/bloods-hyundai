import { and, desc, eq, gte, isNull, lt, lte, notInArray, or, sql } from 'drizzle-orm';
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
import { inferLeadAttribution, type CampaignAttributionCandidate } from '../../../utils/metrics/attribution';
import {
  aggregateStoredGa4Breakdowns,
  fetchGa4WebsiteAnalytics,
  readStoredGa4Metric,
  type Ga4WebsiteAnalytics,
  type Ga4WebsiteTrendRow,
} from '../../../utils/metrics/ga4';
import { buildMarketingReportInsights } from '../../../utils/metrics/reportInsights';
import { roasBasis, computeRoas } from '../../../utils/metrics/roas';
import { buildMarketingTrend } from '../../../utils/metrics/marketingTrend';
import { collectCreativeMedia } from '../../../utils/metrics/creativeMedia';
import { aggregateProviderBreakdowns } from '../../../utils/metrics/providerBreakdowns';
import {
  MARKETING_REPORT_TIME_ZONE,
  SYNTHETIC_MARKETING_LEAD_SOURCES,
  marketingReportDateForInstant,
  resolveMarketingReportRange,
} from '../../../utils/metrics/reportScope';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const dealerId = user.dealerId;
  const { from, to, fromDate, dayAfterTo } = resolveRange(getQuery(event));
  const crmLeadScope = reportCrmLeadScope(dealerId, fromDate, dayAfterTo);
  // PostgreSQL must see the exact same expression in SELECT, GROUP BY and ORDER BY.
  // A bound timezone would become a different parameter in each repeated expression.
  const crmLeadTimeZone = sql.raw(`'${MARKETING_REPORT_TIME_ZONE}'`);
  const crmLeadLocalDate = sql<string>`date_trunc('day', ${enquiries.createdAt} AT TIME ZONE ${crmLeadTimeZone})::date`;

  const [dealer] = await db.select({ settings: dealers.settings }).from(dealers).where(eq(dealers.id, dealerId));
  const dealerSettings = (dealer?.settings as Record<string, any>) || {};
  const integrations: MarketingIntegrations =
    dealerSettings?.marketing?.integrations || {};
  const externalCrmSyncEnabled = hasExternalCrmSyncEnabled(dealerSettings);
  const avgSaleValue: number | null = typeof dealerSettings?.marketing?.avgSaleValue === 'number'
    ? dealerSettings.marketing.avgSaleValue
    : null;

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
      gclid: enquiries.gclid,
      gbraid: enquiries.gbraid,
      wbraid: enquiries.wbraid,
      fbclid: enquiries.fbclid,
      msclkid: enquiries.msclkid,
      landingPage: enquiries.landingPage,
      referrer: enquiries.referrer,
      chatSource: enquiries.chatSource,
      chatIntent: enquiries.chatIntent,
      attributedPlatform: enquiries.attributedPlatform,
      attributedCampaignId: enquiries.attributedCampaignId,
      attributedCampaignName: enquiries.attributedCampaignName,
      attributionConfidence: enquiries.attributionConfidence,
      attributionMethod: enquiries.attributionMethod,
      vehicleStockId: enquiries.vehicleStockId,
      testDrive: enquiries.testDrive,
      financeInterest: enquiries.financeInterest,
      syncedToCrm: enquiries.syncedToCrm,
      crmRef: enquiries.crmRef,
      externalRef: enquiries.externalRef,
    }).from(enquiries)
      .where(crmLeadScope)
      .orderBy(desc(enquiries.createdAt)),
    db.select({
      date: crmLeadLocalDate,
      total: sql<number>`count(*)::int`,
      withUtm: sql<number>`count(*) filter (where ${enquiries.utmSource} is not null or ${enquiries.utmMedium} is not null or ${enquiries.utmCampaign} is not null)::int`,
      withCampaign: sql<number>`count(*) filter (where ${enquiries.utmCampaign} is not null and ${enquiries.utmCampaign} <> '')::int`,
      syncedToCrm: sql<number>`count(*) filter (where ${enquiries.syncedToCrm} = true)::int`,
    }).from(enquiries)
      .where(crmLeadScope)
      .groupBy(crmLeadLocalDate)
      .orderBy(crmLeadLocalDate),
    db.select().from(marketingSyncRuns)
      .where(eq(marketingSyncRuns.dealerId, dealerId))
      .orderBy(desc(marketingSyncRuns.startedAt))
      .limit(60),
  ]);

  const campaignCandidates = buildCampaignCandidates(metricRows);
  const inferredByLeadId = new Map<string, ReturnType<typeof inferLeadAttribution>>();
  const crmSignals: CrmLeadSignal[] = leadRows.map((lead) => {
    const inferred = inferLeadAttribution(lead, campaignCandidates);
    inferredByLeadId.set(lead.id, inferred);
    return {
    source: lead.source,
    type: lead.type,
    status: lead.status,
    utmSource: lead.utmSource,
    utmMedium: lead.utmMedium,
    utmCampaign: lead.utmCampaign,
    gclid: lead.gclid,
    gbraid: lead.gbraid,
    wbraid: lead.wbraid,
    fbclid: lead.fbclid,
    msclkid: lead.msclkid,
    attributedPlatform: inferred.platform,
    attributedCampaignId: inferred.campaignId,
    attributedCampaignName: inferred.campaignName,
    vehicleStockId: lead.vehicleStockId,
    syncedToCrm: lead.syncedToCrm,
    crmRef: lead.crmRef,
    externalRef: lead.externalRef,
  };
  });

  const crmCampaigns = summarizeCrmCampaigns(crmSignals);
  const dailyPaidLeadRows = summarizeDailyPaidLeads(leadRows, inferredByLeadId);
  const metrics = aggregateMarketingMetrics(toMetricInputs(metricRows), crmCampaigns);
  const coverage = calculateLeadSignalCoverage(crmSignals);
  const leadSources = summarizeLeadSources(crmSignals);
  const typeBreakdown = summarizeBy(crmSignals, lead => lead.type || 'unknown');
  const statusBreakdown = summarizeBy(crmSignals, lead => lead.status || 'unknown');
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
  const platformStatuses = {
    ga4: platformDataStatus('ga4', connected.ga4, metricRows, syncRows),
    meta_ads: platformDataStatus('meta_ads', connected.meta_ads, metricRows, syncRows),
    google_ads: platformDataStatus('google_ads', connected.google_ads, metricRows, syncRows),
  };
  const websiteAnalytics = await buildWebsiteAnalytics(
    integrations,
    { from, to },
    connected.ga4,
    metricRows,
    dailyLeadRows,
    dailyPaidLeadRows,
  );
  const summary = {
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
    chatCoverage: coverage.chatCoverage ?? 0,
    clickIdCoverage: coverage.total ? Math.round((coverage.withClickId / coverage.total) * 1000) / 10 : 0,
    backfilledAttributionCoverage: coverage.total ? Math.round((coverage.withBackfilledAttribution / coverage.total) * 1000) / 10 : 0,
    vehicleCoverage: coverage.vehicleCoverage,
  };
  const professionalMetrics = buildProfessionalMetrics(metricRows, metrics.platforms, avgSaleValue);
  const insights = buildMarketingReportInsights({
    summary,
    professionalMetrics,
    campaigns: metrics.campaigns,
    leadSources,
    externalCrmSyncEnabled,
  });

  return {
    period: { from, to },
    connected,
    dataStatus: platformStatuses,
    avgSaleValue,
    summary,
    platformMetrics: metrics.platforms,
    professionalMetrics,
    insights,
    websiteAnalytics,
    campaigns: metrics.campaigns,
    audienceBreakdowns: aggregateProviderBreakdowns(metricRows),
    creativeMedia: collectCreativeMedia(metricRows, metrics.campaigns),
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
        gclid: lead.gclid,
        fbclid: lead.fbclid,
        attributedPlatform: inferredByLeadId.get(lead.id)?.platform || null,
        attributedCampaignId: inferredByLeadId.get(lead.id)?.campaignId || null,
        attributionMethod: inferredByLeadId.get(lead.id)?.method || lead.attributionMethod,
        attributionConfidence: inferredByLeadId.get(lead.id)?.confidence || lead.attributionConfidence,
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
      status: dataLayerStatus(coverage, professionalMetrics.paidMedia.spend > 0 || professionalMetrics.paidMedia.clicks > 0),
      expectedEvents: [
        { event: 'formSubmission', destination: 'GTM dataLayer', status: 'implemented' },
        { event: 'FormSubmission', destination: 'GTM dataLayer compatibility', status: 'implemented' },
        { event: 'generate_lead', destination: 'GA4', status: 'implemented' },
        { event: 'Lead', destination: 'Meta Pixel', status: 'implemented' },
        { event: 'add_to_cart', destination: 'GTM dataLayer / GA4 ecommerce', status: 'implemented' },
        { event: 'remove_from_cart', destination: 'GTM dataLayer / GA4 ecommerce', status: 'implemented' },
        { event: 'view_cart', destination: 'GTM dataLayer / GA4 ecommerce', status: 'implemented' },
        { event: 'clear_cart', destination: 'GTM dataLayer', status: 'implemented' },
        { event: 'accessories_quote_start', destination: 'GTM dataLayer / GA4 ecommerce', status: 'implemented' },
        { event: 'accessories_quote_submit', destination: 'GTM dataLayer / GA4 ecommerce', status: 'implemented' },
      ],
      requiredLeadFields: [
        'enquiryId',
        'formType',
        'formLocation',
        'source',
        'utmSource',
        'utmMedium',
        'utmCampaign',
        'utmTerm',
        'utmContent',
        'gclid',
        'gbraid',
        'wbraid',
        'fbclid',
        'msclkid',
        'landingPage',
        'referrer',
        'attributedPlatform',
        'attributedCampaignId',
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

function platformDataStatus(
  platform: 'ga4' | 'meta_ads' | 'google_ads',
  liveConnected: boolean,
  metricRows: MarketingMetricsDaily[],
  syncRows: Array<{ platform: string; status: string }>,
): 'connected' | 'stored_data' | 'not_connected' {
  if (liveConnected) return 'connected';

  const hasStoredData = metricRows.some(row => row.platform === platform)
    || syncRows.some(run => run.platform === platform && run.status === 'success');
  return hasStoredData ? 'stored_data' : 'not_connected';
}

async function buildWebsiteAnalytics(
  integrations: MarketingIntegrations,
  range: { from: string; to: string },
  ga4Connected: boolean,
  metricRows: MarketingMetricsDaily[],
  dailyLeadRows: Array<{ date: string; total: number }>,
  dailyPaidLeadRows: Array<{ date: string; total: number }>,
): Promise<Ga4WebsiteAnalytics> {
  const dailyTrend = buildMarketingTrend(range, metricRows, dailyLeadRows, dailyPaidLeadRows);
  if (!ga4Connected || !integrations.ga4PropertyId) {
    const hasStoredGa4Data = metricRows.some(row => row.platform === 'ga4');
    const analytics = emptyWebsiteAnalytics(hasStoredGa4Data ? 'stored_data' : 'not_configured', null, dailyTrend);
    return { ...analytics, ...aggregateStoredGa4Breakdowns(metricRows.filter(row => row.platform === 'ga4')) };
  }

  try {
    const analytics = await fetchGa4WebsiteAnalytics(integrations.ga4PropertyId, range);
    return { ...analytics, dailyTrend };
  } catch (err) {
    return emptyWebsiteAnalytics('error', err instanceof Error ? err.message : String(err), dailyTrend);
  }
}

function emptyWebsiteAnalytics(
  status: Ga4WebsiteAnalytics['status'],
  error: string | null,
  dailyTrend: Ga4WebsiteTrendRow[],
): Ga4WebsiteAnalytics {
  return {
    status,
    error,
    dailyTrend,
    topLandingPages: [],
    trafficChannels: [],
    sourceMedium: [],
    deviceCategories: [],
    topEvents: [],
    formEvents: [],
  };
}

function summarizeDailyPaidLeads(
  leads: Array<{ id: string; createdAt: Date }>,
  inferredByLeadId: Map<string, ReturnType<typeof inferLeadAttribution>>,
) {
  const totals = new Map<string, number>();
  for (const lead of leads) {
    const platform = inferredByLeadId.get(lead.id)?.platform;
    if (platform !== 'meta_ads' && platform !== 'google_ads') continue;
    const date = marketingReportDateForInstant(lead.createdAt);
    totals.set(date, (totals.get(date) || 0) + 1);
  }
  return [...totals].map(([date, total]) => ({ date, total }));
}

function summarizeCrmCampaigns(leads: CrmLeadSignal[]): CrmCampaignCount[] {
  const counts = new Map<string, CrmCampaignCount>();
  for (const lead of leads) {
    const key = [
      lead.utmSource || '',
      lead.utmMedium || '',
      lead.utmCampaign || '',
      lead.attributedPlatform || '',
      lead.attributedCampaignId || '',
      lead.attributedCampaignName || '',
    ].join('\u0000');
    const existing = counts.get(key) || {
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      attributedPlatform: lead.attributedPlatform === 'meta_ads' || lead.attributedPlatform === 'google_ads' ? lead.attributedPlatform : null,
      attributedCampaignId: lead.attributedCampaignId,
      attributedCampaignName: lead.attributedCampaignName,
      count: 0,
    };
    existing.count += 1;
    counts.set(key, existing);
  }
  return [...counts.values()];
}

function buildCampaignCandidates(rows: MarketingMetricsDaily[]): CampaignAttributionCandidate[] {
  const seen = new Set<string>();
  const candidates: CampaignAttributionCandidate[] = [];
  for (const row of rows) {
    if (row.platform !== 'google_ads' && row.platform !== 'meta_ads') continue;
    const key = `${row.platform}:${row.campaignId}:${row.campaignName || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({
      platform: row.platform as CampaignAttributionCandidate['platform'],
      campaignId: row.campaignId,
      campaignName: row.campaignName,
    });
  }
  return candidates;
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

function buildProfessionalMetrics(
  rows: MarketingMetricsDaily[],
  platforms: ReturnType<typeof aggregateMarketingMetrics>['platforms'],
  avgSaleValue: number | null,
) {
  const ga4Rows = rows.filter(row => row.platform === 'ga4');
  const metaRows = rows.filter(row => row.platform === 'meta_ads');
  const googleRows = rows.filter(row => row.platform === 'google_ads');

  const paid = [...metaRows, ...googleRows];
  const paidSpend = sum(paid, row => Number(row.spend || 0));
  const paidImpressions = sum(paid, row => row.impressions || 0);
  const paidClicks = sum(paid, row => row.clicks || 0);
  const paidLeads = sum(paid, row => row.platformLeads || 0);
  const paidCrmLeads = platforms.meta_ads.crmLeads + platforms.google_ads.crmLeads;
  const paidConversionsValue = sum(paid, row => adsMetric(row, 'conversionsValue'));

  return {
    ga4Website: {
      sessions: platforms.ga4.sessions,
      users: platforms.ga4.users,
      keyEvents: platforms.ga4.conversions,
      engagementRate: weightedGa4Metric(ga4Rows, 3, 0),
      averageSessionDuration: weightedGa4Metric(ga4Rows, 4, 0),
      screenPageViews: sum(ga4Rows, row => ga4Metric(row, 5)),
      eventCount: sum(ga4Rows, row => ga4Metric(row, 6)),
      eventsPerSession: weightedGa4Metric(ga4Rows, 7, 0),
      conversionRate: percent(platforms.ga4.conversions, platforms.ga4.sessions),
    },
    paidMedia: {
      spend: roundMoney(paidSpend),
      impressions: paidImpressions,
      clicks: paidClicks,
      ctr: percent(paidClicks, paidImpressions),
      averageCpc: paidClicks ? roundMoney(paidSpend / paidClicks) : null,
      cpm: paidImpressions ? roundMoney((paidSpend / paidImpressions) * 1000) : null,
      platformLeads: paidLeads,
      platformLeadRate: percent(paidLeads, paidClicks),
      crmLeads: paidCrmLeads,
      cpl: paidCrmLeads ? roundMoney(paidSpend / paidCrmLeads) : null,
      roas: computeRoas(
        roasBasis({ conversionsValue: paidConversionsValue, crmLeads: paidCrmLeads, avgSaleValue }),
        paidSpend,
      ),
    },
    googleAds: buildAdPlatformMetrics(googleRows, platforms.google_ads, avgSaleValue),
    metaAds: buildAdPlatformMetrics(metaRows, platforms.meta_ads, avgSaleValue),
  };
}

function buildAdPlatformMetrics(
  rows: MarketingMetricsDaily[],
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    platformLeads: number;
    crmLeads: number;
    cpl: number | null;
    ctr: number | null;
    platformLeadRate: number | null;
  },
  avgSaleValue: number | null,
) {
  const conversionsValue = sum(rows, row => adsMetric(row, 'conversionsValue'));
  const allConversions = sum(rows, row => adsMetric(row, 'allConversions'));
  const interactions = sum(rows, row => adsMetric(row, 'interactions'));
  return {
    spend: totals.spend,
    impressions: totals.impressions,
    clicks: totals.clicks,
    ctr: totals.ctr,
    averageCpc: totals.clicks ? roundMoney(totals.spend / totals.clicks) : null,
    cpm: totals.impressions ? roundMoney((totals.spend / totals.impressions) * 1000) : null,
    platformLeads: totals.platformLeads,
    conversionRate: percent(totals.platformLeads, totals.clicks),
    costPerConversion: totals.platformLeads ? roundMoney(totals.spend / totals.platformLeads) : null,
    crmLeads: totals.crmLeads,
    cpl: totals.cpl,
    conversionsValue: conversionsValue ? roundMoney(conversionsValue) : null,
    allConversions: allConversions || null,
    interactions: interactions || null,
    interactionRate: percent(interactions, totals.impressions),
    searchImpressionShare: weightedAdsMetric(rows, 'searchImpressionShare', 'impressions'),
    roas: computeRoas(
      roasBasis({ conversionsValue, crmLeads: totals.crmLeads, avgSaleValue }),
      totals.spend,
    ),
  };
}

function ga4Metric(row: MarketingMetricsDaily, index: number) {
  return readStoredGa4Metric(row.raw, index);
}

function weightedGa4Metric(rows: MarketingMetricsDaily[], metricIndex: number, weightIndex: number) {
  let weighted = 0;
  let totalWeight = 0;
  for (const row of rows) {
    const value = ga4Metric(row, metricIndex);
    const weight = ga4Metric(row, weightIndex);
    if (!Number.isFinite(value) || !Number.isFinite(weight) || weight <= 0) continue;
    weighted += value * weight;
    totalWeight += weight;
  }
  return totalWeight ? roundRate(weighted / totalWeight) : null;
}

function adsMetric(row: MarketingMetricsDaily, key: string) {
  const value = (row.raw as any)?.metrics?.[key];
  return value == null ? 0 : Number(value) || 0;
}

function weightedAdsMetric(rows: MarketingMetricsDaily[], metricKey: string, weightKey: keyof MarketingMetricsDaily) {
  let weighted = 0;
  let totalWeight = 0;
  for (const row of rows) {
    const value = adsMetric(row, metricKey);
    const weight = Number(row[weightKey] || 0);
    if (!Number.isFinite(value) || !Number.isFinite(weight) || weight <= 0) continue;
    weighted += value * weight;
    totalWeight += weight;
  }
  return totalWeight ? roundRate(weighted / totalWeight) : null;
}

function sum<T>(rows: T[], selector: (row: T) => number) {
  return rows.reduce((total, row) => total + selector(row), 0);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundRate(value: number) {
  return Math.round(value * 10000) / 10000;
}

function percent(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 10000) / 100;
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

function dataLayerStatus(
  coverage: ReturnType<typeof calculateLeadSignalCoverage>,
  hasPaidTraffic: boolean,
) {
  if (coverage.total === 0) return 'no_leads';
  if (coverage.total < 5) return 'limited_sample';
  if (coverage.sourceCoverage < 80) return 'field_mapping_gap';

  const hasStrongAttribution =
    coverage.utmCoverage >= 80 &&
    coverage.campaignCoverage >= 80 &&
    (!hasPaidTraffic || coverage.paidAttributionCoverage >= 80);

  if (coverage.sourceCoverage >= 95 && hasStrongAttribution) return 'healthy';
  if (coverage.utmCoverage < 50 || coverage.campaignCoverage < 50 || (hasPaidTraffic && coverage.paidAttributionCoverage < 50)) {
    return 'low_attribution_signal';
  }
  return 'needs_attention';
}

function hasExternalCrmSyncEnabled(settings: Record<string, any>) {
  const candidates = [
    settings?.crm,
    settings?.externalCrm,
    settings?.leadExport,
    settings?.leadExports,
    settings?.marketing?.crm,
    settings?.marketing?.externalCrm,
    settings?.marketing?.leadExport,
    settings?.marketing?.integrations?.crm,
    settings?.marketing?.integrations?.externalCrm,
    settings?.marketing?.integrations?.leadExport,
  ].filter(Boolean);

  return candidates.some((candidate) => {
    if (typeof candidate !== 'object') return false;
    if (candidate.enabled === true || candidate.isActive === true || candidate.active === true) return true;
    return Boolean(candidate.provider || candidate.endpoint || candidate.webhookUrl || candidate.apiUrl);
  });
}

function resolveRange(query: Record<string, unknown>) {
  try {
    return resolveMarketingReportRange(query);
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Invalid marketing report date range',
    });
  }
}

function reportCrmLeadScope(dealerId: string, fromDate: Date, dayAfterTo: Date) {
  return and(
    eq(enquiries.dealerId, dealerId),
    gte(enquiries.createdAt, fromDate),
    lt(enquiries.createdAt, dayAfterTo),
    isNull(enquiries.archivedAt),
    or(
      isNull(enquiries.source),
      notInArray(enquiries.source, [...SYNTHETIC_MARKETING_LEAD_SOURCES]),
    ),
  );
}
