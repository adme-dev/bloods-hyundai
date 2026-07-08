# PAUL Session Handoff

**Session:** 2026-07-08 (full day)
**Context:** CRM audit→remediation→production; admin dashboard restructure; email lead-ingest system for toyota-theme-nuxt.

---

## Session Accomplishments

### bloods-hyundai (ALL LIVE on production: bloodhyundai.com.au + bloods-hyundai.netlify.app; both deploy from `main`)
- **CRM audit** (4 parallel agents + verification): ~30 defects found (credential leak, 6+ IDORs, 3-way enquiry-status vocabulary split, `user.id` undefined everywhere, broken customer pagination, dead UI).
- **Full remediation, 5 waves** (PRs #2 feature-branch, #3 main): identity fix, atomic dealer-scoped status/notes, credential leak sealed, canonical statuses end-to-end (intake→UI→analytics), customer list rewritten in SQL, notifications per-item read state, task IDOR + overdue reconciliation, dashboard canonical metrics, Edit Customer/Add Vehicle/bulk actions/tasks page built.
- **DB migrations applied to production Neon** (`bloods-hyundai` project `cold-sound-73227570`): status normalization (42 enquiries → `new_lead`, reversible via `enquiry_activity_log` `status_migrated` rows) + `users.read_notification_ids`. Post-deploy sweep ran clean.
- **Dashboard restructure** (PR #4): 2,038-line page → Today KPI strip + Action Zone + 5 URL-synced lazy tabs (`app/components/admin/dashboard/`). Follow-ups: #5 button contrast (destructive-token renders broken on some elements — worked around with explicit `bg-red-600 text-white`; root cause NOT found), #6 row truncation + trends-chart percentage-height fix + removed unused `tailwindcss` v3 / `@tailwindcss/vite` v4 / `@nuxtjs/tailwindcss` packages, #7 **site-config cache poisoning fix** (degraded fallbacks no longer cached; were hiding nav site-wide 10–40 min; cache key v2→v3).
- Typecheck baseline improved 570→532 (bloods). Tests 36/36 on main.

### toyota-theme-nuxt (PR #1 OPEN, NOT merged — targets active WIP branch `feat/cms-catalog-slice1`)
- **Email lead-ingest** (branch `feat/email-lead-ingest`): completes triad (Meta/Google webhooks pre-existed). New `server/utils/emailLeadParser.ts` (carsales ADF/XML + generic; 6 fixture tests), `server/api/webhooks/email-leads/[token].post.ts` (token→dealer via `settings.marketing.emailLeadsToken`, idempotent via `lead_ingestion_log`, always-200 post-auth), Cloudflare Email Worker `scripts/cloudflare/email-leads-worker.js`, runbook `docs/ops/email-leads-setup.md`. 415/415 tests, typecheck at 610 baseline.
- Spec + plan committed in that repo under `docs/superpowers/{specs,plans}/2026-07-08-email-lead-ingest*`.

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Legacy status mapping: `new→new_lead`, `in_progress/contacted→appointment_set`, `closed→sold` | Both legacy values meant "service appointment exists"; user approved |
| CRM fixes cherry-picked to `main` (PR #3) instead of merging the 42-commit theme branch | Production got only CRM fixes; theme rework stays isolated |
| Dashboard: destructive buttons use explicit red-600/white, not the token | Token renders broken on buttons (unsolved cascade gremlin); explicit classes are deterministic |
| Ingest tenant resolution: token-per-dealer (`emailLeadsToken`), not `leads+slug@` parsing | Matches existing google-leads pattern in toyota repo |
| Ingest transport: Cloudflare Email Routing + Worker (user-directed), SendGrid Inbound Parse compatible | User registering a leads domain in Cloudflare |
| werribee-toyota-new = reference only; build target = toyota-theme-nuxt | User correction mid-design |

---

## Gaps / Open Items

### Destructive-token rendering bug (bloods)
**Status:** DEFERRED (worked around). Badge renders fine, Button broken with identical classes; `@property` vars all registered; not root-caused. If other faded red buttons appear in admin (delete buttons etc.), hunt globally.
### Custom per-form email templates not HTML-escaped (bloods)
**Status:** DEFERRED. Default templates escaped; merge-tag path (`replaceMergeTags`) is not context-aware.
### Werribee Toyota not provisioned as dealer/tenant
**Status:** PENDING onboarding (dealer row + `settings.marketing.emailLeadsToken`).
### toyota PR #1 unmerged
**Status:** awaiting user review; targets their WIP branch.

---

## User Actions Required (only they can do)

1. **Cloudflare:** register leads domain, enable Email Routing, `wrangler deploy` worker with `INGEST_URL`, route `leads@<domain>` → worker (runbook: `toyota-theme-nuxt/docs/ops/email-leads-setup.md`).
2. **Per dealer:** generate token (`openssl rand -hex 24`), SQL in runbook, point carsales/Google lead delivery at the routed address.
3. Review/merge toyota PR #1.

---

## Reference Files for Next Session

```
bloods-hyundai/docs/superpowers/specs/2026-07-08-crm-remediation-design.md
bloods-hyundai/docs/superpowers/specs/2026-07-08-admin-dashboard-restructure-design.md
bloods-hyundai/scripts/migrations/*.sql            (both applied to prod)
toyota-theme-nuxt/docs/superpowers/specs/2026-07-08-email-lead-ingest-design.md
toyota-theme-nuxt/docs/superpowers/plans/2026-07-08-email-lead-ingest.md
toyota-theme-nuxt/docs/ops/email-leads-setup.md    (Cloudflare runbook)
```

Key infra: Neon org ADME (`org-flat-cell-27826575`), bloods prod project `cold-sound-73227570`; Netlify sites `bloodhyundai` (5188455b…, custom domain, prod branch `main`) + `bloods-hyundai` (222af42a…, same repo/branch). toyota repo default branch is `feat/cms-catalog-slice1`.

---

## Prioritized Next Actions

| Priority | Action |
|----------|--------|
| 1 | User: Cloudflare domain + Email Routing + worker deploy (runbook) |
| 2 | Review/merge toyota PR #1; live-drive with the ADF fixture |
| 3 | Provision Werribee Toyota dealer row + token |
| 4 | Optional: root-cause destructive-token bug; escape custom email templates |

---

## State Summary

**Current:** bloods-hyundai fully shipped (main `0507b49`+); toyota `feat/email-lead-ingest` pushed, PR #1 open.
**Next:** User account actions (Cloudflare), then merge PR #1.
**Resume:** read this handoff; specs/plans/runbooks above carry full detail.

*Handoff created: 2026-07-08 ~19:30 AEST*
