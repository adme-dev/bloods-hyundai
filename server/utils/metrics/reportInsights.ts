type NullableNumber = number | null | undefined;

export type InsightPriority = 'high' | 'medium' | 'low';

export interface MarketingReportSummaryInput {
  totalCrmLeads: number;
  paidCrmLeads: number;
  syncedToCrm: number;
  externalMarketplaceLeads: number;
  crmSyncCoverage: number;
  utmCoverage: number;
  campaignCoverage: number;
  paidAttributionCoverage: number;
  sourceCoverage: number;
  clickIdCoverage: number;
  backfilledAttributionCoverage: number;
  vehicleCoverage?: number;
}

export interface MarketingReportCampaignInput {
  platform: string;
  campaignId: string;
  campaignName: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  platformLeads: number;
  crmLeads: number;
  cpl: NullableNumber;
  ctr: NullableNumber;
  platformLeadRate: NullableNumber;
}

export interface MarketingReportLeadSourceInput {
  key: string;
  label: string;
  category: string;
  total: number;
  crmSynced: number;
  withCampaign: number;
}

export interface MarketingReportProfessionalMetricsInput {
  ga4Website: {
    sessions: number;
    users: number;
    keyEvents: number;
    conversionRate: NullableNumber;
  };
  paidMedia: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: NullableNumber;
    averageCpc: NullableNumber;
    cpm: NullableNumber;
    platformLeads: number;
    platformLeadRate?: NullableNumber;
    crmLeads: number;
    cpl: NullableNumber;
  };
}

export interface MarketingReportInsightsInput {
  summary: MarketingReportSummaryInput;
  professionalMetrics: MarketingReportProfessionalMetricsInput;
  campaigns: MarketingReportCampaignInput[];
  leadSources: MarketingReportLeadSourceInput[];
}

export interface MarketingReportInsightRecommendation {
  priority: InsightPriority;
  title: string;
  detail: string;
  action: string;
}

export interface MarketingReportInsights {
  executive: {
    totalSpend: number;
    totalCrmLeads: number;
    blendedCpl: number | null;
    paidShareOfLeads: number | null;
    topLeadSource: string | null;
    bestCampaign: string | null;
    dataQualityScore: number;
    primaryRecommendation: string;
  };
  funnel: Array<{
    key: string;
    label: string;
    value: number;
    rateFromPrevious: number | null;
    caption: string;
  }>;
  recommendations: MarketingReportInsightRecommendation[];
  sourceDiagnostics: Array<MarketingReportLeadSourceInput & {
    share: number;
    crmSyncCoverage: number;
    campaignCoverage: number;
  }>;
  campaignDiagnostics: {
    bestByCpl: MarketingReportCampaignInput | null;
    highestSpendNoCrmLead: MarketingReportCampaignInput | null;
    opportunities: Array<{
      campaignName: string;
      platform: string;
      spend: number;
      clicks: number;
      crmLeads: number;
      issue: string;
    }>;
  };
  dataQuality: Array<{
    key: string;
    label: string;
    value: number;
    target: number;
    status: 'good' | 'watch' | 'poor';
  }>;
}

export function buildMarketingReportInsights(input: MarketingReportInsightsInput): MarketingReportInsights {
  const { summary, professionalMetrics, campaigns, leadSources } = input;
  const paid = professionalMetrics.paidMedia;
  const totalSpend = roundMoney(paid.spend || 0);
  const blendedCpl = summary.paidCrmLeads > 0 && totalSpend > 0 ? roundMoney(totalSpend / summary.paidCrmLeads) : null;
  const topLeadSource = leadSources[0]?.label || null;
  const bestCampaign = bestCampaignByCpl(campaigns)?.campaignName || null;
  const dataQuality = buildDataQuality(summary);
  const dataQualityScore = Math.round(dataQuality.reduce((sum, item) => sum + Math.min(item.value, item.target) / item.target, 0) / Math.max(dataQuality.length, 1) * 100);
  const recommendations = buildRecommendations(input, dataQuality);

  return {
    executive: {
      totalSpend,
      totalCrmLeads: summary.totalCrmLeads,
      blendedCpl,
      paidShareOfLeads: percent(summary.paidCrmLeads, summary.totalCrmLeads),
      topLeadSource,
      bestCampaign,
      dataQualityScore,
      primaryRecommendation: recommendations[0]?.title || 'Keep monitoring campaign quality and CRM lead matching.',
    },
    funnel: buildFunnel(summary, professionalMetrics),
    recommendations,
    sourceDiagnostics: buildSourceDiagnostics(leadSources, summary.totalCrmLeads),
    campaignDiagnostics: buildCampaignDiagnostics(campaigns),
    dataQuality,
  };
}

