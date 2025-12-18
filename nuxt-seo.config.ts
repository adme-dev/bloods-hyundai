export default defineNuxtConfig({
  robots: {
    disallow: ['/admin', '/api', '/secure-vehicle'],
    allow: '/',
  },
  
  sitemap: {
    strictNuxtContentPaths: true,
    exclude: [
      '/admin/**',
      '/api/**',
      '/secure-vehicle/**',
      '/payment-success',
    ],
  },
  
  ogImage: {
    enabled: true,
    defaults: {
      component: 'OgImageDefault',
    },
  },
});









