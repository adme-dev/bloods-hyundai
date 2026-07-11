// Meta Marketing API insights (level=campaign, time_increment=1).
// Lead action types ported from XeroFlow metaClient.ts (incl. leads_retrieval).
import type { DateRange, NormalizedRow } from './types';
import { attachCreativeMedia, safeMediaUrl, type CreativeMedia } from './creativeMedia';

export const META_LEAD_ACTION_TYPES = new Set([
  'lead',
  'offsite_conversion.fb_pixel_lead',
  'leads_retrieval',
]);

interface MetaInsight {
  campaign_id?: string;
  campaign_name?: string;
  date_start?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: Array<{ action_type: string; value: string }>;
}

interface MetaAdCreative {
  id?: string;
  name?: string;
  campaign_id?: string;
  campaign?: { name?: string };
  creative?: {
    id?: string;
    name?: string;
    thumbnail_url?: string;
    image_url?: string;
    video_id?: string;
    object_story_spec?: {
      video_data?: { image_url?: string };
      link_data?: { image_url?: string };
    };
  };
}

export function normalizeMetaInsights(insights: unknown[]): NormalizedRow[] {
  return (insights as MetaInsight[]).map((i) => {
    const leads = (i.actions || [])
      .filter((a) => META_LEAD_ACTION_TYPES.has(a.action_type))
      .reduce((sum, a) => sum + Number(a.value || 0), 0);
    return {
      platform: 'meta_ads' as const,
      date: i.date_start || '',
      campaignId: i.campaign_id || '',
      campaignName: i.campaign_name || null,
      spend: i.spend != null ? Number(i.spend) : null,
      impressions: i.impressions != null ? Number(i.impressions) : null,
      clicks: i.clicks != null ? Number(i.clicks) : null,
      platformLeads: leads,
      sessions: null,
      users: null,
      conversions: null,
      raw: i,
    };
  });
}

export function normalizeMetaCreatives(ads: unknown[]): CreativeMedia[] {
  return (ads as MetaAdCreative[]).flatMap((ad) => {
    const creative = ad.creative;
    const imageUrl = safeMediaUrl(
      creative?.thumbnail_url
      || creative?.image_url
      || creative?.object_story_spec?.video_data?.image_url
      || creative?.object_story_spec?.link_data?.image_url,
    );
    if (!ad.id || !ad.campaign_id || !creative?.id || !imageUrl) return [];
    return [{
      id: `meta:${ad.id}:${creative.id}`,
      platform: 'meta_ads' as const,
      campaignId: ad.campaign_id,
      campaignName: ad.campaign?.name || null,
      title: ad.name || creative.name || 'Meta ad',
      mediaType: creative.video_id ? 'video' as const : 'image' as const,
      imageUrl,
      videoUrl: null,
      performanceLabel: null,
    }];
  });
}

const META_GRAPH_BASE = 'https://graph.facebook.com/v23.0';

/** adAccountId accepts '1234567890' or 'act_1234567890'. Follows paging.next. */
export async function fetchMetaDaily(adAccountId: string, range: DateRange): Promise<NormalizedRow[]> {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) throw new Error('META_SYSTEM_USER_TOKEN not set');
  const account = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

  // Token goes in the Authorization header, NEVER the URL — error messages echo
  // URLs and sync_runs.error is persisted.
  const insights: unknown[] = [];
  let url: string | null = `${META_GRAPH_BASE}/${account}/insights?` + new URLSearchParams({
    level: 'campaign',
    time_increment: '1',
    time_range: JSON.stringify({ since: range.from, until: range.to }),
    fields: 'campaign_id,campaign_name,spend,impressions,clicks,actions',
    limit: '100',
  }).toString();

  let guard = 0;
  const fetchJson = $fetch as <T>(request: string, opts?: Record<string, unknown>) => Promise<T>;
  while (url && guard < 20) {
    const res: { data?: unknown[]; paging?: { next?: string } } = await fetchJson<{ data?: unknown[]; paging?: { next?: string } }>(url, {
      timeout: 30_000,
      headers: { Authorization: `Bearer ${token}` },
    });
    insights.push(...(res.data || []));
    url = res.paging?.next || null;
    guard++;
  }
  try {
    const ads: unknown[] = [];
    url = `${META_GRAPH_BASE}/${account}/ads?` + new URLSearchParams({
      fields: 'id,name,campaign_id,campaign{name},creative{id,name,thumbnail_url,image_url,video_id,object_story_spec}',
      effective_status: JSON.stringify(['ACTIVE', 'PAUSED']),
      limit: '100',
    }).toString();
    guard = 0;
    while (url && guard < 20) {
      const res: { data?: unknown[]; paging?: { next?: string } } = await fetchJson(url, {
        timeout: 30_000,
        headers: { Authorization: `Bearer ${token}` },
      });
      ads.push(...(res.data || []));
      url = res.paging?.next || null;
      guard++;
    }
    return attachCreativeMedia(normalizeMetaInsights(insights), normalizeMetaCreatives(ads));
  } catch {
    console.warn('Meta Ads creative enrichment failed; campaign metrics were preserved');
    return normalizeMetaInsights(insights);
  }
}
