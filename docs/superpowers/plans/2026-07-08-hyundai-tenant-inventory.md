# Hyundai Tenant Inventory

## Scope

Initial inventory for turning `bloods-hyundai` into the Hyundai universal theme. This document tracks surfaces that must become tenant-aware before Blood, Sale, and future Hyundai dealers can run safely from one app.

## Current Branch

- Branch: `feature/hyundai-universal-theme`
- Production status: no production domain or Netlify setting changes made.

## Existing Tenant Foundation

The app already has a useful baseline:

- `server/database/schema.ts`
  - `dealer_groups`
  - `dealers`
  - `users`
  - `enquiries`
  - `enquiry_notes`
  - `enquiry_activity_log`
  - several admin/customer tables later in the schema
- `server/api/site-config.ts`
  - merges dealer DB row, CDN/local config fallback, and runtime host-derived tenant.
  - normalizes `navigation.main` and `sitelinks.mainnav`.
- `server/utils/tenant.ts`
  - currently maps Blood and Sale by hard-coded host map.
- `app/utils/tenantCacheKey.ts`
  - provides host-scoped payload/cache keys.
- Admin surface exists for:
  - branding
  - forms
  - staff
  - settings
  - media
  - routing
  - enquiries/customers/service areas

## Known Live Site IDs

- Blood Hyundai:
  - Repo: `adme-dev/bloods-hyundai`
  - Netlify project: `bloodhyundai`
  - Site ID: `5188455b-0ee6-4a34-8b79-3b054ed9d899`
  - Domain: `bloodhyundai.com.au`
- Sale Hyundai:
  - Repo: `adme-dev/sale-hyundai-nuxt`
  - Netlify project: `sale-hyundai`
  - Site ID: `621477ab-2ec6-4009-ae3f-9a036dbf62eb`
  - Domain: `salehyundai.com.au`

## Tenant-Sensitive Files

### Tenant Resolution

- `server/utils/tenant.ts`
  - hard-coded Blood and Sale tenants.
  - hard-coded host map.
  - should be replaced by DB-backed `dealer_domains` lookup with env fallback.

### Site Config

- `server/api/site-config.ts`
  - currently supports local fallback and dealer DB merge.
  - has Blood/Sale-specific local fallback checks.
  - forces Blood naming in `normalizeSiteConfig`.
- `server/data/site-config.bloods-hyundai.json`
  - Blood local fallback.
- `server/data/site-config.json`
  - Sale local fallback.
  - contains large Sale payload including nav, departments, pages, forms, banners, ticker, stock placeholders.

### Pages And Local CMS Fallbacks

- `server/data/pages/home.json`
  - Sale-specific fallback homepage content.
- `server/api/page/[slug].ts`
  - contains dealer-specific filtering for Sale and Blood fallback content.

### Inventory

- `server/utils/inventory-config.ts`
  - contains Blood-specific Supabase fallback URL.
  - contains Blood slug checks and env prefix logic.
  - now accepts tenant inventory settings for feed sources and homepage seller IDs before env/local fallbacks.
- APIs likely affected:
  - `server/api/carsales-feed.ts` now passes resolved tenant inventory settings.
  - `server/api/homepage-filters.ts` now passes resolved tenant inventory settings.
  - `server/api/search.ts`
  - `server/api/vehicle-detail/[id].ts`
  - `server/api/vehicle-enrichment*.ts`
  - `server/api/vehicle/[slug].ts`

### Reviews And Place Data

- `server/api/reviews.ts`
  - dealer-specific local fallback checks.
- `server/data/reviews/hours.json`
  - Sale-specific Google Place payload.
  - should become dealer-scoped cache/storage.

### SEO And Identity

- `app/pages/index.vue`
  - currently has hard-coded title fallback `Hyundai Dealer Geelong`.
- `app/composables/useSiteIdentity.ts`
  - normalizes `Bloods Hyundai` to `Blood Hyundai`.
  - should be generalized as display-name normalization or tenant setting.
- `server/routes/llms.txt.ts`
  - consumes `/api/site-config`; tenant headers must be preserved.
