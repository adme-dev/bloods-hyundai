// GA4 Data API runReport. Metric order is the request<->parse contract.
// Metric names source: https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema
import { JWT } from 'google-auth-library';
import type { DateRange, NormalizedRow } from './types';

export const GA4_METRICS = [
  'sessions',
  'totalUsers',
  'keyEvents',
  'engagementRate',
  'averageSessionDuration',
  'screenPageViews',
  'eventCount',
  'eventsPerSession',
] as const;

interface Ga4RunReportResponse {
  dimensionHeaders?: Array<{ name?: string }>;
  metricHeaders?: Array<{ name?: string }>;
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
}

export interface Ga4BreakdownRow {
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
}

type CachedGa4Breakdowns = Pick<Ga4WebsiteAnalytics, 'topLandingPages' | 'trafficChannels' | 'sourceMedium'>;

export interface Ga4WebsiteAnalytics {
  status: 'connected' | 'stored_data' | 'not_configured' | 'error';
  error: string | null;
  dailyTrend: Ga4WebsiteTrendRow[];
  topLandingPages: Ga4BreakdownRow[];
  trafficChannels: Ga4BreakdownRow[];
  sourceMedium: Ga4BreakdownRow[];
  deviceCategories: Ga4BreakdownRow[];
  topEvents: Ga4BreakdownRow[];
  formEvents: Ga4BreakdownRow[];
}

export interface Ga4WebsiteTrendRow {
  date: string;
  sessions: number;
  users: number;
  keyEvents: number;
  crmLeads: number;
  paidSpend: number;
  paidClicks: number;
  platformConversions: number;
  paidCrmLeads: number;
  crmCpl: number | null;
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

export function normalizeGa4BreakdownResponse(resp: unknown): Ga4BreakdownRow[] {
  const response = resp as Ga4RunReportResponse;
  const dimensionNames = response?.dimensionHeaders?.map(header => header.name || '') || [];
  const metricNames = response?.metricHeaders?.map(header => header.name || '') || [];
  return (response?.rows || []).map((row) => {
    const dimensions: Record<string, string> = {};
    const metrics: Record<string, number> = {};

    dimensionNames.forEach((name, index) => {
      if (!name) return;
      dimensions[name] = row.dimensionValues?.[index]?.value || '';
    });
    metricNames.forEach((name, index) => {
      if (!name) return;
      const value = Number(row.metricValues?.[index]?.value || 0);
      metrics[name] = Number.isFinite(value) ? value : 0;
    });

    return { dimensions, metrics };
  });
}

export function attachGa4Breakdowns(rows: NormalizedRow[], breakdowns: CachedGa4Breakdowns): NormalizedRow[] {
  return rows.map(row => ({
    ...row,
    raw: {
      daily: row.raw,
      ga4Breakdowns: Object.fromEntries(Object.entries(breakdowns).map(([key, values]) => [
        key,
        values.filter(value => ga4Date(value.dimensions.date) === row.date).map(stripDateDimension),
      ])),
    },
  }));
}

export function aggregateStoredGa4Breakdowns(rows: Array<{ raw: unknown }>): CachedGa4Breakdowns {
  return {
    topLandingPages: aggregateCachedRows(rows, 'topLandingPages', 'landingPagePlusQueryString', 12),
    trafficChannels: aggregateCachedRows(rows, 'trafficChannels', 'sessionDefaultChannelGroup', 10),
    sourceMedium: aggregateCachedRows(rows, 'sourceMedium', 'sessionSourceMedium', 12),
  };
}

function aggregateCachedRows(rows: Array<{ raw: unknown }>, key: keyof CachedGa4Breakdowns, dimension: string, limit: number) {
  const totals = new Map<string, Ga4BreakdownRow>();
  for (const row of rows) {
    const cached = (row.raw as { ga4Breakdowns?: CachedGa4Breakdowns } | null)?.ga4Breakdowns?.[key] || [];
    for (const item of cached) {
      const value = item.dimensions[dimension] || '(not set)';
      const total = totals.get(value) || { dimensions: { [dimension]: value }, metrics: {} };
      const previousSessions = total.metrics.sessions || 0;
      const currentSessions = item.metrics.sessions || 0;
      for (const [metric, amount] of Object.entries(item.metrics)) {
        if (metric === 'engagementRate') {
          const sessions = previousSessions + currentSessions;
          total.metrics[metric] = sessions
            ? (((total.metrics[metric] || 0) * previousSessions) + (amount * currentSessions)) / sessions
            : 0;
        } else {
          total.metrics[metric] = (total.metrics[metric] || 0) + amount;
        }
      }
      totals.set(value, total);
    }
  }
  return [...totals.values()].sort((a, b) => (b.metrics.sessions || 0) - (a.metrics.sessions || 0)).slice(0, limit);
}

function stripDateDimension(row: Ga4BreakdownRow): Ga4BreakdownRow {
  const { date: _date, ...dimensions } = row.dimensions;
  return { dimensions, metrics: row.metrics };
}

function ga4Date(value = '') {
  return value.length === 8 ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : value;
}

function ga4Jwt(): JWT {
  const b64 = process.env.GA4_SERVICE_ACCOUNT_KEY;
  if (!b64) throw new Error('GA4_SERVICE_ACCOUNT_KEY not set');
  let key: { client_email: string; private_key: string };
  try {
    key = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  } catch {
    throw new Error('GA4_SERVICE_ACCOUNT_KEY is not valid base64-encoded JSON');
  }
  return new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
}

async function runGa4Report(
  propertyId: string,
  range: DateRange,
  options: {
    dimensions: string[];
    metrics: string[];
    limit?: number;
    orderByMetric?: string;
  },
): Promise<Ga4BreakdownRow[]> {
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
        dimensions: options.dimensions.map((name) => ({ name })),
        metrics: options.metrics.map((name) => ({ name })),
        limit: options.limit || 10,
        keepEmptyRows: false,
        orderBys: options.orderByMetric
          ? [{ metric: { metricName: options.orderByMetric }, desc: true }]
          : undefined,
      },
    },
  );
  return normalizeGa4BreakdownResponse(resp);
}

