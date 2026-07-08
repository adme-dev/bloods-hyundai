import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toContextUser } from '../server/utils/authContext.ts';

describe('toContextUser', () => {
  it('aliases userId to id and preserves the payload', () => {
    const u = toContextUser({
      userId: 'u-1', dealerId: 'd-1', email: 'a@b.com',
      role: 'sales', firstName: 'A', lastName: 'B',
    });
    assert.equal(u.id, 'u-1');
    assert.equal(u.userId, 'u-1');
    assert.equal(u.dealerId, 'd-1');
    assert.equal(u.role, 'sales');
  });
});
