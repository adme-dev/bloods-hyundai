import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aggregateMarketingMetrics } from '../server/utils/metrics/aggregate.ts';

const meta = (over: Record<string, unknown> = {}) => ({
  platform: 'meta_ads' as const, campaignId: '111', campaignName: 'July i30 Runout',
  spend: 100, impressions: 5000, clicks: 200, platformLeads: 10,
  sessions: 0, users: 0, conversions: 0, ...over,
});

describe('aggregateMarketingMetrics', () => {
  it('sums per-campaign rows across days and computes CPL from CRM leads', () => {
    const out = aggregateMarketingMetrics(
      [meta(), meta({ spend: 50, clicks: 100, platformLeads: 5 })],
      [{ utmSource: 'facebook', utmMedium: 'paid', utmCampaign: 'july i30 runout', count: 6 }],
    );
    const c = out.campaigns.find(c => c.campaignId === '111')!;
    assert.equal(c.spend, 150);
    assert.equal(c.platformLeads, 15);
    assert.equal(c.crmLeads, 6);
    assert.equal(c.cpl, 25);
    assert.equal(out.platforms.meta_ads.spend, 150);
    assert.equal(out.platforms.meta_ads.crmLeads, 6);
  });

  it('matches CRM campaign by campaignId too, case-insensitive names', () => {
    const out = aggregateMarketingMetrics(
      [meta({ campaignName: 'BRAND Campaign' })],
      [{ utmSource: 'fb', utmMedium: 'cpc', utmCampaign: '111', count: 2 }],
    );
    assert.equal(out.campaigns[0]!.crmLeads, 2);
  });

  it('cpl is null when no CRM leads', () => {
    const out = aggregateMarketingMetrics([meta()], []);
    assert.equal(out.campaigns[0]!.cpl, null);
  });

  it('unmatched paid CRM campaigns land in an Other/untagged row', () => {
    const out = aggregateMarketingMetrics(
      [meta()],
      [
        { utmSource: 'facebook', utmMedium: 'paid', utmCampaign: 'july i30 runout', count: 3 },
        { utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'mystery-campaign', count: 4 },
      ],
    );
    const other = out.campaigns.find(c => c.campaignId === '__other__')!;
    assert.equal(other.crmLeads, 4);
    assert.equal(other.cpl, null);
    assert.equal(other.spend, 0);
  });

  it('platform-level crmLeads uses utm source/medium mapping', () => {
    const out = aggregateMarketingMetrics(
      [meta(), { ...meta({ platform: 'google_ads' as const, campaignId: '999', campaignName: 'Brand' }) }],
      [
        { utmSource: 'instagram', utmMedium: 'paid_social', utmCampaign: null, count: 5 },
        { utmSource: 'google', utmMedium: 'cpc', utmCampaign: null, count: 7 },
        { utmSource: 'newsletter', utmMedium: 'email', utmCampaign: null, count: 99 },
      ],
    );
    assert.equal(out.platforms.meta_ads.crmLeads, 5);
    assert.equal(out.platforms.google_ads.crmLeads, 7);
  });

  it('GA4 rows aggregate into platform totals only, never campaigns', () => {
    const out = aggregateMarketingMetrics(
      [{ platform: 'ga4', campaignId: '', campaignName: null, spend: 0, impressions: 0, clicks: 0, platformLeads: 0, sessions: 120, users: 90, conversions: 4 },
       { platform: 'ga4', campaignId: '', campaignName: null, spend: 0, impressions: 0, clicks: 0, platformLeads: 0, sessions: 80, users: 60, conversions: 2 }],
      [],
    );
    assert.deepEqual(out.platforms.ga4, { sessions: 200, users: 150, conversions: 6 });
    assert.equal(out.campaigns.length, 0);
  });

  it('scopes campaign matching by platform when names collide', () => {
    const out = aggregateMarketingMetrics(
      [
        meta({ campaignName: 'July Runout', campaignId: 'm1' }),
        { ...meta({ platform: 'google_ads' as const, campaignName: 'July Runout', campaignId: 'g1', spend: 200 }) },
      ],
      [
        { utmSource: 'facebook', utmMedium: 'paid', utmCampaign: 'july runout', count: 3 },
        { utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'july runout', count: 5 },
      ],
    );
    assert.equal(out.campaigns.find(c => c.campaignId === 'm1')!.crmLeads, 3);
    assert.equal(out.campaigns.find(c => c.campaignId === 'g1')!.crmLeads, 5);
  });
});
