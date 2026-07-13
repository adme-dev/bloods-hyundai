# Marketing Hub Explainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a help/explainer dialog to `/admin/marketing-report` with curated plain-English explanations per metric plus an optional Groq-generated, client-ready period narrative, per `docs/superpowers/specs/2026-07-13-marketing-hub-explainer-design.md`.

**Architecture:** Three new units — a typed content module, a shadcn Dialog component, a Groq-backed server endpoint — plus small template/style touches in `app/pages/admin/marketing-report.vue`.

**Tech Stack:** Nuxt 3 / Vue 3, shadcn-vue dialog + button (`~/components/ui/*`), UnoCSS Tailwind-preset utilities, `groq-sdk` (already a dependency, ^0.37.0), h3 server route.

## Global Constraints

- **The dialog teleports to `<body>`** — it must use only global Tailwind/shadcn utility classes (`text-muted-foreground`, `bg-muted`, etc.), NEVER `marketing-hub__*` classes or page-scoped CSS vars.
- Groq conventions copied from `server/services/groq-enrichment.ts`: `new Groq({ apiKey: process.env.AI_API_KEY || process.env.GROQ_API_KEY })`, model constant `llama-3.1-8b-instant`, graceful disable (console.warn + feature off) when the key is missing — never a 500 for a missing key.
- Auth guard identical to `marketing-report.get.ts`: `const user = event.context.user; if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' });`
- Data-truth rules: explanations present possibilities, never asserted causes; the AI prompt forbids inventing numbers; AI output is labeled "AI-generated — review before sending".
- **No test runner exists in this repo.** Per-task verification is `npm run typecheck`; final gate `npm run build` + manual browser pass.
- Commits: add ONLY the files each task names. NEVER `git add -A` or `git add .` (working tree has unrelated changes).
- Status colors: amber for the AI-error notice (warning), never red (red = actionable failure only).

---

### Task 1: Curated content module

**Files:**
- Create: `app/components/admin/marketing/explainerContent.ts`

**Interfaces:**
- Produces: `ExplainerTopicKey` union type, `ExplainerTopic` interface, `explainerTopics: ExplainerTopic[]` (ordered array) — consumed by Task 2's component and Task 4's page imports.

- [ ] **Step 1: Create the module with this exact content**

