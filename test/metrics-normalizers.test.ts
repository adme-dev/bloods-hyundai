import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeGa4Response } from '../server/utils/metrics/ga4.ts';

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
