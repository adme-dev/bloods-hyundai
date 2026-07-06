/**
 * GET /sitemap.xml
 * Generates dynamic sitemap
 * Migrated from: src/functions/sitemap.js
 */
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import { normalizeSiteUrl, shouldExcludeFromSitemap } from '~~/shared/seo';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const baseUrl = normalizeSiteUrl(config.public.siteUrl || config.public.apiUrl);

  try {
    // Fetch data for sitemap
    const [navigationJson, modelsJson, variants, carsalesData] = await Promise.all([
      $fetch(`${config.public.cdnUrl}/config/config.json`).catch(() => ({ pages: {} })) as Promise<any>,
      $fetch('https://hyundaioem.b-cdn.net/data/models.json').catch(() => []) as Promise<any[]>,
      $fetch('https://hyundaioem.b-cdn.net/data/variants.json').catch(() => []) as Promise<any[]>,
      $fetch(`/api/carsales-feed`, { baseURL: baseUrl }).catch(() => ({ vehiclesData: [] })) as Promise<any>,
    ]);

    const links: Array<{ url: string; changefreq: string; priority: number; img?: Array<{ url: string }> }> = [];

    // Static pages
    links.push({ url: '/', changefreq: 'daily', priority: 1.0 });
    links.push({ url: '/special-offers', changefreq: 'daily', priority: 0.9 });
    links.push({ url: '/contact', changefreq: 'monthly', priority: 0.8 });
    links.push({ url: '/car-sales', changefreq: 'daily', priority: 0.9 });

    // Page links from navigation
    if (navigationJson.pages) {
      Object.keys(navigationJson.pages).forEach((page) => {
        links.push({
          url: `/${page}`,
          changefreq: 'daily',
          priority: 0.9,
        });
      });
    }

    // Model links
    modelsJson.forEach((model: any) => {
      const imageUrl = model.model_image ? model.model_image.replace(/\\/g, '') : null;
      links.push({
        url: `/vehicle/${model.slug}`,
        changefreq: 'daily',
        priority: 0.8,
        img: imageUrl ? [{ url: imageUrl }] : undefined,
      });
    });

    // Variant links
    variants.forEach((variant: any) => {
      const imageUrl = variant.image ? variant.image.replace(/\\/g, '') : null;
      links.push({
        url: `/variant/${variant.slug}`,
        changefreq: 'daily',
        priority: 0.8,
        img: imageUrl ? [{ url: imageUrl }] : undefined,
      });
    });

    // Carsales vehicle links
    const vehiclesData = carsalesData.vehiclesData || [];
    vehiclesData.forEach((item: any) => {
      const slug = slugify(item.title || '');
      links.push({
        url: `/vehicle-for-sale/${item.stockid || ''}/${slug}`,
        changefreq: 'daily',
        priority: 0.8,
        img: item.thumb ? [{ url: item.thumb }] : undefined,
      });
    });

    // Build links
    modelsJson.forEach((model: any) => {
      if (model.slug) {
        links.push({
          url: `/build/${model.slug}?sortby=price`,
          changefreq: 'weekly',
          priority: 0.7,
        });
      }
    });

    const publicLinks = links.filter((link) => !shouldExcludeFromSitemap(link.url));

    // Generate sitemap XML
    const stream = new SitemapStream({ hostname: baseUrl });
    const xml = await streamToPromise(Readable.from(publicLinks).pipe(stream)).then((data) => data.toString());

    setResponseHeaders(event, {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    });

    return xml;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Error generating sitemap',
    });
  }
});

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}