export async function fetchGa4WebsiteAnalytics(propertyId: string, range: DateRange): Promise<Ga4WebsiteAnalytics> {
  const [
    topLandingPages,
    trafficChannels,
    sourceMedium,
    deviceCategories,
    topEvents,
  ] = await Promise.all([
    runGa4Report(propertyId, range, {
      dimensions: ['landingPagePlusQueryString'],
      metrics: ['sessions', 'totalUsers', 'screenPageViews', 'keyEvents', 'engagementRate', 'averageSessionDuration'],
      orderByMetric: 'sessions',
      limit: 12,
    }),
    runGa4Report(propertyId, range, {
      dimensions: ['sessionDefaultChannelGroup'],
      metrics: ['sessions', 'totalUsers', 'keyEvents', 'engagementRate'],
      orderByMetric: 'sessions',
      limit: 10,
    }),
    runGa4Report(propertyId, range, {
      dimensions: ['sessionSourceMedium'],
      metrics: ['sessions', 'totalUsers', 'keyEvents', 'engagementRate'],
      orderByMetric: 'sessions',
      limit: 12,
    }),
    runGa4Report(propertyId, range, {
      dimensions: ['deviceCategory'],
      metrics: ['sessions', 'totalUsers', 'keyEvents', 'engagementRate'],
      orderByMetric: 'sessions',
      limit: 8,
    }),
    runGa4Report(propertyId, range, {
      dimensions: ['eventName'],
      metrics: ['eventCount', 'totalUsers', 'keyEvents'],
      orderByMetric: 'eventCount',
      limit: 25,
    }),
  ]);

  return {
    status: 'connected',
    error: null,
    dailyTrend: [],
    topLandingPages,
    trafficChannels,
    sourceMedium,
    deviceCategories,
    topEvents,
    formEvents: topEvents.filter((row) => isLeadEvent(row.dimensions.eventName)).slice(0, 10),
  };
}

export async function fetchGa4DailyWithBreakdowns(propertyId: string, range: DateRange): Promise<NormalizedRow[]> {
  const [daily, topLandingPages, trafficChannels, sourceMedium] = await Promise.all([
    fetchGa4Daily(propertyId, range),
    runGa4Report(propertyId, range, { dimensions: ['date', 'landingPagePlusQueryString'], metrics: ['sessions', 'totalUsers', 'screenPageViews', 'keyEvents', 'engagementRate'], limit: 100_000 }),
    runGa4Report(propertyId, range, { dimensions: ['date', 'sessionDefaultChannelGroup'], metrics: ['sessions', 'totalUsers', 'keyEvents'], limit: 100_000 }),
    runGa4Report(propertyId, range, { dimensions: ['date', 'sessionSourceMedium'], metrics: ['sessions', 'totalUsers', 'keyEvents'], limit: 100_000 }),
  ]);
  return attachGa4Breakdowns(daily, { topLandingPages, trafficChannels, sourceMedium });
}

function isLeadEvent(eventName = '') {
  return /form|lead|enquir|enquiry|submit|contact|test_drive|finance|service|parts|accessor|add_to_cart|remove_from_cart|view_cart|clear_cart/i.test(eventName);
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
