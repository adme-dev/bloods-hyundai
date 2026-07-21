import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('homepage slider admin UI', () => {
  it('always publishes from the dashboard without an upstream publishing toggle', () => {
    const page = readFileSync('app/pages/admin/settings/homepage-slider.vue', 'utf8');

    assert.doesNotMatch(page, /Publishing control/);
    assert.doesNotMatch(page, /customEnabled/);
    assert.doesNotMatch(page, /<Switch\b/);
    assert.match(page, /body: \{ enabled: true, slides: slides\.value \}/);
  });

  it('keeps the dashboard status icon large and vertically centred beside its copy', () => {
    const page = readFileSync('app/pages/admin/settings/homepage-slider.vue', 'utf8');

    assert.match(page, /class="slider-status-alert/);
    assert.match(page, /class="slider-status-icon\b/);
    assert.match(page, /Alert's base styles absolutely position direct-child SVGs/);
    assert.match(page, /\.slider-status-alert\s*\{[^}]*display:\s*grid;[^}]*align-items:\s*center;/s);
    assert.match(page, /\.slider-status-icon\s*\{[^}]*width:\s*40px;[^}]*height:\s*40px;/s);
    assert.match(page, /<CircleCheckBig class="h-6 w-6/);
  });

  it('allows saving an empty dashboard-managed slider', () => {
    const page = readFileSync('app/pages/admin/settings/homepage-slider.vue', 'utf8');

    assert.doesNotMatch(page, /customEnabled\s*&&\s*!enabledSlideCount/);
    assert.match(page, /Leave the list empty to hide the homepage slider/i);
  });

  it('supports responsive image selection, scheduling, ordering, and preview', () => {
    const page = readFileSync('app/pages/admin/settings/homepage-slider.vue', 'utf8');
    const editor = readFileSync('app/components/admin/settings/HomepageSlideEditor.vue', 'utf8');
    const settingsIndex = readFileSync('app/pages/admin/settings/index.vue', 'utf8');

    assert.match(editor, /Desktop image/);
    assert.match(editor, /Mobile image/);
    assert.match(editor, /AdminDatePicker/);
    assert.match(editor, /Time on screen/);
    assert.match(editor, /duration_seconds/);
    assert.match(editor, /<Select v-model="contrastModel"/);
    assert.match(editor, /SelectTrigger/);
    assert.doesNotMatch(editor, /<select\b/);
    assert.match(page, /MediaLibraryDialog/);
    assert.match(editor, /Move slide up/);
    assert.match(page, /Preview homepage/);
    assert.match(settingsIndex, /\/admin\/settings\/homepage-slider/);
  });

  it('does not use native date inputs or raw HTML rendering for admin-managed copy', () => {
    const page = readFileSync('app/pages/admin/settings/homepage-slider.vue', 'utf8');
    const editor = readFileSync('app/components/admin/settings/HomepageSlideEditor.vue', 'utf8');

    assert.doesNotMatch(`${page}\n${editor}`, /type=["']date["']/);
    assert.doesNotMatch(`${page}\n${editor}`, /v-html/);
  });
});
