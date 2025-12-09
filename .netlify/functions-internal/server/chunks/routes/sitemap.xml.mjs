import { d as defineEventHandler, u as useRuntimeConfig, s as setResponseHeaders, c as createError } from '../nitro/nitro.mjs';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue';
import 'consola';

const sitemap_xml = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiUrl || "https://sale-hyundai.com.au";
  try {
    const [navigationJson, modelsJson, variants, carsalesData] = await Promise.all([
      $fetch(`${config.public.cdnUrl}/config/config.json`).catch(() => ({ pages: {} })),
      $fetch("https://hyundaioem.b-cdn.net/data/models.json").catch(() => []),
      $fetch("https://hyundaioem.b-cdn.net/data/variants.json").catch(() => []),
      $fetch(`/api/carsales-feed`, { baseURL: baseUrl }).catch(() => ({ vehiclesData: [] }))
    ]);
    const links = [];
    links.push({ url: "/", changefreq: "daily", priority: 1 });
    links.push({ url: "/special-offers", changefreq: "daily", priority: 0.9 });
    links.push({ url: "/contact", changefreq: "monthly", priority: 0.8 });
    links.push({ url: "/car-sales", changefreq: "daily", priority: 0.9 });
    if (navigationJson.pages) {
      Object.keys(navigationJson.pages).forEach((page) => {
        links.push({
          url: `/${page}`,
          changefreq: "daily",
          priority: 0.9
        });
      });
    }
    modelsJson.forEach((model) => {
      const imageUrl = model.model_image ? model.model_image.replace(/\\/g, "") : null;
      links.push({
        url: `/vehicle/${model.slug}`,
        changefreq: "daily",
        priority: 0.8,
        img: imageUrl ? [{ url: imageUrl }] : void 0
      });
    });
    variants.forEach((variant) => {
      const imageUrl = variant.image ? variant.image.replace(/\\/g, "") : null;
      links.push({
        url: `/variant/${variant.slug}`,
        changefreq: "daily",
        priority: 0.8,
        img: imageUrl ? [{ url: imageUrl }] : void 0
      });
    });
    const vehiclesData = carsalesData.vehiclesData || [];
    vehiclesData.forEach((item) => {
      const slug = slugify(item.title || "");
      links.push({
        url: `/vehicle-for-sale/${item.stockid || ""}/${slug}`,
        changefreq: "daily",
        priority: 0.8,
        img: item.thumb ? [{ url: item.thumb }] : void 0
      });
    });
    modelsJson.forEach((model) => {
      if (model.slug) {
        links.push({
          url: `/build/${model.slug}?sortby=price`,
          changefreq: "weekly",
          priority: 0.7
        });
      }
    });
    const stream = new SitemapStream({ hostname: baseUrl });
    const xml = await streamToPromise(Readable.from(links).pipe(stream)).then((data) => data.toString());
    setResponseHeaders(event, {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600"
    });
    return xml;
  } catch (error) {
    console.error("Error generating sitemap:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error generating sitemap"
    });
  }
});
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export { sitemap_xml as default };
//# sourceMappingURL=sitemap.xml.mjs.map
