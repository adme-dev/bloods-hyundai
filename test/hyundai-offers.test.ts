import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { extractHeroBanner } from '../server/utils/hyundaiOffers.ts';

describe('extractHeroBanner', () => {
  it('uses the current desktop offers preload before older fallback banners', () => {
    const html = `
      <link rel="preload" as="image" href="/content/dam/hyundai/au/en/offers-images/2026/q3-104529-GameOn-767x975-mobile.jpg" media="(max-width: 767px)" fetchpriority="high"/>
      <link rel="preload" as="image" href="/content/dam/hyundai/au/en/offers-images/2026/q3-104529-GameOn-1920x720-desktop.jpg" media="(min-width: 768px)" fetchpriority="high"/>
      <img src="/content/dam/hyundai/au/en/offers-images/2025/2026-retail-offers/104249_DAC_Q1_2026_Web_banners_V1_1920x720.png"/>
    `;

    assert.equal(
      extractHeroBanner(html),
      'https://www.hyundai.com/content/dam/hyundai/au/en/offers-images/2026/q3-104529-GameOn-1920x720-desktop.jpg'
    );
  });
});
