import { d as defineEventHandler, u as useRuntimeConfig, s as setResponseHeaders } from '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue';
import 'consola';

const robots_txt = defineEventHandler((event) => {
  const config = useRuntimeConfig();
  const siteUrl = config.public.apiUrl || "https://sale-hyundai.com.au";
  const robotsContent = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
  setResponseHeaders(event, {
    "Content-Type": "text/plain",
    "Cache-Control": "public, max-age=3600"
  });
  return robotsContent;
});

export { robots_txt as default };
//# sourceMappingURL=robots.txt.mjs.map
