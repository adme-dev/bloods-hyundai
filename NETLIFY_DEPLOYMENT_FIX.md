# Netlify Deployment Fix - December 9, 2024

## Issue
Netlify deployment was failing with the error:
```
Deploy did not succeed: Deploy directory '.output/public' does not exist
```

## Root Cause
This project's Nuxt/Nitro build writes the public deploy assets to `.output/public`.
If Netlify is configured to publish another directory, such as `dist`, the deploy
step fails even when `npm run build` succeeds.

## Solution
Set `publish = ".output/public"` in `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".output/public"
```

**Important:** If the Netlify Dashboard has a different publish directory set (visible in build logs as `publishOrigin: ui`), you must either:
1. Clear it in the dashboard: Site configuration → Build & deploy → Build settings → Clear "Publish directory"
2. Or ensure it matches `.output/public`

## Why This Works
The build generates `.output/public` for static assets and `.output/server` for the
server bundle. The `publish = ".output/public"` setting tells Netlify where to find
the static assets for deployment.

## Verification
After this change, the deployment should succeed. The site will work with:
- ✅ SSR pages (e.g., `/car-sales`, `/vehicle/[slug]`)
- ✅ ISR pages (e.g., `/special-offers`)
- ✅ SPA pages (e.g., `/secure-vehicle`)
- ✅ API routes (e.g., `/api/search`)
- ✅ Static assets (e.g., `/_nuxt/*`, `/assets/*`)

## References
- [Nitro Netlify Preset](https://nitro.unjs.io/deploy/providers/netlify)
- [Nuxt 4 Migration Guide](https://nuxt.com/docs/getting-started/upgrade)









