# Cloudflare Pages Deployment Guide

This project supports deployment to both Netlify and Cloudflare Pages. This guide covers the Cloudflare Pages setup.

## Overview

The project uses Nuxt 4 with Nitro, which supports multiple deployment presets. The configuration **automatically detects** the deployment platform:

- **Cloudflare Pages** - Detected via `CF_PAGES=1` environment variable (set automatically by Cloudflare)
- **Netlify** - Detected via `NETLIFY=true` environment variable (set automatically by Netlify)

No manual `NITRO_PRESET` configuration is required.

## Prerequisites

1. **Cloudflare Account** - Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI** (optional for local testing) - `npm install -g wrangler`
3. **Node.js 20+**

## Deployment Methods

### Method 1: Cloudflare Dashboard (Recommended for first deploy)

1. **Connect your GitHub repository:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Workers & Pages** → **Create application** → **Pages**
   - Select **Connect to Git** and authorize your GitHub account
   - Choose the `sale-hyundai-nuxt` repository

2. **Configure build settings:**
   - **Framework preset:** Nuxt.js (or None/custom)
   - **Build command:** `npm run build` (Cloudflare Pages sets `CF_PAGES=1` automatically)
   - **Build output directory:** `dist` (Nitro generates this for cloudflare-pages preset)
   - **Root directory:** `/` (leave as default)
   
   > **Note:** You can also use `npm run build:cloudflare` if you want to explicitly set the preset.

