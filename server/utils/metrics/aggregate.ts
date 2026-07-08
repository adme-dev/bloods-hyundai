// Pure month-to-date aggregation + CRM CPL join. No DB imports.

export interface MetricInput {
  platform: 'ga4' | 'meta_ads' | 'google_ads';
  campaignId: string;
  campaignName: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  platformLeads: number;
  sessions: number;
  users: number;
  conversions: number;
}

export interface CrmCampaignCount {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  count: number;
}

export const META_UTM_SOURCES = ['facebook', 'fb', 'meta', 'instagram', 'ig'];
export const GOOGLE_UTM_SOURCES = ['google', 'googleads', 'google_ads'];
export const PAID_UTM_MEDIUMS = ['cpc', 'ppc', 'paid', 'paid_social'];

interface CampaignAgg {
  platform: string;
  campaignId: string;
  campaignName: string | null;
  spend: number;
  clicks: number;
  platformLeads: number;
  crmLeads: number;
  cpl: number | null;
}

export function aggregateMarketingMetrics(rows: MetricInput[], crm: CrmCampaignCount[]) {
  const ga4 = { sessions: 0, users: 0, conversions: 0 };
  const adTotals = {
    meta_ads: { spend: 0, impressions: 0, clicks: 0, platformLeads: 0, crmLeads: 0, cpl: null as number | null },
    google_ads: { spend: 0, impressions: 0, clicks: 0, platformLeads: 0, crmLeads: 0, cpl: null as number | null },
  };
  const campaignMap = new Map<string, CampaignAgg>();

  for (const r of rows) {
    if (r.platform === 'ga4') {
      ga4.sessions += r.sessions;
      ga4.users += r.users;
      ga4.conversions += r.conversions;
      continue;
    }
    const t = adTotals[r.platform];
    t.spend += r.spend;
    t.impressions += r.impressions;
    t.clicks += r.clicks;
    t.platformLeads += r.platformLeads;

    const key = `${r.platform}:${r.campaignId}`;
    const c = campaignMap.get(key) || {
      platform: r.platform, campaignId: r.campaignId, campaignName: r.campaignName,
      spend: 0, clicks: 0, platformLeads: 0, crmLeads: 0, cpl: null,
    };
    c.spend += r.spend;
    c.clicks += r.clicks;
    c.platformLeads += r.platformLeads;
    if (r.campaignName) c.campaignName = r.campaignName;
    campaignMap.set(key, c);
  }

  // CRM campaign-level join: utm_campaign matches campaignId or campaignName (lowercased),
  // scoped per platform so same-named campaigns on different platforms never collide.
  const byId = new Map<string, CampaignAgg>();
  const byName = new Map<string, CampaignAgg>();
  for (const c of campaignMap.values()) {
    byId.set(`${c.platform}:${c.campaignId.toLowerCase()}`, c);
    if (c.campaignName) byName.set(`${c.platform}:${c.campaignName.toLowerCase()}`, c);
  }

  let otherPaidLeads = 0;
  for (const row of crm) {
    const source = (row.utmSource || '').toLowerCase();
    const medium = (row.utmMedium || '').toLowerCase();

    // Platform-level attribution by source (+ paid medium for Google).
    if (META_UTM_SOURCES.includes(source)) {
      adTotals.meta_ads.crmLeads += row.count;
    } else if (GOOGLE_UTM_SOURCES.includes(source) && PAID_UTM_MEDIUMS.includes(medium)) {
      adTotals.google_ads.crmLeads += row.count;
    }

    // Derive a platform hint from source/medium before campaign matching.
    let hint: 'meta_ads' | 'google_ads' | null = null;
    if (META_UTM_SOURCES.includes(source)) {
      hint = 'meta_ads';
    } else if (GOOGLE_UTM_SOURCES.includes(source) && PAID_UTM_MEDIUMS.includes(medium)) {
      hint = 'google_ads';
    }

    // Campaign-level match.
    const campaignKey = (row.utmCampaign || '').toLowerCase();
    if (!campaignKey) continue;

    if (hint) {
      const match = byId.get(`${hint}:${campaignKey}`) || byName.get(`${hint}:${campaignKey}`);
      if (match) {
        match.crmLeads += row.count;
      } else {
        otherPaidLeads += row.count;
      }
    } else {
      const metaMatch = byId.get(`meta_ads:${campaignKey}`) || byName.get(`meta_ads:${campaignKey}`);
      const googleMatch = byId.get(`google_ads:${campaignKey}`) || byName.get(`google_ads:${campaignKey}`);
      if (metaMatch && !googleMatch) {
        metaMatch.crmLeads += row.count;
      } else if (googleMatch && !metaMatch) {
        googleMatch.crmLeads += row.count;
      }
      // Zero or multiple matches without a hint: can't identify the platform, don't guess.
    }
  }

  for (const c of campaignMap.values()) {
    c.cpl = c.crmLeads > 0 ? Math.round((c.spend / c.crmLeads) * 100) / 100 : null;
  }
  for (const t of [adTotals.meta_ads, adTotals.google_ads]) {
    t.spend = Math.round(t.spend * 100) / 100;
    t.cpl = t.crmLeads > 0 ? Math.round((t.spend / t.crmLeads) * 100) / 100 : null;
  }

  const campaigns = [...campaignMap.values()]
    .map(c => ({ ...c, spend: Math.round(c.spend * 100) / 100 }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 15);

  if (otherPaidLeads > 0) {
    campaigns.push({
      platform: 'crm', campaignId: '__other__', campaignName: 'Other / untagged',
      spend: 0, clicks: 0, platformLeads: 0, crmLeads: otherPaidLeads, cpl: null,
    });
  }

  return { platforms: { ga4, ...adTotals }, campaigns };
}
