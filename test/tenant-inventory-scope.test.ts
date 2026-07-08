import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTenantSellerIds } from '../server/utils/tenant-inventory-scope';

describe('tenant inventory scope', () => {
  it('resolves seller IDs from tenant settings before local fallbacks', () => {
    const sellerIds = resolveTenantSellerIds('bloods-hyundai', {
      inventory: {
        primarySellerIds: ['tenant-primary'],
        groupSellerIds: ['tenant-group'],
        secondarySellerIds: ['tenant-secondary'],
      },
    });

    assert.deepEqual(sellerIds, ['tenant-primary', 'tenant-group', 'tenant-secondary']);
  });

  it('keeps Blood fallback seller IDs while tenant settings are not configured', () => {
    const sellerIds = resolveTenantSellerIds('bloods-hyundai', {});

    assert.deepEqual(sellerIds, [
      '49b41e33-6e72-b64d-43a2-7897e61c1bf0',
      '646680a2-406b-2430-bde8-761a48e4a2ed',
      '41bba4aa-6460-dbd6-30f7-7f31dfa5ef61',
    ]);
  });
});
