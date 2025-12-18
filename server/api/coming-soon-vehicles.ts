/**
 * API endpoint to fetch "Coming Soon" vehicles from Hyundai Australia
 *
 * Scrapes the Hyundai AU cars page to find vehicles with Register Your Interest (RYI) links
 * These are vehicles that are announced but not yet available for sale
 */

// Cache for coming soon vehicles (TTL: 24 hours)
const comingSoonCache: { data: any[] | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export interface ComingSoonVehicle {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  category: string;
  image: string | null;
  hyundaiUrl: string;
  isComingSoon: true;
  form: true; // Triggers Register Interest form on vehicle page
}

/**
 * Extract coming soon vehicles from Hyundai AU website HTML
 */
function parseComingSoonVehicles(html: string): ComingSoonVehicle[] {
  const vehicles: ComingSoonVehicle[] = [];

  // Look for RYI (Register Your Interest) links which indicate coming soon vehicles
  // Pattern: /au/en/cars/[category]/[model]-ryi
  const ryiPattern = /href=["']?(\/au\/en\/cars\/[^"'\s]+?-ryi)["']?[^>]*>[\s\S]*?<[^>]*class=["'][^"']*model[^"']*["'][^>]*>[\s\S]*?([A-Z0-9][A-Z0-9\s]+?)[\s]*</gi;

  // Alternative pattern: look for "Register your interest" text near vehicle names
  const registerPattern = /<a[^>]*href=["'](\/au\/en\/cars\/[^"']+)["'][^>]*>[\s\S]*?Register\s+(?:your\s+)?interest/gi;

  // Pattern to find vehicle cards with RYI URLs
  const vehicleCardPattern = /href=["'](\/au\/en\/cars\/(?:eco|suvs|small-cars|sports-cars|people-movers)[^"']*-ryi)["'][^>]*>/gi;

  const foundUrls = new Set<string>();
  let match;

  // Find all RYI URLs
  while ((match = vehicleCardPattern.exec(html)) !== null) {
    if (match[1]) foundUrls.add(match[1]);
  }

  // Also check for explicit register interest links
  while ((match = registerPattern.exec(html)) !== null) {
    if (match[1] && match[1].includes('-ryi')) {
      foundUrls.add(match[1]);
    }
  }

  // Process each found URL
  for (const url of foundUrls) {
    const vehicle = parseVehicleFromUrl(url, html);
    if (vehicle) {
      vehicles.push(vehicle);
    }
  }

  return vehicles;
}

/**
 * Parse vehicle details from URL and surrounding HTML context
 */
function parseVehicleFromUrl(url: string, html: string): ComingSoonVehicle | null {
  // Extract model name from URL
  // e.g., /au/en/cars/eco/ioniq6-n-ryi -> ioniq6-n
  // e.g., /au/en/cars/eco/elexio-ryi -> elexio
  const urlMatch = url.match(/\/([^\/]+)-ryi$/);
  if (!urlMatch || !urlMatch[1]) return null;

  const rawSlug = urlMatch[1];
  const slug = normalizeSlug(rawSlug);

  // Determine category from URL path
  const categoryMatch = url.match(/\/cars\/([^\/]+)\//);
  const categorySlug = categoryMatch?.[1] ?? 'eco';
  const category = mapCategoryName(categorySlug);

  // Try to extract more info from the HTML around this URL
  const vehicleInfo = extractVehicleInfo(html, url, rawSlug);

  return {
    id: `coming-soon-${slug}`,
    name: vehicleInfo.name || formatVehicleName(slug),
    slug,
    tagline: vehicleInfo.tagline || 'Coming Soon - Register Your Interest',
    category,
    image: vehicleInfo.image ?? null,
    hyundaiUrl: `https://www.hyundai.com${url}`,
    isComingSoon: true,
    form: true,
  };
}

/**
 * Extract additional vehicle info from HTML context
 */
function extractVehicleInfo(html: string, url: string, rawSlug: string): { name?: string; tagline?: string; image?: string } {
  const info: { name?: string; tagline?: string; image?: string } = {};

  // Look for vehicle name near the URL
  // Common patterns in Hyundai's HTML structure
  const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Try to find the vehicle card containing this URL
  const cardPattern = new RegExp(
    `<[^>]*class=["'][^"']*(?:vehicle|model|car)[^"']*["'][^>]*>[\\s\\S]*?href=["']${escapedUrl}["'][\\s\\S]*?</[^>]+>`,
    'i'
  );
  const cardMatch = html.match(cardPattern);

  if (cardMatch?.[0]) {
    // Extract title/name from within the card
    const titleMatch = cardMatch[0].match(/<(?:h[1-6]|span|div)[^>]*class=["'][^"']*(?:title|name|heading)[^"']*["'][^>]*>([^<]+)</i);
    if (titleMatch?.[1]) {
      info.name = titleMatch[1].trim();
    }

    // Extract tagline/description
    const taglineMatch = cardMatch[0].match(/<(?:p|span|div)[^>]*class=["'][^"']*(?:tagline|description|subtitle)[^"']*["'][^>]*>([^<]+)</i);
    if (taglineMatch?.[1]) {
      info.tagline = taglineMatch[1].trim();
    }

    // Extract image
    const imageMatch = cardMatch[0].match(/src=["']((?:https:\/\/www\.hyundai\.com)?\/content\/dam\/[^"']+\.(?:png|jpg|jpeg|webp))["']/i);
    if (imageMatch?.[1]) {
      info.image = imageMatch[1].startsWith('http') ? imageMatch[1] : `https://www.hyundai.com${imageMatch[1]}`;
    }
  }

  // Fallback: try to find image associated with this model
  if (!info.image) {
    const slugPattern = rawSlug.replace(/-/g, '[\\-_]?');
    const imagePattern = new RegExp(
      `["']((?:https:\\/\\/www\\.hyundai\\.com)?\\/content\\/dam\\/hyundai\\/au\\/en\\/[^"']*${slugPattern}[^"']*\\.(?:png|jpg|jpeg|webp))["']`,
      'i'
    );
    const imgMatch = html.match(imagePattern);
    if (imgMatch?.[1]) {
      info.image = imgMatch[1].startsWith('http') ? imgMatch[1] : `https://www.hyundai.com${imgMatch[1]}`;
    }
  }

  return info;
}

/**
 * Normalize slug for consistency
 */
function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    // Handle specific model name formats
    .replace('ioniq6-n', 'ioniq-6-n')
    .replace('ioniq5-n', 'ioniq-5-n')
    .replace('ioniq6', 'ioniq-6')
    .replace('ioniq5', 'ioniq-5')
    .replace('ioniq9', 'ioniq-9');
}

/**
 * Format vehicle name from slug
 */
function formatVehicleName(slug: string): string {
  return slug
    .split('-')
    .map(word => {
      const lower = word.toLowerCase();
      if (lower === 'n') return 'N';
      if (lower === 'ioniq') return 'IONIQ';
      if (lower === 'ev') return 'EV';
      if (lower === 'elexio') return 'ELEXIO';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Map category slug to display name
 */
function mapCategoryName(slug: string): string {
  const categoryMap: Record<string, string> = {
    'eco': 'Electric',
    'suvs': 'SUVs',
    'small-cars': 'Hatch & Sedans',
    'sports-cars': 'Performance',
    'people-movers': 'People Movers',
    'people-movers-and-commercial': 'People Movers',
  };
  return categoryMap[slug] || 'Coming Soon';
}

/**
 * Known coming soon vehicles (fallback if scraping fails)
 * Updated periodically based on Hyundai AU announcements
 */
function getKnownComingSoonVehicles(): ComingSoonVehicle[] {
  return [
    {
      id: 'coming-soon-ioniq-6-n',
      name: 'IONIQ 6 N',
      slug: 'ioniq-6-n',
      tagline: 'A new paradigm for high-performance EV',
      category: 'Electric',
      // Side profile image matching Hyundai AU "Coming soon" section (640x331)
      image: 'https://www.hyundai.com/content/dam/hyundai/au/en/models/ioniq-6-n/register-your-interest/hero/Hyundai_IONIQ6N_Side_Profile_640x331.png',
      hyundaiUrl: 'https://www.hyundai.com/au/en/cars/eco/ioniq6-n-ryi',
      isComingSoon: true,
      form: true,
    },
    {
      id: 'coming-soon-elexio',
      name: 'ELEXIO',
      slug: 'elexio',
      tagline: 'Be first. Drive the future',
      category: 'Electric',
      // Side profile image matching Hyundai AU "Coming soon" section (640x331)
      image: 'https://www.hyundai.com/content/dam/hyundai/au/en/elexio/ryi/Hyundai_ELEXIO_Side_Profile_640x331.png',
      hyundaiUrl: 'https://www.hyundai.com/au/en/cars/eco/elexio-ryi',
      isComingSoon: true,
      form: true,
    },
  ];
}

export default defineEventHandler(async (event) => {
  try {
    // Check cache first
    if (comingSoonCache.data && Date.now() - comingSoonCache.timestamp < CACHE_TTL) {
      return {
        success: true,
        vehicles: comingSoonCache.data,
        source: 'cache',
        cachedAt: new Date(comingSoonCache.timestamp).toISOString(),
      };
    }

    // Fetch the Hyundai AU cars page
    console.log('[Coming Soon API] Fetching Hyundai AU cars page...');

    const html = await $fetch<string>('https://www.hyundai.com/au/en/cars', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HyundaiDealerBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-AU,en;q=0.9',
      },
      timeout: 15000,
    });

    // Parse coming soon vehicles
    let vehicles = parseComingSoonVehicles(html);

    // Merge scraped with known vehicles, preferring known data for quality
    // Known vehicles have curated, accurate data; scraped data can be unreliable
    const knownVehicles = getKnownComingSoonVehicles();
    const knownBySlug = new Map(knownVehicles.map(v => [v.slug, v]));
    const scrapedBySlug = new Map(vehicles.map(v => [v.slug, v]));

    const finalVehicles: ComingSoonVehicle[] = [];
    const processedSlugs = new Set<string>();

    // First, add all known vehicles (they have curated data)
    for (const known of knownVehicles) {
      finalVehicles.push(known);
      processedSlugs.add(known.slug);
    }

    // Then add any NEW scraped vehicles that aren't in our known list
    // This allows automatic detection of new coming soon vehicles
    for (const scraped of vehicles) {
      if (!processedSlugs.has(scraped.slug)) {
        finalVehicles.push(scraped);
        processedSlugs.add(scraped.slug);
        console.log(`[Coming Soon API] Found new vehicle via scraping: ${scraped.slug}`);
      }
    }

    vehicles = finalVehicles;

    // Update cache
    comingSoonCache.data = vehicles;
    comingSoonCache.timestamp = Date.now();

    console.log(`[Coming Soon API] Found ${vehicles.length} coming soon vehicles`);

    return {
      success: true,
      vehicles,
      source: 'scraped',
      scrapedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('[Coming Soon API] Error:', error.message);

    // Return known vehicles as fallback on error
    const fallbackVehicles = getKnownComingSoonVehicles();

    return {
      success: true,
      vehicles: fallbackVehicles,
      source: 'fallback',
      error: error.message,
    };
  }
});
