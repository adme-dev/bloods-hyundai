import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADMIN_THEME_STORAGE_KEY,
  normalizeAdminThemePreference,
  resolveAdminTheme,
} from '../app/utils/adminTheme';

const __dirname = dirname(fileURLToPath(import.meta.url));
const layoutSource = readFileSync(resolve(__dirname, '../app/layouts/admin.vue'), 'utf8');
const dashboardSource = readFileSync(resolve(__dirname, '../app/pages/admin/index.vue'), 'utf8');

describe('admin theme preference', () => {
  it('defaults missing or invalid stored values to system', () => {
    assert.equal(normalizeAdminThemePreference(null), 'system');
    assert.equal(normalizeAdminThemePreference(''), 'system');
    assert.equal(normalizeAdminThemePreference('sepia'), 'system');
  });

  it('accepts every supported preference', () => {
    assert.equal(normalizeAdminThemePreference('system'), 'system');
    assert.equal(normalizeAdminThemePreference('light'), 'light');
    assert.equal(normalizeAdminThemePreference('dark'), 'dark');
  });

  it('resolves system from the operating-system colour scheme', () => {
    assert.equal(resolveAdminTheme('system', false), 'light');
    assert.equal(resolveAdminTheme('system', true), 'dark');
    assert.equal(resolveAdminTheme('light', true), 'light');
    assert.equal(resolveAdminTheme('dark', false), 'dark');
  });

  it('uses a stable admin-only storage key', () => {
    assert.equal(ADMIN_THEME_STORAGE_KEY, 'bloods-admin-theme');
  });

  it('offers an accessible System, Light and Dark mode control', () => {
    assert.match(layoutSource, /aria-label="Colour mode"/);
    assert.match(layoutSource, /value="system"/);
    assert.match(layoutSource, /value="light"/);
    assert.match(layoutSource, /value="dark"/);
  });

  it('allows explicit light mode to override a dark operating system on the dashboard', () => {
    assert.match(
      dashboardSource,
      /:global\(:root:not\(\[data-theme="light"\]\)\) \.dashboard-shell/,
    );
  });

  it('restores the previous document theme when the admin layout is left', () => {
    assert.match(layoutSource, /rootThemeBeforeAdmin/);
    assert.match(layoutSource, /root\.classList\.toggle\('dark', rootWasDarkBeforeAdmin\)/);
    assert.match(layoutSource, /root\.style\.colorScheme = rootColourSchemeBeforeAdmin/);
  });
});
