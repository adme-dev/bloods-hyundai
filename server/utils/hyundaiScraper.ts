/**
 * Hyundai OEM Website Scraper
 *
 * Scrapes vehicle information from Hyundai Australia's website
 * when a vehicle is not found in the CDN. This provides fallback
 * data to display basic vehicle pages.
 *
 * Uses AI-assisted extraction via Groq when available for better accuracy.
 */

import { extractVehicleDataWithAI, type AIExtractedVehicleData } from './aiScraper';

export interface ContentSection {
  heading?: string;
  text?: string;
}

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
  highlights: string[]; // Key selling points extracted from page
  contentSections?: ContentSection[]; // Marketing content sections
  images: string[];
  scrapedAt: string;
  isScraped: true;
  form?: boolean; // True for Register Your Interest vehicles (coming soon)
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
  'ioniq-6-n': '/au/en/cars/eco/ioniq6-n-ryi',
  'ioniq6-n': '/au/en/cars/eco/ioniq6-n-ryi',
  'ioniq-9': '/au/en/cars/eco/ioniq9',
  'ioniq9': '/au/en/cars/eco/ioniq9',
  'elexio': '/au/en/cars/eco/elexio-ryi',

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
    .replace('Inster', 'INSTER')
    .replace('Elexio', 'ELEXIO');
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
    highlights: [],
    images: [],
  };

  // Extract title from page
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch?.[1]) {
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
  // Priority: hero images first (especially desktop Hero_D), then RYI/model images, then gallery
  const damImageRegex = /["'](\/content\/dam\/hyundai\/au\/en\/[^"']+\.(?:png|jpg|jpeg|webp))["']/gi;
  let match;
  const heroDesktopImages: string[] = []; // Desktop hero images (1920x720)
  const heroMobileImages: string[] = [];  // Mobile hero images
  const ryiImages: string[] = [];         // RYI specific images (Register Your Interest pages)
  const modelImages: string[] = [];       // Model/vehicle images
  const otherImages: string[] = [];       // Gallery, feature images

  while ((match = damImageRegex.exec(html)) !== null) {
    const imagePath = match[1];
    if (!imagePath) continue;

    const fullUrl = `${HYUNDAI_BASE_URL}${imagePath}`;

    // Skip generic social share images, icons, logos, navigation
    if (imagePath.includes('social-share') ||
        imagePath.includes('/icons/') ||
        imagePath.includes('/logos/') ||
        imagePath.includes('/navigation/') ||
        imagePath.includes('/owning/') ||
        imagePath.includes('/masterbrand/') ||
        imagePath.includes('/offers-images/') ||
        imagePath.includes('side-profile') ||
        imagePath.includes('favicon')) {
      continue;
    }

    // Prioritize desktop hero images (Hero_D pattern from RYI pages)
    if (imagePath.includes('Hero_D') || (imagePath.includes('hero') && imagePath.includes('1920'))) {
      heroDesktopImages.push(fullUrl);
    } else if (imagePath.includes('Hero_M') || (imagePath.includes('hero') && imagePath.includes('767'))) {
      heroMobileImages.push(fullUrl);
    } else if (imagePath.includes('/ryi/') || imagePath.includes('register-your-interest')) {
      // RYI page specific images (vehicle images on coming soon pages)
      ryiImages.push(fullUrl);
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
    if (!imagePath) continue;

    if (imagePath.includes('social-share') ||
        imagePath.includes('/icons/') ||
        imagePath.includes('/logos/') ||
        imagePath.includes('/navigation/') ||
        imagePath.includes('side-profile')) {
      continue;
    }

    if (imagePath.includes('Hero_D') || (imagePath.includes('hero') && imagePath.includes('1920'))) {
      if (!heroDesktopImages.includes(imagePath)) heroDesktopImages.push(imagePath);
    } else if (imagePath.includes('Hero_M')) {
      if (!heroMobileImages.includes(imagePath)) heroMobileImages.push(imagePath);
    } else if (imagePath.includes('/ryi/') || imagePath.includes('register-your-interest')) {
      if (!ryiImages.includes(imagePath)) ryiImages.push(imagePath);
    } else if (imagePath.includes('models') || imagePath.includes('vehicles')) {
      if (!modelImages.includes(imagePath)) modelImages.push(imagePath);
    } else if (imagePath.includes('gallery') || imagePath.includes('feature')) {
      if (!otherImages.includes(imagePath)) otherImages.push(imagePath);
    }
  }

  // Combine images with priority: desktop hero > mobile hero > RYI > model > other
  if (!data.images) data.images = [];
  data.images.push(...heroDesktopImages.slice(0, 2));
  data.images.push(...heroMobileImages.slice(0, 1));
  data.images.push(...ryiImages.slice(0, 4));
  data.images.push(...modelImages.slice(0, 3));
  data.images.push(...otherImages.slice(0, 2));

  // Only use OG image as last resort if we found no other images
  if (data.images.length === 0) {
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImageMatch?.[1]) {
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

  // === Electric Vehicle Specifications ===

  // Driving range (WLTP) - patterns like "546km", "up to 546 km", "546 km (WLTP)"
  const rangePatterns = [
    /(\d{3,4})\s*km\s*(?:\(?\s*WLTP\s*\)?)?/i,
    /(?:range|driving\s+range)[:\s]*(?:up\s+to\s+)?(\d{3,4})\s*km/i,
    /(?:up\s+to\s+)?(\d{3,4})\s*km\s*(?:range|driving)/i,
  ];
  for (const pattern of rangePatterns) {
    const rangeMatch = html.match(pattern);
    const rangeValue = rangeMatch?.[1];
    if (rangeValue && parseInt(rangeValue) > 200) { // Sanity check for EV range
      data.specs!['range'] = `${rangeValue}km`;
      break;
    }
  }

  // Battery capacity - patterns like "77.4 kWh", "72.6kWh battery"
  const batteryMatch = html.match(/(\d+(?:\.\d+)?)\s*kWh/i);
  if (batteryMatch) {
    data.specs!['battery'] = `${batteryMatch[1]} kWh`;
  }

  // Charging time - patterns like "18 min", "10-80% in 18 minutes"
  const chargingPatterns = [
    /(?:10-80%|fast\s+charge)[:\s]*(?:in\s+)?(\d+)\s*min/i,
    /(\d+)\s*min(?:utes?)?\s*(?:to\s+)?(?:10-80%|fast\s+charge)/i,
    /charge[:\s]*(\d+)\s*min/i,
  ];
  for (const pattern of chargingPatterns) {
    const chargeMatch = html.match(pattern);
    if (chargeMatch) {
      data.specs!['charging'] = `${chargeMatch[1]} min (10-80%)`;
      break;
    }
  }

  // 0-100 acceleration
  const accelMatch = html.match(/0-100\s*(?:km\/h)?[:\s]*(\d+(?:\.\d+)?)\s*s(?:ec)?/i);
  if (accelMatch) {
    data.specs!['acceleration'] = `${accelMatch[1]}s (0-100km/h)`;
  }

  // === Feature Extraction ===

  // Remove script and style tags from HTML before feature extraction
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const extractedFeatures = new Set<string>();

  // Known feature keywords to look for in clean HTML
  const knownFeatures = [
    { keyword: 'infotainment', label: 'Infotainment System' },
    { keyword: 'heads-up display', label: 'Heads-up Display' },
    { keyword: 'panoramic sunroof', label: 'Panoramic Sunroof' },
    { keyword: 'leather', label: 'Leather Interior' },
    { keyword: 'heated seats', label: 'Heated Seats' },
    { keyword: 'ventilated seats', label: 'Ventilated Seats' },
    { keyword: 'blind spot', label: 'Blind Spot Monitoring' },
    { keyword: 'lane assist', label: 'Lane Keeping Assist' },
    { keyword: 'adaptive cruise', label: 'Adaptive Cruise Control' },
    { keyword: 'parking assist', label: 'Parking Assist' },
    { keyword: 'surround view', label: 'Surround View Camera' },
    { keyword: '360', label: '360° Camera' },
    { keyword: 'wireless charging', label: 'Wireless Phone Charging' },
    { keyword: 'apple carplay', label: 'Apple CarPlay' },
    { keyword: 'android auto', label: 'Android Auto' },
    { keyword: 'bose', label: 'BOSE Premium Audio' },
    { keyword: 'harman kardon', label: 'Harman Kardon Audio' },
    { keyword: 'ambient lighting', label: 'Ambient Lighting' },
    { keyword: 'sunroof', label: 'Sunroof' },
  ];

  // Check for each known feature in the clean HTML
  for (const { keyword, label } of knownFeatures) {
    if (cleanHtml.toLowerCase().includes(keyword.toLowerCase())) {
      extractedFeatures.add(label);
    }
  }

  // Look for specific screen size mentions (common in Hyundai pages)
  const screenMatch = cleanHtml.match(/(\d+(?:\.\d+)?)["\s]*(?:inch|")\s*(?:screen|display|infotainment)/i);
  if (screenMatch) {
    extractedFeatures.add(`${screenMatch[1]}" Display`);
  }

  data.features = Array.from(extractedFeatures).slice(0, 10);

  // === Highlight/Selling Point Extraction ===

  // Extract key selling points from H2/H3 headings and prominent text in clean HTML
  const highlightPatterns = [
    // H2 and H3 headings often contain key selling points
    /<h[23][^>]*>([^<]{15,120})<\/h[23]>/gi,
    // Paragraphs with specific classes
    /<p[^>]*class="[^"]*(?:lead|intro|highlight|subtitle)[^"]*"[^>]*>([^<]{20,150})<\/p>/gi,
  ];

  const extractedHighlights = new Set<string>();
  const skipTerms = ['cookie', 'privacy', 'terms', 'subscribe', 'newsletter', 'login', 'sign up', 'menu', 'navigation'];

  for (const pattern of highlightPatterns) {
    let highlightMatch;
    while ((highlightMatch = pattern.exec(cleanHtml)) !== null) {
      const highlight = highlightMatch[1]?.trim();
      if (highlight && highlight.length > 15 && highlight.length < 150) {
        const cleanHighlight = highlight
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&#\d+;/g, '')
          .trim();

        // Skip if contains unwanted terms
        const lowerHighlight = cleanHighlight.toLowerCase();
        const shouldSkip = skipTerms.some(term => lowerHighlight.includes(term));

        if (cleanHighlight && !shouldSkip && cleanHighlight.split(' ').length >= 3) {
          extractedHighlights.add(cleanHighlight);
        }
      }
    }
  }

  data.highlights = Array.from(extractedHighlights).slice(0, 5);

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

  // Check if this is a Register Your Interest (RYI) page
  const isRYI = url.includes('-ryi');

  try {
    const response = await $fetch<string>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HyundaiDealerBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-AU,en;q=0.9',
      },
    });

    // Try AI-assisted extraction first (Groq)
    let aiData: AIExtractedVehicleData | null = null;
    try {
      aiData = await extractVehicleDataWithAI(response, slug);
      if (aiData) {
        console.log(`[Scraper] AI extraction successful for ${slug}`);
      }
    } catch (aiError: any) {
      console.log(`[Scraper] AI extraction failed, falling back to regex: ${aiError.message}`);
    }

    // Fall back to regex extraction if AI fails
    const regexExtracted = extractVehicleData(response, slug);

    // Merge AI and regex data, preferring AI when available
    const extracted = mergeExtractionResults(aiData, regexExtracted, slug);

    // Determine CTA button text and link based on RYI status
    const buttonText = isRYI ? 'Register Your Interest' : 'Enquire Now';
    const buttonLink = isRYI ? `/vehicle/${slug}#register` : `/variant/${slug}`;

    // Build the complete vehicle data structure
    const vehicleData: ScrapedVehicleData = {
      slug,
      model: extracted.model || slug,
      title: extracted.title || formatVehicleName(slug),
      tagline: extracted.tagline || extracted.description?.split('.')[0] || `Discover the ${formatVehicleName(slug)}`,
      description: extracted.description || `Explore the ${formatVehicleName(slug)} at your local Hyundai dealer.`,
      header: {
        slides: [{
          desktop: extracted.heroDesktop || getDefaultHeroImage(slug),
          mobile: extracted.heroMobile || extracted.heroDesktop || getDefaultHeroImage(slug),
          video: false,
          heading: formatVehicleName(slug),
          sub_heading: extracted.tagline || extracted.description?.split('.')[0] || `Discover the ${formatVehicleName(slug)}`,
          button: buttonText,
          link: buttonLink,
          bottom_strip: buildSpecStrip(extracted.specs || {}, isElectricVehicle(slug)),
        }],
      },
      specs: extracted.specs || {},
      features: extracted.features || [],
      highlights: extracted.highlights || [],
      contentSections: extracted.contentSections || [],
      images: extracted.images || [],
      scrapedAt: new Date().toISOString(),
      isScraped: true,
      form: isRYI, // Set form=true for RYI pages to show Register Interest form
    };

    return vehicleData;
  } catch (error: any) {
    console.error(`[Scraper] Error fetching vehicle ${slug}:`, error.message);

    // If fetch fails, return a basic placeholder
    return createPlaceholderVehicle(slug);
  }
}

