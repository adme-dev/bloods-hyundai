import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('stock card promotions admin UI', () => {
  const page = () => readFileSync('app/pages/admin/settings/stock-card-promo.vue', 'utf8');

  it('uses the shared colour field instead of bare inline colour inputs', () => {
    assert.match(page(), /<AdminColorField\b/);
    assert.doesNotMatch(page(), /<input[^>]*type="color"/);

    const colorField = readFileSync('app/components/admin/settings/AdminColorField.vue', 'utf8');
    assert.match(colorField, /type="color"/);
    assert.match(colorField, /<Label :for="id">/);
  });

  it('keeps every field in a labelled stacked group so rows stay aligned', () => {
    assert.doesNotMatch(page(), /<Label[^>]*>Colour<\/Label>\s*<input/);
    assert.match(page(), /class="space-y-2">\s*<Label for="scroller-text">/);
  });

  it('lets the user pick vehicles from live stock', () => {
    assert.match(page(), /datalist id="stock-card-promo-stock-options"/);
    assert.match(page(), /api\/carsales-feed/);
    assert.match(page(), /Not found in the current stock feed/);
  });

  it('supports time-framed offers and graphics via the admin date picker', () => {
    assert.match(page(), /AdminDatePicker/);
    assert.doesNotMatch(page(), /type=["']date["']/);
  });

  it('offers a URL fallback so graphics never depend solely on the media library', () => {
    assert.match(page(), /paste an image URL/);
    assert.match(page(), /MediaLibraryDialog/);
  });

  it('is linked from the settings hub and never renders raw HTML', () => {
    const settingsIndex = readFileSync('app/pages/admin/settings/index.vue', 'utf8');
    assert.match(settingsIndex, /\/admin\/settings\/stock-card-promo/);
    assert.doesNotMatch(page(), /v-html/);
  });
});
