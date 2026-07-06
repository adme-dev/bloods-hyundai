/**
 * Cache Control Middleware
 * 
 * Cache public documents briefly at the CDN while keeping private and
 * user-specific routes out of all caches.
 */
import { getDocumentCacheHeaders } from '~~/shared/seo';

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

  const headers = getDocumentCacheHeaders(path);
  Object.entries(headers).forEach(([name, value]) => {
    setHeader(event, name, value);
  });
});
