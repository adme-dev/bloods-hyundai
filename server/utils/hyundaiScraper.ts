/**
 * Hyundai OEM Website Scraper
 *
 * Scrapes vehicle information from Hyundai Australia's website
 * when a vehicle is not found in the CDN. This provides fallback
 * data to display basic vehicle pages.
 */

export interface ScrapedVehicleData {
  slug: string;
  model: string;
  title: string;
  tagline: string;
  description: string;
  header: {
    slides: Array<{
      desktop: string;
      mobile?: string;
      video?: string | false;
      heading: string;
      sub_heading: string;
      button?: string;
      link?: string;
      bottom_strip?: Array<{
        heading: string;
        sub_heading: string;
      }> | false;
    }>;
  };
  specs: Record<string, string>;
  features: string[];
  images: string[];
  scrapedAt: string;
  isScraped: true;
}

// URL mapping for Hyundai Australia website
// Maps our slugs to their URL paths
const HYUNDAI_URL_MAPPINGS: Record<string, string> = {
  // SUVs
  'venue': '/au/en/cars/suvs/venue',
  'kona': '/au/en/cars/suvs/kona',
  'kona-hybrid': '/au/en/cars/suvs/kona/konahybrid',
  'kona-electric': '/au/en/cars/eco/kona-electric',
  'tucson': '/au/en/cars/suvs/tucson',
  'tucson-hybrid': '/au/en/cars/suvs/tucson-hybrid',
  'santa-fe': '/au/en/cars/suvs/santa-fe',
  'santa-fe-hybrid': '/au/en/cars/suvs/santa-fe-hybrid',
  'palisade': '/au/en/cars/suvs/palisade',
  'staria': '/au/en/cars/people-movers-and-commercial/staria',
  'staria-load': '/au/en/cars/people-movers-and-commercial/staria-load',

  // Electric
  'inster': '/au/en/cars/eco/inster',
  'ioniq-5': '/au/en/cars/eco/ioniq5',
  'ioniq5': '/au/en/cars/eco/ioniq5',
  'ioniq-5-n': '/au/en/cars/eco/ioniq5n',
  'ioniq5n': '/au/en/cars/eco/ioniq5n',
  'ioniq-6': '/au/en/cars/eco/ioniq6-2023',
  'ioniq6': '/au/en/cars/eco/ioniq6-2023',
  'ioniq-9': '/au/en/cars/eco/ioniq9',
  'ioniq9': '/au/en/cars/eco/ioniq9',

  // Hatchbacks & Sedans
  'i30': '/au/en/cars/small-cars/i30',
  'i30-hatch': '/au/en/cars/small-cars/i30',
  'i30-n-line': '/au/en/cars/small-cars/i30/n-line',
  'i30-sedan': '/au/en/cars/small-cars/i30/sedan',
  'i30-sedan-hybrid': '/au/en/cars/small-cars/i30/i30-sedan-hybrid',
  'i30-sedan-n-line': '/au/en/cars/small-cars/i30/n-line-sedan',
  'sonata': '/au/en/cars/mid-size/sonata-n-line',
  'sonata-n-line': '/au/en/cars/mid-size/sonata-n-line',

  // Performance
  'i20-n': '/au/en/cars/sports-cars/i20-n',
  'i30-n': '/au/en/cars/sports-cars/i30-n',
  'i30-sedan-n': '/au/en/cars/sports-cars/i30-sedan-n',
};

const HYUNDAI_BASE_URL = 'https://www.hyundai.com';
const HYUNDAI_DAM_BASE = 'https://www.hyundai.com/content/dam/hyundai/au/en';

/**
 * Get the Hyundai website URL for a vehicle slug
 */
export function getHyundaiUrl(slug: string): string | null {
  // Direct mapping lookup
  if (HYUNDAI_URL_MAPPINGS[slug]) {
    return `${HYUNDAI_BASE_URL}${HYUNDAI_URL_MAPPINGS[slug]}`;
  }

  // Try normalized slug (lowercase, hyphenated)
  const normalizedSlug = slug.toLowerCase().replace(/\s+/g, '-');
  if (HYUNDAI_URL_MAPPINGS[normalizedSlug]) {
    return `${HYUNDAI_BASE_URL}${HYUNDAI_URL_MAPPINGS[normalizedSlug]}`;
  }

  // Try to guess URL based on slug pattern
  // This is a fallback for unmapped vehicles
  const guessedPath = guessVehiclePath(slug);
  if (guessedPath) {
    return `${HYUNDAI_BASE_URL}${guessedPath}`;
  }

  return null;
}