```ts
export type ExplainerTopicKey =
  | 'unmatched-banner'
  | 'crm-leads'
  | 'ad-spend'
  | 'website-activity'
  | 'utm-coverage'
  | 'data-layer-audit'
  | 'cpl-reconciliation';

export interface ExplainerTopic {
  key: ExplainerTopicKey;
  title: string;
  measures: string;
  whyAlarming: string;
  whatGoodLooksLike: string;
  whatToCheck: string[];
}

export const explainerTopics: ExplainerTopic[] = [
  {
    key: 'unmatched-banner',
    title: 'Why "no CRM leads matched to paid media"?',
    measures:
      'This banner compares synced ad spend with CRM leads that carry paid-platform evidence — UTM tags or click IDs tying a lead to a specific ad. Spend showing here means the platform connection is working.',
    whyAlarming:
      'It reads like the spend produced nothing. Zero matches has four common, honest explanations: campaigns whose objective is awareness or traffic rather than leads; campaigns still pending or in their learning phase; tracking feeds not live yet; and leads arriving by phone or walk-in, which never carry ad tags.',
    whatGoodLooksLike:
      'For lead-generation campaigns with live tracking, most paid leads should carry platform evidence. For periods running only awareness or traffic campaigns, zero matches is expected — not a fault.',
    whatToCheck: [
      'Which campaign objectives ran this period — lead-gen, or awareness/traffic',
      'Whether campaigns were pending, in learning, or waiting on feeds during the period',
      'UTM tags and click-ID capture on every paid ad final URL',
      'Whether the period\'s leads arrived via phone, walk-in or marketplace channels that never carry tags',
    ],
  },
  {
    key: 'crm-leads',
    title: 'Admin CRM leads',
    measures:
      'Enquiries captured in this CRM during the selected period — website forms, phone, walk-in and marketplace leads — regardless of what marketing drove them.',
    whyAlarming:
      'A low count next to a visible ad spend looks like the spend "bought" only these leads. The two numbers come from different systems: spend syncs from the ad platforms, while leads are what actually reached the CRM. Awareness or traffic campaigns can spend without creating form-fill leads.',
    whatGoodLooksLike:
      'Lead volume in line with the campaigns that are genuinely lead-gen. Judge lead-gen campaigns on leads; judge awareness or traffic campaigns on reach and clicks.',
    whatToCheck: [
      'Which campaign objectives ran this period',
      'Whether the period includes days before campaigns went live',
      'Whether phone and walk-in enquiries are being logged in the CRM',
    ],
  },
  {
    key: 'ad-spend',
    title: 'Ad spend',
    measures:
      'Total spend synced from the connected ad platforms (Meta and Google) for the selected period.',
    whyAlarming:
      'Spend shows even when no leads match it, so it can read as money without results. The blended cost-per-lead beneath it divides all spend by matched leads, so it is only meaningful when lead-gen campaigns are running.',
    whatGoodLooksLike:
      'Spend you can assign to a named objective. A blended CPL judged only against lead-gen spend.',
    whatToCheck: [
      'Campaign objectives for the spend in this period',
      'Campaigns pending or in learning — spend without full delivery yet',
      'Whether CPL is being read against awareness spend, where it does not apply',
    ],
  },
  {
    key: 'website-activity',
    title: 'Website activity',
    measures:
      'GA4 sessions for the period, with key events (the conversion actions configured in GA4) as the caption.',
    whyAlarming:
      'High sessions next to few CRM leads can look like the website is failing. Sessions count all visits — service customers, parts lookups, existing owners — not just in-market buyers, and many real enquiries arrive by phone rather than forms.',
    whatGoodLooksLike:
      'Steady sessions with key events tracking the actions that matter (form submits, calls, direction clicks) so the two numbers can be compared honestly.',
    whatToCheck: [
      'Which key events are configured in GA4 and whether they match real enquiry actions',
      'Whether phone-call enquiries are tracked as events or only appear in the CRM',
    ],
  },
  {
    key: 'utm-coverage',
    title: 'UTM coverage',
    measures:
      'The share of this period\'s CRM leads that arrived carrying UTM parameters — the tags that record which campaign, source and medium drove the lead.',
    whyAlarming:
      'With few leads the percentage swings hard: 33.3% can simply mean one of three leads carried tags. It measures tagging completeness, not marketing performance.',
    whatGoodLooksLike:
      '80% or higher. Sustained low coverage usually means some entry points (phone, chat, marketplaces) never carry tags, or ad links are missing UTMs.',
    whatToCheck: [
      'UTM tags on every paid ad final URL',
      'Whether the untagged leads came from phone, walk-in or marketplace sources',
      'Lead volume — below roughly ten leads, read the count, not the percentage',
    ],
  },
  {
    key: 'data-layer-audit',
    title: 'Data Layer Audit',
    measures:
      'Field-by-field coverage of the lead-tracking contract: how many of the period\'s leads carried UTMs, a source, a campaign tag, paid-platform evidence, a click ID, or backfilled attribution.',
    whyAlarming:
      'A 0% row means none of the period\'s leads carried that field — with three leads, one field missing on all of them reads as total failure. Source coverage at 100% alongside 0% click-ID coverage typically means leads are captured correctly but did not come from ad clicks.',
    whatGoodLooksLike:
      'UTM coverage at 80% or higher and source coverage at 95% or higher. Click-ID and paid-attribution rows only apply to ad-click leads, so they sit at 0% whenever no ad-click leads arrived.',
    whatToCheck: [
      'Which rows apply to this period\'s lead mix — ad-click fields are expected to be 0% without ad-click leads',
      'Whether website forms pass UTMs and click IDs through to the CRM',
      'Lead volume before treating any percentage as a trend',
    ],
  },
  {
    key: 'cpl-reconciliation',
    title: 'Campaign CPL Reconciliation',
    measures:
      'Each ad campaign\'s spend alongside the platform\'s own reported leads and the CRM leads matched back to that campaign.',
    whyAlarming:
      'Zero platform leads against real spend usually means the campaign is not optimising for leads — the platform itself reports none — rather than tracking losing them. Zero CRM matches on top of that follows from the same cause.',
    whatGoodLooksLike:
      'Lead-gen campaigns showing platform leads and CRM matches. Awareness and traffic rows showing clicks and impressions, with CPL treated as not applicable.',
    whatToCheck: [
      'Each campaign\'s objective before reading its CPL column',
      'Whether platform-reported leads and CRM matches diverge on lead-gen campaigns (a real tracking question)',
    ],
  },
];
```

