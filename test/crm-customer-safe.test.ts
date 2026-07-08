import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pickSafeCustomer, redactActivityValue } from '../server/utils/customerSafe.ts';

const SECRET = {
  id: 'c1', firstName: 'A', email: 'a@b.com',
  passwordHash: 'HASH', resetToken: 'RT', resetTokenExpiry: 'X', verificationToken: 'VT',
};

describe('customerSafe', () => {
  it('pickSafeCustomer strips all sensitive columns', () => {
    const s = pickSafeCustomer(SECRET) as Record<string, unknown>;
    assert.equal(s.firstName, 'A');
    for (const k of ['passwordHash', 'resetToken', 'resetTokenExpiry', 'verificationToken']) {
      assert.equal(k in s, false);
    }
  });

  it('pickSafeCustomer passes through null/undefined', () => {
    assert.equal(pickSafeCustomer(null), null);
    assert.equal(pickSafeCustomer(undefined), undefined);
  });

  it('redactActivityValue strips secrets from a jsonb object and passes through non-objects', () => {
    const r = redactActivityValue(SECRET) as Record<string, unknown>;
    assert.equal('passwordHash' in r, false);
    assert.equal(r.firstName, 'A');
    assert.equal(redactActivityValue(null), null);
    assert.equal(redactActivityValue('note'), 'note');
  });
});
