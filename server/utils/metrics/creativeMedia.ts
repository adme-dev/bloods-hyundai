import type { NormalizedRow } from './types';

export interface CreativeMedia {
  id: string;
  platform: 'meta_ads' | 'google_ads';
  campaignId: string;
  campaignName: string | null;
  title: string;
  mediaType: 'image' | 'video';
  imageUrl: string;
  videoUrl: string | null;
  performanceLabel: string | null;
}

export interface ReportCreativeMedia extends CreativeMedia {
  spend: number;
  ctr: number | null;
}

export function safeMediaUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function attachCreativeMedia(rows: NormalizedRow[], media: CreativeMedia[]): NormalizedRow[] {
  const byCampaign = new Map<string, CreativeMedia[]>();
  for (const item of media) {
    const key = `${item.platform}:${item.campaignId}`;
    const existing = byCampaign.get(key) || [];
    if (existing.length < 12) existing.push(item);
    byCampaign.set(key, existing);
  }

  return rows.map((row) => {
    const creativeMedia = byCampaign.get(`${row.platform}:${row.campaignId}`);
    if (!creativeMedia?.length) return row;
    const raw = row.raw && typeof row.raw === 'object' && !Array.isArray(row.raw) ? row.raw : {};
    return { ...row, raw: { ...raw, creativeMedia } };
  });
}

export function collectCreativeMedia(
  rows: Array<{ platform: string; campaignId: string; raw: unknown }>,
  campaigns: Array<{ platform: string; campaignId: string; spend: number; ctr: number | null }>,
): ReportCreativeMedia[] {
  const metrics = new Map(campaigns.map(campaign => [
    `${campaign.platform}:${campaign.campaignId}`,
    { spend: campaign.spend, ctr: campaign.ctr },
  ]));
  const seen = new Set<string>();
  const result: ReportCreativeMedia[] = [];

  for (const row of rows) {
    const cached = (row.raw as { creativeMedia?: unknown } | null)?.creativeMedia;
    if (!Array.isArray(cached)) continue;
    for (const value of cached) {
      const item = parseStoredCreative(value);
      if (!item || seen.has(`${item.platform}:${item.id}`)) continue;
      seen.add(`${item.platform}:${item.id}`);
      result.push({
        ...item,
        ...(metrics.get(`${item.platform}:${item.campaignId}`) || { spend: 0, ctr: null }),
      });
    }
  }

  return result.sort((a, b) => b.spend - a.spend || a.title.localeCompare(b.title));
}

function parseStoredCreative(value: unknown): CreativeMedia | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<CreativeMedia>;
  if (!item.id || !item.campaignId || !item.title) return null;
  if (item.platform !== 'meta_ads' && item.platform !== 'google_ads') return null;
  if (item.mediaType !== 'image' && item.mediaType !== 'video') return null;
  const imageUrl = safeMediaUrl(item.imageUrl);
  if (!imageUrl) return null;
  return {
    id: item.id,
    platform: item.platform,
    campaignId: item.campaignId,
    campaignName: typeof item.campaignName === 'string' ? item.campaignName : null,
    title: item.title,
    mediaType: item.mediaType,
    imageUrl,
    videoUrl: safeMediaUrl(item.videoUrl),
    performanceLabel: typeof item.performanceLabel === 'string' ? item.performanceLabel : null,
  };
}
