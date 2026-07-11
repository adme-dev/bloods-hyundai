# Admin Route Redesign Workflow

## 1. Inventory Before Editing

Document the route's purpose, primary user, decisions/actions, data sources, child components, query parameters, mutations, permission checks, responsive behavior, and every loading/empty/error state. Capture a baseline screenshot and console state when browser tooling is available.

## 2. Make a Content Map

Map existing content to the approved patterns:

| Content | Preferred pattern |
|---|---|
| Page identity and global controls | Page header |
| Four or fewer summary numbers | KPI strip |
| Related operational group | Section with cards/panels |
| Repeated records | Table or compact list |
| Ranked categorical values | Bar list |
| Change over time | Inspectable chart |
| Blocking setup problem | Critical insight banner |
| Non-blocking anomaly | Amber observation |
| No records | Compact explicit empty state |

Do not force a chart where a number or table answers the question more clearly.

## 3. Establish the Shell

Adopt the full-width muted ground, centered content container, header hierarchy, section rhythm, and shared tokens first. If more than one route needs the same rule, place it in an existing shared admin stylesheet or component boundary rather than copying scoped CSS repeatedly.

## 4. Convert One Vertical Slice at a Time

Implement in this order:

1. Shell and header
2. Primary summary/actions
3. Main records or workflow
4. Secondary insights and supporting data
5. Loading, empty, failure, and connection states
6. Responsive and dark-theme details

After each slice, verify that existing navigation and mutations still work. Avoid unrelated API or business-logic refactors during a visual redesign.

## 5. Review Data Semantics

Trace every displayed value to its API field or local computation. Confirm denominator-zero behavior, currency precision, date timezone, provider identity, cache freshness, and permission scope. Never translate missing data into zero unless zero is the real measured value.

## 6. Accessibility and Interaction Pass

Check heading order, landmarks, table semantics, labels, keyboard order, focus visibility, disabled states, tooltip keyboard access, status announcements, contrast, reduced motion, and non-color cues.

## 7. Responsive Pass

Inspect desktop, tablet, and mobile—not only by shrinking a screenshot. Confirm controls wrap intentionally, cards retain useful density, tables scroll locally, labels remain readable, and fixed/sticky elements do not cover content.

## 8. Verification and Handoff

Run focused regression tests and project quality gates. In a real browser, verify no hydration mismatch, runtime exception, failed request caused by the redesign, invalid SVG property warning, or horizontal page overflow. Summarize preserved behavior and any route-specific exception to the design system.
