import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const endpointSource = readFileSync(resolve(__dirname, '../server/api/admin/analytics/marketing-report.get.ts'), 'utf8');
const pageSource = readFileSync(resolve(__dirname, '../app/pages/admin/marketing-report.vue'), 'utf8');

describe('Marketing report GA4 fallback', () => {
  it('preserves stored GA4 trend data when live breakdown credentials are unavailable', () => {
    assert.match(endpointSource, /hasStoredGa4Data[\s\S]*?'stored_data'/);
    assert.match(pageSource, /status === 'stored_data'/);
    assert.match(pageSource, /GA4 synced data/);
  });

  it('does not present stored-only data as a live GA4 breakdown connection', () => {
    assert.match(pageSource, /Live landing-page, channel and event breakdowns require the GA4 reporting credential/);
  });

  it('uses production-synced GA4 breakdowns when localhost has no reporting credential', () => {
    assert.match(endpointSource, /aggregateStoredGa4Breakdowns/);
    assert.match(pageSource, /acquisition breakdowns are available from the production sync cache/);
  });

  it('reads the GA4 user metric by the name returned from the endpoint', () => {
    assert.match(pageSource, /metric\(row, 'totalUsers'\)/);
    assert.doesNotMatch(pageSource, /metric\(row, 'activeUsers'\)/);
  });

  it('distinguishes stored platform data from live provider credentials', () => {
    assert.match(endpointSource, /dataStatus:\s*platformStatuses/);
    assert.match(endpointSource, /meta_ads:\s*platformDataStatus\('meta_ads'/);
    assert.match(endpointSource, /google_ads:\s*platformDataStatus\('google_ads'/);
    assert.match(pageSource, /dataStatus\.meta_ads/);
    assert.match(pageSource, /dataStatus\.google_ads/);
  });
});
