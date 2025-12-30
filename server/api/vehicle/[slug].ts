import { H3Event } from 'h3';
import { scrapeHyundaiVehicle, hasVehicleMapping } from '../../utils/hyundaiScraper';

// Simple in-memory cache for scraped vehicles (TTL: 1 hour)
const scrapedVehicleCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Normalize a vehicle slug by stripping year prefixes and other common variations
 * Examples: "2025-santa-fe" -> "santa-fe", "2024-i30-n" -> "i30-n"
 */
function normalizeSlug(slug: string): string {
  // Strip leading year prefix (e.g., "2025-", "2024-")
  return slug.replace(/^20\d{2}-/, '');
}

/**
 * Get all slug variations to try for CDN lookup
 */
function getSlugVariations(slug: string): string[] {
  const variations: string[] = [slug];
  const normalized = normalizeSlug(slug);

  // Add normalized version if different
  if (normalized !== slug) {
    variations.push(normalized);
  }

  return variations;
}

export default defineEventHandler(async (event: H3Event) => {
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Vehicle slug is required',
    });
  }

  const config = useRuntimeConfig();

  // The OEM RAW CDN URL where vehicle JSON files are stored
  const oemRawCdnUrl = config.public.oemRawCdnUrl || process.env.NUXT_PUBLIC_OEM_RAW_CDN_URL || 'https://hyundaioem.b-cdn.net/raw';

  // Try different slug variations (original, then normalized)
  const slugVariations = getSlugVariations(slug);

  for (const trySlug of slugVariations) {
    try {
      // Fetch the vehicle JSON file from CDN based on slug
      const vehicleUrl = `${oemRawCdnUrl}/${trySlug}.json`;

      console.log(`[Vehicle API] Fetching vehicle data from: ${vehicleUrl}`);

      const response = await $fetch<any[]>(vehicleUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });

      // The response is an array, return the first item
      const vehicleData = Array.isArray(response) ? response[0] : response;

      if (vehicleData) {
        return {
          success: true,
          vehicle: vehicleData,
          slug: trySlug,
          originalSlug: slug,
          source: 'cdn',
        };
      }
    } catch (error: any) {
      // Continue to next variation if this one fails
      console.log(`[Vehicle API] CDN miss for ${trySlug}, trying next variation...`);
    }
  }

  // All CDN attempts failed, try scraping with normalized slug
  const normalizedSlug = normalizeSlug(slug);
  console.error(`[Vehicle API] All CDN attempts failed for ${slug}, trying scraper with ${normalizedSlug}`);

  return await tryScrapeFallback(normalizedSlug, slug);
});

/**
 * Attempt to get vehicle data by scraping Hyundai's website
 */
async function tryScrapeFallback(slug: string, originalSlug?: string) {
  console.log(`[Vehicle API] Attempting to scrape from Hyundai website for: ${slug}`);

  // Check cache first
  const cached = scrapedVehicleCache.get(slug);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Vehicle API] Returning cached scraped data for ${slug}`);
    return {
      success: true,
      vehicle: cached.data,
      slug,
      originalSlug: originalSlug || slug,
      source: 'scraped-cache',
    };
  }

  // Check if we have a URL mapping for this vehicle
  if (!hasVehicleMapping(slug)) {
    console.log(`[Vehicle API] No URL mapping found for ${slug}`);
    throw createError({
      statusCode: 404,
      message: `Vehicle not found: ${originalSlug || slug}`,
    });
  }

  // Try to scrape the vehicle data
  const scrapedData = await scrapeHyundaiVehicle(slug);

  if (scrapedData) {
    // Cache the scraped data
    scrapedVehicleCache.set(slug, {
      data: scrapedData,
      timestamp: Date.now(),
    });

    console.log(`[Vehicle API] Successfully scraped data for ${slug}`);

    return {
      success: true,
      vehicle: scrapedData,
      slug,
      originalSlug: originalSlug || slug,
      source: 'scraped',
    };
  }

  // Scraping failed completely
  throw createError({
    statusCode: 404,
    message: `Vehicle not found: ${originalSlug || slug}`,
  });
}






