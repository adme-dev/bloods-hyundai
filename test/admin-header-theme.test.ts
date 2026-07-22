import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const layoutSource = readFileSync(resolve(__dirname, '../app/layouts/admin.vue'), 'utf8');
const globalStyles = readFileSync(resolve(__dirname, '../app/assets/styles/main.scss'), 'utf8');
const notificationsSource = readFileSync(
  resolve(__dirname, '../app/components/admin/NotificationBell.vue'),
  'utf8',
);

describe('admin header theme contract', () => {
  it('themes the header and every portalled header surface in dark mode', () => {
    assert.match(layoutSource, /['"]data-admin-theme['"]:\s*['"]true['"]/);
    assert.match(globalStyles, /:root\[data-admin-theme\]/);
    assert.match(layoutSource, /<SheetContent[^>]*class="w-64 p-0"/);
    assert.match(layoutSource, /<DropdownMenuContent[^>]*class="w-64 p-1\.5"/);
    assert.doesNotMatch(layoutSource, /admin-theme-surface/);
    assert.doesNotMatch(notificationsSource, /admin-theme-surface/);
  });

  it('lets explicit theme selection override the operating-system preference', () => {
    assert.match(globalStyles, /:root\[data-admin-theme\]:not\(\[data-theme="light"\]\)/);
    assert.match(globalStyles, /:root\.dark\[data-admin-theme\]/);
    assert.match(globalStyles, /:root\[data-admin-theme\]\[data-theme="dark"\]/);
  });

  it('uses theme tokens instead of fixed light notification surfaces', () => {
    assert.doesNotMatch(notificationsSource, /border-slate-200|bg-white|bg-slate-50/);
    assert.match(notificationsSource, /border-border bg-background/);
    assert.match(notificationsSource, /bg-muted\/40/);
  });

  it('uses semantic shadcn foregrounds for brand controls', () => {
    assert.match(layoutSource, /bg-primary[^"\n]*text-primary-foreground/);
    assert.doesNotMatch(layoutSource, /--admin-brand|#[0-9a-f]{3,8}/i);
  });
});
