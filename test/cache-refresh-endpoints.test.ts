import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  getNitroFunctionCacheStorageKey,
  invalidateNitroFunctionCache,
} from '../server/utils/cache-refresh';

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('cache refresh storage keys', () => {
  it('matches Nitro function cache storage keys', () => {
    assert.equal(
      getNitroFunctionCacheStorageKey('site-config', 'site-config-data:v3:bloodhyundai.com.au'),
      'nitro:functions:site-config:site-config-data:v3:bloodhyundai.com.au.json',
    );
  });

  it('removes the tenant entry used by normal cached reads', async () => {
    const removed: string[] = [];
    await invalidateNitroFunctionCache(
      {
        removeItem: async (key: string) => {
          removed.push(key);
        },
      },
      'carsales-feed',
      'carsales-feed-data:bloodhyundai.com.au',
    );

    assert.deepEqual(removed, [
      'nitro:functions:carsales-feed:carsales-feed-data:bloodhyundai.com.au.json',
    ]);
  });
});

describe('refresh endpoint wiring', () => {
  const cases = [
    ['server/api/site-config.ts', 'site-config'],
    ['server/api/carsales-feed.ts', 'carsales-feed'],
    ['server/api/page/[slug].ts', 'page-content'],
  ] as const;

  for (const [path, cacheName] of cases) {
    it(`${path} invalidates, rebuilds, and keeps the HTTP response out of a second cache`, () => {
      const contents = source(path);
      assert.match(contents, /(?:query|getQuery\(event\))\.refresh\s*===\s*['"]true['"]/);
      assert.match(contents, new RegExp(`invalidateNitroFunctionCache\\([\\s\\S]*['"]${cacheName}['"]`));
      assert.match(contents, /setResponseHeader\(event,\s*['"]Cache-Control['"],\s*['"]no-store['"]\)/);
    });
  }

  it('page refresh replaces its normal cached entry instead of bypassing it once', () => {
    const contents = source('server/api/page/[slug].ts');
    assert.match(contents, /defineCachedFunction/);
    assert.doesNotMatch(contents, /defineCachedEventHandler/);
    assert.doesNotMatch(contents, /shouldBypassCache/);
  });

  it('does not add a second route-rule cache around the refreshable handlers', () => {
    const contents = source('nuxt.config.ts');
    assert.doesNotMatch(contents, /['"]\/api\/site-config['"]\s*:\s*\{\s*swr/);
    assert.doesNotMatch(contents, /['"]\/api\/carsales-feed['"]\s*:\s*\{\s*swr/);
    assert.doesNotMatch(contents, /['"]\/api\/page\/\*\*['"]\s*:\s*\{\s*swr/);
  });
});
