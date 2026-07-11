// Google Ads REST searchStream + GAQL. Ported patterns from XeroFlow
// googleAdsClient.ts: dash-stripped IDs, batch flattening, camelCase results.
import type { DateRange, NormalizedRow } from './types';
import { attachCreativeMedia, safeMediaUrl, type CreativeMedia } from './creativeMedia';

export function buildCampaignGaql(range: DateRange): string {
  // Field names source: https://developers.google.com/google-ads/api/fields/v23/metrics
  return `
    SELECT
      campaign.id,
      campaign.name,
      segments.date,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_per_conversion,
      metrics.all_conversions,
      metrics.interactions,
      metrics.interaction_rate,
      metrics.search_impression_share
    FROM campaign
    WHERE segments.date BETWEEN '${range.from}' AND '${range.to}'
  `;
}

export function buildAssetGroupGaql(): string {
  return `
    SELECT
      campaign.id,
      campaign.name,
      asset.id,
      asset.name,
      asset.type,
      asset.image_asset.full_size.url,
      asset.youtube_video_asset.youtube_video_id,
      asset.youtube_video_asset.youtube_video_title,
      asset_group_asset.field_type,
      asset_group_asset.performance_label
    FROM asset_group_asset
    WHERE asset_group_asset.status != 'REMOVED'
  `;
}

export function buildAdGroupAdAssetGaql(): string {
  return `
    SELECT
      campaign.id,
      campaign.name,
      asset.id,
      asset.name,
      asset.type,
      asset.image_asset.full_size.url,
      asset.youtube_video_asset.youtube_video_id,
      asset.youtube_video_asset.youtube_video_title,
      ad_group_ad_asset_view.field_type,
      ad_group_ad_asset_view.performance_label
    FROM ad_group_ad_asset_view
    WHERE ad_group_ad_asset_view.enabled = TRUE
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
  metrics?: {
    costMicros?: string | number;
    impressions?: string | number;
    clicks?: string | number;
    conversions?: number;
    ctr?: string | number;
    averageCpc?: string | number;
    conversionsValue?: string | number;
    costPerConversion?: string | number;
    allConversions?: string | number;
    interactions?: string | number;
    interactionRate?: string | number;
    searchImpressionShare?: string | number;
  };
  segments?: { date?: string };
}

interface GoogleCreativeAssetResult {
  campaign?: { id?: string | number; name?: string };
  asset?: {
    id?: string | number;
    name?: string;
    type?: string;
    imageAsset?: { fullSize?: { url?: string } };
    youtubeVideoAsset?: { youtubeVideoId?: string; youtubeVideoTitle?: string };
  };
  assetGroupAsset?: { fieldType?: string; performanceLabel?: string };
  adGroupAdAssetView?: { fieldType?: string; performanceLabel?: string };
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

export function normalizeGoogleCreativeAssets(results: unknown[]): CreativeMedia[] {
  return (results as GoogleCreativeAssetResult[]).flatMap((result) => {
    const campaignId = String(result.campaign?.id ?? '');
    const assetId = String(result.asset?.id ?? '');
    const youtubeId = result.asset?.youtubeVideoAsset?.youtubeVideoId;
    const imageUrl = safeMediaUrl(result.asset?.imageAsset?.fullSize?.url)
      || (youtubeId ? safeMediaUrl(`https://i.ytimg.com/vi/${encodeURIComponent(youtubeId)}/hqdefault.jpg`) : null);
    if (!campaignId || !assetId || !imageUrl) return [];
    const link = result.assetGroupAsset || result.adGroupAdAssetView;
    return [{
      id: `google:${campaignId}:${assetId}`,
      platform: 'google_ads' as const,
      campaignId,
      campaignName: result.campaign?.name || null,
      title: result.asset?.name || result.asset?.youtubeVideoAsset?.youtubeVideoTitle || 'Google Ads asset',
      mediaType: youtubeId ? 'video' as const : 'image' as const,
      imageUrl,
      videoUrl: youtubeId ? `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId)}` : null,
      performanceLabel: link?.performanceLabel || null,
    }];
  });
}

const GOOGLE_ADS_BASE = 'https://googleads.googleapis.com/v23';

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

  async function search(query: string): Promise<unknown[]> {
    // One retry on 429/5xx (ported backoff pattern, simplified to a single retry).
    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const batches = await $fetch<unknown>(
          `${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:searchStream`,
          { method: 'POST', headers, timeout: 30_000, body: { query } },
        );
        return flattenSearchStream(batches);
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

  const campaignResults = await search(buildCampaignGaql(range));
  const creativeResults = await Promise.allSettled([
    search(buildAssetGroupGaql()),
    search(buildAdGroupAdAssetGaql()),
  ]);
  const failedCreativeQueries = creativeResults.filter(result => result.status === 'rejected');
  if (failedCreativeQueries.length) {
    console.warn(`Google Ads creative enrichment: ${failedCreativeQueries.length} asset query failed; campaign metrics were preserved`);
  }
  const creativeMedia = normalizeGoogleCreativeAssets(creativeResults.flatMap(result => result.status === 'fulfilled' ? result.value : []));
  return attachCreativeMedia(normalizeGoogleAdsResults(campaignResults), creativeMedia);
}
