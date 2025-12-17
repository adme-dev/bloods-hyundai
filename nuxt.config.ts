// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Nuxt 4 - no compatibility flag needed anymore
  devtools: { enabled: false },

  // Modules (sitemap disabled in dev for memory optimization)
  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
    'nuxt-gtag',
    '@nuxt/image',
    // Comprehensive SEO module (includes sitemap, robots, og-image, schema-org, seo-kit)
    '@nuxtjs/seo',
    // UIkit loaded globally
    '@fedorae/nuxt-uikit',
    // UnoCSS/Tailwind utilities - used globally for all pages
    // Note: @nuxtjs/tailwindcss removed - UnoCSS with Tailwind preset handles all utility classes
    '@unocss/nuxt',
    'nuxt-vitalizer',
  ],

  // Pinia Persisted State configuration
  piniaPluginPersistedstate: {
    storage: 'localStorage',
    debug: process.env.NODE_ENV === 'development',
  },

  // Nuxt SEO configuration
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://salehyundai.com.au',
    name: 'Sale Hyundai',
    description: 'Sale Hyundai - Your trusted Hyundai dealer in Sale, Victoria. Browse new and used vehicles, book a test drive, and explore our latest offers.',
    defaultLocale: 'en-AU',
  },


  // Schema.org configuration
  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'Sale Hyundai',
      url: process.env.NUXT_PUBLIC_SITE_URL || 'https://salehyundai.com.au',
      logo: `${process.env.NUXT_PUBLIC_SITE_URL || 'https://salehyundai.com.au'}/logo.png`,
    },
  },

  // Disable OG Image generation (causing compatibility issues with getter functions in useSeoMeta)
  ogImage: {
    enabled: false,
  },

  // CSS imports (UIkit CSS handled by @fedorae/nuxt-uikit module)
  css: [
    '~/assets/styles/main.scss',
  ],

  // Runtime config (environment variables)
  runtimeConfig: {
    // Server-only (private)
    jwtSecret: process.env.NUXT_JWT_SECRET || '',
    stripeSecretKey: process.env.NUXT_STRIPE_SECRET_KEY || '',
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',

    // Cloudflare R2 Storage
    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    r2BucketName: process.env.R2_BUCKET_NAME || 'dealer-assets',
    r2PublicUrl: process.env.R2_PUBLIC_URL || '',

    // Public (exposed to client)
    public: {
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || 'Sale Hyundai',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || '',
      cdnUrl: process.env.NUXT_PUBLIC_CDN_URL || '',
      oemCdnUrl: process.env.NUXT_PUBLIC_OEM_CDN_URL || '',
      oemRawCdnUrl: process.env.NUXT_PUBLIC_OEM_RAW_CDN_URL || 'https://hyundaioem.b-cdn.net/raw',
      stripePublishableKey: process.env.NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      // Dealer API key for CRM integration and R2 uploads
      dealerApiKey: process.env.NUXT_PUBLIC_DEALER_API_KEY || '',
      // Facebook Pixel ID for conversion tracking
      facebookPixelId: process.env.NUXT_PUBLIC_FACEBOOK_PIXEL_ID || '',
    },
  },

  // Google Tag Manager
  gtag: {
    enabled: process.env.NODE_ENV === 'production',
    id: process.env.NUXT_PUBLIC_GTM_ID || '',
  },

  // Vite config (replaces vue.config.js)
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "sass:math";
            @use "sass:color";
            @use "~/assets/styles/_variables.scss" as *;
            @use "~/assets/styles/_mixins.scss" as *;
          `,
        },
      },
    },
    // Build optimizations
    build: {
      sourcemap: process.env.NODE_ENV === 'development',
      // Enable minification in production
      minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false,
      cssMinify: process.env.NODE_ENV === 'production',
      // Optimize chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router'],
            'vendor-pinia': ['pinia'],
          },
        },
      },
    },
    server: {
      hmr: {
        overlay: false,
      },
      watch: {
        // Reduce file watching overhead
        usePolling: false,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.nuxt/**'],
      },
    },
    optimizeDeps: {
      // Reduce initial dep optimization memory
      holdUntilCrawlEnd: false,
    },
  },

  // Nitro server config
  nitro: {
    preset: 'netlify',
    // Disable prerendering during initial migration
    // prerender: {
    //   routes: ['/sitemap.xml'],
    // },
    // Compression for faster response delivery
    compressPublicAssets: true,
    // Security headers for all responses
    routeRules: {
      '/**': {
        headers: {
          // Prevent clickjacking
          'X-Frame-Options': 'SAMEORIGIN',
          // Prevent MIME type sniffing
          'X-Content-Type-Options': 'nosniff',
          // Enable XSS protection
          'X-XSS-Protection': '1; mode=block',
          // Referrer policy
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          // Permissions policy (previously feature policy)
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
          // Cross-Origin policies
          'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
          'Cross-Origin-Resource-Policy': 'same-origin',
        },
      },
      // Cache static assets aggressively
      '/_nuxt/**': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      },
      '/images/**': {
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      },
    },
  },

  // Route rules for hybrid rendering
  // Note: Prerendering disabled during migration. Re-enable when API is ready.
  routeRules: {
    // Static pages - prerender at build time (disabled for now)
    // '/': { prerender: true },
    // '/contact': { prerender: true },
    // '/site-map': { prerender: true },

    // ISR for offers - revalidate every hour
    '/special-offers': { isr: 3600 },
    '/special-offer/**': { isr: 3600 },

    // SSR for dynamic content
    '/car-sales/**': { ssr: true },
    '/vehicle/**': { ssr: true },
    '/cars-for-sale/**': { ssr: true },
    
    // SSR for calculator pages - ensures data is fetched server-side and included in payload
    '/calculator/**': { ssr: true, prerender: false },

    // SPA mode for user-specific pages
    '/secure-vehicle/**': { ssr: false },
    '/payment-success': { ssr: false },
    
    // Accessories store - SSR for SEO, cache for 1 hour
    '/accessories': {
      ssr: true,
      isr: 3600,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    },
    '/accessories/**': {
      ssr: true,
      isr: 3600,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    },
  },

  // App config
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      htmlAttrs: {
        lang: 'en-AU',
      },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        // Preconnect to external resources for faster loading
        { rel: 'preconnect', href: 'https://hyundaioem.b-cdn.net' },
        { rel: 'dns-prefetch', href: 'https://hyundaioem.b-cdn.net' },
        { rel: 'preconnect', href: 'https://www.googletagmanager.com' },
        { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' },
      ],
      meta: [
        // Security headers as meta tags (backup for server headers)
        { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
    },
  },

  // Auto-imports - stores are auto-imported by Nuxt from app/stores/
  imports: {
    dirs: [
      'composables', 
      'utils',
    ],
  },

  // Component options
  components: {
    dirs: [
      {
        path: '~/components',
        pathPrefix: false,
        // Ignore index.ts files to prevent duplicate component warnings with shadcn-vue
        ignore: ['**/index.ts'],
      },
    ],
  },

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: false, // Enable later when migration is complete
  },

  // Experimental features
  experimental: {
    // Disable automatic image preloading - causes warnings with ClientOnly components
    writeEarlyHints: false,
  },

  // Nuxt Vitalizer - Lighthouse score optimization
  // Disables prefetch/preload links that can hurt LCP and FCP scores
  vitalizer: {
    disablePrefetchLinks: true,
    disablePreloadLinks: true,
  },

  // Nuxt Image - Image optimization and CDN integration
  image: {
    // Use Netlify provider in production for consistent SSR/client URL generation
    // NODE_ENV is available in both server and client bundles
    provider: process.env.NODE_ENV === 'production' ? 'netlify' : 'ipx',
    // Quality setting for optimized images
    quality: 80,
    // Default format (webp for better compression)
    format: ['webp', 'jpg'],
    // Responsive image sizes
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
    // Allow images from these domains (required for Netlify Image CDN)
    domains: [
      'hyundaioem.b-cdn.net',
      'salehyundai.com.au',
      'driveAgentMedia.b-cdn.net',
      'driveagent.b-cdn.net',
      'www.hyundai.com',
      'carsales.pxcrush.net',
    ],
    // BunnyCDN provider configuration (fallback/alternative)
    providers: {
      bunny: {
        provider: 'bunny',
        options: {
          baseURL: 'https://hyundaioem.b-cdn.net',
        },
      },
    },
    // Presets for common image sizes
    presets: {
      thumbnail: {
        modifiers: {
          width: 300,
          height: 200,
          fit: 'cover',
        },
      },
      card: {
        modifiers: {
          width: 600,
          height: 400,
          fit: 'cover',
        },
      },
      hero: {
        modifiers: {
          width: 1600,
          height: 900,
          fit: 'cover',
        },
      },
    },
  },

  compatibilityDate: '2024-12-05',
});