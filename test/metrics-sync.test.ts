import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveSyncWindow, syncPlatforms } from '../server/utils/metrics/sync.ts';

describe('resolveSyncWindow', () => {
  it('backfills 30 days when no rows exist', () => {
    assert.deepEqual(resolveSyncWindow(null, '2026-07-09'), { from: '2026-06-10', to: '2026-07-09' });
  });
  it('re-fetches trailing 3 days when rows exist', () => {
    assert.deepEqual(resolveSyncWindow('2026-07-08', '2026-07-09'), { from: '2026-07-07', to: '2026-07-09' });
  });
});

describe('syncPlatforms isolation', () => {
  it('one failing platform does not block the others', async () => {
    const calls: string[] = [];
    const results = await syncPlatforms([
      { platform: 'ga4', fetch: async () => { calls.push('ga4'); return []; } },
      { platform: 'meta_ads', fetch: async () => { throw new Error('token expired'); } },
      { platform: 'google_ads', fetch: async () => { calls.push('google_ads'); return []; } },
    ], async () => 0);
    assert.deepEqual(calls, ['ga4', 'google_ads']);
    assert.equal(results.find(r => r.platform === 'meta_ads')?.status, 'error');
    assert.match(results.find(r => r.platform === 'meta_ads')?.error || '', /token expired/);
    assert.equal(results.find(r => r.platform === 'ga4')?.status, 'success');
  });
});
