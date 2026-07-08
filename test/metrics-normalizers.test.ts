import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeGa4Response } from '../server/utils/metrics/ga4.ts';
import { normalizeMetaInsights } from '../server/utils/metrics/metaAds.ts';

describe('normalizeGa4Response', () => {
  it('maps runReport rows to property-level NormalizedRows', () => {
    const resp = {
      rows: [
        { dimensionValues: [{ value: '20260701' }], metricValues: [{ value: '120' }, { value: '95' }, { value: '7' }] },
        { dimensionValues: [{ value: '20260702' }], metricValues: [{ value: '80' }, { value: '60' }, { value: '3' }] },
      ],
    };
    const rows = normalizeGa4Response(resp);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      platform: 'ga4',
      date: '2026-07-01',
      campaignId: '',
      campaignName: null,
      spend: null,
      impressions: null,
      clicks: null,
      platformLeads: null,
      sessions: 120,
      users: 95,
      conversions: 7,
      raw: resp.rows[0],
    });
  });

  it('returns [] for empty/missing rows', () => {
    assert.deepEqual(normalizeGa4Response({}), []);
    assert.deepEqual(normalizeGa4Response({ rows: [] }), []);
  });
});

describe('normalizeMetaInsights', () => {
  const insight = {
    campaign_id: '238461',
    campaign_name: 'July i30 Runout',
    date_start: '2026-07-02',
    date_stop: '2026-07-02',
    spend: '142.57',
    impressions: '9021',
    clicks: '311',
    actions: [
      { action_type: 'lead', value: '4' },
      { action_type: 'offsite_conversion.fb_pixel_lead', value: '2' },
      { action_type: 'leads_retrieval', value: '1' },
      { action_type: 'link_click', value: '250' },
    ],
  };

  it('maps campaign-day insights and sums only lead action types', () => {
    const rows = normalizeMetaInsights([insight]);
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      platform: 'meta_ads',
      date: '2026-07-02',
      campaignId: '238461',
      campaignName: 'July i30 Runout',
      spend: 142.57,
      impressions: 9021,
      clicks: 311,
      platformLeads: 7,
      sessions: null,
      users: null,
      conversions: null,
      raw: insight,
    });
  });

  it('handles missing actions and empty input', () => {
    const rows = normalizeMetaInsights([{ ...insight, actions: undefined }]);
    assert.equal(rows[0]!.platformLeads, 0);
    assert.deepEqual(normalizeMetaInsights([]), []);
  });
});
