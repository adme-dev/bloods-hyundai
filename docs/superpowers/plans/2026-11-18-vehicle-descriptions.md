# Vehicle Descriptions Implementation Plan

**Goal:** Keep dealer comments visible and provide the approved three display options.
**Architecture:** A shared pure resolver, tenant-scoped settings endpoints, and an admin settings page. Existing enrichment remains untouched.
**Tech stack:** Nuxt/Vue, TypeScript, Drizzle/Postgres, node:test.
**Spec:** `docs/superpowers/specs/2026-11-18-vehicle-descriptions-design.md`

## Constraints and review focus

Preserve dealer text, unrelated settings, tenant isolation and specs/features. Test blank input, duplicate text, arrival of AI after dealer comments, invalid mode and missing settings. Keep exports independent of display configuration; no feed changes without a verified feed.

## Tasks

- [x] Write resolver regression tests; run and observe failure.
- [x] Implement shared mode validation, settings reader and section resolver; run tests.
- [x] Add authenticated GET/PUT and public tenant-scoped GET; validate roles and use an atomic JSON-key update.
- [x] Add settings page/navigation and connect the public listing to the resolver.
- [x] Run focused/full tests, typecheck/build, browser checks and branch review. Record limitations and delivery state.

## Verification and delivery

- `node --import tsx --test test/*.test.ts`: 396 passing, zero failures.
- `npm run typecheck`: passed.
- `npm run build`: passed; local build skips migrations because no database credentials are configured.
- Separate read-only branch review: no blocking defects.
- Built-app browser checks with explicit local API/auth fixtures: default both; save/reload; mobile dark without overflow; original stock 320477544 comments preserved after delayed AI response; dealer-first ordering; fallback mode hides AI when comments exist. No page exceptions or hydration warnings.
- Screenshots and temporary browser script retained under `/private/tmp/blood-description-*`. These are fixture checks, not authenticated production acceptance or database persistence proof.
- No outgoing advertising feed endpoint or export exists in this repo. XeroFlow has separate feed management; Blood's active Merchant Center feed URL and its exported description have not been verified. No feed configuration changed.
- Production deployment and live acceptance remain outstanding.

Implementation decisions: reuse existing settings JSON (no schema migration); atomic JSON-key update preserves unrelated concurrent settings changes; public reads resolve both Blood slug aliases; database-read errors fall back to dealer comments only to respect a possible AI opt-out.
