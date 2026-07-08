// Meta Marketing API insights (level=campaign, time_increment=1).
// Lead action types ported from XeroFlow metaClient.ts (incl. leads_retrieval).
import type { NormalizedRow } from './types';

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
