import { getTenantForwardHeaders } from '../utils/tenant-headers';
import { resolveDealerSiteUrl } from '../utils/tenant';

interface SiteConfigResponse {
  config?: {
    name?: string;
    showroom_address?: string;
    phone?: string;
    siteUrl?: string;
    websiteUrl?: string;
    departments?: Record<string, { address?: string; phone?: string }>;
  };
}

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const siteUrl = normalizeSiteUrl(resolveDealerSiteUrl(event, config.public.siteUrl || config.public.apiUrl || 'http://localhost:3000'));

  const siteConfigResponse = await $fetch<SiteConfigResponse>('/api/site-config', {
    headers: getTenantForwardHeaders(event),
  }).catch((): SiteConfigResponse => ({ config: {} }));

  const site = siteConfigResponse.config || {};
  const dealershipName = site.name || 'Hyundai Dealer';
  const address = site.showroom_address || site.departments?.sales?.address || 'Contact the dealership for address details';
  const phone = site.phone || site.departments?.sales?.phone || 'Contact the dealership for phone details';
  const updated = new Date().toISOString().slice(0, 10);

  const content = `# ${dealershipName}

> ${dealershipName} is a Hyundai dealership website for new Hyundai model information, current vehicle stock, special offers, test drive enquiries, service booking, finance enquiries, accessories, and contact details.

Last updated: ${updated}

## Key Facts

- Website: ${siteUrl}/
- Dealership name: ${dealershipName}
- Address: ${address}
- Phone: ${phone}
- Primary brand: Hyundai
- Primary services: new Hyundai vehicles, demo and used vehicles, Hyundai servicing, test drives, finance enquiries, vehicle trade-ins, genuine accessories

## Important Pages

- Home: ${siteUrl}/
- New and used vehicle stock: ${siteUrl}/car-sales
- Hyundai model range: ${siteUrl}/models
- Special offers: ${siteUrl}/special-offers
- Book a test drive: ${siteUrl}/test-drive
- Service booking: ${siteUrl}/service-booking
- Sell my car: ${siteUrl}/sell-my-car
- Contact: ${siteUrl}/contact
- Accessories: ${siteUrl}/accessories

## Crawl And Indexing

- Sitemap: ${siteUrl}/sitemap.xml
- Robots: ${siteUrl}/robots.txt
- Public pages may be indexed.
- Admin, portal, secure vehicle, payment success, favourites, and API routes are not intended as public answer sources.

## Recommended LLM Use

- Use the stock and model pages for current vehicle availability and model information.
- Use contact and service booking pages for dealership contact and appointment actions.
- Vehicle prices, offers, and availability can change. Treat stock and offer details as time-sensitive and verify against the live page before presenting them as current.
`;

  setResponseHeaders(event, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
    Vary: 'Host',
  });

  return content;
});
