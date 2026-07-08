# Admin Dashboard Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `app/pages/admin/index.vue` (2,038 lines, ~24 stacked sections) into a Today KPI strip + Action Zone (always visible) + five lazy, URL-synced tabs, per the 2026-07-08 design spec.

**Architecture:** Markup is *moved verbatim* (not rewritten) from the page into one component per section group under `app/components/admin/dashboard/`. Every component takes the full dashboard API response as a single prop named `data`, so moved template code referencing `data?.…` keeps working unchanged. Pure formatting helpers are extracted once to `app/utils/dashboardFormat.ts`; helpers that read `data` move into the component that uses them (reading the prop instead). The page shrinks to composition + tabs.

**Tech Stack:** Nuxt 3, Vue 3 `<script setup>`, shadcn-vue (`~/components/ui/tabs` exists), Tailwind, lucide-vue-next.

## Global Constraints

- The single `useFetch('/api/admin/analytics/dashboard')` stays in the page; components never fetch. (Spec §4/§6 — no API changes.)
- All 24 sections survive; none deleted. (Spec §3.)
- Moved markup is cut-paste verbatim except: identifier wiring (helpers/icons imports) and the polish items (spec §5). No visual redesign of cards.
- Deviation from spec §4, agreed at plan time: components take the whole response as prop `data` instead of narrow slices — avoids rewriting hundreds of `data?.…` references. Update the spec's §4 wording in Task 1.
- Empty-state copy pattern: `<p class="py-6 text-center text-sm text-muted-foreground">…</p>` with section-appropriate text (e.g. "No hot leads right now").
- Vertical rhythm: page root uses one `space-y-6`; remove per-section `mt-*` overrides encountered during moves.
- Typecheck gate after every task: `npx nuxt typecheck 2>&1 | grep -c "error TS"` must not exceed the baseline captured in Task 0.
- Commit after every task on branch `feat/dashboard-restructure`.

## Helper-resolution procedure (used by Tasks 3–9)

After moving a markup block into a component, resolve identifiers deterministically:
1. Run the typecheck gate. Every "cannot find name X" inside the new component is a helper/icon/const the block needs.
2. If X is a **pure function or constant** (no `data`/`ref` access): move it to `app/utils/dashboardFormat.ts` (exported), import it in the component, delete it from the page **only when the page no longer references it**.
3. If X **reads `data`** (e.g. `getLifecycleCount`): move it into the component script, replacing `data.value` with `props.data`.
4. If X is a **lucide icon or ui component**: add the import to the component.
5. Re-run the gate; repeat until clean.

---

### Task 0: Baseline

**Files:** none (measurement only)

- [ ] **Step 1: Capture typecheck baseline**

Run: `cd /Users/paulgiurin/Documents/GitHub/bloods-hyundai && npx nuxt typecheck 2>&1 | grep -c "error TS"`
Expected: a number (last known on main: 555). Record it; every later gate compares to this.

- [ ] **Step 2: Confirm branch**

Run: `git branch --show-current`
Expected: `feat/dashboard-restructure`.

---

### Task 1: Shared format util + spec wording fix

**Files:**
- Create: `app/utils/dashboardFormat.ts`
- Modify: `docs/superpowers/specs/2026-07-08-admin-dashboard-restructure-design.md` (§4 first paragraph)

**Interfaces:**
- Produces: `app/utils/dashboardFormat.ts` exporting, verbatim from `app/pages/admin/index.vue` script (line refs pre-refactor): `formatTrend` (:1806), `getTrendClass` (:1801), `formatResponseTime` (:1811), `getConversionBarClass` (:1821), `formatChartDate` (:1833), `formatTimeAgo` (:1837), `getStatusVariant` (:1847), `formatStatus` (:1857), `getInitials` (:1867), `formatCurrency` (:1880), `getTargetProgress` (:1892), `getTargetProgressClass` (:1897), `getLeadScoreClass` (:1905), `getWorkloadBorderClass` (:1920), `getWorkloadBadgeVariant` (:1930).

- [ ] **Step 1: Create the util** — copy the listed functions unchanged from the page into `app/utils/dashboardFormat.ts`, each prefixed with `export`. Header comment:

```ts
// Pure display helpers for the admin dashboard, shared by the page and the
// section components under app/components/admin/dashboard/.
```

Do NOT delete them from the page yet (the page still uses them until its rewrite in Task 10).

- [ ] **Step 2: Amend spec §4** — replace "Each receives its data slice via a single prop (no fetching inside)" with "Each receives the full dashboard API response as a single `data` prop (no fetching inside); moved markup referencing `data?.…` therefore works verbatim."

