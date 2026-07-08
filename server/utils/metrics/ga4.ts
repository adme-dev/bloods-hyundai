// GA4 Data API runReport. Metric order is the request<->parse contract
// (pattern ported from XeroFlow dashboard ga4Client.ts).
import { JWT } from 'google-auth-library';
import type { DateRange, NormalizedRow } from './types';

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
