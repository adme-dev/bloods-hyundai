import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveLiveTestEmailOverride } from '../server/utils/liveTestEmail.ts';

describe('resolveLiveTestEmailOverride', () => {
  it('does not override delivery when no live-test secret header is provided', () => {
    const result = resolveLiveTestEmailOverride({
      configuredSecret: 'secret',
      configuredRecipient: 'paul@adme.net.au',
    });

    assert.deepEqual(result, { ok: true, override: null });
  });

  it('rejects a provided secret when the override is not configured', () => {
    const result = resolveLiveTestEmailOverride({
      configuredSecret: '',
      configuredRecipient: 'paul@adme.net.au',
      providedSecret: 'secret',
    });

    assert.equal(result.ok, false);
  });

  it('rejects an invalid live-test secret', () => {
    const result = resolveLiveTestEmailOverride({
      configuredSecret: 'correct-secret',
      configuredRecipient: 'paul@adme.net.au',
      providedSecret: 'wrong-secret',
    });

    assert.equal(result.ok, false);
  });

  it('returns a normalized override recipient for a valid secret', () => {
    const result = resolveLiveTestEmailOverride({
      configuredSecret: 'correct-secret',
      configuredRecipient: ' Paul@ADME.NET.AU ',
      providedSecret: 'correct-secret',
      requestedAt: '2026-07-10T01:00:00.000Z',
    });

    assert.deepEqual(result, {
      ok: true,
      override: {
        recipient: 'paul@adme.net.au',
        requestedAt: '2026-07-10T01:00:00.000Z',
      },
    });
  });
});