/**
 * Attempt to guess the URL path for a vehicle slug
 */
function guessVehiclePath(slug: string): string | null {
  const normalizedSlug = slug.toLowerCase();

  // Electric vehicles typically under /eco
  if (normalizedSlug.includes('electric') || normalizedSlug.startsWith('ioniq')) {
    return `/au/en/cars/eco/${normalizedSlug}`;
  }

  // Performance variants under /sports-cars
  if (normalizedSlug.endsWith('-n') && !normalizedSlug.includes('line')) {
    return `/au/en/cars/sports-cars/${normalizedSlug}`;
  }

  // SUVs
  const suvModels = ['venue', 'kona', 'tucson', 'santa-fe', 'palisade'];
  for (const model of suvModels) {
    if (normalizedSlug.startsWith(model)) {
      return `/au/en/cars/suvs/${normalizedSlug}`;
    }
  }

  // Small cars (i30, i20)
  if (normalizedSlug.startsWith('i30') || normalizedSlug.startsWith('i20')) {
    return `/au/en/cars/small-cars/${normalizedSlug}`;
  }

  return null;
}

/**
 * Format a vehicle name from slug
 */
function formatVehicleName(slug: string): string {
  return slug
    .split('-')
    .map(word => {
      // Keep specific formatting for known patterns
      if (word.toLowerCase() === 'n') return 'N';
      if (word.toLowerCase() === 'i30') return 'i30';
      if (word.toLowerCase() === 'i20') return 'i20';
      if (word.toLowerCase() === 'ioniq') return 'IONIQ';
      if (word.toLowerCase() === 'ev') return 'EV';
      if (word.toLowerCase() === 'suv') return 'SUV';
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace('Santa Fe', 'SANTA FE')
    .replace('Tucson', 'TUCSON')
    .replace('Venue', 'VENUE')
    .replace('Kona', 'KONA')
    .replace('Palisade', 'PALISADE')
    .replace('Staria', 'STARIA')
    .replace('Sonata', 'SONATA')
    .replace('Inster', 'INSTER');
}

/**
 * Extract vehicle data from HTML content
 */
function extractVehicleData(html: string, slug: string): Partial<ScrapedVehicleData> {
  const data: Partial<ScrapedVehicleData> = {
    slug,
    model: slug,
    specs: {},
    features: [],
    images: [],
  };

  // Extract title from page
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    data.title = titleMatch[1]
      .replace(/\s*\|\s*Hyundai.*$/i, '')
      .replace(/\s*-\s*Hyundai.*$/i, '')
      .trim();
  } else {
    data.title = formatVehicleName(slug);
  }

  // Extract meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  if (metaDescMatch) {
    data.description = metaDescMatch[1];
  }

  // Extract images from content/dam paths (Hyundai's DAM system)
  // Priority: hero/banner images first, then model images, then gallery
  const damImageRegex = /["'](\/content\/dam\/hyundai\/au\/en\/[^"']+\.(?:png|jpg|jpeg|webp))["']/gi;
  let match;
  const heroImages: string[] = [];
  const modelImages: string[] = [];
  const otherImages: string[] = [];

  while ((match = damImageRegex.exec(html)) !== null) {
    const imagePath = match[1];
    const fullUrl = `${HYUNDAI_BASE_URL}${imagePath}`;

    // Skip generic social share images, icons, logos
    if (imagePath.includes('social-share') ||
        imagePath.includes('/icons/') ||
        imagePath.includes('/logos/') ||
        imagePath.includes('favicon')) {
      continue;
    }

    // Prioritize hero and banner images for the main display
    if (imagePath.includes('hero') || imagePath.includes('banner') || imagePath.includes('Header')) {
      heroImages.push(fullUrl);
    } else if (imagePath.includes('models') || imagePath.includes('vehicles')) {
      modelImages.push(fullUrl);
    } else if (imagePath.includes('gallery') || imagePath.includes('feature') || imagePath.includes('interior') || imagePath.includes('exterior')) {
      otherImages.push(fullUrl);
    }
  }

  // Also look for full URLs with same priority logic
  const fullUrlRegex = /["'](https:\/\/www\.hyundai\.com\/content\/dam\/hyundai\/au\/en\/[^"']+\.(?:png|jpg|jpeg|webp))["']/gi;
  while ((match = fullUrlRegex.exec(html)) !== null) {
    const imagePath = match[1];

    if (imagePath.includes('social-share') ||
        imagePath.includes('/icons/') ||
        imagePath.includes('/logos/')) {
      continue;
    }

    if (imagePath.includes('hero') || imagePath.includes('banner') || imagePath.includes('Header')) {
      if (!heroImages.includes(imagePath)) heroImages.push(imagePath);
    } else if (imagePath.includes('models') || imagePath.includes('vehicles')) {
      if (!modelImages.includes(imagePath)) modelImages.push(imagePath);
    } else if (imagePath.includes('gallery') || imagePath.includes('feature')) {
      if (!otherImages.includes(imagePath)) otherImages.push(imagePath);
    }
  }

  // Combine images with priority: hero > model > other
  if (!data.images) data.images = [];
  data.images.push(...heroImages.slice(0, 3));
  data.images.push(...modelImages.slice(0, 4));
  data.images.push(...otherImages.slice(0, 3));

  // Only use OG image as last resort if we found no other images
  if (data.images.length === 0) {
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImageMatch) {
      const ogImage = ogImageMatch[1];
      // Only add if it's not a generic social share image
      if (!ogImage.includes('social-share') && !ogImage.includes('family_range')) {
        data.images.push(ogImage.startsWith('http') ? ogImage : `${HYUNDAI_BASE_URL}${ogImage}`);
      }
    }
  }

  // Extract specifications - look for common patterns in Hyundai pages
  // Engine power pattern
  const powerMatch = html.match(/(\d+)\s*kW\s*[\/|]\s*(\d+)\s*Nm/i);
  if (powerMatch) {
    data.specs!['power'] = `${powerMatch[1]}kW / ${powerMatch[2]}Nm`;
  }

  // Fuel consumption
  const fuelMatch = html.match(/(\d+\.?\d*)\s*L\s*\/\s*100\s*km/i);
  if (fuelMatch) {
    data.specs!['fuel_consumption'] = `${fuelMatch[1]}L / 100km`;
  }

  // Seating - look for patterns like "5-seater", "7 seater", "seats 5"
  // More specific patterns to avoid false matches like "2 seats" from unrelated content
  const seatPatterns = [
    /([5-9])\s*(?:-\s*)?seater/i,                    // "5-seater", "7 seater"
    /([5-9])\s*(?:-\s*)?seat\s+(?:suv|configuration|option)/i, // "7 seat SUV"
    /seats?\s*(?:up\s*to\s*)?([5-9])/i,              // "seats 7", "seats up to 7"
    /([5-9])\s+(?:or\s+\d+\s+)?seats/i,              // "6 or 7 seats"
  ];
  for (const pattern of seatPatterns) {
    const seatMatch = html.match(pattern);
    if (seatMatch) {
      data.specs!['seating'] = `${seatMatch[1]} seats`;
      break;
    }
  }

  // Towing capacity
  const towMatch = html.match(/(\d+(?:,\d+)?)\s*kg\s*(?:braked\s*)?towing/i);
  if (towMatch) {
    data.specs!['towing'] = `${towMatch[1]}kg`;
  }

  return data;
}