- [ ] **Step 2: Verify** — Run: `npm run typecheck` — exit 0, no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/admin/marketing/explainerContent.ts
git commit -m "feat(admin): curated explainer content for marketing hub"
```

---

### Task 2: ExplainerDialog component

**Files:**
- Create: `app/components/admin/marketing/ExplainerDialog.vue`

**Interfaces:**
- Consumes: `explainerTopics`, `ExplainerTopicKey` from Task 1; `Dialog`/`DialogScrollContent`/`DialogHeader`/`DialogTitle`/`DialogDescription` from `~/components/ui/dialog`; `Button` from `~/components/ui/button`.
- Produces: component with props `{ open: boolean; topic: ExplainerTopicKey | null; from: string; to: string }`, emit `update:open` — consumed by Task 4.

- [ ] **Step 1: Create the component**

```vue
<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="max-w-xl">
      <DialogHeader>
        <DialogTitle>Understanding this report</DialogTitle>
        <DialogDescription>
          Plain-English notes on every number, plus an optional AI summary of this period.
        </DialogDescription>
      </DialogHeader>

      <section class="rounded-lg border bg-muted/40 p-4">
        <h3 class="text-sm font-semibold">Explain this period</h3>
        <p class="mt-1 text-xs text-muted-foreground">
          Generates a client-ready summary from this period's actual figures.
        </p>
        <div v-if="aiState === 'idle'" class="mt-3">
          <Button size="sm" @click="generate">Explain this period</Button>
        </div>
        <div v-else-if="aiState === 'loading'" class="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw class="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Generating summary…
        </div>
        <p v-else-if="aiState === 'unavailable'" class="mt-3 text-xs text-muted-foreground">
          AI summary not configured for this environment.
        </p>
        <p v-else-if="aiState === 'error'" class="mt-3 text-xs text-amber-600 dark:text-amber-400">
          Couldn't generate a summary — the notes below still apply.
          <button type="button" class="underline" @click="generate">Try again</button>
        </p>
        <div v-else class="mt-3 space-y-2">
          <p class="text-[11px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
            AI-generated — review before sending
          </p>
          <p class="whitespace-pre-wrap text-sm leading-relaxed">{{ narrative }}</p>
          <div class="flex gap-2">
            <Button size="sm" variant="outline" @click="copyNarrative">{{ copied ? 'Copied' : 'Copy' }}</Button>
            <Button size="sm" variant="ghost" @click="generate">Regenerate</Button>
          </div>
          <p v-if="copyFailed" class="text-xs text-muted-foreground">Copy failed — select the text manually.</p>
        </div>
      </section>

      <section
        v-for="t in explainerTopics"
        :key="t.key"
        :ref="el => setSectionEl(t.key, el)"
        class="-mx-3 space-y-2 rounded-lg p-3 transition-colors"
        :class="{ 'bg-primary/5 ring-1 ring-primary/30': highlighted === t.key }"
      >
        <h3 class="text-sm font-semibold">{{ t.title }}</h3>
        <p class="text-sm text-muted-foreground">
          <strong class="font-medium text-foreground">What it measures: </strong>{{ t.measures }}
        </p>
        <p class="text-sm text-muted-foreground">
          <strong class="font-medium text-foreground">Why it can look alarming: </strong>{{ t.whyAlarming }}
        </p>
        <p class="text-sm text-muted-foreground">
          <strong class="font-medium text-foreground">What good looks like: </strong>{{ t.whatGoodLooksLike }}
        </p>
        <div>
          <p class="text-sm font-medium">What to check</p>
          <ul class="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li v-for="c in t.whatToCheck" :key="c">{{ c }}</li>
          </ul>
        </div>
      </section>
    </DialogScrollContent>
  </Dialog>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { RefreshCw } from 'lucide-vue-next';
