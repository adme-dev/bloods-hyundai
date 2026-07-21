export type ReportBuilderDimension =
  | 'platform'
  | 'campaign'
  | 'age'
  | 'area'
  | 'ad_device'
  | 'landing_page'
  | 'source_medium'
  | 'website_device';

export type ReportBuilderMetric =
  | 'spend'
  | 'crm_leads'
  | 'cpl'
  | 'clicks'
  | 'ctr'
  | 'impressions'
  | 'sessions'
  | 'users'
  | 'key_events';

export type ReportBuilderSortKey = ReportBuilderDimension | ReportBuilderMetric;
export type ReportBuilderSortDirection = 'asc' | 'desc';

export interface ReportBuilderRow {
  key: string;
  dimensions: Partial<Record<ReportBuilderDimension, string>>;
  metrics: Partial<Record<ReportBuilderMetric, number | null>>;
}

type CampaignRow = {
  platform: string;
  campaignName: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  crmLeads: number;
};

type AudienceRow = {
  platform: string;
  value: string;
  spend: number;
  impressions: number;
  clicks: number;
};

type WebsiteRow = {
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
};

export interface ReportBuilderInput {
  campaigns: CampaignRow[];
  summary: { totalCrmLeads: number };
  platformMetrics: Record<'meta_ads' | 'google_ads', { crmLeads: number }>;
  audienceBreakdowns: Record<'age' | 'area' | 'device', AudienceRow[]>;
  websiteAnalytics: {
    topLandingPages: WebsiteRow[];
    sourceMedium: WebsiteRow[];
    deviceCategories: WebsiteRow[];
  };
  professionalMetrics: {
    ga4Website: { sessions: number; users: number; keyEvents: number };
  };
}

export const REPORT_BUILDER_DIMENSIONS: ReadonlyArray<{
  id: ReportBuilderDimension;
  label: string;
  description: string;
}> = [
  { id: 'platform', label: 'Platform', description: 'Group rows by Google Ads, Meta Ads, or GA4.' },
  { id: 'campaign', label: 'Campaign', description: 'Advertising campaign name.' },
  { id: 'age', label: 'Age', description: 'Provider-reported paid audience age.' },
  { id: 'area', label: 'Area', description: 'Provider-reported paid audience location.' },
  { id: 'ad_device', label: 'Ad device', description: 'Provider-reported paid delivery device.' },
  { id: 'landing_page', label: 'Landing page', description: 'GA4 session landing page.' },
  { id: 'source_medium', label: 'Source / medium', description: 'GA4 session source and medium.' },
  { id: 'website_device', label: 'Website device', description: 'GA4 website device category.' },
];

export const REPORT_BUILDER_METRICS: ReadonlyArray<{
  id: ReportBuilderMetric;
  label: string;
  format: 'money' | 'number' | 'percent';
}> = [
  { id: 'spend', label: 'Spend', format: 'money' },
  { id: 'crm_leads', label: 'CRM leads', format: 'number' },
  { id: 'cpl', label: 'CPL', format: 'money' },
  { id: 'clicks', label: 'Clicks', format: 'number' },
  { id: 'ctr', label: 'CTR', format: 'percent' },
  { id: 'impressions', label: 'Impressions', format: 'number' },
  { id: 'sessions', label: 'Sessions', format: 'number' },
  { id: 'users', label: 'Users', format: 'number' },
  { id: 'key_events', label: 'Key events', format: 'number' },
];

const DETAIL_DIMENSIONS = REPORT_BUILDER_DIMENSIONS
  .map(option => option.id)
  .filter((id): id is Exclude<ReportBuilderDimension, 'platform'> => id !== 'platform');
const PAID_METRICS: ReportBuilderMetric[] = ['spend', 'crm_leads', 'cpl', 'clicks', 'ctr', 'impressions'];
const AUDIENCE_METRICS: ReportBuilderMetric[] = ['spend', 'clicks', 'ctr', 'impressions'];
const WEBSITE_METRICS: ReportBuilderMetric[] = ['sessions', 'users', 'key_events'];
const ALL_METRICS = REPORT_BUILDER_METRICS.map(option => option.id);

export function availableMetricsForDimensions(dimensions: ReportBuilderDimension[]): ReportBuilderMetric[] {
  const detail = dimensions.find(dimension => dimension !== 'platform');
  if (!detail) return [...ALL_METRICS];
  if (detail === 'campaign') return [...PAID_METRICS];
  if (detail === 'age' || detail === 'area' || detail === 'ad_device') return [...AUDIENCE_METRICS];
  return [...WEBSITE_METRICS];
}

