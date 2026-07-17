import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const componentSource = readFileSync(
  resolve(__dirname, '../app/components/page-elements/FrontSlider.vue'),
  'utf8'
);

describe('FrontSlider component', () => {
  it('overlays pagination on the banner so the quick-actions toolbar sits flush below it', () => {
    const paginationStyles = componentSource.match(/\.hero-pagination\s*\{([^}]*)\}/)?.[1];

    assert.ok(paginationStyles, 'expected hero pagination styles');
    assert.match(paginationStyles, /position:\s*absolute;/);
    assert.match(paginationStyles, /inset-inline:\s*0;/);
    assert.match(paginationStyles, /bottom:\s*12px;/);
    assert.match(paginationStyles, /margin-top:\s*0;/);
  });

  it('wires accessible previous and next controls to the carousel', () => {
    assert.match(componentSource, /aria-label="Previous slide"/);
    assert.match(componentSource, /aria-label="Next slide"/);
    assert.match(componentSource, /@click\.stop="scrollPrevious"/);
    assert.match(componentSource, /@click\.stop="scrollNext"/);
    assert.match(componentSource, /const scrollPrevious = \(\) => \{\s*emblaApi\?\.scrollPrev\(\);/);
    assert.match(componentSource, /const scrollNext = \(\) => \{\s*emblaApi\?\.scrollNext\(\);/);
  });

  it('reveals Hyundai-style navigation controls on hover and keyboard focus', () => {
    assert.match(componentSource, /\.hero-slider:hover \.hero-nav-button/);
    assert.match(componentSource, /\.hero-nav-button:focus-visible/);
    assert.match(componentSource, /background:\s*rgba\(0, 44, 95,/);
    assert.match(componentSource, /@media \(hover: none\), \(pointer: coarse\)/);
  });
});