/**
 * Merge AI extraction results with regex fallback
 */
function mergeExtractionResults(
  aiData: AIExtractedVehicleData | null,
  regexData: Partial<ScrapedVehicleData>,
  slug: string
): {
  model: string;
  title: string;
  tagline: string;
  description: string;
  specs: Record<string, string>;
  features: string[];
  highlights: string[];
  contentSections: ContentSection[];
  heroDesktop: string | undefined;
  heroMobile: string | undefined;
  images: string[];
} {
  if (!aiData) {
    // No AI data, use regex results
    return {
      model: regexData.model || slug,
      title: regexData.title || formatVehicleName(slug),
      tagline: regexData.description?.split('.')[0] || '',
      description: regexData.description || '',
      specs: regexData.specs || {},
      features: regexData.features || [],
      highlights: regexData.highlights || [],
      contentSections: [],
      heroDesktop: regexData.images?.[0],
      heroMobile: regexData.images?.[1] || regexData.images?.[0],
      images: deduplicateImages(regexData.images || [], slug),
    };
  }

  // Convert AI specs to flat Record<string, string>
  const specs: Record<string, string> = {};
  if (aiData.specs.range) specs.range = aiData.specs.range;
  if (aiData.specs.battery) specs.battery = aiData.specs.battery;
  if (aiData.specs.chargingTime) specs.charging = aiData.specs.chargingTime;
  if (aiData.specs.acceleration) specs.acceleration = aiData.specs.acceleration;
  if (aiData.specs.power) specs.power = aiData.specs.power;
  if (aiData.specs.torque) specs.torque = aiData.specs.torque;
  if (aiData.specs.fuelConsumption) specs.fuel_consumption = aiData.specs.fuelConsumption;
  if (aiData.specs.seating) specs.seating = `${aiData.specs.seating} seats`;
  if (aiData.specs.towing) specs.towing = aiData.specs.towing;

  // Merge specs with regex fallback
  const mergedSpecs = { ...regexData.specs, ...specs };

  // Combine and deduplicate images
  const allImages = [
    aiData.heroImageDesktop,
    aiData.heroImageMobile,
    ...aiData.galleryImages,
    ...(regexData.images || []),
  ].filter((img): img is string => !!img);

  // Build content sections from AI data
  const contentSections: ContentSection[] = [];
  if (aiData.introHeading || aiData.introText) {
    contentSections.push({ heading: aiData.introHeading, text: aiData.introText });
  }
  if (aiData.designHeading || aiData.designText) {
    contentSections.push({ heading: aiData.designHeading, text: aiData.designText });
  }
  if (aiData.technologyHeading || aiData.technologyText) {
    contentSections.push({ heading: aiData.technologyHeading, text: aiData.technologyText });
  }
  if (aiData.performanceHeading || aiData.performanceText) {
    contentSections.push({ heading: aiData.performanceHeading, text: aiData.performanceText });
  }
  if (aiData.safetyHeading || aiData.safetyText) {
    contentSections.push({ heading: aiData.safetyHeading, text: aiData.safetyText });
  }
  if (aiData.comfortHeading || aiData.comfortText) {
    contentSections.push({ heading: aiData.comfortHeading, text: aiData.comfortText });
  }

  return {
    model: slug,
    title: aiData.title || regexData.title || formatVehicleName(slug),
    tagline: aiData.tagline || regexData.description?.split('.')[0] || '',
    description: aiData.description || regexData.description || '',
    specs: mergedSpecs,
    features: aiData.features.length > 0 ? aiData.features : (regexData.features || []),
    highlights: aiData.highlights.length > 0 ? aiData.highlights : (regexData.highlights || []),
    contentSections,
    heroDesktop: aiData.heroImageDesktop || regexData.images?.[0],
    heroMobile: aiData.heroImageMobile || aiData.heroImageDesktop || regexData.images?.[0],
    images: deduplicateImages(allImages, slug),
  };
}

