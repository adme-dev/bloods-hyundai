# Marketing Hub Explainer ("Explain this") — Design

**Date:** 2026-07-13
**Scope:** New help/explainer dialog for `/admin/marketing-report` (Marketing Hub), with curated per-metric explanations plus an optional Groq-generated, client-ready period narrative.
**Driver:** Agency feedback (Clara, Slack 2026-07-13): dealers seeing "3 leads for $700 spend", "33.3% UTM coverage", and 0% attribution stats need an in-product, defensible explanation they can also forward to clients.

## Goal

Meet the dealer (or agency) at the moment of confusion: every alarming-looking number on the Marketing Hub gets a plain-English explanation one click away, and the agency gets a copy-paste-ready client narrative generated from the period's real figures.

## Architecture (Approach A — approved)

Three new units plus small template touches:

### 1. `app/components/admin/marketing/explainerContent.ts`

Typed curated-content module. Exported shape:

```ts
export type ExplainerTopicKey =
  | 'crm-leads' | 'ad-spend' | 'website-activity' | 'utm-coverage'
  | 'unmatched-banner' | 'data-layer-audit' | 'cpl-reconciliation';

export interface ExplainerTopic {
  key: ExplainerTopicKey;
  title: string;
  measures: string;      // what this number actually counts
  whyAlarming: string;   // why it can look bad while being explainable
  whatGoodLooksLike: string; // targets, using thresholds already coded in the report (UTM ≥80%, source ≥95%)
  whatToCheck: string[]; // concrete next actions
}
```

Copy requirements (data-truth rules apply — possibilities, never asserted causes):

- **`unmatched-banner`** (Clara's #1): spend is synced from ad platforms; leads are CRM enquiries; a lead counts as *paid-matched* only when it carries platform evidence (UTMs / click IDs). Zero matches has four honest possible causes, all listed: (1) campaigns with non-lead-gen objectives (awareness/traffic), (2) campaigns pending or in learning, (3) tracking feeds not yet live, (4) leads arriving by phone/walk-in that never carry tags.
- **`utm-coverage`**: define UTM coverage; call out the small-denominator effect explicitly ("33.3% can mean 1 of 3 leads — small samples swing hard"); target ≥80%.
- **`data-layer-audit`**: one-liner per audit stat (UTM, source, campaign, paid attribution, click-ID, backfilled) with its threshold and what 0% means when lead volume is low.
- **`crm-leads` / `ad-spend` / `website-activity` / `cpl-reconciliation`**: what each counts, its source system, and why spend and lead counts are not a ratio when objectives aren't lead-gen.

### 2. `app/components/admin/marketing/ExplainerDialog.vue`

- shadcn `Dialog` + `DialogScrollContent` from `~/components/ui/dialog`; visual styling consistent with the Marketing Hub design system (14px radius, muted ink, 11px eyebrows; no new colors).
- Props: `open: boolean`, `topic: ExplainerTopicKey | null`. Emits `update:open`. When opened with a topic, scrolls to / visually highlights that section; header Help button opens with `topic: null` (top of dialog).
- Layout: "Explain this period" AI panel at top, then all curated topics as titled sections.
- AI panel states: idle (button "Explain this period"), loading, success (narrative + visible "AI-generated — review before sending" label + Copy button), error (amber inline note: "Couldn't generate a summary — the notes below still apply"), unavailable (muted note "AI summary not configured for this environment"; shown only after the endpoint reports `available: false`).
- Copy button uses the Clipboard API; confirms with a transient "Copied" state.

### 3. `server/api/admin/analytics/marketing-explain.post.ts`

- Auth: `event.context.user` guard with 401, `user.dealerId` scoping — same as `marketing-report.get.ts`.
- Body: `{ from: string, to: string }` (same period params the report uses). The endpoint **recomputes** the summary metrics server-side by reusing the report's data path — client-sent numbers are never trusted.
- Groq call following `server/services/groq-enrichment.ts` conventions: `new Groq({ apiKey: process.env.AI_API_KEY || process.env.GROQ_API_KEY })`; if no key, return `{ available: false }` (HTTP 200) and log a console warning — never a 500.
- Model: `llama-3.1-8b-instant` (constant, same as the proven enrichment service; upgrading to a 70B Groq model later is a one-line change). Low temperature (0.3), `max_tokens` ≈ 400.
- Prompt: system message carries the curated framing rules — dealer-principal audience, 120–180 words, plain English, present possibilities not assertions, use ONLY the metrics provided, never invent numbers or causes. User message carries the period label and exact metrics (spend, CRM leads, paid-matched leads, coverage percentages, platform lead counts).
- Response: `{ available: true, narrative: string, generatedAt: string }`.
- Cache: module-scope in-memory `Map` keyed `dealerId:from:to:<hash of metrics>`; entries expire after 6 hours or when the metrics hash changes. Cache hit skips the Groq call.

### 4. Template touches in `app/pages/admin/marketing-report.vue`

- Info button (`CircleHelp` lucide icon, real `<button>` with `aria-label="Explain <metric>"`) on: each of the four summary KPI tiles, the Data Layer Audit section header, and the CPL Reconciliation panel header.
- "What does this mean?" text button appended to the attribution banner (both `unmatched` and not-connected variants open `unmatched-banner`).
- Help button in the page header controls (opens dialog untargeted).
- One `ExplainerDialog` instance at page root; `ref` state for `open`/`topic`.

## Data flow

Curated content is static — no fetch. AI narrative: user clicks → POST `/api/admin/analytics/marketing-explain` with the page's current `from`/`to` → server recomputes metrics → Groq → narrative rendered + cached. The dialog never blocks on the AI call, and no AI call happens without an explicit click.

## Error handling

- Missing key → `available: false` → muted note (feature invisible-cost, never broken).
- Groq/API error → amber inline error, curated content untouched, retry allowed.
- Clipboard failure → show "Copy failed — select the text manually" note; the narrative text remains selectable.
- Endpoint validates `from`/`to` (same validation approach as the report endpoint, 366-day max range).

## Out of scope (YAGNI)

- No chat/follow-up questions; single-shot narrative only.
- No persistence of narratives to the database.
- No per-tile popovers; the dialog is the single surface.
- No changes to the report GET endpoint or sync pipeline.

## Verification

- `npm run typecheck`, `npm run build`.
- Endpoint: unauthenticated request → 401; missing-key path → `{ available: false }`; happy path exercised in dev against real Groq (key present in Netlify; local `.env` may lack it — the unavailable path IS the local test).
- Browser pass: each entry point opens the dialog to the right topic; AI states (loading/success/copy/error); light/dark; ≤700px (dialog scrolls internally, no page scroll); keyboard: buttons focusable, dialog trap + Esc per shadcn defaults; no hydration warnings.
