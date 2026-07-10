import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeUtm, hasAttributionSignal } from '../app/composables/useUtmParams.ts';

describe('mergeUtm', () => {
  it('preserves first-touch landingPage, referrer, and firstSeenAt when a later visit has different values', () => {
    const existing = {
      utmSource: 'google',
      utmCampaign: 'brand-search',
      landingPage: 'https://bloodhyundai.com.au/?utm_source=google',
      referrer: 'https://www.google.com/',
      firstSeenAt: '2026-01-01T00:00:00.000Z',
      lastSeenAt: '2026-01-01T00:00:00.000Z',
    };
    const incoming = {
      utmSource: 'facebook',
      utmCampaign: 'july-runout',
      landingPage: 'https://bloodhyundai.com.au/offers?utm_source=facebook',
      referrer: 'https://www.facebook.com/',
      lastSeenAt: '2026-01-05T12:00:00.000Z',
    };

    const merged = mergeUtm(existing, incoming);

    assert.equal(merged.landingPage, existing.landingPage, 'existing landingPage must win (first-touch)');
    assert.equal(merged.referrer, existing.referrer, 'existing referrer must win (first-touch)');
    assert.equal(merged.firstSeenAt, existing.firstSeenAt, 'existing firstSeenAt must win (first-touch)');
  });

  it('lets incoming signal fields overwrite existing ones', () => {
    const existing = {
      utmCampaign: 'old-campaign',
      lastSeenAt: '2026-01-01T00:00:00.000Z',
    };
    const incoming = {
      utmCampaign: 'new-campaign',
      lastSeenAt: '2026-01-05T12:00:00.000Z',
    };

    const merged = mergeUtm(existing, incoming);

    assert.equal(merged.utmCampaign, incoming.utmCampaign, 'incoming signal field must win');
  });

  it('refreshes lastSeenAt to the incoming value', () => {
    const existing = {
      utmSource: 'google',
      lastSeenAt: '2026-01-01T00:00:00.000Z',
    };
    const incoming = {
      utmSource: 'google',
      lastSeenAt: '2026-01-05T12:00:00.000Z',
    };

    const merged = mergeUtm(existing, incoming);

    assert.equal(merged.lastSeenAt, incoming.lastSeenAt);
  });

  it('falls back firstSeenAt to incoming.lastSeenAt when existing has no firstSeenAt', () => {
    const existing = {};
    const incoming = {
      utmSource: 'google',
      lastSeenAt: '2026-01-05T12:00:00.000Z',
    };

    const merged = mergeUtm(existing, incoming);

    assert.equal(merged.firstSeenAt, incoming.lastSeenAt);
  });
});

describe('hasAttributionSignal', () => {
  it('is false for an empty object', () => {
    assert.equal(hasAttributionSignal({}), false);
  });

  it('is false when only non-signal fields are present', () => {
    assert.equal(hasAttributionSignal({ landingPage: 'https://bloodhyundai.com.au/' }), false);
    assert.equal(
      hasAttributionSignal({
        landingPage: 'https://bloodhyundai.com.au/',
        referrer: 'https://www.google.com/',
        lastSeenAt: '2026-01-01T00:00:00.000Z',
        firstSeenAt: '2026-01-01T00:00:00.000Z',
      }),
      false,
    );
  });

  it('is true when any single signal field is present', () => {
    assert.equal(hasAttributionSignal({ utmSource: 'google' }), true);
    assert.equal(hasAttributionSignal({ utmMedium: 'cpc' }), true);
    assert.equal(hasAttributionSignal({ utmCampaign: 'july-runout' }), true);
    assert.equal(hasAttributionSignal({ utmTerm: 'hyundai suv' }), true);
    assert.equal(hasAttributionSignal({ utmContent: 'ad-1' }), true);
    assert.equal(hasAttributionSignal({ chatSource: 'widget' }), true);
    assert.equal(hasAttributionSignal({ chatIntent: 'test-drive' }), true);
    assert.equal(hasAttributionSignal({ gclid: 'abc123' }), true);
    assert.equal(hasAttributionSignal({ gbraid: 'abc123' }), true);
    assert.equal(hasAttributionSignal({ wbraid: 'abc123' }), true);
    assert.equal(hasAttributionSignal({ fbclid: 'xyz789' }), true);
    assert.equal(hasAttributionSignal({ msclkid: 'def456' }), true);
  });
});
