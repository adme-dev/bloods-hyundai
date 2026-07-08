import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildHyundaiCalculatorUrl,
  getCalculatorRouteResolution,
  getSafeCalculatorErrorPayload,
  isHyundaiCalculatorTenant,
  normalizeModelSlug,
} from '../server/utils/hyundaiCalculator.ts';

describe('Hyundai calculator helpers', () => {
  it('normalizes year-prefixed model slugs before resolving calculator models', () => {
    assert.equal(normalizeModelSlug('2025-palisade'), 'palisade');
    assert.equal(normalizeModelSlug('2026 IONIQ 5'), 'ioniq 5');
  });

  it('keeps Hyundai-specific calculator aliases pointed at valid OEM model names', () => {
    assert.deepEqual(getCalculatorRouteResolution('2025-palisade'), {
      apiModelName: 'palisade',
      fallbackModelNames: [],
    });
    assert.deepEqual(getCalculatorRouteResolution('ioniq-6-n'), {
      apiModelName: 'ioniq-6',
      fallbackModelNames: [],
    });
    assert.deepEqual(getCalculatorRouteResolution('i30-sedan-hybrid'), {
      apiModelName: 'i30',
      preferredPowertrain: 'Hybrid',
      preferredVariantGroupName: 'i30 Sedan Hybrid',
      fallbackModelNames: [],
    });
  });

  it('builds calculator URLs through the Hyundai OEM adapter boundary', () => {
    assert.equal(
      buildHyundaiCalculatorUrl({
        modelName: 'ioniq-5',
        postcode: '3000',
        displayPowertrain: 'true',
      }),
      'https://www.hyundai.com/content/api/au/hyundai/v3/carpricecalculator?postcode=3000&modelname=ioniq-5&displaypowertrain=true'
    );
  });

  it('keeps calculator access Hyundai-tenant only', () => {
    assert.equal(isHyundaiCalculatorTenant({ oem: 'hyundai' }), true);
    assert.equal(isHyundaiCalculatorTenant({ oem: 'toyota' }), false);
    assert.equal(isHyundaiCalculatorTenant(null), false);
  });

  it('returns a safe public error payload for upstream calculator failures', () => {
    assert.deepEqual(getSafeCalculatorErrorPayload(404), {
      statusCode: 404,
      message: 'Calculator data is not available for this model right now.',
    });
    assert.deepEqual(getSafeCalculatorErrorPayload(500), {
      statusCode: 502,
      message: 'Calculator data is temporarily unavailable. Please try again later.',
    });
  });
});
