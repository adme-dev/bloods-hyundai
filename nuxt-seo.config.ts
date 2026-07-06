export default defineNuxtConfig({
  robots: {
    disallow: ['/admin', '/portal', '/secure-vehicle', '/favorites', '/payment-success'],
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










