# Technical Context: Sale Hyundai Website

## Technology Stack

### Frontend
- **Framework:** Nuxt 3.x (Vue 3 Composition API)
- **Styling:** 
  - UIkit (global component library via `@fedorae/nuxt-uikit`)
  - UnoCSS (Tailwind-like utilities via `@unocss/nuxt`)
  - shadcn-vue components (located in `app/components/ui/`)
  - SCSS for custom styles
- **State Management:** Pinia (`@pinia/nuxt`)
- **Utilities:** VueUse (`@vueuse/nuxt`)

### Backend (Serverless)
- **Runtime:** Nitro (Nuxt's server engine)
- **API Routes:** `server/api/` directory
- **Database:** NEON PostgreSQL (planned)
- **ORM:** Drizzle ORM (planned)

### External Services
- **CMS:** WordPress REST API (for content pages)
- **CDN:** BunnyCDN for static assets and JSON data
- **Vehicle Data:** Supabase (direct queries for homepage filters, storage JSON for full data)
- **Analytics:** Google Tag Manager via `nuxt-gtag`
- **SEO:** `@nuxtjs/seo` module
- **Payments:** Stripe (for vehicle reservations)

### Deployment
- **Primary Platform:** Netlify
  - Preset: `netlify` (via `@netlify/nuxt` module)
  - Build command: `npm run build`
- **Secondary Platform:** Cloudflare Pages
  - Preset: `cloudflare-pages`
  - Build command: `npm run build:cloudflare`
  - Config files: `wrangler.toml`, `_headers`, `_redirects`
- **Build:** Static generation where possible, SSR for dynamic content

## Project Structure
```
sale-hyundai-nuxt/
├── app/
│   ├── components/
│   │   ├── ui/              # shadcn-vue components
│   │   ├── contact/         # Contact form components
│   │   ├── search/          # Vehicle search components
│   │   ├── page-elements/   # Reusable page sections
│   │   └── ...
│   ├── composables/         # Vue composables
│   ├── pages/               # File-based routing
│   ├── stores/              # Pinia stores
│   └── assets/              # SCSS, images
├── server/
│   └── api/                 # API routes
├── public/                  # Static files
├── memory-bank/             # Project documentation
└── nuxt.config.ts           # Nuxt configuration
```

## Environment Variables
```env
# Public
NUXT_PUBLIC_SITE_NAME       # Site name (Sale Hyundai)
NUXT_PUBLIC_SITE_URL        # Site URL
NUXT_PUBLIC_API_URL         # WordPress/Backend API
NUXT_PUBLIC_CDN_URL         # BunnyCDN for pages JSON
NUXT_PUBLIC_OEM_CDN_URL     # Hyundai OEM data CDN
NUXT_PUBLIC_OEM_RAW_CDN_URL # Raw Hyundai data CDN
NUXT_PUBLIC_GTM_ID          # Google Tag Manager ID

# Private
NUXT_JWT_SECRET             # JWT signing secret
NUXT_STRIPE_SECRET_KEY      # Stripe API key
NEON_DATABASE_URL           # PostgreSQL connection (planned)
SUPABASE_URL                # Supabase project URL
SUPABASE_KEY                # Supabase service role key
```

## Key APIs

### Form Submission
Current: `POST /api/form` → External API
Planned: `POST /api/enquiry` → NEON Database

### Vehicle Data
- `GET /api/all-variants` - All Hyundai models
- `GET /api/vehicle/[slug]` - Vehicle detail
- `GET /api/vehicle-detail/[id]` - Stock vehicle detail
- `GET /api/search` - Vehicle search
- `GET /api/carsales-feed` - Full vehicle inventory (~700KB, for car-sales pages)
- `GET /api/homepage-filters` - Lightweight filter aggregates (~10KB, for homepage)

### Content
- `GET /api/page/[slug]` - WordPress page content
- `GET /api/hyundai-offers` - Special offers

## Development Setup
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for Netlify (default)
npm run build

# Build for Cloudflare Pages
npm run build:cloudflare

# Preview production build
npm run preview

# Preview Cloudflare build locally
npm run preview:cloudflare

# Deploy to Cloudflare Pages
npm run deploy:cloudflare
```

## Known Technical Considerations
- UIkit and UnoCSS coexist - UIkit for complex components, UnoCSS for utilities
- shadcn-vue components in `app/components/ui/` follow Vue port conventions
- Forms currently submit to external WordPress API, migration to NEON planned
- Some pages use ISR (incremental static regeneration) for performance
- Homepage uses route-aware SSR optimization - only car-sales pages preload full vehicle data
- Homepage fetches lightweight filter aggregates via `/api/homepage-filters` (73% payload reduction)










