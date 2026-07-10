# Marketing Hub — UI/UX Handoff

**Date:** 2026-07-10
**Purpose:** Build the Marketing Hub report so its UI/UX is **identical to the approved mockup**.
**Reference mockup (interactive):** https://claude.ai/code/artifact/cd25a64b-df27-473e-b770-eb54d5b20f11
**Reference mockup (source, committed):** `docs/design/marketing-hub-mockup.html` — open it; the CSS in its `<style>` block is the source of truth for tokens, spacing and components.
**Feature spec / plan:** `docs/superpowers/specs/2026-07-10-marketing-hub-phase1-design.md` · `docs/superpowers/plans/2026-07-10-marketing-hub-phase1.md`

> Build target is the real page `app/pages/admin/marketing-report.vue` + `server/api/admin/analytics/marketing-report.get.ts`. The mockup is a static HTML render of how that page should look. Match tokens, spacing, and component structure exactly; keep it in Nuxt UI where components already exist.

---

## 1. Design tokens (both themes — copy verbatim)

Grounded in the existing Hyundai admin identity. Define as CSS custom properties on `:root`; redefine under `@media (prefers-color-scheme: dark)` **and** `:root[data-theme="dark"]` / `:root[data-theme="light"]` so the viewer's toggle wins.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--ground` | `#eaeef3` | `#080f18` | page background |
| `--surface` | `#ffffff` | `#101b28` | card background |
| `--surface-2` | `#f5f8fb` | `#152232` | insets, table head |
| `--surface-3` | `#eef3f8` | `#1b2a3b` | bar tracks |
| `--ink` | `#0b1a2b` | `#e7eef6` | primary text |
| `--ink-2` | `#39506a` | `#aebdce` | secondary text |
| `--muted` | `#6b7d90` | `#7c8ea0` | labels, captions |
| `--line` | `#dfe6ee` | `#213042` | borders |
| `--brand` | `#001E50` | `#4d88cc` | Hyundai navy — pills, primary buttons |
| `--accent` | `#0091b8` | `#37c4e6` | interactive/emphasis, single-series charts |
| `--good` | `#1a9e5c` | `#39c682` | status only (connected, on-target) |
| `--warn` | `#c47d1f` | `#eab255` | status only |
| `--crit` | `#d13b22` | `#f4674c` | status only (0%, alerts, misses) |
| `--meta` | `#1877f2` | `#4a9bff` | Meta identity (labeled) |
| `--google` | `#188038` | `#4dbf72` | Google Ads identity (labeled) |
| `--ga4` | `#e8710a` | `#f5924a` | GA4 identity (labeled) |
| `--series3` | `#7c5cff` | `#a58cff` | 3rd chart series (CRM leads) |
| `--radius` | `14px` | — | card radius |
| `--shadow` | `0 1px 2px rgba(11,26,43,.05), 0 8px 24px -14px rgba(11,26,43,.18)` | dark equivalent in mockup | card elevation |

**Rules:** semantic colors (good/warn/crit) are for *state only*, never as a data-series or accent. Platform hues are always paired with a text label/badge so color is never the sole cue.

## 2. Typography

- **Family:** system stack — `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` (matches the existing admin; no webfont — CSP blocks CDNs).
- **Figures:** every number uses `font-variant-numeric: tabular-nums` (`.num` class).
- **Scale:** page H1 29px/750; section H2 15px/700; card H3 14px/700; KPI value 26px/750; metric value 17–20px/700; eyebrow/label 11px/700 uppercase `letter-spacing:.09em` in `--muted`.
- Headings `letter-spacing:-.01em`; `text-wrap: balance` on long titles.

## 3. Layout

- Container `max-width:1200px`, side padding 22px. Vertical rhythm: `section { margin-top:26px }`.
- Card = `--surface` + `1px solid --line` + `--radius` + `--shadow`. Panel header pattern: `.panel-head` (title + one-line muted description).
- Grid systems (gap 14px): `split` = `1.45fr 1fr`; `split2` = `1fr 1fr`; `split3` = `repeat(3,1fr)`; KPI strip = `repeat(4,1fr)`.
- **Responsive:** ≤960px all splits collapse to 1 col, KPI to 2 col, creatives to 2 col; wide tables get `overflow-x:auto` on their own wrapper (`.tscroll`) — the page never scrolls sideways.
- `@media (prefers-reduced-motion: no-preference)` only: bar-fill width transitions.

