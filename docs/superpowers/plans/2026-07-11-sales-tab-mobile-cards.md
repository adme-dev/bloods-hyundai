# Sales Tab Lower-Section Cards Mobile Refinement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the four lower cards on the admin sales tab (Sales Funnel, Pipeline Status, Enquiry Trends, Response Performance) for mobile per `docs/superpowers/specs/2026-07-11-sales-tab-mobile-cards-design.md`, and wire the non-functional chart toggle to real data.

**Architecture:** All changes live in one file, `app/components/admin/dashboard/SalesTab.vue` — template restructuring using the repo's shadcn-vue card anatomy (`CardHeader` grid + `CardAction`), a static stage-grouping array in the script, and a scoped `@media (max-width: 700px)` CSS block matching the conventions in `CompactKpiCard.vue`.

**Tech Stack:** Nuxt 3 / Vue 3 SFC, shadcn-vue cards (`~/components/ui/card`), UnoCSS with Tailwind preset (utility classes), scoped CSS for the 700px breakpoint.

## Global Constraints

- Mobile breakpoint is `@media (max-width: 700px)` in scoped CSS — NOT Tailwind responsive prefixes (repo convention; UnoCSS `max-[700px]:` variants are not used anywhere in this codebase).
- The ui card components expose `data-slot="card-header"` / `"card-content"` / `"card-action"` attributes — use `:deep([data-slot="..."])` to style them from scoped CSS.
- `DashboardData` is `any` (see `app/components/admin/dashboard/types.ts`) — type chart-day params locally, do not touch types.ts.
- No new colors, no gradients, no sample data. Zero/empty states must render exactly as today.
- **No test runner exists in this repo** (no vitest/jest, no `test` script). The verification cycle per task is `npm run typecheck`; final gate is `npm run build` plus a browser pass.
- Commits must add ONLY `app/components/admin/dashboard/SalesTab.vue` (the working tree has unrelated uncommitted changes in other files — never `git add -A`).

## Preflight: baseline commit

`SalesTab.vue` already has uncommitted changes from earlier card work. Commit it as-is first so this plan's diffs are clean:

- [ ] Run: `git add app/components/admin/dashboard/SalesTab.vue && git commit -m "wip(admin): sales tab card refinements baseline"`
- [ ] Run: `git status --short app/components/admin/dashboard/SalesTab.vue` — Expected: no output (clean).

---

### Task 1: Pipeline Status — stage grouping

**Files:**
- Modify: `app/components/admin/dashboard/SalesTab.vue` (template ~lines 179–197; script after the `pipelineStatuses` array ~line 440)

**Interfaces:**
- Consumes: existing `pipelineStatuses` array — each entry has `key`, `label`, `description`, `variant`, and `stage: 'cold' | 'warm' | 'hot' | 'closed'`.
- Produces: `pipelineStageGroups` (module-scope const, used only in this template) and the `stat-row` CSS class on pipeline rows (styled in Task 3).

- [ ] **Step 1: Add the grouping array to the script**

Immediately after the closing `];` of `pipelineStatuses`, add:

```ts
const stageLabels: Record<string, string> = { cold: 'Cold', warm: 'Warm', hot: 'Hot', closed: 'Closed' };

const pipelineStageGroups = (['cold', 'warm', 'hot', 'closed'] as const).map(stage => ({
  stage,
  label: stageLabels[stage],
  statuses: pipelineStatuses.filter(s => s.stage === stage),
}));
```

(Plain const, not `computed` — `pipelineStatuses` is static.)

- [ ] **Step 2: Replace the flat list in the template**

Find the Pipeline Status card's `CardContent` (currently `class="space-y-3"` containing a `v-for="status in pipelineStatuses"` div with `rounded-lg border border-dashed px-4 py-3`). Replace the entire `CardContent` block with:

