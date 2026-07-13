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
const creativeDialogSource = readFileSync(
  resolve(__dirname, '../app/components/admin/marketing/CreativePreviewDialog.vue'),
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

  it('renders stored provider breakdowns with explicit empty states and no fabricated figures', () => {
    assert.match(pageSource, /audienceBreakdowns/);
    assert.match(pageSource, /Synced provider data/);
    assert.match(pageSource, /Live report data/);
    assert.match(pageSource, /No audience breakdown data is stored for this period/);
    assert.match(pageSource, /Awaiting provider breakdown sync/);
    assert.doesNotMatch(pageSource, /No sample figures are shown|Report-builder results will appear|Phase 3 · new/);
    assert.doesNotMatch(pageSource, /previewAge|previewDevices|previewAreas|previewPivot/);
    assert.doesNotMatch(pageSource, /\$164|\$266\.32|Werribee/);
  });

  it('connects the report builder to real report data with accessible controls and sorting', () => {
    assert.match(pageSource, /buildReportBuilderRows\(data\.value/);
    assert.match(pageSource, /REPORT_BUILDER_DIMENSIONS/);
    assert.match(pageSource, /REPORT_BUILDER_METRICS/);
    assert.match(pageSource, /:aria-pressed="builderDimensions\.includes/);
    assert.match(pageSource, /:disabled="!builderAvailableMetrics\.includes/);
    assert.match(pageSource, /:aria-sort="builderAriaSort/);
    assert.match(pageSource, /sortBuilderBy/);
    assert.match(pageSource, /role="status" aria-live="polite"/);
    assert.match(pageSource, /No real report data is available for this breakdown/);
    assert.doesNotMatch(pageSource, /Time of day|<span>ROAS<\/span>/);
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

  it('binds calculated SVG geometry as attributes instead of readonly DOM properties', () => {
    for (const binding of ['y1', 'y2', 'y', 'd', 'x1', 'x2', 'cx', 'cy']) {
      assert.match(pageSource, new RegExp(`:${binding}\\.attr=`));
      assert.doesNotMatch(pageSource, new RegExp(`:${binding}=(?!\\"?[^>]*\\.attr)`));
    }
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

  it('renders synced provider media instead of illustrative creative tiles', () => {
    assert.match(pageSource, /data\.creativeMedia/);
    assert.match(pageSource, /creative\.imageUrl/);
    assert.match(pageSource, /No creative media has been synced/);
    assert.doesNotMatch(pageSource, /previewCreatives/);
    assert.doesNotMatch(pageSource, /art: 'IONIQ 9'/);
  });

  it('opens each synced ad in an accessible creative preview dialog', () => {
    assert.match(pageSource, /@click="openCreative\(creative\)"/);
    assert.match(pageSource, /:aria-label="`Preview ad: \$\{creative\.title\}`"/);
    assert.match(pageSource, /<CreativePreviewDialog/);
    assert.match(pageSource, /v-model:open="creativeDialogOpen"/);
    assert.match(creativeDialogSource, /<Dialog/);
    assert.match(creativeDialogSource, /<DialogTitle[^>]*>/);
    assert.match(creativeDialogSource, /Open video/);
    assert.match(creativeDialogSource, /referrerpolicy="no-referrer"/);
    assert.match(creativeDialogSource, /minmax\(340px/);
    assert.match(creativeDialogSource, /\[overflow-wrap:anywhere\]/);
    assert.match(creativeDialogSource, /leading-snug/);
    assert.match(creativeDialogSource, /100svh/);
    assert.match(creativeDialogSource, /42svh/);
    assert.match(creativeDialogSource, /md:min-h-\[520px\]/);
  });

  it('runs the provider sync before refreshing empty breakdown and creative data', () => {
    assert.match(pageSource, /async function syncAndRefresh/);
    assert.match(pageSource, /\$fetch<SyncResponse>\('\/api\/admin\/metrics\/sync', \{ method: 'POST' \}\)/);
    assert.match(pageSource, /await refresh\(\)/);
    assert.match(pageSource, /Sync provider data/);
  assert.match(pageSource, /Syncing platforms…/);
  assert.match(pageSource, /syncError/);
  assert.match(pageSource, /No ad-provider integration is configured/);
  assert.match(pageSource, /result\.error/);
  assert.doesNotMatch(pageSource, /Other provider data was refreshed/);
});

  it('explains report freshness in concise dealer-facing language', () => {
    assert.match(pageSource, /Results reflect the website, advertising and CRM data available for/);
    assert.match(pageSource, /Panels waiting for a platform sync are clearly marked/);
    assert.doesNotMatch(pageSource, /Every numeric value shown/);
    assert.doesNotMatch(pageSource, /production-synced cache/);
  });

  it('distinguishes a zero-match period from a disconnected attribution setup', () => {
    assert.match(pageSource, /No CRM leads are matched to paid media for this period/);
    assert.match(pageSource, /none of the[\s\S]*CRM leads carries paid-platform evidence/);
    assert.match(pageSource, /Review enquiries/);
    assert.doesNotMatch(pageSource, /Attribution isn’t connected yet — the report is running on empty/);
    assert.doesNotMatch(pageSource, /Every panel below is built and working/);
  });
});
