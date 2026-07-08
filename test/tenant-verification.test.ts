import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  HYUNDAI_TENANT_VERIFICATION_TARGETS,
  loadLocalSiteConfigSummary,
  verifyHyundaiTenantTargets,
} from '../server/utils/tenant-verification.ts';

describe('Hyundai tenant verification', () => {
  it('loads separate local config fallbacks for Blood and Sale', () => {
    const blood = loadLocalSiteConfigSummary('bloods-hyundai');
    const sale = loadLocalSiteConfigSummary('sale-hyundai');

    assert.equal(blood.name, 'Blood Hyundai');
    assert.equal(sale.name, 'Sale Hyundai');
    assert.equal(blood.hasNav, true);
    assert.equal(sale.hasNav, true);
  });

  it('verifies the Blood and Sale host matrix with fallback resolver defaults', async () => {
    const previous = process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER;
    delete process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER;

    const results = await verifyHyundaiTenantTargets();

    assert.equal(results.length, HYUNDAI_TENANT_VERIFICATION_TARGETS.length);
    assert.deepEqual(results.map((result) => result.resolvedSlug), [
      'bloods-hyundai',
      'bloods-hyundai',
      'sale-hyundai',
      'sale-hyundai',
    ]);
    assert.equal(results.every((result) => result.source === 'fallback-map'), true);

    if (previous === undefined) {
      delete process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER;
    } else {
      process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER = previous;
    }
  });
});
