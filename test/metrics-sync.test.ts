import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { credentialErrorsForIntegrations, resolveSyncWindow, syncPlatforms } from '../server/utils/metrics/sync.ts';

describe('resolveSyncWindow', () => {
  it('backfills 30 days when no rows exist', () => {
    assert.deepEqual(resolveSyncWindow(null, '2026-07-09'), { from: '2026-06-10', to: '2026-07-09' });
  });
  it('re-fetches trailing 3 days when rows exist', () => {
    assert.deepEqual(resolveSyncWindow('2026-07-08', '2026-07-09'), { from: '2026-07-07', to: '2026-07-09' });
  });
  it('heals gaps longer than 3 days by resuming from the day after the latest row', () => {
    assert.deepEqual(resolveSyncWindow('2026-07-01', '2026-07-09'), { from: '2026-07-02', to: '2026-07-09' });
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

describe('credentialErrorsForIntegrations', () => {
  it('reports configured providers whose runtime credentials are unavailable', () => {
    const results = credentialErrorsForIntegrations({
      ga4PropertyId: 'properties/123',
      metaAdAccountId: 'act_123',
      googleAdsCustomerId: '456',
    }, {});

    assert.deepEqual(results.map(result => [result.platform, result.status]), [
      ['ga4', 'error'],
      ['meta_ads', 'error'],
      ['google_ads', 'error'],
    ]);
    assert.match(results[1]?.error || '', /META_SYSTEM_USER_TOKEN/);
  });

  it('returns no credential errors when configured providers can authenticate', () => {
    assert.deepEqual(credentialErrorsForIntegrations({
      ga4PropertyId: 'properties/123',
      metaAdAccountId: 'act_123',
      googleAdsCustomerId: '456',
    }, {
      GA4_SERVICE_ACCOUNT_KEY: 'configured',
      META_SYSTEM_USER_TOKEN: 'configured',
      GOOGLE_ADS_DEVELOPER_TOKEN: 'configured',
      GOOGLE_ADS_CLIENT_ID: 'configured',
      GOOGLE_ADS_CLIENT_SECRET: 'configured',
      GOOGLE_ADS_REFRESH_TOKEN: 'configured',
    }), []);
  });
});
