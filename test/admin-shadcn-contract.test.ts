import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '../app');
const uiRoot = join(appRoot, 'components/ui');
const adminRoots = [join(appRoot, 'components/admin'), join(appRoot, 'pages/admin')];
const mainStyles = readFileSync(join(appRoot, 'assets/styles/main.scss'), 'utf8');
const adminLayout = readFileSync(join(appRoot, 'layouts/admin.vue'), 'utf8');

function vueAndTsFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return vueAndTsFiles(path);
    return ['.vue', '.ts'].includes(extname(entry.name)) ? [path] : [];
  });
}

describe('admin shadcn foundation', () => {
  it('keeps shared shadcn primitives on semantic tokens instead of fixed light colours', () => {
    const fixedColourPattern = /(?:bg|text|border|ring-offset)-(?:white|gray-\d+)|(?:bg|text|border|ring)-\[#[0-9a-f]+\]/i;
    const offenders = vueAndTsFiles(uiRoot)
      .filter(path => fixedColourPattern.test(readFileSync(path, 'utf8')))
      .map(path => path.replace(`${appRoot}/`, ''));

    assert.deepEqual(offenders, []);
  });

  it('defines the charcoal admin palette on the root so portalled shadcn surfaces inherit it', () => {
    assert.match(mainStyles, /:root\[data-admin-theme\]/);
    assert.match(mainStyles, /:root\[data-admin-theme\][^{]*\.dark|:root\.dark\[data-admin-theme\]/);
    assert.match(mainStyles, /--background:\s*0 0% [4-8]%/);
    assert.match(mainStyles, /--card:\s*0 0% (?:8|9|10)%/);
    assert.match(mainStyles, /--popover:\s*0 0% (?:8|9|10)%/);
    assert.match(adminLayout, /['"]data-admin-theme['"]:\s*['"]true['"]/);
  });

  it('keeps the current migration slice free of route-level style blocks', () => {
    const remainingLegacyStyles = [
      'components/admin/NotificationBell.vue',
      'pages/admin/enquiries/[id].vue',
      'pages/admin/index.vue',
      'pages/admin/marketing-report.vue',
    ];
    const styledAdminFiles = adminRoots
      .flatMap(vueAndTsFiles)
      .filter(path => /<style(?:\s|>)/.test(readFileSync(path, 'utf8')))
      .map(path => path.replace(`${appRoot}/`, ''))
      .sort();

    assert.deepEqual(styledAdminFiles, remainingLegacyStyles.sort());
  });
});