function buildFunnel(summary: MarketingReportSummaryInput, professionalMetrics: MarketingReportProfessionalMetricsInput) {
  const sessions = professionalMetrics.ga4Website.sessions || 0;
  const keyEvents = professionalMetrics.ga4Website.keyEvents || 0;
  const paidClicks = professionalMetrics.paidMedia.clicks || 0;
  const crmLeads = summary.totalCrmLeads || 0;
  const synced = summary.syncedToCrm || 0;

  return [
    {
      key: 'website_sessions',
      label: 'Website sessions',
      value: sessions,
      rateFromPrevious: null,
      caption: 'GA4 sessions for the selected period.',
    },
    {
      key: 'paid_clicks',
      label: 'Paid clicks',
      value: paidClicks,
      rateFromPrevious: percent(paidClicks, sessions),
      caption: 'Media traffic from Google and Meta Ads.',
    },
    {
      key: 'ga4_key_events',
      label: 'GA4 key events',
      value: keyEvents,
      rateFromPrevious: percent(keyEvents, sessions),
      caption: 'Tracked website conversion events.',
    },
    {
      key: 'crm_leads',
      label: 'CRM leads',
      value: crmLeads,
      rateFromPrevious: percent(crmLeads, keyEvents || sessions),
      caption: 'Enquiries captured in the CRM database.',
    },
    {
      key: 'crm_synced',
      label: 'CRM synced',
      value: synced,
      rateFromPrevious: percent(synced, crmLeads),
      caption: 'Leads confirmed as pushed to CRM.',
    },
  ];
}

function buildRecommendations(
  input: MarketingReportInsightsInput,
  dataQuality: MarketingReportInsights['dataQuality'],
): MarketingReportInsightRecommendation[] {
  const { summary, professionalMetrics, campaigns } = input;
  const paid = professionalMetrics.paidMedia;
  const recommendations: MarketingReportInsightRecommendation[] = [];

  if (paid.spend > 0 && summary.paidCrmLeads === 0) {
    recommendations.push({
      priority: 'high',
      title: 'Paid media is not reconciling to CRM leads',
      detail: `Spend is active but no CRM leads are currently attributed to Google or Meta.`,
      action: 'Audit UTM campaign values, click IDs, and form attribution fields before judging campaign CPL.',
    });
  }

  const noLeadSpend = highestSpendNoLeadCampaign(campaigns);
  if (noLeadSpend && noLeadSpend.spend >= 50) {
    recommendations.push({
      priority: 'high',
      title: 'Campaign spend has no matched CRM leads',
      detail: `${noLeadSpend.campaignName || noLeadSpend.campaignId} spent ${roundMoney(noLeadSpend.spend)} with ${noLeadSpend.clicks} clicks and no matched CRM lead.`,
      action: 'Check the landing page form, campaign UTM, and CRM ingestion path for this campaign.',
    });
  }

  for (const check of dataQuality) {
    if (check.status === 'poor') {
      recommendations.push({
        priority: 'high',
        title: `${check.label} is below target`,
        detail: `${check.label} is ${roundRate(check.value)}% against a ${check.target}% target.`,
        action: 'Fix the website data layer and CRM field mapping for the affected lead sources.',
      });
    } else if (check.status === 'watch') {
      recommendations.push({
        priority: 'medium',
        title: `${check.label} needs monitoring`,
        detail: `${check.label} is ${roundRate(check.value)}%, which is below the preferred ${check.target}% target.`,
        action: 'Review recent form submissions and external lead feeds for missing attribution fields.',
      });
    }
  }

  if (summary.totalCrmLeads > 0 && summary.externalMarketplaceLeads / summary.totalCrmLeads >= 0.5) {
    recommendations.push({
      priority: 'medium',
      title: 'External marketplaces are driving the lead mix',
      detail: `${summary.externalMarketplaceLeads} of ${summary.totalCrmLeads} CRM leads came from external marketplace feeds.`,
      action: 'Separate OEM/paid website performance from Carsales and Autotrader when reviewing campaign ROI.',
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      priority: 'low',
      title: 'Core reporting signals are healthy',
      detail: 'Campaign, source, paid attribution, and CRM sync coverage are within normal reporting thresholds.',
      action: 'Review campaign CPL and landing page trends for optimisation opportunities.',
    });
  }

  return recommendations.slice(0, 6);
}

