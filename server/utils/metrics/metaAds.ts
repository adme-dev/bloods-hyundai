// Meta Marketing API insights (level=campaign, time_increment=1).
// Lead action types ported from XeroFlow metaClient.ts (incl. leads_retrieval).
import type { DateRange, NormalizedRow } from './types';

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
  while (url && guard < 20) {
    const res: { data?: unknown[]; paging?: { next?: string } } = await $fetch(url, {
      timeout: 30_000,
      headers: { Authorization: `Bearer ${token}` },
    });
    insights.push(...(res.data || []));
    url = res.paging?.next || null;
    guard++;
  }
  return normalizeMetaInsights(insights);
}
