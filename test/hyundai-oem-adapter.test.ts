import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { HYUNDAI_AU_OEM_ADAPTER } from '../server/utils/hyundaiOemAdapter.ts';

describe('Hyundai AU OEM adapter', () => {
  it('builds stable OEM endpoint URLs', () => {
    assert.equal(
      HYUNDAI_AU_OEM_ADAPTER.endpoints.models(),
      'https://www.hyundai.com/content/api/au/hyundai/v3/carpricecalculator/models'
    );

    assert.equal(
      HYUNDAI_AU_OEM_ADAPTER.endpoints.carCalculator({
        modelName: 'IONIQ 5',
        postcode: '3000',
        displayPowertrain: true,
      }),
      'https://www.hyundai.com/content/api/au/hyundai/v3/carpricecalculator?postcode=3000&modelname=IONIQ+5&displaypowertrain=true'
    );
  });

  it('exposes normalized model summaries through the model adapter boundary', () => {
    const result = HYUNDAI_AU_OEM_ADAPTER.models.toModelSummaries({
      success: true,
      variants: [
        {
          id: 'model-1',
          name: 'TUCSON',
          slug: 'tucson',
          category: 'SUVs and People Movers',
          image: 'https://example.com/tucson.png',
        },
      ],
    });

    assert.equal(result.success, true);
    assert.equal(result.models[0].name, 'TUCSON');
    assert.equal(result.models[0].vehiclecat, 'SUVs and People Movers');
  });

  it('exposes offer hero extraction through the offers adapter boundary', () => {
    const banners = HYUNDAI_AU_OEM_ADAPTER.offers.extractHeroBanners(`
      <link rel="preload" href="/content/dam/hyundai/au/en/offers-images/2026/q3-104529-GameOn-767x975-mobile.jpg"/>
      <link rel="preload" href="/content/dam/hyundai/au/en/offers-images/2026/q3-104529-GameOn-1920x720-desktop.jpg"/>
    `);

    assert.equal(
      banners.desktop,
      'https://www.hyundai.com/content/dam/hyundai/au/en/offers-images/2026/q3-104529-GameOn-1920x720-desktop.jpg'
    );
    assert.equal(
      banners.mobile,
      'https://www.hyundai.com/content/dam/hyundai/au/en/offers-images/2026/q3-104529-GameOn-767x975-mobile.jpg'
    );
  });
});
