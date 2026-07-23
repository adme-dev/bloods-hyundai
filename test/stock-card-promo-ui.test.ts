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
    assert.match(page(), /class="space-y-2">\s*<Label :for="`banner-text-\$\{index\}`">/);
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

  // Raw URL inputs were removed deliberately (2026-07-23): dealers pick images
  // from the media library only, so the allowed-host validation can't be fought.
  it('sources images from the media library, with no raw URL fallback', () => {
    assert.doesNotMatch(page(), /paste an image URL/);
    assert.match(page(), /MediaLibraryDialog/);
    assert.match(page(), /Choose from media library/);
  });

  it('renders live card previews for offers and groups', () => {
    assert.match(page(), /offerPreviews\[index\]/);
    assert.match(page(), /groupPreviews\[index\]/);
    assert.match(page(), /<ModernVehicleCard\b[^>]*promo-preview/);
    assert.match(page(), /<BannerMarqueePreview\b/);
  });

  it('is linked from the settings hub and never renders raw HTML', () => {
    const settingsIndex = readFileSync('app/pages/admin/settings/index.vue', 'utf8');
    assert.match(settingsIndex, /\/admin\/settings\/stock-card-promo/);
    assert.doesNotMatch(page(), /v-html/);
  });
});
