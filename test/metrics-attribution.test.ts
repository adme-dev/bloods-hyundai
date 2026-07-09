import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inferLeadAttribution } from '../server/utils/metrics/attribution.ts';

const campaigns = [
  { platform: 'google_ads' as const, campaignId: 'g-1', campaignName: 'Brand Search' },
  { platform: 'meta_ads' as const, campaignId: 'm-1', campaignName: 'July Runout' },
];

describe('inferLeadAttribution', () => {
  it('uses Google click IDs as strong paid-search evidence', () => {
    const out = inferLeadAttribution({ gclid: 'abc', utmCampaign: 'Brand Search' }, campaigns);
    assert.equal(out.platform, 'google_ads');
    assert.equal(out.campaignId, 'g-1');
    assert.equal(out.confidence, 95);
    assert.equal(out.method, 'click_id');
  });

  it('uses Meta click IDs and matching campaigns', () => {
    const out = inferLeadAttribution({ fbclid: 'xyz', utmCampaign: 'July Runout' }, campaigns);
    assert.equal(out.platform, 'meta_ads');
    assert.equal(out.campaignId, 'm-1');
    assert.equal(out.method, 'click_id');
  });

  it('back-propagates old UTM-only leads to campaign rows', () => {
    const out = inferLeadAttribution({
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'g-1',
    }, campaigns);
    assert.equal(out.platform, 'google_ads');
    assert.equal(out.campaignId, 'g-1');
    assert.equal(out.method, 'utm_campaign');
  });

  it('keeps unqualified website leads unattributed', () => {
    const out = inferLeadAttribution({ source: '/contact-us' }, campaigns);
    assert.equal(out.platform, null);
    assert.equal(out.method, 'none');
  });
});
