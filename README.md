# Sale Hyundai - Nuxt 4

This is the Nuxt 4 migration of the Sale Hyundai website, upgraded from Vue 2 + Vue CLI.

## Tech Stack

- **Framework:** Nuxt 4 (Vue 3)
- **State Management:** Pinia
- **UI Framework:** UIkit 3
- **Styling:** SCSS
- **Deployment:** Netlify (SSR)

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file in the project root with these variables:

```bash
# Site Configuration
NUXT_PUBLIC_SITE_NAME="Sale Hyundai"
NUXT_PUBLIC_SITE_URL="https://www.salehyundai.com.au"

# API Configuration
NUXT_PUBLIC_API_URL="https://your-api-url.com"

# CDN URLs
NUXT_PUBLIC_CDN_URL="https://your-cdn.com"
NUXT_PUBLIC_OEM_CDN_URL="https://hyundaioem.b-cdn.net"

# Stripe (for secure vehicle deposits)
NUXT_STRIPE_SECRET_KEY="sk_live_xxxxx"
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxxxx"

# Google Tag Manager
NUXT_PUBLIC_GTM_ID="GTM-XXXXXXX"

# JWT Secret (for server-side operations)
NUXT_JWT_SECRET="your-jwt-secret-here"
```

## Project Structure

```
sale-hyundai-nuxt/
├── app/
│   ├── pages/           # File-based routing (22 pages)
│   ├── components/      # Auto-imported components
│   ├── layouts/         # Page layouts
│   ├── composables/     # Vue composables
│   ├── utils/           # Utility functions
│   └── assets/          # SCSS, images
├── server/
│   ├── api/             # API routes (proxy to backend)
│   └── routes/          # Server routes (sitemap, robots.txt)
├── stores/              # Pinia stores
├── plugins/             # Nuxt plugins (UIkit, lodash)
├── public/              # Static files
└── nuxt.config.ts       # Nuxt configuration
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/contact` | Contact page with forms |
| `/car-sales` | Vehicle search/listing |
| `/vehicle-for-sale/[id]/[slug]` | Single vehicle details |
| `/vehicle/[slug]` | New vehicle model page |
| `/build-and-price` | Model selection |
| `/build/[slug]` | Variant selection |
| `/calculator/[model]` | Build & price configurator |
| `/special-offers` | Current offers listing |
| `/special-offer/[id]/[name]` | Single offer details |
| `/test-drive` | Test drive booking |
| `/sell-my-car` | Trade-in form |
| `/secure-vehicle/[id]` | Deposit payment |
| `/cars-for-sale/[...slug]` | SEO taxonomy pages |
| `/compare-vehicles-for-sale` | Vehicle comparison |
| `/[slug]` | CMS pages (catch-all) |

## API Routes

All API routes are in `server/api/`:

- `/api/hyundai-offers` - List special offers
- `/api/hyundai-offers/[id]` - Single offer details
- `/api/all-variants` - Vehicle variants
- `/api/variant-details` - Single variant
- `/api/variant-price` - Variant pricing
- `/api/car-calculator` - Build & price data
- `/api/accessories` - Model accessories
- `/api/search` - Vehicle search
- `/api/page/[slug]` - CMS page content
- `/api/form` - Form submissions
- `/api/stripe/*` - Payment routes
- `/api/reviews` - Google reviews

## Migration from Vue 2

This project was migrated from Vue 2. Key changes:

- **Routing:** Manual routes → File-based routing in `app/pages/`
- **State:** Vuex → Pinia stores
- **Components:** Manual imports → Auto-imported
- **Meta:** vue-meta → `useSiteMeta()` composable
- **Mixins:** → Composables in `app/composables/`
- **Netlify Functions:** → Server routes in `server/api/`
- **Options API:** → Composition API with `<script setup>`

## Development

```bash
# Run dev server with hot reload
npm run dev

# Build for production
npm run build

# Generate static site (if needed)
npm run generate
```

### Memory Issues

If you encounter "JS heap out of memory" errors:

```bash
# Already configured in package.json scripts
NODE_OPTIONS='--max-old-space-size=4096' npm run dev
```

## Deployment

The project is configured for Netlify deployment with SSR support.

1. Connect your repo to Netlify
2. Set environment variables in Netlify dashboard
3. Build command: `npm run build`
4. Publish directory: `.output/public`
5. Functions directory: `.netlify/functions-internal`

### Route Rules

- **ISR (Incremental Static Regeneration):** `/special-offers/*` - revalidates hourly
- **SSR:** `/car-sales/*`, `/vehicle/*`, `/cars-for-sale/*`
- **SPA:** `/secure-vehicle/*`, `/payment-success`

## License

Proprietary - Sale Hyundai





