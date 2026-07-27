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

  // A hardcoded fuel list let a banner target "Hybrid" with no hybrids in the
  // feed, which saved cleanly and then matched zero cards on the stock page.
  it('builds fuel and condition options from live stock, not a fixed list', () => {
    const source = page();

    // Both banner and group selects, for both fields, go through the builders.
    assert.equal(source.match(/in withSaved\(fuelOptions\(/g)?.length, 2);
    assert.equal(source.match(/in withSaved\(conditionOptions\(/g)?.length, 2);

    // The static lists must no longer feed the dropdowns directly.
    assert.doesNotMatch(source, /v-for="fuelOption in FUEL_TYPE_ORDER"/);
    assert.doesNotMatch(source, /<SelectItem value="demo">Demo<\/SelectItem>/);

    // Options narrow by the target's make/model/variant.
    assert.match(source, /function narrowedStock\(make: string, model: string, variant: string\)/);
    assert.match(source, /fuelOptions\(banner\.make, banner\.model, banner\.variant\)/);
    assert.match(source, /conditionOptions\(group\.make, group\.model, group\.variant\)/);
  });

  it('keeps a saved selection visible once its stock runs out', () => {
    const source = page();
    assert.match(source, /function withSaved\(options: readonly string\[\], saved: string\)/);
    assert.match(source, /\(no stock\)/);
  });
});

describe('stock card promo cache freshness', () => {
  const composable = () => readFileSync('app/composables/useStockCardPromo.ts', 'utf8');
  const admin = () => readFileSync('app/pages/admin/settings/stock-card-promo.vue', 'utf8');

  // Returning the payload unconditionally pinned settings for the whole SPA
  // session, so a saved banner never appeared without a full page reload.
  it('expires the client payload instead of reusing it forever', () => {
    assert.match(composable(), /PROMO_CACHE_TTL_MS/);
    assert.match(composable(), /Date\.now\(\) - fetchedAt < PROMO_CACHE_TTL_MS \? cached : undefined/);
  });

  it('drops the client cache as soon as the admin saves', () => {
    assert.match(composable(), /export function invalidateStockCardPromoCache/);
    assert.match(admin(), /invalidateStockCardPromoCache\(\)/);
  });
});
