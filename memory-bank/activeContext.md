# Active Context: Sale Hyundai Website

## Current Focus
Building a **Multi-Tenant Enquiry Management System** to centralize form submissions from multiple dealership websites into a shared NEON PostgreSQL database with complete data isolation per dealer.

Additionally, developing an **Accessories Store R&D App** to showcase Hyundai Genuine Accessories with shopping cart functionality.

## Deployment Reference
- Netlify site/project ID for this repository: `5188455b-0ee6-4a34-8b79-3b054ed9d899`
- Site URL: `https://bloodhyundai.com.au`

## Recent Changes
- **Added Cloudflare Pages deployment support** (January 2026)
  - Auto-detection of deployment platform (`CF_PAGES=1` for Cloudflare, `NETLIFY=true` for Netlify)
  - Dual deployment strategy (Netlify primary, Cloudflare staging/failover)
  - Updated `nuxt.config.ts` to conditionally set Nitro preset and image provider
  - Created `wrangler.toml`, `_headers`, `_redirects` for Cloudflare Pages
  - Documentation: `CLOUDFLARE_DEPLOYMENT.md`
- Created comprehensive PRD for Multi-Tenant Enquiry Management System (v2.0)
- Designed multi-tenant database schema with Row-Level Security (RLS)
- Documented dealer onboarding flow
- Defined API key authentication for form submissions
- Mapped out role-based access control (RBAC)

### Accessories Store R&D (New)
- Created `accessories` Pinia store with cart functionality (persisted to localStorage)
- Enhanced `/api/accessories` endpoint with category sorting and display info
- Built component suite: `AccessoryCard`, `AccessoryPackCard`, `AccessoriesCart`, `ModelSelector`, `AccessoryDetailModal`
- Created pages: `/accessories` (model selector + shop), `/accessories/[model]` (model-specific)
- Integrated with Hyundai Australia's accessories API (https://www.hyundai.com/content/api/au/hyundai/v3/accessories)
- Added route rules for SSR with 1-hour ISR cache

## In Progress
- ✅ **NEON database setup completed (December 9, 2025)**
  - Multi-tenant schema fully implemented on development branch
  - Row-Level Security (RLS) policies active
  - Sale Hyundai dealer seeded with API key
- 🔄 Next: Drizzle ORM integration
- 🔄 Next: Tenant resolution middleware implementation
- 🔄 Next: `/api/enquiry` endpoint with API key authentication

## Architecture Decisions

### Multi-Tenancy Model
- **Shared Database** with `dealer_id` foreign key on all tenant tables
- **Row-Level Security (RLS)** at PostgreSQL level for ironclad isolation
- **Subdomain-based routing** for dashboard (e.g., `salehyundai.leads.app`)
- **API Key authentication** for form submissions from dealer websites

### Database Choice: NEON PostgreSQL
- Serverless-friendly (works with Netlify)
- Native Row-Level Security support
- JSONB for flexible type-specific fields
- Scales across multiple dealers

### ORM Choice: Drizzle
- TypeScript-first with excellent type inference
- Serverless-optimized
- Easy to set RLS context per request

### Authentication: Custom JWT with Tenant Context
- JWT contains `dealer_id` claim
- Tenant middleware sets RLS context before queries
- Same email can exist at different dealers

## Next Steps

### Phase 1: Multi-Tenant Foundation (Week 1-2)
1. ✅ Set up NEON PostgreSQL database
2. ✅ Create multi-tenant schema (`dealers`, `users`, `enquiries`, etc.)
3. ✅ Implement Row-Level Security policies
4. ✅ Seed Sale Hyundai as first dealer
5. 🔄 **NEXT**: Install Drizzle ORM and create schema definitions
6. 🔄 **NEXT**: Build tenant-aware API middleware
7. 🔄 **NEXT**: Create `/api/enquiry` endpoint with API key validation
8. 🔄 **NEXT**: Update Sale Hyundai website to use new endpoint

### Phase 2: Authentication & Dashboard (Week 2-3)
1. Implement JWT auth with `dealer_id` claim
2. Build subdomain routing for tenant resolution
3. Create dealer-branded login page
4. Build tenant-filtered enquiries list
5. Build enquiry detail view

### Phase 3: Dealer Management (Week 3-4)
1. Super admin dashboard for platform operators
2. Dealer onboarding flow
3. Dealer settings page
4. API key management
5. User management per dealer

### Phase 4: Analytics & Scale (Week 4-6)
1. Dealer-scoped analytics
2. Email notifications
3. Onboard second dealer (validation)
4. Performance optimization

## Key Tables
| Table | Purpose | Tenant Scope |
|-------|---------|--------------|
| `dealers` | Tenant registry | N/A (global) |
| `users` | Staff accounts | `dealer_id` FK |
| `enquiries` | Form submissions | `dealer_id` FK |
| `enquiry_notes` | Notes on enquiries | Via `enquiry_id` |
| `enquiry_activity_log` | Audit trail | `dealer_id` FK |

## Form Types (All Dealers)
| Form | Key | Status |
|------|-----|--------|
| Contact | `contact` | To migrate |
| Finance | `finance` | To migrate |
| Vehicle Enquiry | `vehicle` | To migrate |
| Sell My Car | `sell_car` | To migrate |
| Test Drive | `test_drive` | To implement |
| Parts | `parts` | To migrate |
| Service | `service` | To migrate |
| Fleet | `fleet` | To migrate |

## Example Dealers (Initial)
| Dealer | Slug | Dashboard URL |
|--------|------|---------------|
| Sale Hyundai | `sale-hyundai` | `salehyundai.leads.app` |
| (Future) Pakenham Hyundai | `pakenham-hyundai` | `pakenhamhyundai.leads.app` |

---

## Accessories Store R&D Feature

### Overview
A fully-featured accessories shop allowing customers to browse and build a cart of Hyundai Genuine Accessories for their specific vehicle model.

### Data Source
- **API**: `https://www.hyundai.com/content/api/au/hyundai/v3/accessories?groupId={groupId}`
- **Reference**: [Hyundai Accessories](https://www.hyundai.com/au/en/owning/accessories)
- Group IDs are CMS-specific identifiers that map to each Hyundai model

### Store Structure (`app/stores/accessories.ts`)
- `selectedModel` - Current Hyundai model
- `accessories` / `accessoryPacks` - Fetched from API
- `cartItems` - Persisted to localStorage
- Actions: `selectModel`, `addToCart`, `removeFromCart`, `updateCartQuantity`

### Pages
| Route | Purpose |
|-------|---------|
| `/accessories` | Model selector + shop view |
| `/accessories/[model]` | Direct link to model accessories |

### Components
| Component | Purpose |
|-----------|---------|
| `AccessoryCard` | Display individual accessory |
| `AccessoryPackCard` | Display value packs with savings |
| `AccessoriesCart` | Slide-out cart sidebar |
| `ModelSelector` | Grid of Hyundai models |
| `AccessoryDetailModal` | Full details modal |

### Supported Models (with known groupIds)
- SUVs: Tucson, Kona, Venue, Santa Fe, Palisade
- Hatch: i30
- Vans: Staria, Staria Load

### Next Steps for Accessories
1. Scrape missing model groupIds (Electric, Performance)
2. Create accessories enquiry form
3. Add vehicle images to model selector
4. Integration with vehicle detail pages
