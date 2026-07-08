# Goal: Email lead-ingest LIVE end-to-end for Werribee Toyota

**Created:** 2026-07-08 (from HANDOFF-2026-07-08-crm-dashboard-ingest.md)
**Status:** ACTIVE

---

## Goal Statement

A carsales (ADF/XML) or Google lead emailed to `leads@<domain>` lands as a lead in
toyota-theme-nuxt for the Werribee Toyota dealer — parsed, deduplicated, and visible —
with the whole pipeline verified against the real fixture, not just unit tests.

Everything is built (toyota PR #1); this goal is about **switching it on and proving it**.

## Why This Goal

The ingest triad (Meta + Google webhooks + email) is complete in code but delivers zero
value until the Cloudflare route exists, a dealer is provisioned, and PR #1 is merged.
It is the highest-leverage unfinished thread from the 2026-07-08 session.

## Success Criteria

- [ ] Cloudflare: leads domain registered, Email Routing enabled, worker deployed with
      `INGEST_URL`, `leads@<domain>` routed to worker
      *(user-only — runbook: `toyota-theme-nuxt/docs/ops/email-leads-setup.md`)*
- [ ] toyota PR #1 reviewed and merged into `feat/cms-catalog-slice1`
- [ ] Werribee Toyota provisioned: dealer row + `settings.marketing.emailLeadsToken`
      (token via `openssl rand -hex 24`; SQL in runbook)
- [ ] Live drive: ADF fixture emailed through the real route creates exactly one lead;
      re-send is idempotent (`lead_ingestion_log`); bad token / malformed payload
      returns per spec
- [ ] carsales / Google lead delivery pointed at the routed address

## Development Track (DONE 2026-07-08 — uncommitted, in working tree)

- [x] HTML-escape the bloods custom per-form email template path — `replaceMergeTags`
      extracted to pure `server/utils/emailTemplate.ts`, `{ html: true }` on bodyHtml
      call sites, `$&`-pattern injection also fixed; 5 tests in `test/email-template.test.ts`
- [x] Root-cause the destructive-token rendering bug — global link rule in
      `main.scss:501` stacks 13 `:not(.class)` → specificity (0,13,1), crushing all
      text-* utilities on `as-child` anchors. Fixed via `.ui-button` marker class on
      buttonVariants + `:not(.ui-button)` exclusion; 4 call-site workarounds reverted

## Ownership Split

| Who | What |
|-----|------|
| **User (account access)** | Cloudflare domain + Email Routing + `wrangler deploy`; PR #1 approval; pointing carsales/Google at the address |
| **Agent (next session)** | PR #1 review support, provisioning SQL, live-drive verification, fixture testing, stretch bug hunts |

## Key References

- Handoff: `.paul/HANDOFF-2026-07-08-crm-dashboard-ingest.md`
- Runbook: `toyota-theme-nuxt/docs/ops/email-leads-setup.md`
- Spec: `toyota-theme-nuxt/docs/superpowers/specs/2026-07-08-email-lead-ingest-design.md`
- Plan: `toyota-theme-nuxt/docs/superpowers/plans/2026-07-08-email-lead-ingest.md`
- Infra: Neon org ADME (`org-flat-cell-27826575`); toyota default branch `feat/cms-catalog-slice1`