/**
 * Scrape vehicle data from Hyundai Australia website
 */
export async function scrapeHyundaiVehicle(slug: string): Promise<ScrapedVehicleData | null> {
  const url = getHyundaiUrl(slug);

  if (!url) {
    console.log(`[Scraper] No URL mapping found for slug: ${slug}`);
    return null;
  }

  console.log(`[Scraper] Fetching vehicle data from: ${url}`);

  try {
    const response = await $fetch<string>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HyundaiDealerBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-AU,en;q=0.9',
      },
    });

    const extracted = extractVehicleData(response, slug);

    // Build the complete vehicle data structure
    const vehicleData: ScrapedVehicleData = {
      slug,
      model: extracted.model || slug,
      title: extracted.title || formatVehicleName(slug),
      tagline: extracted.description?.split('.')[0] || `Discover the ${formatVehicleName(slug)}`,
      description: extracted.description || `Explore the ${formatVehicleName(slug)} at your local Hyundai dealer.`,
      header: {
        slides: [{
          desktop: extracted.images?.[0] || getDefaultHeroImage(slug),
          mobile: extracted.images?.[0] || getDefaultHeroImage(slug),
          video: false,
          heading: formatVehicleName(slug),
          sub_heading: extracted.description?.split('.')[0] || `Discover the ${formatVehicleName(slug)}`,
          button: 'Enquire Now',
          link: `/variant/${slug}`,
          bottom_strip: buildSpecStrip(extracted.specs || {}),
        }],
      },
      specs: extracted.specs || {},
      features: extracted.features || [],
      images: extracted.images || [],
      scrapedAt: new Date().toISOString(),
      isScraped: true,
    };

    return vehicleData;
  } catch (error: any) {
    console.error(`[Scraper] Error fetching vehicle ${slug}:`, error.message);

    // If fetch fails, return a basic placeholder
    return createPlaceholderVehicle(slug);
  }
}

