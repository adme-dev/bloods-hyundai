import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(
  resolve(__dirname, '../app/pages/admin/marketing-report.vue'),
  'utf8',
);

describe('Marketing Hub UI', () => {
  it('uses the approved Marketing Hub information architecture', () => {
    assert.match(pageSource, /<h1>Marketing Hub<\/h1>/);
    assert.match(pageSource, /Campaign CPL Reconciliation/);
    assert.match(pageSource, /Audience &amp; delivery breakdowns/);
    assert.match(pageSource, /Ad creative/);
    assert.match(pageSource, /Report builder/);
    assert.doesNotMatch(pageSource, />Priority Actions</);
  });

  it('includes the approved theme tokens and responsive layout contract', () => {
    assert.match(pageSource, /--ground:\s*#eaeef3/);
    assert.match(pageSource, /--surface:\s*#ffffff/);
    assert.match(pageSource, /--brand:\s*#001e50/i);
    assert.match(pageSource, /--accent:\s*#0091b8/);
    assert.match(pageSource, /@media\s*\(max-width:\s*960px\)/);
    assert.match(pageSource, /\.marketing-hub__kpis\s*\{[\s\S]*grid-template-columns:\s*repeat\(4,\s*1fr\)/);
  });

  it('keeps future-data surfaces explicitly marked as previews', () => {
    assert.match(pageSource, /Phase 2 · new/);
    assert.match(pageSource, /Phase 3 · new/);
    assert.match(pageSource, /illustrative until the first breakdown sync runs/);
    assert.match(pageSource, /Example output/);
  });
});