- [ ] **Step 3: Typecheck gate** (baseline from Task 0).

- [ ] **Step 4: Commit**

```bash
git add app/utils/dashboardFormat.ts docs/superpowers/specs/2026-07-08-admin-dashboard-restructure-design.md
git commit -m "feat(dashboard): shared format util for dashboard components"
```

---

### Task 2: `DashboardData` prop type + empty-state snippet convention

**Files:**
- Create: `app/components/admin/dashboard/types.ts`

**Interfaces:**
- Produces: `export type DashboardData = any` alias with doc comment. (The page treats the response as untyped `data?.…` today; introducing a full response type is out of scope — the alias marks every component's prop uniformly and gives one future site to strengthen.)

- [ ] **Step 1: Create**

```ts
// app/components/admin/dashboard/types.ts
/**
 * The /api/admin/analytics/dashboard response. The legacy page accessed it
 * untyped (`data?.…`); this alias keeps that behavior while giving all
 * dashboard components a single prop type to strengthen later.
 */
export type DashboardData = any;
```

- [ ] **Step 2: Commit**

```bash
git add app/components/admin/dashboard/types.ts
git commit -m "feat(dashboard): DashboardData prop type"
```

---

### Task 3: `TodayKpiStrip.vue` (new markup — the one non-move component)

**Files:**
- Create: `app/components/admin/dashboard/TodayKpiStrip.vue`

**Interfaces:**
- Consumes: `DashboardData` (Task 2).
- Produces: `<TodayKpiStrip :data="data" />` rendering 4 clickable KPI cards. KPI sources: New Today `data?.overview?.today`; Needs Attention `data?.overview?.pipeline?.unassigned`; Overdue Follow-ups `data?.taskStats?.overdue`; Hot Leads `data?.hotLeads?.length`.

- [ ] **Step 1: Create the component**

```vue
<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card
      v-for="kpi in kpis"
      :key="kpi.label"
      class="cursor-pointer transition-shadow hover:shadow-md"
      @click="kpi.go()"
    >
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">{{ kpi.label }}</CardTitle>
        <component :is="kpi.icon" class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-3xl font-bold" :class="kpi.emphasis && Number(kpi.value) > 0 ? 'text-red-600' : ''">
          {{ kpi.value }}
        </div>
        <p class="text-xs text-muted-foreground">{{ kpi.hint }}</p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Inbox, AlertTriangle, Clock, Flame } from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import type { DashboardData } from './types';

const props = defineProps<{ data: DashboardData }>();

const kpis = computed(() => [
  {
    label: 'New Today',
    value: props.data?.overview?.today ?? 0,
    hint: 'Fresh enquiries',
    icon: Inbox,
    emphasis: false,
    go: () => navigateTo('/admin/enquiries?status=new_lead'),
  },
  {
    label: 'Needs Attention',
    value: props.data?.overview?.pipeline?.unassigned ?? 0,
    hint: 'Unassigned enquiries',
    icon: AlertTriangle,
    emphasis: true,
    go: () => navigateTo('/admin/enquiries?assigned=unassigned'),
  },
  {
    label: 'Overdue Follow-ups',
    value: props.data?.taskStats?.overdue ?? 0,
    hint: 'Tasks past due',
    icon: Clock,
    emphasis: true,
    go: () => navigateTo('/admin/tasks?dueDate=overdue'),
  },
  {
    label: 'Hot Leads',
    value: props.data?.hotLeads?.length ?? 0,
    hint: 'Negotiating & closing',
    icon: Flame,
    emphasis: false,
    go: () => document.getElementById('hot-leads-card')?.scrollIntoView({ behavior: 'smooth' }),
  },
]);
</script>
```

Note: verify the KPI source paths against the API response shape in `server/api/admin/analytics/dashboard.get.ts` return block while implementing; if `taskStats.overdue` lives under another key (e.g. `tasks.overdue`), use the actual key.

- [ ] **Step 2: Typecheck gate.**

- [ ] **Step 3: Commit**

```bash
git add app/components/admin/dashboard/TodayKpiStrip.vue
git commit -m "feat(dashboard): Today KPI strip with click-throughs"
```

---

### Task 4: `ActionZone.vue` (move: Hot Leads 735–809, Overdue Follow-ups 883–930, Recent Activity 1142–1197, Quick Actions 1239–1302)

**Files:**
- Create: `app/components/admin/dashboard/ActionZone.vue`
- (Markup source) `app/pages/admin/index.vue` line ranges above, pre-refactor numbering.

**Interfaces:**
- Consumes: `DashboardData`; helpers per the helper-resolution procedure.
- Produces: `<ActionZone :data="data" />` rendering a `grid gap-6 lg:grid-cols-2` with the four cards. The Hot Leads root Card gets `id="hot-leads-card"` (Task 3's scroll target).

- [ ] **Step 1: Create shell**

```vue
<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <!-- moved: Hot Leads (add id="hot-leads-card" to its root Card) -->
    <!-- moved: Overdue Follow-ups -->
    <!-- moved: Quick Actions -->
    <!-- moved: Recent Activity -->
  </div>
</template>

<script setup lang="ts">
import type { DashboardData } from './types';
const props = defineProps<{ data: DashboardData }>();
</script>
```

- [ ] **Step 2: Move the four markup blocks** verbatim from the listed line ranges into the shell, replacing the placeholder comments, in that order.

- [ ] **Step 3: Resolve identifiers** per the helper-resolution procedure (expected: `formatTimeAgo`, `formatStatus`, `getStatusVariant`, `getLeadScoreClass`, `formatCurrency` from the util; icons; `navigateToEnquiries`-style navigation closures move in and use `navigateTo` directly).

- [ ] **Step 4: Empty states** — inside the moved Hot Leads and Overdue and Recent Activity cards, where their list `v-for` containers are, add the sibling zero-state (spec §5):

```html
<p v-if="!data?.hotLeads?.length" class="py-6 text-center text-sm text-muted-foreground">No hot leads right now</p>
```

(equivalently `overdueFollowups` / `recentActivity` keys — use the keys the moved markup already iterates).

- [ ] **Step 5: Typecheck gate.**

- [ ] **Step 6: Commit**

```bash
git add app/components/admin/dashboard/ActionZone.vue
git commit -m "feat(dashboard): action zone (hot leads, overdue, quick actions, activity)"
```

---

### Task 5: `SalesTab.vue` (move: Sales Targets 116–197, Conversion Funnel 810–882, Department Cards 931–994, Enquiry Trends 995–1045, Response Performance 1046–1120, Pipeline Status 1121–1141, plus Total Enquiries + This Week cards from 33–93)

Same shell pattern as Task 4 (prop `data`, root `<div class="space-y-6">`), same steps: shell → verbatim move in the listed order → helper resolution (expected data-dependent movers: `sortedDepartments`, `pipelineStatuses`, `chartTypes`, `selectedChartType`, `dateRange`, `getBarHeight`, `getDeptIcon`/`getDeptBgClass`/`getDeptTextClass`, `getModelInterestWidth`) → empty states for list cards → typecheck gate → commit `feat(dashboard): sales & pipeline tab`.

---

### Task 6: `MarketingTab.vue` (move: Channel Performance 198–310, Top Campaigns 311–361)

Same pattern. Expected movers: `getChannelWidth` (data-dependent — reads a max), campaign list formatting from util. Empty state for campaigns list. Commit `feat(dashboard): marketing tab`.

---

### Task 7: `CustomersTab.vue` (move: Retention Quick Stats 362–422, Deep Dive 423–541, Task Breakdown & Priority 542–608, At-Risk list & Vehicle Interest 609–732)

Same pattern. Expected movers: `lifecycleStagesOrdered`, `getLifecycleCount/Percent/Color/BarColor`, `getEngagementScoreColor`, `getRiskScoreColor`, `getTaskTypeIcon`, `getVehicleInterestPercent` (most read `data` → move into component using `props.data`). Empty state for the at-risk list. Commit `feat(dashboard): customers tab`.

---

### Task 8: `InventoryTab.vue` (move: Vehicle Catalog 1367–1460, Test Drives 1461–1527, Accessories & Offers 1528–1627)

Same pattern. Empty states for top-models, upcoming test drives, offers lists. Commit `feat(dashboard): inventory & test drives tab`.

---

### Task 9: `TeamTab.vue` (move: Team Performance 1198–1238, Staff Workload 1303–1366)

Same pattern. Expected movers: `getInitials`/`getGravatarUrl` (util / existing import), `getWorkloadBorderClass`, `getWorkloadBadgeVariant`. Empty state for leaderboard. Commit `feat(dashboard): team tab`.

---

### Task 10: Rewrite `app/pages/admin/index.vue` as composition + URL-synced lazy tabs

**Files:**
- Modify: `app/pages/admin/index.vue` (template collapses to ~120 lines; script keeps: page meta, greeting, `useFetch`, refresh, alert-banner logic, tab state)

**Interfaces:**
- Consumes: all components from Tasks 3–9; `Tabs, TabsList, TabsTrigger, TabsContent` from `~/components/ui/tabs`.

- [ ] **Step 1: Replace the template** with:

```vue
<template>
  <div class="space-y-6">
    <!-- keep: existing Header block (lines 3–32) verbatim -->
    <!-- keep: existing Alert banner block (lines 95–115) verbatim -->

    <TodayKpiStrip :data="data" />
    <ActionZone :data="data" />

    <Tabs :model-value="activeTab" @update:model-value="onTabChange">
      <TabsList class="grid w-full grid-cols-2 sm:grid-cols-5">
        <TabsTrigger value="sales">Sales &amp; Pipeline</TabsTrigger>
        <TabsTrigger value="marketing">Marketing</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
        <TabsTrigger value="inventory">Inventory &amp; Test Drives</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>
      <TabsContent value="sales"><SalesTab v-if="visited.sales" :data="data" /></TabsContent>
      <TabsContent value="marketing"><MarketingTab v-if="visited.marketing" :data="data" /></TabsContent>
      <TabsContent value="customers"><CustomersTab v-if="visited.customers" :data="data" /></TabsContent>
      <TabsContent value="inventory"><InventoryTab v-if="visited.inventory" :data="data" /></TabsContent>
      <TabsContent value="team"><TeamTab v-if="visited.team" :data="data" /></TabsContent>
    </Tabs>
  </div>
</template>
```

- [ ] **Step 2: Script — tab state synced to URL, lazy-render bookkeeping**

```ts
const TAB_VALUES = ['sales', 'marketing', 'customers', 'inventory', 'team'] as const;
type TabValue = typeof TAB_VALUES[number];

const route = useRoute();
const router = useRouter();

const initialTab: TabValue = TAB_VALUES.includes(route.query.tab as TabValue)
  ? (route.query.tab as TabValue)
  : 'sales';
const activeTab = ref<TabValue>(initialTab);
const visited = reactive<Record<TabValue, boolean>>({
  sales: false, marketing: false, customers: false, inventory: false, team: false,
});
visited[initialTab] = true;

function onTabChange(value: string | number | null) {
  const tab = String(value) as TabValue;
  if (!TAB_VALUES.includes(tab)) return;
  activeTab.value = tab;
  visited[tab] = true;
  router.replace({ query: { ...route.query, tab } });
}
```

- [ ] **Step 3: Prune the script** — delete every helper/constant/icon import that now lives only in the util or a component (the typecheck's "declared but never read" plus a manual grep per identifier confirm safety). Keep: page meta, `userState`/`greetingName`, `useFetch`, `refresh`, anything the header/banner markup references.

- [ ] **Step 4: Typecheck gate** (baseline from Task 0; expect *at or below* baseline since dead identifiers are removed).

- [ ] **Step 5: Sanity render** — `npm run dev` and load `/admin`: page renders, KPI strip + action zone visible, each tab click renders its sections, `?tab=` updates, hard reload on `?tab=marketing` opens Marketing.

- [ ] **Step 6: Commit**

```bash
git add app/pages/admin/index.vue
git commit -m "feat(dashboard): compose page from KPI strip, action zone, URL-synced lazy tabs"
```

---

### Task 11: Full verification

- [ ] **Step 1:** `npx tsx --test test/*.test.ts` → all pass (67 expected).
- [ ] **Step 2:** `npx nuxt typecheck 2>&1 | grep -c "error TS"` → ≤ Task 0 baseline.
- [ ] **Step 3:** `npm run build` → completes without new errors.
- [ ] **Step 4:** Push branch; Netlify deploy-preview; visually confirm the five tabs, KPI click-throughs, empty states.

## Self-Review Notes

- **Spec coverage:** layout (§2) → Tasks 3, 4, 10; mapping table (§3) → Tasks 4–9 cover every row; component architecture (§4, as amended) → Tasks 1–9; polish (§5) → empty states in Tasks 4–9, spacing + click-throughs in Tasks 3/10, consistent headers enforced during moves; data flow (§6) → single fetch preserved (Task 10); testing (§7) → Tasks 0/10/11.
- **Placeholders:** the "moved:" comments in shells are instructions to paste specific line ranges — the content exists in the repo; nothing is TBD. Helper resolution is a deterministic procedure, not deferred design.
- **Type consistency:** `DashboardData` prop named `data` in every component; `visited`/`activeTab`/`onTabChange` names match between template and script in Task 10.