```vue
        <CardContent class="space-y-4">
          <div v-for="group in pipelineStageGroups" :key="group.stage">
            <h4 class="pb-1 text-[11px] font-bold uppercase tracking-[0.09em] text-muted-foreground">{{ group.label }}</h4>
            <div class="divide-y">
              <div
                v-for="status in group.statuses"
                :key="status.key"
                class="stat-row flex items-center justify-between gap-3 py-2 text-sm"
              >
                <div class="flex min-w-0 items-center gap-2.5">
                  <Badge :variant="status.variant">{{ status.label }}</Badge>
                  <span class="truncate text-muted-foreground">{{ status.description }}</span>
                </div>
                <div class="text-base font-semibold tabular-nums">{{ data?.overview?.pipeline?.[status.key] || 0 }}</div>
              </div>
            </div>
          </div>
        </CardContent>
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck`
Expected: exits 0 (same warnings as before this change, no new errors mentioning SalesTab).

- [ ] **Step 4: Commit**

```bash
git add app/components/admin/dashboard/SalesTab.vue
git commit -m "feat(admin): group pipeline statuses by sales stage"
```

---

### Task 2: Enquiry Trends — CardAction header, wired toggle, mobile chart

**Files:**
- Modify: `app/components/admin/dashboard/SalesTab.vue` (Trends card template ~lines 270–316; imports ~line 400; `getBarHeight` ~lines 459–463; scoped `<style>` block)

**Interfaces:**
- Consumes: `data.dailyTrend[]` entries with `date`, `total`, `vehicle`, `testDrive`, `service` (all returned by `server/api/admin/analytics/dashboard.get.ts`); existing `selectedChartType` ref and `chartTypes` array (values `'total' | 'sales' | 'service'`).
- Produces: `getDayValue(day)` used by the template; `trend-chart` / `trend-col` / `trend-label` / `trend-toggle` CSS classes styled in this task's CSS; `sales-panel` class expectations handled in Task 3.

- [ ] **Step 1: Import CardAction**

Change the card import line:

```ts
import { Card, CardAction, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
```

- [ ] **Step 2: Convert the Trends card header**

First change the Trends card's opening tag: `<Card class="lg:col-span-2">` → `<Card class="sales-panel lg:col-span-2">`.

Then replace the Trends card's `CardHeader` (currently a `flex items-center justify-between` wrapper div holding title/description and the button row) with:

```vue
        <CardHeader class="grid grid-cols-[1fr_auto] items-start gap-2">
          <div class="min-w-0">
            <CardTitle>Enquiry Trends</CardTitle>
            <CardDescription>Last 14 days activity</CardDescription>
          </div>
          <CardAction>
            <div class="trend-toggle flex gap-1">
              <Button
                v-for="chartType in chartTypes"
                :key="chartType.value"
                variant="ghost"
                size="sm"
                :class="{ 'bg-muted': selectedChartType === chartType.value }"
                @click="selectedChartType = chartType.value"
              >
                {{ chartType.label }}
              </Button>
            </div>
          </CardAction>
        </CardHeader>
```

- [ ] **Step 3: Wire the toggle in the script**

Replace the existing `getBarHeight` function with:

```ts
type TrendDay = { total: number; vehicle?: number; testDrive?: number; service?: number };

function getDayValue(day: TrendDay): number {
  if (selectedChartType.value === 'sales') return (day.vehicle || 0) + (day.testDrive || 0);
  if (selectedChartType.value === 'service') return day.service || 0;
  return day.total;
}

function getBarHeight(day: TrendDay): number {
  if (!props.data?.dailyTrend) return 0;
  const maxValue = Math.max(...props.data.dailyTrend.map((d: TrendDay) => getDayValue(d)), 1);
  return (getDayValue(day) / maxValue) * 100;
}
```

- [ ] **Step 4: Update the chart template**

Replace the chart's `CardContent` body with (changes: `trend-chart` class on the height wrapper, `trend-col` on each day column, `trend-label` on the date label, and `getDayValue(day)` replacing `day.total` in minHeight + tooltip):

