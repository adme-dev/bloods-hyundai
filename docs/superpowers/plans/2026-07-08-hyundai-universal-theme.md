# Hyundai Universal Theme Task List

## Objective

Create a non-live Hyundai universal multi-tenant theme from the current Blood Hyundai codebase. Blood Hyundai and Sale Hyundai become the first tenants. Nothing in this plan changes production domains, Netlify project links, or live deployment settings until staging verification is complete and explicitly approved.

## Guardrails

- Work from `bloods-hyundai` on branch `feature/hyundai-universal-theme`.
- Do not push to production unless explicitly requested.
- Do not change Netlify domain aliases, production env vars, or DNS.
- Do not remove the existing Blood or Sale production paths until both tenants pass staging verification.
- Prefer additive database migrations and reversible code paths.
- Every tenant-aware cache key must include tenant or hostname.
- Every server API that reads/writes dealer data must resolve and enforce the current tenant server-side.

## Architecture Decisions

- `bloods-hyundai` is the base for the Hyundai universal theme because it has the latest Hyundai UI, SEO, chatbot, calculator, and config fixes.
- The long-term repo may be renamed or forked as `hyundai-theme-nuxt`, but first implementation happens as a branch so production remains stable.
- Toyota dashboard architecture is the reference for admin, tenant, and operational patterns. Toyota OEM logic is not copied into Hyundai.
- Hyundai-specific OEM, offer, model, and calculator logic stays behind Hyundai-specific adapters.
- Blood and Sale are tenant records, not separate theme implementations.

## Phase 0: Inventory And Safety

- [ ] Confirm current Blood repo has no uncommitted production fixes.
- [ ] Capture current Blood and Sale Netlify site IDs, repos, domains, and env assumptions in a local reference doc.
- [ ] Identify current hard-coded dealer names, domains, phone numbers, locations, SEO titles, banners, logos, and fallbacks.
- [ ] Identify every public API that reads site/dealer/inventory/form/chatbot config.
- [ ] Identify every admin API and whether it already accepts/enforces `dealer_id`.

Acceptance:
- [ ] There is a written inventory of tenant-sensitive surfaces.
- [ ] No production deploy or domain setting has changed.

## Phase 1: Tenant Contract

- [ ] Define `HyundaiTenant` contract: slug, name, domains, site URL, OEM, status, timezone, locale.
- [ ] Define typed dealer settings for branding, navigation, homepage banners, forms, inventory source, chatbot, service, SEO, scripts, and integrations.
- [ ] Define config precedence: database tenant settings first, dealer config JSON fallback second, local fallback last.
- [ ] Define cache key standard: `<resource>:vN:<tenant-or-host>`.
- [ ] Add a tenant-resolution test matrix for `bloodhyundai.com.au`, `www.bloodhyundai.com.au`, `salehyundai.com.au`, local hosts, and unknown hosts.

Acceptance:
- [ ] Tenant contract exists in docs and is reflected in TypeScript types.
- [ ] Cache naming standard is documented and used by new work.

## Phase 2: Database Foundation

- [ ] Add `dealer_domains` table with `dealer_id`, `hostname`, `is_primary`, `is_active`, timestamps.
- [ ] Add or formalise `dealer_settings` shape if settings remain JSON-backed on `dealers.settings`.
- [ ] Add `dealer_navigation` table or decide to keep navigation in typed settings for first release.
- [ ] Add `dealer_media` or formalise media records if admin-managed banners need structured storage.
- [ ] Add SQL seed data for Blood and Sale tenants, including domains.
- [ ] Add migration verification SQL to assert both tenants and domains exist.

Acceptance:
- [ ] Migrations are additive and safe to run on a staging/development Neon branch.
- [ ] Blood and Sale tenant rows can be queried independently.
- [ ] No migration has been applied to production unless explicitly approved.

## Phase 3: Tenant Resolver

- [ ] Create server utility: hostname -> dealer domain -> dealer row -> tenant context.
- [ ] Add local/dev fallback for `NUXT_PUBLIC_DEALER_SLUG` and `DEALER_SLUG`.
- [ ] Add tenant-aware cache helper shared by site config, vehicles, models, forms, and chatbot.
- [ ] Replace hard-coded tenant host map with DB-backed domain lookup plus safe fallback.
- [ ] Add debug-safe logging for tenant resolution failures without leaking secrets.

Acceptance:
- [ ] Blood host resolves Blood tenant.
- [ ] Sale host resolves Sale tenant.
- [ ] Unknown host resolves safe default or explicit 404/disabled tenant state.
- [ ] Tenant cache keys cannot collide across Blood and Sale.

## Phase 4: Site Config Unification

- [ ] Refactor `/api/site-config` to build config from tenant context.
- [ ] Normalize `navigation.main` and `sitelinks.mainnav` consistently.
- [ ] Normalize homepage promotional slides, thumbs, footer banners, and ticker.
- [ ] Normalize branding: logo, favicon, dealer name, address, phone, social links.
- [ ] Normalize SEO metadata: site name, titles, descriptions, canonical URL.
- [ ] Keep config JSON fallback for legacy DriveAgent payloads during migration.

Acceptance:
- [ ] `/api/site-config` returns Blood data on Blood host.
- [ ] `/api/site-config` returns Sale data on Sale host.
- [ ] Nav and banners load from tenant config for both.
- [ ] No Blood text appears on Sale config, and no Sale text appears on Blood config.

