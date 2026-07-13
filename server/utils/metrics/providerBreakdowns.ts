import type { NormalizedRow, Platform } from './types';

export type ProviderBreakdownDimension = 'age' | 'device' | 'area';

export interface ProviderBreakdownInput {
  dimension: ProviderBreakdownDimension;
  value: string;
  date: string;
  campaignId: string;
  spend: number;
  impressions: number;
  clicks: number;
}

export interface ProviderBreakdownTotal {
  platform: Extract<Platform, 'meta_ads' | 'google_ads'>;
  value: string;
  spend: number;
  impressions: number;
  clicks: number;
}

export type ProviderBreakdownSummary = Record<ProviderBreakdownDimension, ProviderBreakdownTotal[]>;

interface CachedBreakdown {
  dimension: ProviderBreakdownDimension;
  value: string;
  spend: number;
  impressions: number;
  clicks: number;
}

export function attachProviderBreakdowns(rows: NormalizedRow[], breakdowns: ProviderBreakdownInput[]): NormalizedRow[] {
  const byCampaignDay = new Map<string, CachedBreakdown[]>();
  for (const row of breakdowns) {
    if (!isDimension(row.dimension) || !row.value.trim()) continue;
    if (![row.spend, row.impressions, row.clicks].every(Number.isFinite)) continue;
    const key = `${row.date}:${row.campaignId}`;
    const cached = byCampaignDay.get(key) || [];
    cached.push({
      dimension: row.dimension,
      value: row.value.trim(),
      spend: row.spend,
      impressions: row.impressions,
      clicks: row.clicks,
    });
    byCampaignDay.set(key, cached);
  }

  return rows.map((row) => {
    const providerBreakdowns = byCampaignDay.get(`${row.date}:${row.campaignId}`) || [];
    const raw = isRecord(row.raw) ? row.raw : {};
    return { ...row, raw: { ...raw, providerBreakdowns } };
  });
}

export function aggregateProviderBreakdowns(rows: Array<{ platform: string; raw: unknown }>): ProviderBreakdownSummary {
  const grouped = new Map<string, ProviderBreakdownTotal & { dimension: ProviderBreakdownDimension }>();

  for (const row of rows) {
    if (row.platform !== 'meta_ads' && row.platform !== 'google_ads') continue;
    const cached = isRecord(row.raw) && Array.isArray(row.raw.providerBreakdowns)
      ? row.raw.providerBreakdowns
      : [];
    for (const candidate of cached) {
      if (!isRecord(candidate) || !isDimension(candidate.dimension) || typeof candidate.value !== 'string' || !candidate.value.trim()) continue;
      if (![candidate.spend, candidate.impressions, candidate.clicks].every(value => typeof value === 'number' && Number.isFinite(value))) continue;
      const value = candidate.value.trim();
      const key = `${candidate.dimension}:${row.platform}:${value}`;
      const total = grouped.get(key) || {
        dimension: candidate.dimension,
        platform: row.platform,
        value,
        spend: 0,
        impressions: 0,
        clicks: 0,
      };
      total.spend += candidate.spend;
      total.impressions += candidate.impressions;
      total.clicks += candidate.clicks;
      grouped.set(key, total);
    }
  }

  const result: ProviderBreakdownSummary = { age: [], device: [], area: [] };
  for (const { dimension, ...row } of grouped.values()) {
    result[dimension].push({ ...row, spend: roundMoney(row.spend) });
  }
  for (const dimension of Object.keys(result) as ProviderBreakdownDimension[]) {
    result[dimension].sort((a, b) => b.spend - a.spend || b.impressions - a.impressions || a.value.localeCompare(b.value));
  }
  return result;
}

function isDimension(value: unknown): value is ProviderBreakdownDimension {
  return value === 'age' || value === 'device' || value === 'area';
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
