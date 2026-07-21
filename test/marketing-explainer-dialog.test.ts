import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dialogSource = readFileSync(
  resolve(__dirname, '../app/components/admin/marketing/ExplainerDialog.vue'),
  'utf8',
);
const contentSource = readFileSync(
  resolve(__dirname, '../app/components/admin/marketing/explainerContent.ts'),
  'utf8',
);

describe('marketing report explainer dialog', () => {
  it('keeps the UTM coverage heading inside the dialog when focusing its section', () => {
    assert.match(contentSource, /title:\s*'UTM coverage'/);
    assert.doesNotMatch(dialogSource, /class="-mx-3/);
    assert.match(dialogSource, /scroll-mt-6/);
    assert.match(
      dialogSource,
      /scrollIntoView\(\{\s*block:\s*'center',\s*inline:\s*'nearest'\s*\}\)/,
    );
  });
});
