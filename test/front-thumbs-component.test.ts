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

  it('keeps mobile thumbs stacked before enabling the carousel at tablet width', () => {
    assert.match(componentSource, /active:\s*false,/);
    assert.match(componentSource, /'\(min-width:\s*640px\)':\s*\{\s*active:\s*true,\s*slidesToScroll:\s*2\s*\}/);
    assert.match(componentSource, /\.thumbs-container\s*\{[\s\S]*?flex-direction:\s*column;/);
    assert.match(componentSource, /@media\s*\(min-width:\s*640px\)\s*\{[\s\S]*?\.thumbs-container\s*\{[\s\S]*?flex-direction:\s*row;/);
  });
});
