# Hyundai Admin Foundation Comparison

## Context

Phase 6 of the Hyundai Universal Theme plan uses the Toyota theme admin as a reference, not as a direct code transplant. The goal is to give Blood and Sale dealer admins tenant-scoped control over public-site content without copying Toyota OEM-specific catalogue, finance, or vehicle-builder assumptions into Hyundai.

## Hyundai Current Admin Surface

Hyundai already has a usable dealer-admin foundation:

- Auth-protected admin routes and middleware for `/api/admin/*`.
- Dealer-scoped staff, customers, enquiries, tasks, service appointments, forms, media, SendGrid, notification, and settings APIs.
- Settings pages for branding, email, finance widget, popup, routing, service booking, and targets.
- Media upload/list/delete APIs and a reusable media library dialog.
- Server-side use of `event.context.dealerId` across most admin APIs.
- Staff role checks on sensitive staff and settings mutations.

The main Hyundai gaps for a universal multi-tenant theme are content-configuration gaps rather than a missing admin shell:

- No dedicated navigation editor/API equivalent to Toyota's `/api/admin/navigation`.
- Homepage banners, thumbnails, ticker, and quick links are not yet first-class admin-managed settings.
- Inventory/feed settings are now typed in tenant defaults, but there is no admin page to edit confirmed source values per tenant.
- No confirmed audit log for dealer settings mutations.
- Admin user tenant membership is enforced through `dealerId`, but platform-admin cross-tenant semantics are not yet formalized.

## Toyota Reference Modules

Toyota has several generic admin concepts that are relevant to Hyundai:

- `server/api/admin/navigation/*` and `server/utils/siteNavigation.ts`: shared link library, desktop/mobile/footer collections, compiled legacy-compatible sitelinks preview, and import-from-feed workflow.
- `app/pages/admin/navigation.vue`: a practical admin UI for editing links, collections, mobile sections, and footer columns.
- `server/api/admin/settings/vehicle-source.*` and `server/utils/vehicleSource.ts`: dealer-scoped inventory/source settings with URL validation.
- `server/api/admin/settings/ticker.*` and `server/utils/siteTicker.ts`: admin-managed public ticker content with site-config fallback.
- `server/api/admin/media/*`, `app/components/media/MediaLibraryDialog.vue`, and `server/utils/themeMedia.ts`: reusable media library patterns.
- Auth/session/rate-limit utility patterns such as `authContext`, `authRateLimit`, and `rateLimit`.

Toyota also has modules that should not be copied in the first Hyundai pass:

- Toyota CMS/page-builder and vehicle-builder modules, because they include Toyota-specific content assumptions and a larger content model than Hyundai needs for the immediate Blood/Sale recovery.
- Toyota OEM, SupplierNav, MVI, live pricing, and lead-forwarding utilities.
- Toyota-specific media lists, national/dealer URL fields, copy, assets, and model taxonomy.
- Push/device APIs unless Hyundai needs mobile app notifications.

## Recommended Hyundai Port Order

1. Add a Hyundai navigation settings contract.
   - Store navigation in `dealers.settings.navigation`.
   - Compile to the current `navigation.main` and `sitelinks.mainnav` shapes so existing frontend components keep working.
   - Include desktop, mobile, footer, and quick-link collections.

2. Port the generic navigation admin API/UI.
   - Adapt Toyota's shared link library and preview workflow.
   - Replace Toyota destination scopes with Hyundai scopes: theme site, Hyundai national/OEM, inventory, service, phone, email, external.
   - Keep all reads/writes scoped to `event.context.dealerId`.

3. Add homepage content settings.
   - Promote hero slides, thumbnails, footer banners, call quick links, and ticker into typed tenant settings.
   - Keep JSON/feed fallback during migration so Blood and Sale do not lose existing banners.
   - Use media library assets or external CDN URLs, normalized through existing image helpers.

4. Add inventory/source settings admin.
   - Surface the tenant inventory source contract created in Phase 5.
   - Validate seller IDs, base URLs, and flags before saving.
   - Keep Sale source fields editable but default-empty until confirmed.

5. Add audit logging for admin mutations.
   - Record dealer ID, user ID, setting namespace, action, timestamp, and a small before/after summary.
   - Start with navigation, homepage, branding, forms, routing, and inventory settings.

6. Formalize platform-admin access.
   - Keep dealer admins locked to one `dealerId`.
   - Add explicit platform-admin handling only where cross-tenant management is required.
   - Ensure admin APIs reject any requested dealer ID that does not match the authenticated user's dealer unless platform-admin is explicitly supported.

## Security And Tenant Isolation Rules

- Every admin API must read the dealer from `event.context.dealerId`; public host resolution must not be trusted for admin writes.
- Do not accept client-provided `dealerId` for normal dealer-admin mutations.
- Settings writes must merge only known namespaces rather than replacing the full settings object from the client.
- Public compiled config must include tenant-aware cache keys.
- Media paths should be dealer/tenant namespaced before exposing banner editing.

## Phase 6 Exit Criteria

- Blood and Sale admins can edit navigation and homepage banners in staging.
- Changes affect only the authenticated dealer.
- Public `/api/site-config` compiles the admin-managed config for the current tenant.
- Audit entries exist for tenant settings changes.
- No live Netlify, DNS, or production domain settings have changed.
