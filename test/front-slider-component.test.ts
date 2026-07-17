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
});
