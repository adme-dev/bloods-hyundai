/**
 * Cache Control Middleware
 * 
 * CRITICAL: This middleware prevents Netlify's Durable Cache from caching SSR responses
 * which would cause 404 errors for CSS/JS files after new deployments.
 * 
 * The problem: When Durable Cache stores HTML, it includes references to hashed asset files.
 * After a new deploy, the asset hashes change, but Durable Cache still serves old HTML
 * with old asset references, causing 404s.
 * 
 * Solution: Set headers that tell Netlify to never cache SSR HTML responses.
 */

export default defineEventHandler((event) => {
  // Only apply to document requests (not API calls, not static assets)
  const path = event.path || '';
  
  // Skip API routes, static assets, and Nuxt internals
  if (
    path.startsWith('/api/') ||
    path.startsWith('/_nuxt/') ||
    path.startsWith('/assets/') ||
    path.includes('.') // Has file extension (static file)
  ) {
    return;
  }

  // Set headers to prevent ALL caching of SSR responses
  // These headers work with Netlify's caching layers
  setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate');
  setHeader(event, 'Pragma', 'no-cache');
  setHeader(event, 'Expires', '0');
  
  // Netlify-specific headers to disable Durable Cache
  setHeader(event, 'Netlify-CDN-Cache-Control', 'no-store');
  setHeader(event, 'CDN-Cache-Control', 'no-store');
  
  // Vary header to ensure different responses aren't served from cache
  setHeader(event, 'Vary', 'Accept, Accept-Encoding');
});
