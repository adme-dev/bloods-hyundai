import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  normalizeHostname,
  resolveDealerSlugAliases,
  resolveTenantFromHostname,
} from '../server/utils/tenant.ts';

describe('tenant helpers', () => {
  it('normalizes hostnames for tenant cache keys and domain lookup', () => {
    assert.equal(normalizeHostname('https://www.BloodHyundai.com.au/special-offers'), 'www.bloodhyundai.com.au');
    assert.equal(normalizeHostname('salehyundai.com.au:443'), 'salehyundai.com.au');
  });

  it('maps Blood and Sale production hosts to separate tenants', () => {
    assert.equal(resolveTenantFromHostname('bloodhyundai.com.au').slug, 'bloods-hyundai');
    assert.equal(resolveTenantFromHostname('www.salehyundai.com.au').slug, 'sale-hyundai');
  });

  it('preserves the Blood slug alias during migration', () => {
    assert.deepEqual(resolveDealerSlugAliases('blood-hyundai'), ['bloods-hyundai', 'blood-hyundai']);
  });
});