- `server/routes/sitemap.xml.ts`
  - fetches `/api/site-config`; tenant headers must be preserved.

### UI Fallbacks

- `app/components/global/HyundaiChatAssistant.vue`
  - fallback phone currently Sale-style `(03) 5144 2133`.
  - fallback address currently Sale-style.
- `app/components/page-elements/FooterLinks.vue`
  - fallback sales/service phones are Blood-specific.
- `app/pages/contact.vue`
  - fallback LMCT `6106`.
- `app/components/vehicle/VehicleEnquiryModal.vue`
  - fallback dealer phone.
- Static logos:
  - `app/pages/portal/login.vue`
  - `app/pages/portal/index.vue`
  - `app/components/page-elements/FooterLinks.vue`
  - should use tenant/site config where appropriate.

### Homepage Config Consumers

- `app/components/page-elements/FrontSlider.vue`
  - consumes `mainStore.site?.promotional`.
- `app/components/page-elements/FrontSliderThumbs.vue`
  - consumes `mainStore.site?.promotional`.
- `app/components/page-elements/HeaderTicker.vue`
  - consumes `mainStore.site?.ticker`.
- `app/components/page-elements/FooterBlocks.vue`
  - consumes `mainStore.site?.promotional?.[0]?.footerblocks`.
- `app/components/page-elements/PageSchema.vue`
  - consumes site config for schema.

### Navigation Consumers

- `app/components/menus/PrimaryNav.vue`
- `app/components/menus/PrimaryNavDefault.vue`
- `app/components/menus/MobileNav.vue`
- `app/components/menus/MobileSiteMenu.vue`
- `app/components/page-elements/FooterLinks.vue`

These expect `navigation.main`, `sitelinks.mainnav`, and `sitelinks.footer`.

### Admin And Auth

Existing admin areas to keep tenant-scoped:

- `server/api/admin/settings/*`
- `server/api/admin/forms/*`
- `server/api/admin/media/*`
- `server/api/admin/upload/*`
- `server/api/admin/staff/*`
- `server/api/admin/enquiries/*`
- `server/api/admin/service/*`
- `server/api/admin/analytics/*`

Every admin route must enforce tenant from authenticated user context, not from client-supplied dealer slug.

## Required Database Additions

First migration candidate:

- `dealer_domains`
  - `id`
  - `dealer_id`
  - `hostname`
  - `is_primary`
  - `is_active`
  - `created_at`
  - `updated_at`
  - unique lower-case hostname
  - index by `dealer_id`

Likely later additions:

- typed settings contract on `dealers.settings`
- optional `dealer_site_configs` table if JSON settings become too large.
- optional `dealer_navigation` table if nav editing needs structured revisions/audit.
- optional `dealer_media` table if banner/media management needs records beyond R2 paths.

## Initial Blood Tenant Data

Known current values:

- slug: `bloods-hyundai`
- alias: `blood-hyundai`
- name: `Blood Hyundai`
- domain: `bloodhyundai.com.au`
- domain: `www.bloodhyundai.com.au`
- site URL: `https://bloodhyundai.com.au`
- showroom: `Cnr Fyans Street & LaTrobe Terrace, Geelong VIC 3220`
- sales phone: `(03) 5221 7233`
- service phone: `(03) 5221 0751`

## Initial Sale Tenant Data

Known current values:

- slug: `sale-hyundai`
- name: `Sale Hyundai`
- domain: `salehyundai.com.au`
- domain: `www.salehyundai.com.au`
- site URL: `https://salehyundai.com.au`
- showroom: `36/38 Foster St, Sale VIC 3850`
- phone: `(03) 5144 2133`
- LMCT: `6106`

## First Implementation Slice

1. Add `dealer_domains` schema + SQL migration.
2. Add tenant contract types.
3. Add DB-backed resolver behind a feature flag, keeping existing hard-coded resolver as fallback.
4. Add seed SQL for Blood and Sale domains.
5. Add a local verification script for host-to-tenant resolution.

## Do Not Touch Yet

- Production Netlify site links.
- DNS/domain aliases.
- Existing live Sale repo deployment.
- Existing local JSON fallbacks, until DB-backed config has been verified.