3. **Set environment variables:**
   Add all required environment variables (see [Environment Variables](#environment-variables) section below)

4. **Deploy:**
   Click "Save and Deploy"

### Method 2: Wrangler CLI (Local Deploy)

```bash
# Login to Cloudflare
npx wrangler login

# Build for Cloudflare
npm run build:cloudflare

# Deploy to Cloudflare Pages
npm run deploy:cloudflare

# Or manually:
npx wrangler pages deploy .output/public --project-name=sale-hyundai
```

### Method 3: GitHub Actions (CI/CD)

Create `.github/workflows/cloudflare-pages.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build for Cloudflare
        run: npm run build:cloudflare
        env:
          NITRO_PRESET: cloudflare-pages
          NUXT_PUBLIC_SITE_URL: ${{ vars.NUXT_PUBLIC_SITE_URL }}
          NUXT_PUBLIC_API_URL: ${{ vars.NUXT_PUBLIC_API_URL }}
          NUXT_PUBLIC_CDN_URL: ${{ vars.NUXT_PUBLIC_CDN_URL }}
          NUXT_PUBLIC_OEM_CDN_URL: ${{ vars.NUXT_PUBLIC_OEM_CDN_URL }}
          NUXT_PUBLIC_OEM_RAW_CDN_URL: ${{ vars.NUXT_PUBLIC_OEM_RAW_CDN_URL }}
          # Add other build-time env vars as needed

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: sale-hyundai
          directory: .output/public
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

## Environment Variables

### Required Variables

Set these in the Cloudflare Pages dashboard under **Settings** → **Environment variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_VERSION` | Node.js version | `20` |
| `NUXT_PUBLIC_SITE_NAME` | Site name | `Sale Hyundai` |
| `NUXT_PUBLIC_SITE_URL` | Production URL | `https://salehyundai.com.au` |
| `NUXT_PUBLIC_API_URL` | Backend API URL | `https://api.example.com` |
| `NUXT_PUBLIC_CDN_URL` | BunnyCDN pages URL | `https://cdn.example.com` |
| `NUXT_PUBLIC_OEM_CDN_URL` | Hyundai OEM CDN | `https://hyundaioem.b-cdn.net` |
| `NUXT_PUBLIC_OEM_RAW_CDN_URL` | Raw Hyundai data CDN | `https://hyundaioem.b-cdn.net/raw` |

### Server-side Variables (Secrets)

| Variable | Description |
|----------|-------------|
| `NUXT_JWT_SECRET` | JWT signing secret |
| `NUXT_STRIPE_SECRET_KEY` | Stripe API key |
| `SENDGRID_API_KEY` | SendGrid API key |
| `NEON_DATABASE_URL` | PostgreSQL connection string |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 storage access key |
| `R2_SECRET_ACCESS_KEY` | R2 storage secret |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | R2 public URL |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `NUXT_PUBLIC_GTM_ID` | Google Tag Manager ID |
| `NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NUXT_PUBLIC_DEALER_API_KEY` | Dealer API key |
| `NUXT_PUBLIC_FACEBOOK_PIXEL_ID` | Facebook Pixel ID |

## Build Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build for Netlify (default) |
| `npm run build:cloudflare` | Build for Cloudflare Pages |
| `npm run preview:cloudflare` | Preview Cloudflare build locally |
| `npm run deploy:cloudflare` | Build and deploy to Cloudflare |

## Key Differences from Netlify

| Feature | Netlify | Cloudflare Pages |
|---------|---------|------------------|
| Build preset | `netlify` (via @netlify/nuxt) | `cloudflare-pages` |
| Image provider | `netlify` | `cloudflare` |
| Functions | Netlify Functions | Cloudflare Workers |
| Edge runtime | Netlify Edge | Cloudflare Workers |
| KV storage | — | Cloudflare KV |
| Object storage | — | Cloudflare R2 (already configured) |

## Custom Domain Setup

1. Go to your Pages project in Cloudflare Dashboard
2. Navigate to **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `salehyundai.com.au`)
5. Follow the DNS configuration instructions

## Cloudflare-Specific Features

### Cloudflare R2 (Already Configured)

The project already uses Cloudflare R2 for dealer asset storage. The configuration is in `nuxt.config.ts`:

```typescript
runtimeConfig: {
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  r2BucketName: process.env.R2_BUCKET_NAME,
  r2PublicUrl: process.env.R2_PUBLIC_URL,
}
```

### Cloudflare Image Resizing

When deployed to Cloudflare, the project uses Cloudflare's image optimization. Ensure your Cloudflare plan supports Image Resizing (Pro plan or higher for custom domains).

### Workers KV (Future)

To add KV namespace binding, update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

## Troubleshooting

### Build Fails with Memory Error

Increase Node.js memory in build command:
```bash
NODE_OPTIONS='--max-old-space-size=8192' npm run build:cloudflare
```

### Functions Not Working

Ensure the build output includes `.output/server/` directory. Check that `NITRO_PRESET=cloudflare-pages` is set.

### Static Assets 404

The Nitro `cloudflare-pages` preset outputs to `dist/` directory. Ensure the Cloudflare Pages build output directory is set to `dist`.

### ASSETS Binding Error

If you see `The name 'ASSETS' is reserved in Pages projects`, this means the Nitro-generated wrangler config conflicts with Cloudflare Pages. This is fixed in the latest configuration - Cloudflare Pages handles asset binding automatically.

### Image Optimization Not Working

1. Check your Cloudflare plan supports Image Resizing
2. Ensure domains are added to `image.domains` in `nuxt.config.ts`
3. For free tier, consider using the `none` provider and external CDN

## Performance Optimization

### Caching Headers

Custom headers are configured in `_headers` file at the project root:
- Static assets: 1 year cache (immutable)
- HTML/root: No cache (SSR)
- JSON: 1 hour cache

### Edge Caching

Cloudflare automatically caches static assets at the edge. For API routes, add cache headers in your API handlers:

```typescript
export default defineEventHandler(async (event) => {
  // Cache for 1 hour at edge
  setResponseHeaders(event, {
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  });
  
  return { data: '...' };
});
```

## Files Created for Cloudflare

| File | Purpose |
|------|---------|
| `wrangler.toml` | Wrangler/Cloudflare Pages configuration |
| `_headers` | Custom HTTP headers for Cloudflare Pages |
| `_redirects` | URL redirects (Cloudflare Pages format) |

## Dual Deployment Strategy

This project supports deploying to both Netlify and Cloudflare simultaneously:

1. **Netlify** - Primary production (`salehyundai.com.au`)
2. **Cloudflare** - Staging/testing or failover

Use different branches or environment variables to control which platform serves production traffic.

---

## Quick Start Checklist

- [ ] Create Cloudflare account
- [ ] Connect GitHub repository to Cloudflare Pages
- [ ] Set build command: `npm run build:cloudflare`
- [ ] Set output directory: `.output/public`
- [ ] Add all environment variables
- [ ] Deploy and verify site works
- [ ] (Optional) Set up custom domain
- [ ] (Optional) Configure GitHub Actions for CI/CD
