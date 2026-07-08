import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getCalculatorSlug,
  getVehicleSearchModelSlug,
  stripModelYearPrefix,
} from '../app/utils/index.ts';

describe('Hyundai model slug helpers', () => {
  it('strips leading model years from route slugs', () => {
    assert.equal(stripModelYearPrefix('2025-palisade'), 'palisade');
    assert.equal(stripModelYearPrefix('2026 santa-fe'), 'santa-fe');
  });

  it('keeps year-prefixed calculator links pointed at the real model', () => {
    assert.equal(getCalculatorSlug('2025-palisade'), 'palisade');
    assert.equal(getCalculatorSlug('2026-kona-hybrid'), 'kona');
    assert.equal(getCalculatorSlug('ioniq-5-electric'), 'ioniq-5');
  });

  it('extracts the stock search model from year-prefixed vehicle pages', () => {
    assert.equal(getVehicleSearchModelSlug('2025-palisade'), 'palisade');
    assert.equal(getVehicleSearchModelSlug('2026-santa-fe-hybrid'), 'santa-fe');
    assert.equal(getVehicleSearchModelSlug('tucson-n-line'), 'tucson');
  });
});