/**
 * Build the specification strip from extracted specs
 */
function buildSpecStrip(specs: Record<string, string>): Array<{ heading: string; sub_heading: string }> | false {
  const strip: Array<{ heading: string; sub_heading: string }> = [];

  if (specs.power) {
    const [power] = specs.power.split('/');
    strip.push({ heading: power.trim(), sub_heading: 'Max Power' });
  }

  if (specs.fuel_consumption) {
    strip.push({ heading: specs.fuel_consumption, sub_heading: 'Combined Fuel' });
  }

  if (specs.seating) {
    strip.push({ heading: specs.seating.replace(' seats', ''), sub_heading: 'Seats' });
  }

  if (specs.towing) {
    strip.push({ heading: specs.towing, sub_heading: 'Towing Capacity' });
  }

  return strip.length > 0 ? strip : false;
}

/**
 * Get a default hero image based on vehicle category
 */
function getDefaultHeroImage(slug: string): string {
  const normalizedSlug = slug.toLowerCase();

  // Map to known default images based on model family
  if (normalizedSlug.includes('santa-fe')) {
    return `${HYUNDAI_DAM_BASE}/models/front-3-4-models/Hyundai-SANTAFE_ICE-950x415.png`;
  }
  if (normalizedSlug.includes('tucson')) {
    return `${HYUNDAI_DAM_BASE}/models/front-3-4-models/Hyundai-TUCSON-950x415.png`;
  }
  if (normalizedSlug.includes('kona')) {
    return `${HYUNDAI_DAM_BASE}/models/front-3-4-models/Hyundai-KONA-950x415.png`;
  }
  if (normalizedSlug.includes('venue')) {
    return `${HYUNDAI_DAM_BASE}/models/front-3-4-models/Hyundai-VENUE-950x415.png`;
  }
  if (normalizedSlug.includes('palisade')) {
    return `${HYUNDAI_DAM_BASE}/models/front-3-4-models/Hyundai-PALISADE-950x415.png`;
  }
  if (normalizedSlug.includes('i30')) {
    return `${HYUNDAI_DAM_BASE}/models/front-3-4-models/Hyundai-i30-950x415.png`;
  }
  if (normalizedSlug.includes('ioniq')) {
    return `${HYUNDAI_DAM_BASE}/models/front-3-4-models/Hyundai-IONIQ5-950x415.png`;
  }

  // Generic fallback
  return `${HYUNDAI_DAM_BASE}/models/front-3-4-models/Hyundai-generic-950x415.png`;
}

/**
 * Create a basic placeholder vehicle when scraping fails
 */
function createPlaceholderVehicle(slug: string): ScrapedVehicleData {
  const title = formatVehicleName(slug);

  return {
    slug,
    model: slug,
    title,
    tagline: `Discover the Hyundai ${title}`,
    description: `The Hyundai ${title} combines style, performance, and value. Contact us to learn more about this exciting vehicle.`,
    header: {
      slides: [{
        desktop: getDefaultHeroImage(slug),
        mobile: getDefaultHeroImage(slug),
        video: false,
        heading: title,
        sub_heading: `Discover the Hyundai ${title}`,
        button: 'Enquire Now',
        link: `/variant/${slug}`,
        bottom_strip: false,
      }],
    },
    specs: {},
    features: [],
    images: [getDefaultHeroImage(slug)],
    scrapedAt: new Date().toISOString(),
    isScraped: true,
  };
}

/**
 * Check if we have a URL mapping for this vehicle
 */
export function hasVehicleMapping(slug: string): boolean {
  const normalizedSlug = slug.toLowerCase().replace(/\s+/g, '-');
  return HYUNDAI_URL_MAPPINGS.hasOwnProperty(slug) ||
         HYUNDAI_URL_MAPPINGS.hasOwnProperty(normalizedSlug) ||
         guessVehiclePath(slug) !== null;
}
