import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildMarketingReportInsights } from '../server/utils/metrics/reportInsights.ts';

const baseInput = () => ({
  summary: {
    totalCrmLeads: 10,
    paidCrmLeads: 4,
    syncedToCrm: 9,
    externalMarketplaceLeads: 2,
    crmSyncCoverage: 90,
    utmCoverage: 80,
    campaignCoverage: 70,
    paidAttributionCoverage: 70,
    sourceCoverage: 100,
    clickIdCoverage: 40,
    backfilledAttributionCoverage: 20,
    vehicleCoverage: 60,
  },
  professionalMetrics: {
    ga4Website: {
      sessions: 1000,
      users: 700,
      keyEvents: 80,
      conversionRate: 8,
    },
    paidMedia: {
      spend: 800,
      impressions: 20000,
      clicks: 400,
      ctr: 2,
      averageCpc: 2,
      cpm: 40,
      platformLeads: 20,
      platformLeadRate: 5,
      crmLeads: 4,
      cpl: 200,
    },
  },
  campaigns: [
    {
      platform: 'google_ads',
      campaignId: 'g1',
      campaignName: 'Brand Search',
      spend: 300,
      impressions: 5000,
      clicks: 150,
      platformLeads: 10,
      crmLeads: 3,
      cpl: 100,
      ctr: 3,
      platformLeadRate: 6.7,
    },
    {
      platform: 'google_ads',
      campaignId: 'g2',
      campaignName: 'IONIQ Runout',
      spend: 500,
      impressions: 15000,
      clicks: 250,
      platformLeads: 10,
      crmLeads: 0,
      cpl: null,
      ctr: 1.7,
      platformLeadRate: 4,
    },
  ],
  leadSources: [
    { key: 'google_paid', label: 'Google paid search', category: 'paid_search', total: 4, crmSynced: 4, withCampaign: 4 },
    { key: 'carsales', label: 'Carsales', category: 'external_marketplace', total: 2, crmSynced: 1, withCampaign: 0 },
  ],
  externalCrmSyncEnabled: true,
});

describe('buildMarketingReportInsights', () => {
  it('builds executive metrics, funnel rates and diagnostics', () => {
    const out = buildMarketingReportInsights(baseInput());

    assert.equal(out.executive.totalSpend, 800);
    assert.equal(out.executive.blendedCpl, 200);
    assert.equal(out.executive.paidShareOfLeads, 40);
    assert.equal(out.executive.topLeadSource, 'Google paid search');
    assert.equal(out.executive.bestCampaign, 'Brand Search');
    assert.equal(out.externalCrmSyncEnabled, true);

    assert.equal(out.funnel.find(step => step.key === 'paid_clicks')!.rateFromPrevious, 40);
    assert.equal(out.funnel.find(step => step.key === 'external_crm_synced')!.rateFromPrevious, 90);

    assert.equal(out.sourceDiagnostics[0]!.share, 40);
    assert.equal(out.sourceDiagnostics[1]!.crmSyncCoverage, 50);
    assert.equal(out.campaignDiagnostics.bestByCpl!.campaignName, 'Brand Search');
    assert.equal(out.campaignDiagnostics.highestSpendNoCrmLead!.campaignName, 'IONIQ Runout');
    assert.equal(out.campaignDiagnostics.opportunities[0]!.issue, 'Spend without CRM lead match');
  });

  it('raises a high priority recommendation when paid spend has no CRM attribution', () => {
    const input = baseInput();
    input.summary.paidCrmLeads = 0;
    input.professionalMetrics.paidMedia.crmLeads = 0;
    input.professionalMetrics.paidMedia.cpl = null;

    const out = buildMarketingReportInsights(input);

    assert.equal(out.executive.blendedCpl, null);
    assert.equal(out.recommendations[0]!.priority, 'high');
    assert.match(out.recommendations[0]!.title, /no paid crm attribution/i);
  });

  it('omits external CRM sync checks when no external connector is enabled', () => {
    const input = baseInput();
    input.externalCrmSyncEnabled = false;

    const out = buildMarketingReportInsights(input);

    assert.equal(out.externalCrmSyncEnabled, false);
    assert.equal(out.funnel.some(step => step.key === 'external_crm_synced'), false);
    assert.equal(out.dataQuality.some(check => check.key === 'external_crm_sync'), false);
  });
});
