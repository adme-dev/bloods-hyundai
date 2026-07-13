# Sales Tab Lower-Section Cards — Mobile Refinement

**Date:** 2026-07-11
**Scope:** `app/components/admin/dashboard/SalesTab.vue` — the four lower-section cards only: Sales Funnel, Pipeline Status, Enquiry Trends, Response Performance.
**Out of scope:** KPI strips (CompactKpiCard), department cards, other tabs. These already follow the compact-card pattern from earlier work in this branch.

## Goal

Bring the four lower cards up to the Marketing Hub admin design system on mobile (≤700px), using shadcn card anatomy (`CardHeader` grid + `CardAction` + `CardFooter`) and Tailwind, matching the conventions already established in `CompactKpiCard.vue` and `TodayKpiStrip.vue`.

## Design

### 1. Sales Funnel card

- Structure unchanged: five stage rows (Total Leads, Contacted, Test Drive Booked, Finance Applied, Converted) with existing stage colors (blue, cyan, purple, yellow, green — no new colors).
- All numeric values get `tabular-nums`.
- Below 700px: card content padding-inline tightens to 14px (matching CompactKpiCard), row text drops to 13px, progress bars slim from `h-3` to `h-2.5`, vertical rhythm tightens.
- The full-width blue "Total Leads" reference bar stays as the 100% baseline.

### 2. Pipeline Status card

- Replace the flat list of 11 dashed-border boxes with four stage groups — **Cold, Warm, Hot, Closed** — driven by the existing (currently unused) `stage` field on `pipelineStatuses`.
- Each group heading is an eyebrow label: 11px / 700 weight / uppercase / `.09em` letter-spacing / muted ink (per design-system.md).
- Rows within a group use `divide-y` separation (no dashed borders): status `Badge` + short muted description on the left (description truncates under width pressure), count on the right in semibold tabular numerals.
- Groups separated by vertical spacing, not nested cards.

### 3. Enquiry Trends card

- Header converts to the established `grid grid-cols-[1fr_auto] items-start gap-2` pattern with the All/Sales/Service segmented control inside `CardAction`. On mobile the buttons shrink to `h-7 px-2 text-xs`.
- **Wire the currently non-functional toggle** to real per-day API data already returned by `dashboard.get.ts`:
  - All → `day.total`
  - Sales → `day.vehicle + day.testDrive`
  - Service → `day.service`
  - Bar heights scale against the max of the *selected* series; hover tooltip shows the selected series' count.
- Date labels: CSS-only thinning — below 700px, hide every second label via `:nth-child(even)` on the per-day column. No JS, no data loss (all 14 bars remain).
- Chart height: 280px desktop → 200px below 700px.
- Empty state text preserved.

### 4. Response Performance card

- Structure untouched. Tabular numerals on all figures; below 700px, labels drop to 13px, spacing tightens, content padding-inline 14px.

### Cross-cutting rules

- Outer section grids change `gap-6` → `gap-4 md:gap-6` so stacked mobile cards match the KPI strips' rhythm.
- All mobile overrides live in the component's scoped `@media (max-width: 700px)` block using existing `--dashboard-*` CSS tokens (same mechanism as CompactKpiCard).
- Changes that apply at all widths (not just mobile): the Pipeline Status stage grouping, the Trends header-grid conversion, the now-functional chart toggle, and tabular-nums. Everything else is scoped below 700px.
- Data truth preserved: no fabricated values; zero/empty states render exactly as today; unavailable values stay `N/A`/`—` per existing behavior.

## Error handling

- `data` prop may be partially undefined; all existing optional-chaining and `|| 0` fallbacks are preserved.
- Toggle wiring must handle days where a per-type field is `0` or missing (`Number(...) || 0` semantics already applied server-side).

## Verification

- `npm run typecheck` and `npm run build` pass.
- Focused component tests, if any cover SalesTab; full test run if shared code changes (none planned).
- Browser check at 375px, 700px, 960px, 1200px in light and dark themes once the Chrome extension is connected; watch for hydration warnings (release blockers per the marketing-hub-admin-design skill).
- Confirm no viewport-wide horizontal scrolling at any width.
