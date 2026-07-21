import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const layoutSource = readFileSync(resolve(__dirname, '../app/layouts/admin.vue'), 'utf8');
const notificationsSource = readFileSync(
  resolve(__dirname, '../app/components/admin/NotificationBell.vue'),
  'utf8',
);

describe('admin header theme contract', () => {
  it('themes the header and every portalled header surface in dark mode', () => {
    assert.match(layoutSource, /\.admin-layout,\s*\.admin-theme-surface\s*\{/);
    assert.match(layoutSource, /class="admin-theme-surface admin-mobile-sheet/);
    assert.match(layoutSource, /class="admin-theme-surface w-64 p-1\.5"/);
    assert.match(notificationsSource, /class="admin-theme-surface admin-notifications-dropdown/);
  });

  it('lets explicit theme selection override the operating-system preference', () => {
    assert.match(layoutSource, /:root:not\(\[data-theme="light"\]\)/);
    assert.match(layoutSource, /:is\(\.dark,\s*:root\[data-theme="dark"\]\)\s*:is\(\.admin-layout,\s*\.admin-theme-surface\)/);
    assert.match(layoutSource, /:root\[data-theme="light"\]/);
  });

  it('uses theme tokens instead of fixed light notification surfaces', () => {
    assert.doesNotMatch(notificationsSource, /border-slate-200|bg-white|bg-slate-50/);
    assert.match(notificationsSource, /border-border bg-background/);
    assert.match(notificationsSource, /bg-muted\/40/);
  });

  it('uses a contrast-safe foreground for dark brand controls', () => {
    assert.match(layoutSource, /--admin-brand-ink:\s*#07101b/);
    assert.match(layoutSource, /color:\s*var\(--admin-brand-ink\)/);
  });
});
