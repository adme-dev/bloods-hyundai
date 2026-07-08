import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isHoneypotTripped, checkRateLimit } from '../server/utils/intakeAbuse.ts';

describe('isHoneypotTripped', () => {
  it('trips when the hidden field is filled', () => {
    assert.equal(isHoneypotTripped({ website: 'http://spam' }), true);
    assert.equal(isHoneypotTripped({ _hp: 'x' }), true);
  });
  it('does not trip for legitimate submissions', () => {
    assert.equal(isHoneypotTripped({ firstName: 'A', website: '' }), false);
    assert.equal(isHoneypotTripped({ firstName: 'A' }), false);
    assert.equal(isHoneypotTripped({}), false);
  });
});

describe('checkRateLimit', () => {
  it('allows up to the limit then blocks within the window', () => {
    const key = 'test-key-1';
    const t0 = 1_000_000;
    for (let i = 0; i < 8; i++) {
      assert.equal(checkRateLimit(key, t0 + i), true, `hit ${i} should pass`);
    }
    assert.equal(checkRateLimit(key, t0 + 8), false, '9th hit should be blocked');
  });
  it('allows again after the window elapses', () => {
    const key = 'test-key-2';
    const t0 = 2_000_000;
    for (let i = 0; i < 8; i++) checkRateLimit(key, t0 + i);
    assert.equal(checkRateLimit(key, t0 + 11 * 60_000), true, 'after window should pass');
  });
});