## 4. Component inventory (all in the mockup CSS)

Build these as Vue components / Nuxt UI equivalents, styled to the mockup:

- **KPI tile** (`.kpi`) — uppercase label + inline icon, big value, muted foot; `.alert` variant turns value `--crit` (used for 0% UTM coverage).
- **Insight banner** (`.insight`) — left `--crit` stripe, icon chip, title + body, right-aligned action button. Carries the "attribution not connected" message.
- **Executive Readout** (full-width card) — data-quality pill (`.qpill.bad/mid/ok`); **funnel** (`.funnel` 4 stages, decreasing bars); **data health** (`.health` rows: label + %-chip + track with a `.tgt` target marker + "Target X%" sub); **campaign opportunities** (`.opp` cards with a `.tagline`).
- **Connection rows / Lead Types / Lead Status** — `.conn-row` with `.pill.dark` (Connected), single-bar (`.barone`), `.extfeed` inset for external-feed count.
- **Campaign CPL Reconciliation table** — monospace campaign names (`.campname`), platform pill, right-aligned tabular columns, `--crit` zeros, "—" for null CPL.
- **Depth cards** (GA4 / Paid Media / Google Ads) — `.mgrid` 2-col metric grid (`.metric` label + value).
- **Trend chart** — SVG polylines, 3 series (accent / ga4 / series3), recessive gridlines, `.legend` present (≥2 series never color-alone), emphasized endpoint dot.
- **Website→lead funnel** (`.wfun`) — labeled decreasing bars.
- **Bar lists** (`.blist`) — traffic channels, devices, breakdowns — single-series `--accent` bars, value right-aligned tabular.
- **Coverage grid** (`.cov`) — Data Layer Audit; `.c.bad` value `--crit`, `.c.ok` value `--good`.
- **Pills/badges** — `.pill.dark` (Connected), `.pill.ok`, `.platpill`, `.cbadge` with color swatch.
- **Phase tags** — `.phase-tag` (accent) / `.phase-tag.p3` (series3) for "Phase 2/3 · new" preview sections.
- **Date range** — `.daterange` segmented control (Month to date / 7 / 30 / 90 / custom), active = `--brand`.

## 5. Section order (top → bottom)

1. Header (title + date-range control + "synced" status)
2. Insight banner (attribution status)
3. KPI strip (Admin CRM leads · Ad spend · Website activity · UTM coverage)
4. **Executive Readout** — full width (Priority Actions block was removed per review; do NOT add it back)
5. Connections / Lead Types / Lead Status (3-col)
6. Campaign CPL Reconciliation (table)
7. GA4 Website / Paid Media Efficiency / Google Ads Depth (3-col)
8. Website Analytics — trend + website→lead funnel; then landing pages + (traffic channels + devices)
9. Source/medium + Data Layer Audit (2-col)
10. Lead Source Setup (marketplace/email feeds)
11. **Phase 2 · new** — Audience & delivery breakdowns (age/area/device)
12. **Phase 2 · new** — Ad creative
13. **Phase 3 · new** — Report builder (pivot)
14. Footer

Sections 1–10 exist in the live report today (Codex-built) and only need restyling to these tokens. Sections 11–13 are the net-new build; keep the "Phase · new" tag until each ships.

## 6. Build rules

- Theme-aware: both light and dark designed (not an auto-invert). Test the viewer toggle.
- Numbers: `tabular-nums`, currency to cents, ratios show "—" on a zero denominator (never NaN/∞).
- Never fake a metric: ROAS renders only when a real value basis exists (`settings.marketing.avgSaleValue` or platform conversion value).
- Reuse existing admin UI components (Card, Button with the `ui-button` marker, pills) where they exist; match the mockup where they don't.
- Data is real — the report already pulls it. See the spec for the (already-shipped) Meta fetch parity and what still needs surfacing (Meta ROAS/reach).

## 7. Status at handoff

- Live report (Codex) already renders sections 1–10 with real data; attribution is 0% until ad URLs are tagged (Phase 1 — a marketing action, see the plan).
- Meta fetch parity shipped on branch `feat/meta-fetch-parity` (pull it before extending Meta display).
- Owner still keeps the marketing area; pause other agents on marketing/report/attribution files while this is built.
