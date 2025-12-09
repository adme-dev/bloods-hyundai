// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Nuxt 4 - no compatibility flag needed anymore
  devtools: { enabled: false },

  // Modules (sitemap disabled in dev for memory optimization)
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'nuxt-gtag',
    '@nuxtjs/seo', // Comprehensive SEO module (includes sitemap, robots, og-image, schema-org, seo-kit)
    '@fedorae/nuxt-uikit', // UIkit loaded globally
    '@unocss/nuxt', // UnoCSS/Tailwind utilities - used globally for all pages
  ],

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

    // Public (exposed to client)
    public: {
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || 'Sale Hyundai',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || '',
      cdnUrl: process.env.NUXT_PUBLIC_CDN_URL || '',
      oemCdnUrl: process.env.NUXT_PUBLIC_OEM_CDN_URL || '',
      oemRawCdnUrl: process.env.NUXT_PUBLIC_OEM_RAW_CDN_URL || 'https://hyundaioem.b-cdn.net/raw',
      stripePublishableKey: process.env.NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
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
    // Optimize memory usage for development
    build: {
      sourcemap: false,
      minify: false,
      cssMinify: false,
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
    '/accessories': { ssr: true, isr: 3600 },
    '/accessories/**': { ssr: true, isr: 3600 },
  },

  // App config
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
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

  compatibilityDate: '2024-12-05',
});



