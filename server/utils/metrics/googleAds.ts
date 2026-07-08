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
