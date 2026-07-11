---
name: marketing-hub-admin-design
description: Redesign and implement Bloods Hyundai admin routes using the approved Marketing Hub visual system. Use for admin page layouts, dashboards, cards, KPI strips, tables, charts, filters, connection states, responsive behavior, dark mode, accessibility, or visual consistency work under app/pages/admin and app/components/admin.
---

# Marketing Hub Admin Design

Use the Marketing Hub as the admin product's visual source of truth while preserving each route's real workflows, permissions, and data.

## Ground Work in the Approved Sources

Read these files before designing or editing:

1. `docs/design/marketing-hub-ui-handoff.md`
2. `docs/design/marketing-hub-mockup.html`, especially its `<style>` block
3. `app/pages/admin/marketing-report.vue` for the production implementation
4. The target route, its child components, API calls, loading states, and tests

Then read [design-system.md](references/design-system.md). For an implementation task, also read [route-redesign-workflow.md](references/route-redesign-workflow.md).

If the sources disagree, preserve working behavior and data integrity, then prefer the handoff's explicit rules over incidental implementation details. Do not copy report-specific content into unrelated routes.

## Apply the System

- Extend the muted, full-width admin canvas and centered 1200px content shell.
- Use the shared tokens and established surface, spacing, type, section-heading, card, table, control, and status patterns.
- Keep information hierarchy dense and operational. This is an admin product, not a marketing landing page.
- Map existing content into the smallest suitable pattern instead of inventing new visual grammar.
- Reuse existing admin/Nuxt UI components when they can match the approved design without changing behavior.
- Preserve route navigation, queries, mutations, authorization, validation, and provider semantics.
- Build light and dark appearances deliberately; do not rely on inversion.
- Collapse grids cleanly at the established breakpoints and contain wide tables inside local horizontal scrollers.

## Protect Data Truth

- Never add sample, illustrative, inferred, or fabricated production values.
- Render unavailable numeric results as `—`; never show `NaN`, infinity, or a made-up zero.
- Distinguish `connected`, `synced/stored data`, `not connected`, `empty for this period`, `loading`, and `failed` states.
- Use red only for an actionable failure, amber for a warning or observation, and green for a verified positive state.
- Pair every provider color and chart series with a text label; color cannot carry meaning alone.
- Keep provider data, cached data, and admin CRM data accurately attributed in the UI.

## Verify Every Redesign

- Test normal, empty, loading, error, and long-content states.
- Test keyboard focus, semantic headings, tables, buttons, labels, and chart alternatives/tooltips.
- Test light/dark themes and widths around 1200px, 960px, 700px, and mobile.
- Check that the page never creates viewport-wide horizontal scrolling.
- Run focused tests, full tests when shared code changed, `npm run typecheck`, and `npm run build` before handoff.
- Use a real browser for visual and console verification when available. Treat hydration warnings and invalid SVG attribute warnings as release blockers.

Report what changed, what data/behavior was preserved, verification performed, and any deliberate exceptions to the system.
