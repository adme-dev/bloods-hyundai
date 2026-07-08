# Admin Dashboard Restructure — Design Spec

**Date:** 2026-07-08
**Goal:** Turn the 2,038-line "everything dashboard" (`app/pages/admin/index.vue`, ~24 stacked sections) into a focused command center: actionable work always visible, analytics one click away in tabs.

## 1. Problem

Every section renders at equal visual weight in one endless scroll. Daily-work items (hot leads, overdue follow-ups) sit below marketing/catalog analytics that matter weekly at most. The monolithic file makes changes risky. Several metrics render `0`/empty with no explanation, reading as broken.

## 2. Layout (target)

```
┌─ Header (title, date, refresh) ────────────────────────────┐
├─ Urgent alert banner (existing, only when items exist) ────┤
├─ TODAY KPI STRIP — 4 compact stat cards, click-through:    │
│   New Today → /admin/enquiries?status=new_lead             │
│   Needs Attention (unassigned) → /admin/enquiries          │
│   Overdue Follow-ups → /admin/tasks?dueDate=overdue        │
│   Hot Leads → scrolls to Hot Leads card                    │
├─ ACTION ZONE (always visible)                              │
│   ├─ Hot Leads (existing card)  │ Overdue Follow-ups       │
│   └─ Quick Actions              │ Recent Activity          │
├─ TABS (lazy-rendered, shadcn Tabs, default "Sales")        │
│   Sales & Pipeline │ Marketing │ Customers │ Inventory │ Team
└─────────────────────────────────────────────────────────────┘
```

## 3. Section → destination mapping

Every existing section survives; nothing is deleted. Template line refs are pre-refactor `app/pages/admin/index.vue`.

| Existing section (lines) | Destination |
|---|---|
| Header (3–32) | Keep (top) |
| Overview stats: Total/New Today/This Week/Needs Attention (33–93) | **Today KPI strip** — replace "Total Enquiries"/"This Week" with Overdue Follow-ups + Hot Leads count; Total/This Week move to Sales tab |
| Alert banner (95–115) | Keep (top) |
| Sales Performance & Targets (116–197) | Tab: **Sales & Pipeline** |
| Marketing Channel Performance (198–310) | Tab: **Marketing** |
| Top Campaigns (311–361) | Tab: **Marketing** |
| Customer Retention Quick Stats (362–422) | Tab: **Customers** |
| Retention Deep Dive: lifecycle funnel, risk segmentation (423–541) | Tab: **Customers** |
| Task Breakdown & Priority Customers (542–608) | Tab: **Customers** |
| At-Risk list & Vehicle Interest (609–732) | Tab: **Customers** |
| Hot Leads (735–809) | **Action zone** |
| Conversion Funnel (810–882) | Tab: **Sales & Pipeline** |
| Overdue Follow-ups (883–930) | **Action zone** |
| Department Cards (931–994) | Tab: **Sales & Pipeline** |
| Enquiry Trends chart (995–1045) | Tab: **Sales & Pipeline** |
| Response Performance (1046–1120) | Tab: **Sales & Pipeline** |
| Pipeline Status (1121–1141) | Tab: **Sales & Pipeline** |
| Recent Activity (1142–1197) | **Action zone** |
| Team Performance (1198–1238) | Tab: **Team** |
| Quick Actions (1239–1302) | **Action zone** |
| Staff Workload (1303–1366) | Tab: **Team** |
| Vehicle Catalog (1367–1460) | Tab: **Inventory & Test Drives** |
| Test Drive Requests (1461–1527) | Tab: **Inventory & Test Drives** |
| Accessories & Offers (1528–end) | Tab: **Inventory & Test Drives** |

## 4. Component architecture

New directory `app/components/admin/dashboard/`, one component per section group. Each receives the full dashboard API response as a single `data` prop (no fetching inside); moved markup referencing `data?.…` therefore works verbatim:

- `TodayKpiStrip.vue` — props: `{ overview, taskStats }`
- `ActionZone.vue` — props: `{ hotLeads, overdueFollowups, recentActivity, pipeline }` (composes the four existing cards; Quick Actions markup lives here)
- `SalesTab.vue`, `MarketingTab.vue`, `CustomersTab.vue`, `InventoryTab.vue`, `TeamTab.vue` — each takes the relevant slices of the dashboard API response

`app/pages/admin/index.vue` shrinks to: the single `useFetch('/api/admin/analytics/dashboard')` (unchanged API), header/banner, `<TodayKpiStrip>`, `<ActionZone>`, and a `<Tabs>` block whose `<TabsContent>` children render the tab components. Tab content is wrapped in lazy rendering (`v-if` on first activation) so initial paint only does the visible work. Active tab persists in the URL query (`?tab=marketing`) so refresh/back keep context.

**Move, don't rewrite:** section markup/logic is cut-pasted into components with minimal edits (prop wiring). Visual redesign of individual cards is out of scope except the polish items below.

## 5. Polish items (in scope)

- **Zero/empty states:** any list card with no rows shows a one-line muted explanation (e.g. "No hot leads right now") instead of empty space; KPI cards showing 0 render normally (0 is meaningful post-status-migration).
- **Consistent card headers:** all section cards use the same CardTitle size/icon placement (several currently vary).
- **KPI click-through:** the four Today KPIs navigate as mapped above (they are currently static).
- **Section spacing:** one consistent vertical rhythm (`space-y-6`) instead of the current mix.

Out of scope: chart redesign, new metrics, backend changes, mobile-specific layout work beyond what the existing responsive grid classes give for free.

## 6. Data flow & errors

Unchanged: one `GET /api/admin/analytics/dashboard` on load; existing `pending` skeleton behavior retained at page level. No API modifications. If a data slice is missing (API partial failure), each tab component renders its zero-state rather than throwing (guard with `?.` as the page already does).

## 7. Testing & verification

- `npx nuxt typecheck` — zero net-new errors vs current baseline.
- Existing tests unaffected (no logic moves into tested modules); no new unit tests — this is markup reorganization, verified visually.
- Live drive after deploy-preview or production deploy: confirm all five tabs render their sections, KPI click-throughs land on the right filtered pages, tab state persists via URL, zero-states show on empty lists.

## 8. Risks

- **Regression while moving markup** — mitigated by moving sections verbatim per the mapping table, one commit per tab/zone, typecheck after each.
- **Muscle-memory change** for anyone used to scrolling — mitigated by URL-addressable tabs (bookmarkable) and keeping all content reachable.
