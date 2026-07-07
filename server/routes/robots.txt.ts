import { resolveDealerSiteUrl } from '../utils/tenant';

/**
 * GET /robots.txt
 * Generates robots.txt
 * Migrated from: src/functions/robots.js
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig();
  const siteUrl = resolveDealerSiteUrl(event, config.public.siteUrl || config.public.apiUrl || 'http://localhost:3000');

  const robotsContent = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

  setResponseHeaders(event, {
    'Content-Type': 'text/plain',
    'Cache-Control': 'public, max-age=3600',
    Vary: 'Host',
  });

  return robotsContent;
});





