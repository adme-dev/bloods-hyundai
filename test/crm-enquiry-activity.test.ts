import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildEnquiryActivityRow } from '../server/utils/enquiryActivity.ts';

describe('buildEnquiryActivityRow', () => {
  it('always includes dealerId and normalizes optional fields to null', () => {
    const row = buildEnquiryActivityRow({
      dealerId: 'd-1', enquiryId: 'e-1', userId: null, action: 'archived',
    });
    assert.equal(row.dealerId, 'd-1');
    assert.equal(row.enquiryId, 'e-1');
    assert.equal(row.userId, null);
    assert.equal(row.entityType, null);
    assert.equal(row.oldValue, null);
    assert.equal(row.newValue, null);
  });

  it('preserves supplied optional fields', () => {
    const row = buildEnquiryActivityRow({
      dealerId: 'd-1', enquiryId: 'e-1', userId: 'u-1',
      action: 'Status changed to sold', entityType: 'status',
      oldValue: { status: 'negotiating' }, newValue: { status: 'sold' },
    });
    assert.equal(row.userId, 'u-1');
    assert.equal(row.entityType, 'status');
    assert.deepEqual(row.oldValue, { status: 'negotiating' });
    assert.deepEqual(row.newValue, { status: 'sold' });
  });
});