## Phase 5: Inventory And OEM Adapters

- [x] Define `InventorySource` contract for Carsales/DriveAgent/API-backed stock.
- [x] Move stock feed config into tenant settings.
- [x] Ensure `/api/carsales-feed`, `/api/homepage-filters`, `/api/search`, and vehicle detail APIs resolve by tenant.
- [x] Define Hyundai OEM model/offers adapter boundaries.
- [x] Keep model calculator routes tenant-safe and Hyundai-specific.

Acceptance:
- [ ] Blood inventory queries use Blood source settings.
- [ ] Sale inventory queries use Sale source settings.
- [ ] Calculator/model endpoints work without cross-tenant leakage.

## Phase 6: Admin Foundation

- [ ] Compare Toyota admin modules against Hyundai admin needs.
- [ ] Port only the generic concepts first: tenant settings, nav editor, media/banner editor, forms, staff, routing.
- [ ] Keep admin routes behind auth.
- [ ] Ensure admin user belongs to one dealer or an explicit platform-admin role.
- [ ] Add audit logging for config changes.

Acceptance:
- [ ] Dealer admin can edit nav and homepage banners for their tenant in staging.
- [ ] Changes affect only that dealer.
- [ ] Admin APIs reject cross-tenant access.

## Phase 7: Chatbot And Front-Facing Config

- [ ] Move chatbot identity, prompts, quick actions, nudge settings, and lead routing into tenant settings.
- [ ] Ensure chatbot vehicle cards and links close correctly on mobile.
- [ ] Ensure call/search/service/mobile quick links are tenant-configured.
- [ ] Add abuse protections and rate limits where chatbot endpoints accept input.

Acceptance:
- [ ] Blood chatbot uses Blood settings.
- [ ] Sale chatbot uses Sale settings.
- [ ] Chatbot cannot submit leads to the wrong dealer.

## Phase 8: Staging Verification

- [ ] Create or use non-production staging URLs for both Blood and Sale tenant views.
- [ ] Run build and typecheck.
- [ ] Run tenant smoke checks for config, nav, banners, inventory, forms, chatbot, calculator, sell-my-car, test-drive, service booking.
- [ ] Run security checks for auth, tenant isolation, rate limiting, and public API exposure.
- [ ] Run Lighthouse pass for homepage and key routes.

Acceptance:
- [ ] Blood staging matches current production content and behavior.
- [ ] Sale staging matches Sale content and behavior.
- [ ] No critical console errors or hydration mismatch warnings.
- [ ] No cross-tenant data leakage is observed.

## Phase 9: Production Cutover Plan

- [ ] Document rollback plan before any switch.
- [ ] Pick first production tenant to cut over.
- [ ] Freeze config changes during cutover window.
- [ ] Switch only one site at a time.
- [ ] Verify live immediately after switch.
- [ ] Keep old deployment available until post-cutover verification passes.

Acceptance:
- [ ] Cutover requires explicit approval.
- [ ] Rollback path is documented and tested.

## Initial Work Order

1. Create Phase 0 inventory document.
2. Add tenant contract/types without changing runtime behavior.
3. Add `dealer_domains` migration and seed SQL for Blood/Sale, unapplied.
4. Add DB-backed tenant resolver behind a feature flag.
5. Add verification scripts for host -> tenant -> config.
6. Refactor `/api/site-config` to use resolver when enabled.
7. Build and verify locally/staging.

## Loop Goal

Keep this branch moving in small, reversible loops until the Hyundai universal theme is ready for staging review:

1. Pick the next unchecked task with the fewest dependencies.
2. Implement only that slice.
3. Verify with the narrowest useful test, then typecheck/build when runtime code changes.
4. Commit the slice locally.
5. Re-check tenant isolation before moving to the next slice.

Loop exit criteria:

- Blood and Sale resolve independently from the same codebase in staging.
- Nav, banners, inventory, forms, chatbot, SEO, and calculator routes are tenant-scoped.
- No production Netlify, DNS, or domain setting has changed without explicit approval.

## Status

- [x] Branch created: `feature/hyundai-universal-theme`
- [x] Plan created
- [x] Phase 0 inventory started
- [x] Tenant contract/types added
- [x] `dealer_domains` migration added but not applied
- [x] DB tenant resolver added behind `HYUNDAI_ENABLE_DB_TENANT_RESOLVER`
- [x] `/api/site-config` reads from tenant context while preserving fallback-map default behavior
- [x] Host-to-tenant/config verification script added
- [x] Inventory feed and homepage filter seller config can read tenant settings before env/local fallbacks
- [x] Standard vehicle enrichment direct inventory lookup is constrained by tenant seller IDs
- [x] Inventory source contract added and used by `/api/carsales-feed`; `/api/search` and `/api/vehicle-detail` audited as tenant-forwarding through the feed
- [x] Blood inventory settings moved into tenant defaults and additive `dealers.settings.inventory` migration; Sale seeded with an empty tenant-owned inventory settings shape pending confirmed feed values
- [x] Hyundai AU OEM model/offers adapter boundary added and used by model summaries, offer hero banner, and variant-price URL construction
- [x] Calculator route now resolves tenant context, enforces Hyundai-only usage, uses OEM adapter URL builders, and returns safe public errors for upstream failures
- [x] No production push/domain change performed
