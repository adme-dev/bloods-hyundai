// test/roas.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { roasBasis, computeRoas } from '../server/utils/metrics/roas.ts';

describe('roas', () => {
  it('is null when spend is zero', () => assert.equal(computeRoas(500, 0), null));
  it('divides revenue by spend, rounded to 2dp', () => assert.equal(computeRoas(1500, 1000), 1.5));
  it('prefers platform conversion value when present', () => {
    assert.equal(roasBasis({ conversionsValue: 900, crmLeads: 3, avgSaleValue: 40000 }), 900);
  });
  it('falls back to crmLeads x avgSaleValue', () => {
    assert.equal(roasBasis({ conversionsValue: 0, crmLeads: 2, avgSaleValue: 40000 }), 80000);
  });
  it('is null with no basis', () => {
    assert.equal(roasBasis({ conversionsValue: 0, crmLeads: 2, avgSaleValue: null }), null);
  });
});