```vue
        <CardContent>
          <div class="trend-chart h-[280px]">
            <div v-if="data?.dailyTrend?.length" class="flex h-full gap-1">
              <div
                v-for="day in data.dailyTrend"
                :key="day.date"
                class="trend-col group relative flex h-full flex-1 flex-col justify-end"
              >
                <div
                  class="w-full rounded-t bg-primary/80 transition-colors hover:bg-primary"
                  :style="{ height: `${Math.round(getBarHeight(day) * 0.9)}%`, minHeight: getDayValue(day) > 0 ? '4px' : '0' }"
                />
                <div class="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block">
                  {{ getDayValue(day) }} enquiries
                </div>
                <div class="trend-label mt-1 text-center text-[10px] text-muted-foreground">
                  {{ formatChartDate(day.date) }}
                </div>
              </div>
            </div>
            <div v-else class="flex h-full items-center justify-center text-sm text-muted-foreground">
              No trend data available yet
            </div>
          </div>
        </CardContent>
```

- [ ] **Step 5: Add the mobile CSS**

Inside the existing scoped `@media (max-width: 700px)` block (the one holding `.department-card` overrides), add:

```css
  .sales-panel .trend-chart {
    height: 200px;
  }

  .trend-col:nth-child(even) .trend-label {
    visibility: hidden;
  }

  .trend-toggle button {
    height: 28px;
    padding-inline: 8px;
    font-size: 12px;
  }
```

Notes: `.sales-panel` was added to the Trends card in Step 2 — the `.sales-panel .trend-chart` selector (0-2-0) out-specifies the `h-[280px]` utility (0-1-0) without `!important`. `visibility: hidden` (not `display: none`) keeps every column's label row occupying space so bar baselines stay aligned. `.trend-toggle button` works without `:deep()` because a child component's root element receives the parent's scope attribute, and its 0-1-1 specificity beats the button's size utilities.

- [ ] **Step 6: Verify**

Run: `npm run typecheck`
Expected: exits 0, no new errors mentioning SalesTab.

- [ ] **Step 7: Commit**

```bash
git add app/components/admin/dashboard/SalesTab.vue
git commit -m "feat(admin): wire trends chart toggle and adapt chart for mobile"
```

---

### Task 3: Funnel + Response polish, shared panel CSS, grid gaps

**Files:**
- Modify: `app/components/admin/dashboard/SalesTab.vue` (Funnel card ~lines 108–177, Pipeline card opening tag, Trends card opening tag, Response card ~lines 318–387, two outer grid divs, scoped `<style>` block)

**Interfaces:**
- Consumes: `stat-row` class from Task 1, `trend-*` classes from Task 2.
- Produces: `sales-panel`, `funnel-content`, `funnel-bar`, `response-content` CSS classes; final scoped mobile CSS.

- [ ] **Step 1: Tag the four cards and outer grids**

1. Funnel card: `<Card>` → `<Card class="sales-panel">`
2. Pipeline card: `<Card>` → `<Card class="sales-panel">`
3. Trends card: verify it already reads `<Card class="sales-panel lg:col-span-2">` (done in Task 2)
4. Response card: `<Card>` → `<Card class="sales-panel">`
5. Funnel+Pipeline wrapper: `<div class="grid gap-6 lg:grid-cols-2">` → `<div class="grid gap-4 md:gap-6 lg:grid-cols-2">`
6. Trends+Response wrapper: `<div class="grid gap-6 lg:grid-cols-3">` → `<div class="grid gap-4 md:gap-6 lg:grid-cols-3">`

- [ ] **Step 2: Funnel card classes**

