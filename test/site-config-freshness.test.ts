import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  SITE_CONFIG_CACHE_TTL_MS,
  invalidateSiteConfigCache,
  isSiteConfigFresh,
  markSiteConfigFetched,
} from '../app/utils/siteConfigFreshness';

const KEY = 'site-config-data:v3::bloodhyundai.com.au';
const payload = { config: {} };

describe('site config client freshness', () => {
  it('uses the SSR payload on first paint', () => {
    invalidateSiteConfigCache();
    assert.equal(isSiteConfigFresh('first-paint-key', payload), true);
  });

  it('reuses a recently fetched payload so navigation stays snappy', () => {
    markSiteConfigFetched(KEY);
    assert.equal(isSiteConfigFresh(KEY, payload), true);
  });

  it('never treats a missing payload as fresh', () => {
    markSiteConfigFetched(KEY);
    assert.equal(isSiteConfigFresh(KEY, null), false);
    assert.equal(isSiteConfigFresh(KEY, undefined), false);
  });

  // The publish path: a dealer saves slides and expects them live at once.
  it('forces a refetch immediately after an admin publish', () => {
    markSiteConfigFetched(KEY);
    assert.equal(isSiteConfigFresh(KEY, payload), true, 'precondition: cached');

    invalidateSiteConfigCache();
    assert.equal(isSiteConfigFresh(KEY, payload), false, 'publish must invalidate');

    markSiteConfigFetched(KEY);
    assert.equal(isSiteConfigFresh(KEY, payload), true, 'fresh again after refetch');
  });

  // Clearing alone would read as "never fetched", which the SSR rule treats as
  // fresh — the publish would silently not take effect.
  it('does not let invalidation be mistaken for a first paint', () => {
    markSiteConfigFetched(KEY);
    invalidateSiteConfigCache();
    assert.equal(isSiteConfigFresh(KEY, payload), false);
  });

  it('keeps the reuse window short enough to feel immediate', () => {
    assert.ok(SITE_CONFIG_CACHE_TTL_MS <= 60_000);
  });
});

describe('site config cache wiring', () => {
  it('gates the app payload on freshness rather than reusing it forever', () => {
    const app = readFileSync('app/app.vue', 'utf8');
    assert.match(app, /isSiteConfigFresh\(key, cached\) \? cached : undefined/);
    assert.match(app, /markSiteConfigFetched\(siteConfigCacheKey\)/);
  });

  it('publishes slides without waiting for the TTL', () => {
    const page = readFileSync('app/pages/admin/settings/homepage-slider.vue', 'utf8');
    assert.match(page, /invalidateSiteConfigCache\(\)/);
    assert.match(page, /await refreshDealerConfig\(\)/);
  });
});
