import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMarketingTrend } from '../server/utils/metrics/marketingTrend.ts';

describe('buildMarketingTrend', () => {
  it('builds daily website, paid-media, and attributed-lead points', () => {
    const rows = [
      { platform: 'ga4', date: '2026-07-01', sessions: 100, users: 70, conversions: 8, spend: 0, clicks: 0, platformLeads: 0 },
      { platform: 'google_ads', date: '2026-07-01', sessions: 0, users: 0, conversions: 0, spend: 120.25, clicks: 30, platformLeads: 4 },
      { platform: 'meta_ads', date: '2026-07-01', sessions: 0, users: 0, conversions: 0, spend: 29.75, clicks: 12, platformLeads: 2 },
    ];

    const result = buildMarketingTrend(
      { from: '2026-07-01', to: '2026-07-02' },
      rows,
      [{ date: '2026-07-01', total: 5 }],
      [{ date: '2026-07-01', total: 3 }],
    );

    assert.deepEqual(result[0], {
      date: '2026-07-01',
      sessions: 100,
      users: 70,
      keyEvents: 8,
      crmLeads: 5,
      paidSpend: 150,
      paidClicks: 42,
      platformConversions: 6,
      paidCrmLeads: 3,
      crmCpl: 50,
    });
    assert.equal(result[1]?.crmCpl, null);
  });
});