import { Dialog, DialogDescription, DialogHeader, DialogScrollContent, DialogTitle } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { explainerTopics, type ExplainerTopicKey } from './explainerContent';

const props = defineProps<{
  open: boolean;
  topic: ExplainerTopicKey | null;
  from: string;
  to: string;
}>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

type AiState = 'idle' | 'loading' | 'success' | 'error' | 'unavailable';
const aiState = ref<AiState>('idle');
const narrative = ref('');
const copied = ref(false);
const copyFailed = ref(false);
const highlighted = ref<ExplainerTopicKey | null>(null);

const sectionEls = new Map<ExplainerTopicKey, HTMLElement>();
function setSectionEl(key: ExplainerTopicKey, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) sectionEls.set(key, el);
  else sectionEls.delete(key);
}

watch(() => props.open, async (open) => {
  if (!open) { highlighted.value = null; return; }
  if (!props.topic) return;
  highlighted.value = props.topic;
  await nextTick();
  sectionEls.get(props.topic)?.scrollIntoView({ block: 'start' });
});

async function generate() {
  aiState.value = 'loading';
  copied.value = false;
  copyFailed.value = false;
  try {
    const res = await $fetch<{ available: boolean; narrative?: string }>(
      '/api/admin/analytics/marketing-explain',
      { method: 'POST', body: { from: props.from, to: props.to } },
    );
    if (!res.available) { aiState.value = 'unavailable'; return; }
    narrative.value = res.narrative || '';
    aiState.value = narrative.value ? 'success' : 'error';
  }
  catch {
    aiState.value = 'error';
  }
}

