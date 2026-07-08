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
