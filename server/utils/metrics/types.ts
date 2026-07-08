export type Platform = 'ga4' | 'meta_ads' | 'google_ads';

/** One platform-day(-campaign) row, ready to upsert into marketing_metrics_daily. */
export interface NormalizedRow {
  platform: Platform;
  date: string; // YYYY-MM-DD
  campaignId: string; // '' = account/property-level row
  campaignName: string | null;
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  platformLeads: number | null;
  sessions: number | null;
  users: number | null;
  conversions: number | null;
  raw: unknown;
}

export interface DateRange {
  from: string; // YYYY-MM-DD inclusive
  to: string;   // YYYY-MM-DD inclusive
}

/** dealers.settings.marketing.integrations */
export interface MarketingIntegrations {
  ga4PropertyId?: string;
  metaAdAccountId?: string;
  googleAdsCustomerId?: string;
  googleAdsLoginCustomerId?: string;
}
