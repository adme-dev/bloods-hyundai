import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getConfiguredFrontSlides,
  getFrontSlideDurationMs,
  resolveHomeSlides,
  shouldFetchOffersHero,
} from '../app/utils/frontSlides.ts';

describe('front slide resolution', () => {
  it('reads slides from the site promotional config prop and filters by date', () => {
    const slides = [
      {
        desktop: 'https://example.com/expired.jpg',
        start: '01-05-2026',
        end: '31-05-2026',
      },
      {
        desktop: 'https://example.com/active.jpg',
        start: '01-06-2026',
        end: '31-07-2026',
      },
    ];

    assert.equal(getConfiguredFrontSlides([{ slides }]).length, 2);
    assert.deepEqual(
      resolveHomeSlides([{ slides }], {
        siteName: 'Blood Hyundai',
        now: new Date(2026, 6, 3),
      }).map((slide) => slide.desktop),
      ['https://example.com/active.jpg']
    );
  });

  it('maps per-slide timing to milliseconds with a backward-compatible default', () => {
    const slides = getConfiguredFrontSlides([{ slides: [
      { desktop: 'https://example.com/default.jpg' },
      { desktop: 'https://example.com/custom.jpg', duration_seconds: 7.5 },
    ] }]);

    assert.equal(getFrontSlideDurationMs(slides[0]), 3500);
    assert.equal(getFrontSlideDurationMs(slides[1]), 7500);
    assert.equal(getFrontSlideDurationMs({ duration_seconds: 90 }), 3500);
  });

  it('falls back to the fresh offers hero for Blood Hyundai when all configured slides are expired', () => {
    const slides = [
      {
        desktop: 'https://example.com/eofy.jpg',
        start: '01-06-2026',
        end: '30-06-2026',
      },
    ];

    assert.equal(shouldFetchOffersHero([{ slides }], 'Blood Hyundai', new Date(2026, 6, 3)), true);

    const resolved = resolveHomeSlides([{ slides }], {
      siteName: 'Blood Hyundai',
      now: new Date(2026, 6, 3),
      offersHero: {
        desktop: 'https://www.hyundai.com/current-desktop.jpg',
        mobile: 'https://www.hyundai.com/current-mobile.jpg',
      },
    });

    assert.equal(resolved.length, 1);
    assert.equal(resolved[0].desktop, 'https://www.hyundai.com/current-desktop.jpg');
    assert.equal(resolved[0].mobile, 'https://www.hyundai.com/current-mobile.jpg');
    assert.equal(resolved[0].link, '/special-offers');
  });

  it('keeps the homepage slider empty when dashboard management publishes no slides', () => {
    const promotional = [{
      homepageSliderManaged: true,
      slides: [],
      footerblocks: [{
        slides: 'https://example.com/footer-content.jpg',
        start_date: '01-01-2026',
        end_date: '31-12-2026',
      }],
    }];

    assert.equal(shouldFetchOffersHero(promotional, 'Blood Hyundai', new Date(2026, 6, 21)), false);
    assert.deepEqual(resolveHomeSlides(promotional, {
      siteName: 'Blood Hyundai',
      now: new Date(2026, 6, 21),
      offersHero: { desktop: 'https://www.hyundai.com/current-desktop.jpg' },
    }), []);
  });

  it('does not add the Blood Hyundai offers fallback for other sites', () => {
    const slides = [
      {
        desktop: 'https://example.com/expired.jpg',
        start: '01-06-2026',
        end: '30-06-2026',
      },
    ];

    assert.deepEqual(
      resolveHomeSlides([{ slides }], {
        siteName: 'Sale Hyundai',
        now: new Date(2026, 6, 3),
        offersHero: { desktop: 'https://www.hyundai.com/current-desktop.jpg' },
      }),
      []
    );
  });

  it('treats date-only end dates as active until the end of that day', () => {
    const slides = [
      {
        desktop: 'https://example.com/expires-tonight.jpg',
        start: '01-06-2026',
        end: '01-07-2026',
      },
    ];

    assert.equal(
      resolveHomeSlides([{ slides }], {
        siteName: 'Blood Hyundai',
        now: new Date(2026, 6, 1, 23, 30),
      }).length,
      1
    );
  });

  it('does not include footerbanner content in homepage hero slides', () => {
    const promotional = [{
      footerbanner: [
        {
          image: 'https://cdn.example.com/office-slide.jpg',
          title: 'Test Drive',
          content: 'Book today',
          button: 'Book Now',
          link: '/test-drive',
        },
      ],
    }];

    const slides = getConfiguredFrontSlides(promotional);

    assert.deepEqual(slides, []);
  });

  it('reads footer block date range fields as start_date/end_date', () => {
    const promotional = [{
      footerblocks: [
        {
          slides: 'https://cdn.example.com/block-slide.jpg',
          start_date: '01-01-2026',
          end_date: '31-12-2050',
        },
      ],
    }];

    const slides = getConfiguredFrontSlides(promotional);
    const active = resolveHomeSlides(promotional, {
      siteName: 'Blood Hyundai',
      now: new Date(2026, 0, 15),
    });

    assert.equal(slides.length, 1);
    assert.equal(active.length, 1);
  });
});
