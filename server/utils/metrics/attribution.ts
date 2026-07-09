import type { Platform } from './types';

export type AttributablePlatform = Extract<Platform, 'meta_ads' | 'google_ads'> | 'microsoft_ads';

export interface AttributionInput {
  source?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  landingPage?: string | null;
  referrer?: string | null;
  attributedPlatform?: string | null;
  attributedCampaignId?: string | null;
  attributedCampaignName?: string | null;
}

export interface CampaignAttributionCandidate {
  platform: Platform;
  campaignId: string;
  campaignName: string | null;
}

export interface AttributionResult {
  platform: AttributablePlatform | null;
  campaignId: string | null;
  campaignName: string | null;
  confidence: number;
  method: 'stored' | 'click_id' | 'utm_campaign' | 'utm_platform' | 'referrer' | 'none';
  evidence: Record<string, string>;
}

const META_SOURCES = ['facebook', 'fb', 'meta', 'instagram', 'ig'];
const GOOGLE_SOURCES = ['google', 'googleads', 'google_ads'];
const PAID_MEDIUMS = ['cpc', 'ppc', 'paid', 'paid_search', 'paid_social'];

export function inferLeadAttribution(
  lead: AttributionInput,
  campaigns: CampaignAttributionCandidate[] = [],
): AttributionResult {
  if (lead.attributedPlatform) {
    return {
      platform: toAttributablePlatform(lead.attributedPlatform),
      campaignId: lead.attributedCampaignId || null,
      campaignName: lead.attributedCampaignName || null,
      confidence: 100,
      method: 'stored',
      evidence: { attributedPlatform: lead.attributedPlatform },
    };
  }

  const source = normalize(lead.utmSource);
  const medium = normalize(lead.utmMedium);
  const campaignKey = normalize(lead.utmCampaign);

  if (lead.gclid || lead.gbraid || lead.wbraid) {
    const campaign = matchCampaign('google_ads', campaignKey, campaigns);
    return result('google_ads', campaign, campaignKey ? 95 : 80, 'click_id', {
      clickId: lead.gclid ? 'gclid' : lead.gbraid ? 'gbraid' : 'wbraid',
      utmCampaign: lead.utmCampaign || '',
    });
  }

  if (lead.fbclid) {
    const campaign = matchCampaign('meta_ads', campaignKey, campaigns);
    const paidHint = META_SOURCES.includes(source) && (!medium || PAID_MEDIUMS.includes(medium));
    return result('meta_ads', campaign, campaignKey ? 90 : paidHint ? 75 : 60, 'click_id', {
      clickId: 'fbclid',
      utmCampaign: lead.utmCampaign || '',
    });
  }

  if (lead.msclkid) {
    return result('microsoft_ads', null, campaignKey ? 85 : 70, 'click_id', {
      clickId: 'msclkid',
      utmCampaign: lead.utmCampaign || '',
    });
  }

  const hintedPlatform = platformFromSourceMedium(source, medium);
  if (campaignKey) {
    const hintedMatch = hintedPlatform ? matchCampaign(hintedPlatform, campaignKey, campaigns) : null;
    if (hintedMatch || hintedPlatform) {
      return result(hintedPlatform, hintedMatch, hintedMatch ? 90 : 75, 'utm_campaign', {
        utmSource: lead.utmSource || '',
        utmMedium: lead.utmMedium || '',
        utmCampaign: lead.utmCampaign || '',
      });
    }

    const uniqueMatch = uniqueCampaignMatch(campaignKey, campaigns);
    if (uniqueMatch) {
      return result(uniqueMatch.platform as AttributablePlatform, uniqueMatch, 70, 'utm_campaign', {
        utmCampaign: lead.utmCampaign || '',
      });
    }
  }

  if (hintedPlatform) {
    return result(hintedPlatform, null, 60, 'utm_platform', {
      utmSource: lead.utmSource || '',
      utmMedium: lead.utmMedium || '',
    });
  }

  const referrer = normalize(`${lead.referrer || ''} ${lead.source || ''} ${lead.landingPage || ''}`);
  if (referrer.includes('facebook.com') || referrer.includes('instagram.com')) {
    return result('meta_ads', null, 35, 'referrer', { referrer: lead.referrer || lead.source || '' });
  }
  if (referrer.includes('google.')) {
    return result('google_ads', null, 30, 'referrer', { referrer: lead.referrer || lead.source || '' });
  }

  return result(null, null, 0, 'none', {});
}

function result(
  platform: AttributablePlatform | null,
  campaign: CampaignAttributionCandidate | null,
  confidence: number,
  method: AttributionResult['method'],
  evidence: Record<string, string>,
): AttributionResult {
  return {
    platform,
    campaignId: campaign?.campaignId || null,
    campaignName: campaign?.campaignName || null,
    confidence,
    method,
    evidence,
  };
}

function platformFromSourceMedium(source: string, medium: string): AttributablePlatform | null {
  if (META_SOURCES.includes(source)) return 'meta_ads';
  if (GOOGLE_SOURCES.includes(source) && PAID_MEDIUMS.includes(medium)) return 'google_ads';
  return null;
}

function matchCampaign(platform: AttributablePlatform | null, campaignKey: string, campaigns: CampaignAttributionCandidate[]) {
  if (!platform || !campaignKey) return null;
  return campaigns.find(campaign =>
    campaign.platform === platform &&
    (normalize(campaign.campaignId) === campaignKey || normalize(campaign.campaignName) === campaignKey),
  ) || null;
}

function uniqueCampaignMatch(campaignKey: string, campaigns: CampaignAttributionCandidate[]) {
  const matches = campaigns.filter(campaign =>
    (campaign.platform === 'google_ads' || campaign.platform === 'meta_ads') &&
    (normalize(campaign.campaignId) === campaignKey || normalize(campaign.campaignName) === campaignKey),
  );
  return matches.length === 1 ? matches[0] : null;
}

function toAttributablePlatform(platform: string): AttributablePlatform | null {
  if (platform === 'google_ads' || platform === 'meta_ads' || platform === 'microsoft_ads') return platform;
  return null;
}

function normalize(value: string | null | undefined) {
  return (value || '').trim().toLowerCase();
}