In the Sales Funnel card:
1. `<CardContent class="space-y-3">` → `<CardContent class="funnel-content space-y-3">`
2. Each of the 5 label rows `<div class="flex items-center justify-between text-sm">` → `<div class="stat-row flex items-center justify-between text-sm">`
3. Each of the 5 value spans: `<span class="font-semibold">` → `<span class="font-semibold tabular-nums">` (4 occurrences) and `<span class="font-bold text-green-600">` → `<span class="font-bold tabular-nums text-green-600">` (Converted row)
4. Each of the 5 bar containers gets `funnel-bar`:
   - `<div class="h-3 w-full rounded-full bg-blue-500" />` → `<div class="funnel-bar h-3 w-full rounded-full bg-blue-500" />`
   - the 4 `<div class="h-3 w-full rounded-full bg-muted overflow-hidden">` → `<div class="funnel-bar h-3 w-full rounded-full bg-muted overflow-hidden">`

- [ ] **Step 3: Response card classes**

In the Response Performance card:
1. `<CardContent class="space-y-4">` → `<CardContent class="response-content space-y-4">`
2. Add `stat-row` to each metric row's `<div class="flex items-center justify-between text-sm">` (6 occurrences: Avg Response Time, Median Response, within-1h row, within-24h row, and the traffic-source `v-for` row — the source row also keeps its existing classes: `class="stat-row flex items-center justify-between text-sm"`)
3. Add `tabular-nums` to the 4 `font-semibold` value spans (avg, median, 1h %, 24h %)
4. Traffic source count badge: `<Badge variant="secondary">` → `<Badge variant="secondary" class="tabular-nums">`

- [ ] **Step 4: Add the shared mobile CSS**

Inside the same scoped `@media (max-width: 700px)` block, add:

```css
  .sales-panel :deep([data-slot="card-header"]),
  .sales-panel :deep([data-slot="card-content"]) {
    padding-inline: 14px;
  }

  .sales-panel .stat-row {
    font-size: 13px;
  }

  .sales-panel .funnel-bar {
    height: 10px;
  }

  .sales-panel .funnel-content > :not([hidden]) ~ :not([hidden]) {
    margin-top: 10px;
  }

  .sales-panel .response-content > :not([hidden]) ~ :not([hidden]) {
    margin-top: 12px;
  }
```

Notes: the `> :not([hidden]) ~ :not([hidden])` selectors mirror how the `space-y-*` utilities apply margins; prefixing with `.sales-panel` (0-4-0 total) out-specifies the utility (0-3-0) without `!important`. Slotted card content belongs to the parent's scope, so no `:deep()` is needed for `.stat-row` / `.funnel-*` / `.response-content`.

- [ ] **Step 5: Verify**

Run: `npm run typecheck`
Expected: exits 0, no new errors mentioning SalesTab.

- [ ] **Step 6: Commit**

```bash
git add app/components/admin/dashboard/SalesTab.vue
git commit -m "feat(admin): mobile polish for sales funnel and response cards"
```

---

### Task 4: Final verification

**Files:**
- No source changes (fixes only if verification fails).

- [ ] **Step 1: Full typecheck and build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0. (Build runs the migrate script first — that's normal for this repo.)

- [ ] **Step 2: Rebuild the knowledge graph** (required by project CLAUDE.md after code changes)

Run: `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`
Expected: exits 0.

- [ ] **Step 3: Browser pass** (requires dev server `npm run dev` and the Claude Chrome extension, or manual check)

At `http://localhost:3000/admin?tab=sales`, verify at widths 375 / 700 / 960 / 1200 in light and dark themes:
- Pipeline Status shows Cold / Warm / Hot / Closed eyebrow groups; counts right-aligned, tabular.
- Trends chart: toggle changes bars + tooltips (All vs Sales vs Service); at ≤700px only every second date label is visible, chart is 200px tall, toggle buttons are compact.
- Funnel bars slimmer at mobile; all values tabular.
- No viewport-wide horizontal scrolling at any width; no hydration warnings in the console (release blockers).
- Zero/empty data still renders as today (0 counts, "No trend data available yet", "No source data available").

- [ ] **Step 4: Report**

Summarize what changed, what behavior was preserved, and verification performed (per the marketing-hub-admin-design skill's reporting requirement).