export function normalizeReportBuilderSelection(
  dimensions: ReportBuilderDimension[],
  metrics: ReportBuilderMetric[],
): { dimensions: ReportBuilderDimension[]; metrics: ReportBuilderMetric[] } {
  const hasPlatform = dimensions.includes('platform');
  const detail = [...dimensions].reverse().find(dimension => DETAIL_DIMENSIONS.includes(dimension as Exclude<ReportBuilderDimension, 'platform'>));
  const normalizedDimensions: ReportBuilderDimension[] = [
    ...(hasPlatform ? ['platform' as const] : []),
    ...(detail ? [detail] : []),
  ];
  if (!normalizedDimensions.length) normalizedDimensions.push('platform');

  const available = availableMetricsForDimensions(normalizedDimensions);
  const normalizedMetrics = metrics.filter((metric, index) => available.includes(metric) && metrics.indexOf(metric) === index);
  if (!normalizedMetrics.length) normalizedMetrics.push(defaultMetricForDimensions(normalizedDimensions));

  return { dimensions: normalizedDimensions, metrics: normalizedMetrics };
}

export function buildReportBuilderRows(
  report: ReportBuilderInput,
  dimensions: ReportBuilderDimension[],
  metrics: ReportBuilderMetric[],
): ReportBuilderRow[] {
  const selection = normalizeReportBuilderSelection(dimensions, metrics);
  const detail = selection.dimensions.find(dimension => dimension !== 'platform');
  const accumulators = new Map<string, Accumulator>();

  if (!detail || detail === 'campaign') {
    const matchedCampaignLeads = { meta_ads: 0, google_ads: 0 };
    for (const campaign of report.campaigns) {
      if (campaign.platform === 'crm') continue;
      if (campaign.platform === 'meta_ads' || campaign.platform === 'google_ads') {
        matchedCampaignLeads[campaign.platform] += finite(campaign.crmLeads);
      }
      add(accumulators, selection.dimensions, 'paid', {
        platform: normalizedLabel(campaign.platform),
        campaign: normalizedLabel(campaign.campaignName),
      }, {
        spend: campaign.spend,
        crmLeads: campaign.crmLeads,
        clicks: campaign.clicks,
        impressions: campaign.impressions,
      });
    }
    if (selection.metrics.includes('crm_leads')) {
      addCrmAttributionGaps(accumulators, report, selection.dimensions, matchedCampaignLeads);
    }
  } else if (detail === 'age' || detail === 'area' || detail === 'ad_device') {
    const source = detail === 'ad_device' ? report.audienceBreakdowns.device : report.audienceBreakdowns[detail];
    for (const row of source) {
      add(accumulators, selection.dimensions, 'paid', {
        platform: normalizedLabel(row.platform),
        [detail]: normalizedLabel(row.value),
      }, {
        spend: row.spend,
        clicks: row.clicks,
        impressions: row.impressions,
      });
    }
  } else {
    const config = websiteSource(report, detail);
    for (const row of config.rows) {
      add(accumulators, selection.dimensions, 'website', {
        platform: 'ga4',
        [detail]: normalizedLabel(row.dimensions[config.dimensionKey]),
      }, {
        sessions: row.metrics.sessions,
        users: row.metrics.totalUsers,
        keyEvents: row.metrics.keyEvents,
      });
    }
  }

  if (!detail && selection.metrics.some(metric => WEBSITE_METRICS.includes(metric))) {
    const totals = report.professionalMetrics.ga4Website;
    add(accumulators, selection.dimensions, 'website', { platform: 'ga4' }, {
      sessions: totals.sessions,
      users: totals.users,
      keyEvents: totals.keyEvents,
    });
  }

  return [...accumulators.values()]
    .filter(row => selection.metrics.some(metric => metricBelongsToSource(metric, row.source)))
    .map(accumulator => toBuilderRow(accumulator, selection.dimensions, selection.metrics));
}

export function sortReportBuilderRows(
  rows: ReportBuilderRow[],
  key: ReportBuilderSortKey,
  direction: ReportBuilderSortDirection,
): ReportBuilderRow[] {
  const multiplier = direction === 'asc' ? 1 : -1;
  return [...rows].sort((left, right) => {
    const leftValue = left.metrics[key as ReportBuilderMetric] ?? left.dimensions[key as ReportBuilderDimension] ?? null;
    const rightValue = right.metrics[key as ReportBuilderMetric] ?? right.dimensions[key as ReportBuilderDimension] ?? null;
    if (leftValue == null && rightValue == null) return 0;
    if (leftValue == null) return 1;
    if (rightValue == null) return -1;
    if (typeof leftValue === 'number' && typeof rightValue === 'number') return (leftValue - rightValue) * multiplier;
    return String(leftValue).localeCompare(String(rightValue), 'en-AU', { numeric: true }) * multiplier;
  });
}

type Accumulator = {
  key: string;
  source: 'paid' | 'website' | 'crm';
  dimensions: Partial<Record<ReportBuilderDimension, string>>;
  spend: number;
  crmLeads: number;
  clicks: number;
  impressions: number;
  sessions: number;
  users: number;
  keyEvents: number;
};