async function copyNarrative() {
  copyFailed.value = false;
  try {
    await navigator.clipboard.writeText(narrative.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
  catch {
    copyFailed.value = true;
  }
}
</script>
```

- [ ] **Step 2: Verify** — Run: `npm run typecheck` — exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/admin/marketing/ExplainerDialog.vue
git commit -m "feat(admin): explainer dialog with groq period summary panel"
```

---

### Task 3: Groq explain endpoint

**Files:**
- Create: `server/api/admin/analytics/marketing-explain.post.ts`

**Interfaces:**
- Consumes: the existing report endpoint via internal `$fetch` (cookie-forwarded); `groq-sdk`.
- Produces: `POST /api/admin/analytics/marketing-explain` accepting `{ from, to }`, returning `{ available: false }` or `{ available: true, narrative, generatedAt }` — consumed by Task 2's `generate()`.

- [ ] **Step 1: Create the endpoint**

```ts
import Groq from 'groq-sdk';
import { createHash } from 'node:crypto';

const AI_MODEL = 'llama-3.1-8b-instant';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { narrative: string; generatedAt: string; expires: number }>();

const SYSTEM_PROMPT = `You write short summaries of a car dealership's marketing report for the dealer principal — a busy, non-technical reader.
Rules:
- 120 to 180 words, plain English, no jargon, no markdown, no headings, no bullet lists.
- Use ONLY the figures provided. Never invent numbers, percentages, causes or outcomes.
- When ad spend has no matched leads, present the honest possibilities (campaigns not optimising for leads, campaigns still ramping up, tracking tags not yet live, or leads arriving by phone/walk-in without tags) as possibilities — never assert one as fact.
- With small lead counts, note that percentages swing hard on few leads.
- Tone: calm, factual, client-ready — something an agency could paste into an email to the dealer.`;

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody<{ from?: unknown; to?: unknown }>(event);
  const from = typeof body?.from === 'string' ? body.from : '';
  const to = typeof body?.to === 'string' ? body.to : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw createError({ statusCode: 400, message: 'Invalid period' });
  }

  const apiKey = process.env.AI_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[MarketingExplain] AI_API_KEY not configured - AI summary disabled');
    return { available: false as const };
  }

  const report = await $fetch<any>('/api/admin/analytics/marketing-report', {
    query: { from, to },
    headers: { cookie: getHeader(event, 'cookie') || '' },
  });

  const metrics = {
    period: `${report.period.from} to ${report.period.to}`,
    adSpendAud: report.insights.executive.totalSpend,
    crmLeadsTotal: report.summary.totalCrmLeads,
    crmLeadsMatchedToPaid: report.summary.paidCrmLeads,
    platformReportedLeads: report.professionalMetrics.paidMedia.platformLeads,
    websiteSessions: report.platformMetrics.ga4.sessions,
    utmCoveragePct: report.summary.utmCoverage,
    campaignCoveragePct: report.summary.campaignCoverage,
    sourceCoveragePct: report.summary.sourceCoverage,
  };

  const hash = createHash('sha1').update(JSON.stringify(metrics)).digest('hex').slice(0, 12);
  const cacheKey = `${user.dealerId}:${from}:${to}:${hash}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) {
    return { available: true as const, narrative: hit.narrative, generatedAt: hit.generatedAt };
  }

  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: AI_MODEL,
    temperature: 0.3,
    max_tokens: 400,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Marketing report figures for the period ${metrics.period}:\n${JSON.stringify(metrics, null, 2)}\n\nWrite the summary.` },
    ],
  });

  const narrative = completion.choices[0]?.message?.content?.trim();
  if (!narrative) {
    throw createError({ statusCode: 502, message: 'AI summary generation failed' });
  }

  const generatedAt = new Date().toISOString();
  cache.set(cacheKey, { narrative, generatedAt, expires: Date.now() + CACHE_TTL_MS });
  return { available: true as const, narrative, generatedAt };
});
```

- [ ] **Step 2: Verify** — Run: `npm run typecheck` — exit 0.

- [ ] **Step 3: Smoke test the auth guard** (dev server assumed running on :3000)

Run: `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/admin/analytics/marketing-explain -H 'content-type: application/json' -d '{"from":"2026-07-01","to":"2026-07-13"}'`
Expected: `401`

- [ ] **Step 4: Commit**

```bash
git add server/api/admin/analytics/marketing-explain.post.ts
git commit -m "feat(admin): groq-backed marketing explain endpoint"
```

---

### Task 4: Wire entry points into marketing-report.vue

**Files:**
- Modify: `app/pages/admin/marketing-report.vue` (imports ~562-580, script state after line ~647, banner ~46-58, KPI tiles ~73-89, audit header ~446-449, CPL section head ~197, header range-wrap ~11-43, dialog instance before closing root div, scoped styles ~962+)

**Interfaces:**
- Consumes: `ExplainerDialog` (Task 2), `ExplainerTopicKey` (Task 1).

- [ ] **Step 1: Imports and state**

Add `CircleHelp` to the lucide import list. After the `useFetch` lines (~647), add:

```ts
const explainerOpen = ref(false);
const explainerTopic = ref<ExplainerTopicKey | null>(null);
function openExplainer(topic: ExplainerTopicKey | null = null) {
  explainerTopic.value = topic;
  explainerOpen.value = true;
}
```

Add to the script imports:

```ts
import ExplainerDialog from '~/components/admin/marketing/ExplainerDialog.vue';
import type { ExplainerTopicKey } from '~/components/admin/marketing/explainerContent';
```

- [ ] **Step 2: KPI tiles**

In `summaryCards` (~line 678), add a `topic` field to each entry with `as const` so it types as a literal, not `string` (otherwise `openExplainer(item.topic)` fails typecheck): `topic: 'crm-leads' as const`, `topic: 'ad-spend' as const`, `topic: 'website-activity' as const`, `topic: 'utm-coverage' as const`. In the KPI template (~lines 81-84), replace the label div with:

```vue
            <div class="marketing-hub__kpi-label">
              {{ item.label }}
              <span class="marketing-hub__kpi-trailing">
                <button
                  type="button"
                  class="marketing-hub__explain"
                  :aria-label="`Explain ${item.label}`"
                  @click="openExplainer(item.topic)"
                >
                  <CircleHelp aria-hidden="true" />
                </button>
                <component :is="item.icon" aria-hidden="true" />
              </span>
            </div>
```

- [ ] **Step 3: Banner link**

Inside the banner's text `<div>` (after the two `<p>` elements, ~line 55), add:

```vue
          <button type="button" class="marketing-hub__explain-link" @click="openExplainer('unmatched-banner')">
            What does this mean?
          </button>
```

- [ ] **Step 4: Audit + CPL headers**

Data Layer Audit `<h2>` (~line 447) — append inside the `<h2>`, after the quality span:

```vue
<button type="button" class="marketing-hub__explain" aria-label="Explain the Data Layer Audit" @click="openExplainer('data-layer-audit')"><CircleHelp aria-hidden="true" /></button>
```

CPL section head (~line 197) — append the same pattern inside the `<h2 id="campaign-title">` after its text: `aria-label="Explain CPL reconciliation"`, `@click="openExplainer('cpl-reconciliation')"`.

- [ ] **Step 5: Header Help button + dialog instance**

In `.marketing-hub__range-wrap`, after the `.marketing-hub__daterange` div (~line 31), add:

```vue
          <button type="button" class="marketing-hub__help" @click="openExplainer()">
            <CircleHelp aria-hidden="true" /> Help
          </button>
```

Before the closing `</div>` of the root `.marketing-hub` element, add:

```vue
    <ExplainerDialog v-model:open="explainerOpen" :topic="explainerTopic" :from="from" :to="to" />
```

- [ ] **Step 6: Styles**

In the scoped `<style>` block (after the existing `__panel-head` rules ~1035), add:

```css
.marketing-hub__kpi-trailing { display: inline-flex; align-items: center; gap: 6px; }
.marketing-hub__explain { display: inline-flex; align-items: center; padding: 2px; border: 0; background: none; color: var(--muted); cursor: pointer; }
.marketing-hub__explain:hover { color: var(--accent); }
.marketing-hub__explain svg { width: 14px; height: 14px; }
.marketing-hub__explain-link { margin-top: 6px; padding: 0; border: 0; background: none; color: var(--accent); cursor: pointer; font-size: 12.5px; font-weight: 600; text-decoration: underline; }
.marketing-hub__help { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--line); border-radius: 10px; background: none; color: inherit; cursor: pointer; font-size: 12.5px; font-weight: 600; }
.marketing-hub__help svg { width: 14px; height: 14px; }
```

(`--muted`, `--accent`, and `--line` are the token names this file's style block already uses — verified by grep: 39/15/29 existing usages respectively.)

- [ ] **Step 7: Verify** — Run: `npm run typecheck` — exit 0.

- [ ] **Step 8: Commit**

```bash
git add app/pages/admin/marketing-report.vue
git commit -m "feat(admin): explainer entry points across marketing hub"
```

---

### Task 5: Final verification

- [ ] **Step 1:** `npm run typecheck && npm run build` — both exit 0.
- [ ] **Step 2:** Auth smoke test (Task 3 Step 3 command) still returns 401.
- [ ] **Step 3:** Browser pass (manual if the Chrome extension is unavailable): every entry point opens the dialog to the right topic with highlight; AI panel states (generate → loading → narrative + Copy; error path by temporarily renaming the env key locally = unavailable note); light/dark; ≤700px (dialog scrolls internally, page doesn't scroll horizontally); Esc closes; no hydration warnings.
- [ ] **Step 4:** Report per the marketing-hub-admin-design skill: what changed, data/behavior preserved, verification performed, exceptions.
