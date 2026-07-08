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

const GOOGLE_ADS_BASE = 'https://googleads.googleapis.com/v20';

async function googleAdsAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Ads OAuth env vars not set (GOOGLE_ADS_CLIENT_ID/SECRET/REFRESH_TOKEN)');
  }
  const res = await $fetch<{ access_token?: string }>('https://oauth2.googleapis.com/token', {
    method: 'POST',
    timeout: 30_000,
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.access_token) throw new Error('Google Ads auth failed: no access token');
  return res.access_token;
}

export async function fetchGoogleAdsDaily(
  cfg: { customerId: string; loginCustomerId?: string },
  range: DateRange,
): Promise<NormalizedRow[]> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not set');
  const token = await googleAdsAccessToken();
  const customerId = cfg.customerId.replace(/-/g, '');

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'developer-token': developerToken,
  };
  if (cfg.loginCustomerId) headers['login-customer-id'] = cfg.loginCustomerId.replace(/-/g, '');

  // One retry on 429/5xx (ported backoff pattern, simplified to a single retry).
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const batches = await $fetch<unknown>(
        `${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:searchStream`,
        { method: 'POST', headers, timeout: 30_000, body: { query: buildCampaignGaql(range) } },
      );
      return normalizeGoogleAdsResults(flattenSearchStream(batches));
    } catch (err: any) {
      lastErr = err;
      const status = err?.status || err?.statusCode;
      if ((status === 429 || status === 500 || status === 503) && attempt === 0) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      // Surface GoogleAdsFailure detail when present (XeroFlow pattern).
      const detail = err?.data?.error?.details?.[0]?.errors?.[0]?.message
        || err?.data?.error?.message;
      throw new Error(`Google Ads API ${status || 'error'}: ${detail || err?.message || 'unknown'}`);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Google Ads API: retries exceeded');
}