function buildSourceDiagnostics(sources: MarketingReportLeadSourceInput[], totalLeads: number) {
  return sources.map(source => ({
    ...source,
    share: percent(source.total, totalLeads) || 0,
    crmSyncCoverage: percent(source.crmSynced, source.total) || 0,
    campaignCoverage: percent(source.withCampaign, source.total) || 0,
  }));
}

function buildCampaignDiagnostics(campaigns: MarketingReportCampaignInput[]): MarketingReportInsights['campaignDiagnostics'] {
  const opportunities = campaigns
    .filter(campaign => campaign.spend > 0 && (campaign.crmLeads === 0 || campaign.cpl == null || campaign.cpl > 250))
    .slice()
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5)
    .map(campaign => ({
      campaignName: campaign.campaignName || campaign.campaignId,
      platform: campaign.platform,
      spend: roundMoney(campaign.spend),
      clicks: campaign.clicks,
      crmLeads: campaign.crmLeads,
      issue: campaign.crmLeads === 0 ? 'Spend without CRM lead match' : 'High CRM CPL',
    }));

  return {
    bestByCpl: bestCampaignByCpl(campaigns),
    highestSpendNoCrmLead: highestSpendNoLeadCampaign(campaigns),
    opportunities,
  };
}

function buildDataQuality(summary: MarketingReportSummaryInput): MarketingReportInsights['dataQuality'] {
  return [
    { key: 'source', label: 'Source coverage', value: summary.sourceCoverage, target: 95, status: qualityStatus(summary.sourceCoverage, 95) },
    { key: 'campaign', label: 'Campaign coverage', value: summary.campaignCoverage, target: 80, status: qualityStatus(summary.campaignCoverage, 80) },
    { key: 'paid_attribution', label: 'Paid attribution coverage', value: summary.paidAttributionCoverage, target: 80, status: qualityStatus(summary.paidAttributionCoverage, 80) },
    { key: 'crm_sync', label: 'CRM sync coverage', value: summary.crmSyncCoverage, target: 95, status: qualityStatus(summary.crmSyncCoverage, 95) },
    { key: 'vehicle', label: 'Vehicle-linked leads', value: summary.vehicleCoverage || 0, target: 70, status: qualityStatus(summary.vehicleCoverage || 0, 70) },
  ];
}

function qualityStatus(value: number, target: number): 'good' | 'watch' | 'poor' {
  if (value >= target) return 'good';
  if (value >= target * 0.65) return 'watch';
  return 'poor';
}

function bestCampaignByCpl(campaigns: MarketingReportCampaignInput[]) {
  return campaigns
    .filter(campaign => campaign.crmLeads > 0 && campaign.cpl != null)
    .slice()
    .sort((a, b) => (a.cpl || Number.POSITIVE_INFINITY) - (b.cpl || Number.POSITIVE_INFINITY) || b.crmLeads - a.crmLeads)[0] || null;
}

function highestSpendNoLeadCampaign(campaigns: MarketingReportCampaignInput[]) {
  return campaigns
    .filter(campaign => campaign.spend > 0 && campaign.crmLeads === 0)
    .slice()
    .sort((a, b) => b.spend - a.spend)[0] || null;
}

function percent(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return roundRate((numerator / denominator) * 100);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundRate(value: number) {
  return Math.round(value * 10) / 10;
}
