import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const componentSource = readFileSync(
  resolve(__dirname, '../app/components/page-elements/FrontSliderThumbs.vue'),
  'utf8'
);

describe('FrontSliderThumbs component', () => {
  it('wires Embla autoplay for the homepage thumbs carousel', () => {
    assert.match(componentSource, /import\s+Autoplay\s+from\s+'embla-carousel-autoplay';/);
    assert.match(componentSource, /Autoplay\(\{\s*delay:\s*3500,\s*stopOnInteraction:\s*false\s*\}\)/s);
  });
});
