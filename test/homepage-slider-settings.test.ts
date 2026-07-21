import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  applyHomepageSliderOverride,
  parseHomepageSliderInput,
  readHomepageSliderSettings,
} from '../shared/homepageSlider.ts';

const allowedImageHosts = new Set([
  'assets.bloodhyundai.com.au',
  'driveagentmedia.b-cdn.net',
]);

const validSlide = {
  id: 'hero-finance',
  enabled: true,
  desktop: 'https://assets.bloodhyundai.com.au/blood-hyundai/images/desktop.webp',
  tablet: 'https://assets.bloodhyundai.com.au/blood-hyundai/images/mobile.webp',
  mobile: 'https://assets.bloodhyundai.com.au/blood-hyundai/images/mobile.webp',
  contrast: 'uk-light',
  postion: 'uk-position-cover',
  heading_content: '2.99% finance offer',
  sub_heading: 'Available for a limited time.',
  link: '/special-offers',
  button_text: 'View offer',
  button_colour: 'uk-light',
  duration_seconds: 6,
  start: '2026-07-20',
  end: '2026-08-31',
};

describe('homepage slider settings contract', () => {
  it('accepts and normalizes the existing promotional slide schema', () => {
    const result = parseHomepageSliderInput({
      enabled: true,
      slides: [validSlide],
    }, { allowedImageHosts });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.version, 1);
    assert.equal(result.value.slides[0]?.desktop, validSlide.desktop);
    assert.equal(result.value.slides[0]?.mobile, validSlide.mobile);
    assert.equal(result.value.slides[0]?.duration_seconds, 6);
    assert.equal(result.value.slides[0]?.start, '20-07-2026');
    assert.equal(result.value.slides[0]?.end, '31-08-2026');
  });

  it('defaults legacy slides to 3.5 seconds and rejects unsafe transition timing', () => {
    const legacyResult = parseHomepageSliderInput({
      enabled: true,
      slides: [{ ...validSlide, duration_seconds: undefined }],
    }, { allowedImageHosts });

    assert.equal(legacyResult.ok, true);
    if (legacyResult.ok) {
      assert.equal(legacyResult.value.slides[0]?.duration_seconds, 3.5);
    }

    for (const duration_seconds of [1.5, 30.5, Number.NaN, 'fast']) {
      const invalidResult = parseHomepageSliderInput({
        enabled: true,
        slides: [{ ...validSlide, duration_seconds }],
      }, { allowedImageHosts });

      assert.equal(invalidResult.ok, false);
      if (!invalidResult.ok) {
        assert.match(invalidResult.errors.join(' '), /duration must be between 2 and 30 seconds/i);
      }
    }
  });

  it('rejects unsafe image hosts, links, markup, invalid ranges, and excess slides', () => {
    const result = parseHomepageSliderInput({
      enabled: true,
      slides: Array.from({ length: 13 }, (_, index) => ({
        ...validSlide,
        id: `slide-${index}`,
        desktop: index === 0 ? 'http://127.0.0.1/private.png' : validSlide.desktop,
        heading_content: index === 1 ? '<img src=x onerror=alert(1)>' : validSlide.heading_content,
        link: index === 2 ? 'javascript:alert(1)' : validSlide.link,
        start: index === 3 ? '2026-09-01' : validSlide.start,
        end: index === 3 ? '2026-08-01' : validSlide.end,
      })),
    }, { allowedImageHosts });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.errors.join(' '), /maximum of 12 slides/i);
    assert.match(result.errors.join(' '), /approved media host/i);
    assert.match(result.errors.join(' '), /plain text/i);
    assert.match(result.errors.join(' '), /safe internal path or HTTPS URL/i);
    assert.match(result.errors.join(' '), /start date must not be after/i);
  });

  it('allows custom management to publish an intentionally empty slider', () => {
    const result = parseHomepageSliderInput({
      enabled: true,
      slides: [],
    }, { allowedImageHosts });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.enabled, true);
    assert.deepEqual(result.value.slides, []);
  });

  it('keeps dashboard management enabled for new and legacy settings', () => {
    const parsed = parseHomepageSliderInput({
      enabled: false,
      slides: [validSlide],
    }, { allowedImageHosts });

    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.equal(parsed.value.enabled, true);

    const stored = readHomepageSliderSettings({
      homepageSlider: {
        version: 1,
        enabled: false,
        updatedAt: '2026-07-21T01:00:00.000Z',
        slides: [validSlide],
      },
    });

    assert.equal(stored?.enabled, true);
  });

  it('replaces only hero slides while preserving upstream thumbs and footer content', () => {
    const settings = readHomepageSliderSettings({
      homepageSlider: {
        version: 1,
        enabled: true,
        updatedAt: '2026-07-21T01:00:00.000Z',
        slides: [validSlide, { ...validSlide, id: 'disabled', enabled: false }],
      },
    });

    const result = applyHomepageSliderOverride({
      name: 'Blood Hyundai',
      promotional: [{
        slides: [{ desktop: 'https://driveagentmedia.b-cdn.net/old.jpg' }],
        thumbs: [{ image: 'https://driveagentmedia.b-cdn.net/thumb.jpg' }],
        footerblocks: [{ slides: 'https://driveagentmedia.b-cdn.net/footer.jpg' }],
      }],
    }, settings);

    const promotional = result.promotional as Array<Record<string, unknown>>;
    assert.equal((promotional[0]?.slides as unknown[]).length, 1);
    assert.equal(promotional[0]?.homepageSliderManaged, true);
    assert.deepEqual(promotional[0]?.thumbs, [{ image: 'https://driveagentmedia.b-cdn.net/thumb.jpg' }]);
    assert.deepEqual(promotional[0]?.footerblocks, [{ slides: 'https://driveagentmedia.b-cdn.net/footer.jpg' }]);
  });

  it('uses dashboard slides even when legacy stored settings were disabled', () => {
    const original = {
      promotional: [{ slides: [{ desktop: 'https://driveagentmedia.b-cdn.net/original.jpg' }] }],
    };
    const settings = readHomepageSliderSettings({
      homepageSlider: {
        version: 1,
        enabled: false,
        updatedAt: '2026-07-21T01:00:00.000Z',
        slides: [validSlide],
      },
    });
    const result = applyHomepageSliderOverride(original, settings);

    const promotional = result.promotional as Array<Record<string, unknown>>;
    assert.equal(promotional[0]?.homepageSliderManaged, true);
    assert.equal((promotional[0]?.slides as unknown[]).length, 1);
  });
});

describe('homepage slider settings API wiring', () => {
  it('protects writes and invalidates the public config cache', () => {
    const api = readFileSync('server/api/admin/settings/homepage-slider.put.ts', 'utf8');

    assert.match(api, /\['admin', 'dealer_admin', 'manager'\]/);
    assert.match(api, /parseHomepageSliderInput/);
    assert.match(api, /invalidateNitroFunctionCache/);
  });
});
