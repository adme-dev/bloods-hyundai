# Marketing Hub Admin Design System

## Source of Truth

The approved artifact is committed at `docs/design/marketing-hub-mockup.html`; its CSS defines exact tokens and core component geometry. `docs/design/marketing-hub-ui-handoff.md` explains intended use. The live implementation is `app/pages/admin/marketing-report.vue`.

## Tokens

| Role | Light | Dark |
|---|---|---|
| Ground | `#eaeef3` | `#080f18` |
| Surface | `#ffffff` | `#101b28` |
| Surface 2 | `#f5f8fb` | `#152232` |
| Surface 3 | `#eef3f8` | `#1b2a3b` |
| Primary ink | `#0b1a2b` | `#e7eef6` |
| Secondary ink | `#39506a` | `#aebdce` |
| Muted ink | `#6b7d90` | `#7c8ea0` |
| Border | `#dfe6ee` | `#213042` |
| Brand | `#001e50` | `#4d88cc` |
| Accent | `#0091b8` | `#37c4e6` |
| Good | `#1a9e5c` | `#39c682` |
| Warning | `#c47d1f` | `#eab255` |
| Critical | `#d13b22` | `#f4674c` |
| Meta | `#1877f2` | `#4a9bff` |
| Google Ads | `#188038` | `#4dbf72` |
| GA4 | `#e8710a` | `#f5924a` |
| Third series | `#7c5cff` | `#a58cff` |

Use a `14px` card radius and the exact `--shadow` value from the mockup. Define theme tokens centrally when redesigning multiple routes; avoid duplicating a divergent token set per page.

## Typography and Density

- Use the system sans stack already used by the admin; do not introduce a CDN font.
- H1: 29px/750. Section H2: 15px/700. Card H3: 14px/700.
- KPI values: 26px/750. Metric values: 17–20px/700.
- Eyebrows and labels: 11px/700 uppercase with `.09em` tracking and muted ink.
- Use tabular numerals for all figures, money, ratios, dates, and table values.
- Keep descriptions to one useful muted line whenever possible.

## Shell and Layout

- Let the muted ground span the full viewport width, even when the admin layout has a constrained parent.
- Center content at `max-width: 1200px` with 22px side padding.
- Use a 26px section rhythm and 14px grid gaps.
- Preferred grids: four-column KPI strip; `1.45fr 1fr`; two equal columns; three equal columns.
- At 960px, collapse split grids and use two KPI columns. At 700px, move to one column and simplify controls.
- A table's wrapper may scroll horizontally; the page itself must not.

## Pattern Catalog

### Page Header

Use an eyebrow, concise H1, one-line purpose statement, and right-aligned route controls. Put freshness or sync status directly below the relevant controls.

### Section Header

Use a 15px heading, a flexible horizontal rule, and an optional compact status or phase tag. Do not wrap every card group in another card.

### Card and Panel

Use white/dark surface, 1px border, 14px radius, and subtle shadow. A panel header contains title and one-line description; the body owns padding and scrolling.

### KPIs

Use an uppercase label, strong tabular value, and explanatory footnote. Make a KPI interactive only when it has a real destination or filtering action.

### Tables and Lists

Use a recessive surface-2 header, clear column alignment, tabular right-aligned numbers, and visible row separation. Prefer a real table for repeated records and bar lists only for ranked comparisons.

### Controls

Use brand-filled active segmented controls and quiet bordered secondary actions. Preserve obvious focus rings, adequate targets, and real button semantics.

### Charts

- Give materially different questions separate charts or tabs; do not crowd unrelated series into one panel.
- Supply legends, axis/context labels, hover and keyboard inspection, and a textual empty state.
- Use recessive gridlines and semantic/provider colors only for their documented meaning.
- Bind calculated SVG geometry through Vue attribute bindings such as `:x`, `:width`, or `v-bind`, not writable DOM properties.
- Respect reduced motion and avoid decorative animation.

### Status and Empty States

Use explicit labels such as Connected, Synced data, Not connected, No activity in this period, and Sync failed. Explain the next action only when one exists. Avoid large blank panels.

## Visual Restraints

- No gradients, glassmorphism, oversized hero typography, decorative blobs, or excessive iconography.
- No arbitrary new colors or one-off radii.
- No nested-card stacks unless the inset represents a distinct interactive or data state.
- No sample figures in production UI.