/**
 * Remove duplicate images and filter out images from other vehicles
 */
function deduplicateImages(images: string[], vehicleSlug?: string): string[] {
  const seen = new Set<string>();
  return images.filter(img => {
    // Normalize URL for comparison (remove query params)
    const normalized = img.split('?')[0] || img;
    if (seen.has(normalized)) return false;

    const lowerUrl = img.toLowerCase();

    // Filter out images from other vehicle models (if we know what vehicle we're scraping)
    if (vehicleSlug) {
      const vehicleSlugNormalized = vehicleSlug.toLowerCase().replace(/-/g, '');

      // Check if the URL contains a different vehicle model
      const otherVehiclePatterns = [
        /\/ioniq-?5[n]?[-\/]/i,
        /\/ioniq-?6[n]?[-\/]/i,
        /\/ioniq-?9[-\/]/i,
        /\/kona[-\/]/i,
        /\/tucson[-\/]/i,
        /\/santa-?fe[-\/]/i,
        /\/venue[-\/]/i,
        /\/palisade[-\/]/i,
        /\/i30[-\/]/i,
        /\/staria[-\/]/i,
        /\/inster[-\/]/i,
        /IONIQ5/i,
        /IONIQ6/i,
        /IONIQ9/i,
      ];

      for (const pattern of otherVehiclePatterns) {
        // Extract vehicle name from pattern for comparison
        const patternName = pattern.source.replace(/[\/\[\]\-\?\(\)\\]/g, '').toLowerCase();

        // Skip if this pattern matches the vehicle we're looking for
        if (vehicleSlugNormalized.includes(patternName.replace(/[^a-z0-9]/g, ''))) continue;

        if (pattern.test(lowerUrl)) {
          return false;
        }
      }
    }

    seen.add(normalized);
    return true;
  });
}

