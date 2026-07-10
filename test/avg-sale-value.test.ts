// test/avg-sale-value.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseAvgSaleValue } from '../server/utils/metrics/avgSaleValue.ts';

describe('parseAvgSaleValue', () => {
  it('is null for null', () => assert.equal(parseAvgSaleValue(null), null));
  it('is null for undefined', () => assert.equal(parseAvgSaleValue(undefined), null));
  it('is null for empty string', () => assert.equal(parseAvgSaleValue(''), null));
  it('is null for whitespace-only string', () => assert.equal(parseAvgSaleValue('   '), null));
  it('is null for a negative number', () => assert.equal(parseAvgSaleValue(-100), null));
  it('is null for zero', () => assert.equal(parseAvgSaleValue(0), null));
  it('is null for NaN', () => assert.equal(parseAvgSaleValue(NaN), null));
  it('is null for a non-numeric string', () => assert.equal(parseAvgSaleValue('not-a-number'), null));
  it('is null for Infinity', () => assert.equal(parseAvgSaleValue(Infinity), null));
  it('accepts a valid number, rounded to 2dp', () => {
    assert.equal(parseAvgSaleValue(40000), 40000);
    assert.equal(parseAvgSaleValue(39999.999), 40000);
    assert.equal(parseAvgSaleValue(12345.678), 12345.68);
  });
  it('accepts a numeric string', () => assert.equal(parseAvgSaleValue('40000'), 40000));
});
