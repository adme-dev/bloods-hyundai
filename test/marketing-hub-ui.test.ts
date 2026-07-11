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

  it('reaches markup rendered by local child components through the scoped-style boundary', () => {
    assert.match(pageSource, /:deep\(\.marketing-hub__panel-head\)/);
    assert.match(pageSource, /:deep\(\.marketing-hub__metrics\)/);
    assert.match(pageSource, /:deep\(\.marketing-hub__bar-row\)/);
    assert.match(pageSource, /:deep\(\.marketing-hub__track\)/);
  });

  it('lets the muted report canvas bleed to the full viewport width', () => {
    assert.match(pageSource, /\.marketing-hub\s*\{[\s\S]*?width:\s*100vw;/);
    assert.match(pageSource, /margin-left:\s*calc\(50%\s*-\s*50vw\);/);
    assert.match(pageSource, /\.marketing-hub\s*>\s*\*\s*\{\s*max-width:\s*1200px;/);
  });

  it('provides separate accessible charts for website, paid media, and lead performance', () => {
    assert.match(pageSource, /role="tablist"/);
    assert.match(pageSource, /role="tab"/);
    assert.match(pageSource, /Website[\s\S]*Paid media[\s\S]*Leads/);
    assert.match(pageSource, /aria-selected/);
    assert.match(pageSource, /analyticsChartTabs/);
  });

  it('makes daily chart values inspectable with pointer and keyboard tooltips', () => {
    assert.match(pageSource, /@mouseenter="activeChartPoint = index"/);
    assert.match(pageSource, /@focus="activeChartPoint = index"/);
    assert.match(pageSource, /class="marketing-hub__chart-tooltip"/);
    assert.match(pageSource, /tabindex="0"/);
    assert.match(pageSource, /:x\.attr="chartHitX\(index\)"/);
    assert.match(pageSource, /:width\.attr="chartHitWidth"/);
  });

  it('keeps the website acquisition breakdowns together with explicit unavailable states', () => {
    assert.match(pageSource, /marketing-hub__website-breakdowns/);
    assert.match(pageSource, /Top landing pages[\s\S]*Pages that started website sessions/);
    assert.match(pageSource, /Traffic channels/);
    assert.match(pageSource, /Source \/ medium[\s\S]*Where website sessions came from/);
    assert.match(pageSource, /GA4 reporting credential is connected/);
  });

  it('shows the high-level path from website visits into the admin CRM', () => {
    assert.match(pageSource, /Website to lead funnel/);
    assert.match(pageSource, /High-level path from visits to this admin CRM/);
    assert.match(pageSource, /websiteLeadFunnelRows/);
    assert.match(pageSource, /Website sessions[\s\S]*GA4 key events[\s\S]*Admin CRM leads/);
  });
});