/**
 * Check if a vehicle slug represents an electric vehicle
 */
function isElectricVehicle(slug: string): boolean {
  const evKeywords = ['ioniq', 'electric', 'ev', 'inster', 'elexio', 'kona-electric'];
  const normalizedSlug = slug.toLowerCase();
  return evKeywords.some(keyword => normalizedSlug.includes(keyword));
}

/**
 * Build the specification strip from extracted specs
 */
function buildSpecStrip(specs: Record<string, string>, isEV: boolean = false): Array<{ heading: string; sub_heading: string }> | false {
  const strip: Array<{ heading: string; sub_heading: string }> = [];

  // For EVs, prioritize EV-specific specs
  if (isEV) {
    if (specs.range) {
      strip.push({ heading: specs.range, sub_heading: 'Range (WLTP)' });
    }

    if (specs.battery) {
      strip.push({ heading: specs.battery, sub_heading: 'Battery' });
    }

    if (specs.charging) {
      strip.push({ heading: specs.charging.replace(' (10-80%)', ''), sub_heading: 'Fast Charge' });
    }

    if (specs.acceleration) {
      strip.push({ heading: specs.acceleration.replace(' (0-100km/h)', ''), sub_heading: '0-100 km/h' });
    }
  }

  // ICE vehicle specs
  if (specs.power) {
    const power = specs.power.split('/')[0];
    if (power) {
      strip.push({ heading: power.trim(), sub_heading: 'Max Power' });
    }
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

  // Limit to 4 items for clean display
  return strip.length > 0 ? strip.slice(0, 4) : false;
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
  const isEV = isElectricVehicle(slug);

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
        button: isEV ? 'Register Your Interest' : 'Enquire Now',
        link: isEV ? `/vehicle/${slug}#register` : `/variant/${slug}`,
        bottom_strip: false,
      }],
    },
    specs: {},
    features: [],
    highlights: [],
    images: [getDefaultHeroImage(slug)],
    scrapedAt: new Date().toISOString(),
    isScraped: true,
    form: isEV, // EVs often have Register Interest forms
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