function add(
  rows: Map<string, Accumulator>,
  selectedDimensions: ReportBuilderDimension[],
  source: Accumulator['source'],
  dimensions: Partial<Record<ReportBuilderDimension, string>>,
  values: Partial<Omit<Accumulator, 'key' | 'source' | 'dimensions'>>,
) {
  const selected = Object.fromEntries(selectedDimensions.map(dimension => [dimension, dimensions[dimension] || 'Unknown'])) as Partial<Record<ReportBuilderDimension, string>>;
  const key = selectedDimensions.map(dimension => selected[dimension]).join('\u0000');
  const row = rows.get(key) || {
    key,
    source,
    dimensions: selected,
    spend: 0,
    crmLeads: 0,
    clicks: 0,
    impressions: 0,
    sessions: 0,
    users: 0,
    keyEvents: 0,
  };
  row.spend += finite(values.spend);
  row.crmLeads += finite(values.crmLeads);
  row.clicks += finite(values.clicks);
  row.impressions += finite(values.impressions);
  row.sessions += finite(values.sessions);
  row.users += finite(values.users);
  row.keyEvents += finite(values.keyEvents);
  rows.set(key, row);
}

function toBuilderRow(
  row: Accumulator,
  dimensions: ReportBuilderDimension[],
  metrics: ReportBuilderMetric[],
): ReportBuilderRow {
  const values: Record<ReportBuilderMetric, number | null> = {
    spend: row.source === 'paid' ? row.spend : null,
    crm_leads: row.source === 'paid' || row.source === 'crm' ? row.crmLeads : null,
    cpl: row.source === 'paid' && row.crmLeads > 0 ? row.spend / row.crmLeads : null,
    clicks: row.source === 'paid' ? row.clicks : null,
    ctr: row.source === 'paid' && row.impressions > 0 ? row.clicks / row.impressions * 100 : null,
    impressions: row.source === 'paid' ? row.impressions : null,
    sessions: row.source === 'website' ? row.sessions : null,
    users: row.source === 'website' ? row.users : null,
    key_events: row.source === 'website' ? row.keyEvents : null,
  };
  return {
    key: row.key,
    dimensions: Object.fromEntries(dimensions.map(dimension => [dimension, row.dimensions[dimension]])),
    metrics: Object.fromEntries(metrics.map(metric => [metric, values[metric]])),
  };
}

function websiteSource(report: ReportBuilderInput, detail: 'landing_page' | 'source_medium' | 'website_device') {
  if (detail === 'landing_page') return { rows: report.websiteAnalytics.topLandingPages, dimensionKey: 'landingPagePlusQueryString' };
  if (detail === 'source_medium') return { rows: report.websiteAnalytics.sourceMedium, dimensionKey: 'sessionSourceMedium' };
  return { rows: report.websiteAnalytics.deviceCategories, dimensionKey: 'deviceCategory' };
}

function defaultMetricForDimensions(dimensions: ReportBuilderDimension[]): ReportBuilderMetric {
  const available = availableMetricsForDimensions(dimensions);
  return available.includes('spend') ? 'spend' : 'sessions';
}

function normalizedLabel(value: string | null | undefined) {
  const label = String(value || '').trim();
  return label || 'Unknown';
}

function finite(value: number | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function addCrmAttributionGaps(
  rows: Map<string, Accumulator>,
  report: ReportBuilderInput,
  dimensions: ReportBuilderDimension[],
  matchedCampaignLeads: Record<'meta_ads' | 'google_ads', number>,
) {
  const paidPlatformLeads = { meta_ads: 0, google_ads: 0 };
  for (const platform of ['meta_ads', 'google_ads'] as const) {
    paidPlatformLeads[platform] = finite(report.platformMetrics[platform]?.crmLeads);
    const withoutCampaign = Math.max(0, paidPlatformLeads[platform] - matchedCampaignLeads[platform]);
    if (!withoutCampaign) continue;
    add(rows, dimensions, 'crm', {
      platform,
      campaign: 'Campaign unavailable',
    }, { crmLeads: withoutCampaign });
  }

  const withoutPaidAttribution = Math.max(
    0,
    finite(report.summary.totalCrmLeads) - paidPlatformLeads.meta_ads - paidPlatformLeads.google_ads,
  );
  if (withoutPaidAttribution) {
    add(rows, dimensions, 'crm', {
      platform: 'crm',
      campaign: 'No paid campaign attribution',
    }, { crmLeads: withoutPaidAttribution });
  }
}

function metricBelongsToSource(metric: ReportBuilderMetric, source: Accumulator['source']) {
  if (source === 'crm') return metric === 'crm_leads';
  return source === 'paid' ? PAID_METRICS.includes(metric) : WEBSITE_METRICS.includes(metric);
}
