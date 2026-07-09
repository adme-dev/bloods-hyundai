/**
 * AI-Assisted Vehicle Data Extraction using Groq + Cheerio
 *
 * Uses Cheerio to clean and structure HTML, then Groq's fast LLM
 * to intelligently extract vehicle information with high accuracy.
 */

import Groq from 'groq-sdk';
import * as cheerio from 'cheerio';

export interface AIExtractedVehicleData {
  title: string;
  tagline: string;
  description: string;
  introHeading?: string;
  introText?: string;
  designHeading?: string;
  designText?: string;
  technologyHeading?: string;
  technologyText?: string;
  performanceHeading?: string;
  performanceText?: string;
  safetyHeading?: string;
  safetyText?: string;
  comfortHeading?: string;
  comfortText?: string;
  specs: {
    range?: string;
    battery?: string;
    chargingTime?: string;
    acceleration?: string;
    power?: string;
    torque?: string;
    fuelConsumption?: string;
    seating?: string;
    towing?: string;
  };
  features: string[];
  highlights: string[];
  heroImageDesktop?: string;
  heroImageMobile?: string;
  galleryImages: string[];
}

interface ExtractedContent {
  title: string;
  metaDescription: string;
  sections: Array<{ heading: string; text: string }>;
  specs: Array<{ label: string; value: string }>;
  features: string[];
  images: string[];
}

/**
 * Use Cheerio to extract clean, structured content from HTML
 * This dramatically reduces token count for AI processing
 */
function extractContentWithCheerio(html: string, slug: string): ExtractedContent {
  const $ = cheerio.load(html);
  const vehicleName = slug.toLowerCase().replace(/-/g, '');

  // Remove noise elements
  $('script, style, noscript, iframe, svg, nav, footer, header').remove();
  $('[class*="navigation"], [class*="menu"], [class*="footer"], [class*="header"]').remove();
  $('[class*="cookie"], [class*="popup"], [class*="modal"], [class*="overlay"]').remove();
  $('[class*="social"], [class*="share"], [class*="sidebar"]').remove();
  $('[id*="navigation"], [id*="menu"], [id*="footer"], [id*="header"]').remove();

  // Extract title
  const title = $('meta[property="og:title"]').attr('content')
    || $('title').text()
    || $('h1').first().text()
    || formatVehicleName(slug);

  // Extract meta description
  const metaDescription = $('meta[name="description"]').attr('content')
    || $('meta[property="og:description"]').attr('content')
    || '';

  // Extract content sections (heading + following paragraphs)
  const sections: Array<{ heading: string; text: string }> = [];

  // Look for main content areas
  const mainContent = $('main, [role="main"], .main-content, #main, article, .content, .page-content');
  const contentArea = mainContent.length > 0 ? mainContent : $('body');

  // Extract section-based content
  contentArea.find('section, [class*="section"], .module, [class*="module"]').each((_, section) => {
    const $section = $(section);

    // Get heading
    const heading = $section.find('h1, h2, h3, .heading, [class*="title"]').first().text().trim();

    // Get paragraphs and text content
    const paragraphs: string[] = [];
    $section.find('p, .text, [class*="description"], [class*="copy"]').each((_, p) => {
      const text = $(p).text().trim();
      if (text.length > 20 && text.length < 1000) {
        paragraphs.push(text);
      }
    });

    if (heading && paragraphs.length > 0) {
      sections.push({
        heading: heading,
        text: paragraphs.join(' ').substring(0, 500),
      });
    }
  });

  // Also look for standalone heading + paragraph patterns
  contentArea.find('h2, h3').each((_, h) => {
    const $h = $(h);
    const heading = $h.text().trim();

    // Skip if already captured or too short
    if (!heading || heading.length < 3 || sections.some(s => s.heading === heading)) return;

    // Look for following paragraphs
    const paragraphs: string[] = [];
    let next = $h.next();
    while (next.length && !next.is('h1, h2, h3')) {
      if (next.is('p') || next.find('p').length) {
        const text = next.text().trim();
        if (text.length > 20 && text.length < 1000) {
          paragraphs.push(text);
        }
      }
      next = next.next();
      // Limit to prevent runaway
      if (paragraphs.length > 3) break;
    }

    if (heading && paragraphs.length > 0) {
      sections.push({
        heading: heading,
        text: paragraphs.join(' ').substring(0, 500),
      });
    }
  });

  // Extract specs from tables or spec lists
  const specs: Array<{ label: string; value: string }> = [];

  // Look for spec tables
  $('table, [class*="spec"], [class*="feature"], dl').each((_, table) => {
    const $table = $(table);

    // Table rows
    $table.find('tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td, th');
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim();
        const value = $(cells[1]).text().trim();
        if (label && value && label.length < 50 && value.length < 50) {
          specs.push({ label, value });
        }
      }
    });

    // Definition lists
    $table.find('dt').each((_, dt) => {
      const label = $(dt).text().trim();
      const value = $(dt).next('dd').text().trim();
      if (label && value) {
        specs.push({ label, value });
      }
    });

    // Key-value divs
    $table.find('[class*="item"], [class*="row"]').each((_, item) => {
      const $item = $(item);
      const label = $item.find('[class*="label"], [class*="key"], [class*="name"]').first().text().trim();
      const value = $item.find('[class*="value"], [class*="data"]').first().text().trim();
      if (label && value && label.length < 50 && value.length < 50) {
        specs.push({ label, value });
      }
    });
  });

  // Extract features from lists
  const features: string[] = [];
  $('ul li, [class*="feature"] li, [class*="highlight"]').each((_, li) => {
    const text = $(li).text().trim();
    if (text.length > 10 && text.length < 200 && !text.includes('©')) {
      features.push(text);
    }
  });

  // Extract images
  const images: string[] = [];
  const seenUrls = new Set<string>();

  // Define patterns for other vehicles to exclude
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
    /\/sonata[-\/]/i,
    /\/inster[-\/]/i,
  ];

  // Check if URL is from another vehicle
  const isOtherVehicle = (url: string): boolean => {
    const lowerUrl = url.toLowerCase();

    // Skip check if this is actually the vehicle we're looking for
    if (lowerUrl.includes(`/${slug}/`) || lowerUrl.includes(`-${slug}-`)) {
      return false;
    }

    for (const pattern of otherVehiclePatterns) {
      // Skip if it's the current vehicle
      const patternStr = pattern.source.toLowerCase();
      if (vehicleName.includes(patternStr.replace(/[-\/\\?]/g, ''))) continue;

      if (pattern.test(url)) {
        return true;
      }
    }
    return false;
  };

  // Look for high-quality vehicle images
  $('img, source, [data-src], [data-srcset]').each((_, img) => {
    const $img = $(img);
    const src = $img.attr('src') || $img.attr('data-src') || '';
    const srcset = $img.attr('srcset') || $img.attr('data-srcset') || '';

    // Parse srcset for best image
    const urls = [src];
    srcset.split(',').forEach(s => {
      const match = s.trim().match(/^(\S+)/);
      const matchedUrl = match?.[1];
      if (matchedUrl) urls.push(matchedUrl);
    });

    urls.forEach(url => {
      if (!url || seenUrls.has(url)) return;

      const lowerUrl = url.toLowerCase();

      // Must be from Hyundai CDN
      if (!url.includes('/content/dam/hyundai')) return;

      // Skip unwanted images
      if (lowerUrl.includes('social-share')) return;
      if (lowerUrl.includes('/icons/')) return;
      if (lowerUrl.includes('/logos/')) return;
      if (lowerUrl.includes('/navigation/')) return;
      if (lowerUrl.includes('favicon')) return;
      if (lowerUrl.includes('/owning/')) return;
      if (lowerUrl.includes('/masterbrand/')) return;
      if (lowerUrl.includes('/offers-images/')) return;
      if (lowerUrl.includes('side-profile')) return;
      if (lowerUrl.includes('/compare/')) return;
      if (lowerUrl.includes('/thumbnail')) return;

      // Skip other vehicle images
      if (isOtherVehicle(url)) return;

      seenUrls.add(url);

      // Ensure full URL
      const fullUrl = url.startsWith('http') ? url : `https://www.hyundai.com${url}`;
      images.push(fullUrl);
    });
  });

  // Also check picture elements
  $('picture source').each((_, source) => {
    const srcset = $(source).attr('srcset') || '';
    srcset.split(',').forEach(s => {
      const match = s.trim().match(/^(\S+)/);
      const matchedUrl = match?.[1];
      if (matchedUrl && matchedUrl.includes('/content/dam/hyundai')) {
        const url = matchedUrl;
        if (!seenUrls.has(url) && !isOtherVehicle(url)) {
          seenUrls.add(url);
          const fullUrl = url.startsWith('http') ? url : `https://www.hyundai.com${url}`;
          images.push(fullUrl);
        }
      }
    });
  });

  return {
    title: title.trim(),
    metaDescription: metaDescription.trim(),
    sections: sections.slice(0, 10), // Limit to avoid token overflow
    specs: specs.slice(0, 15),
    features: features.slice(0, 15),
    images: images.slice(0, 12),
  };
}

/**
 * Convert extracted content to a compact format for AI processing
 */
function formatContentForAI(content: ExtractedContent): string {
  let formatted = '';

  formatted += `TITLE: ${content.title}\n\n`;

  if (content.metaDescription) {
    formatted += `META DESCRIPTION: ${content.metaDescription}\n\n`;
  }

  if (content.sections.length > 0) {
    formatted += `CONTENT SECTIONS:\n`;
    content.sections.forEach((section, i) => {
      formatted += `[${i + 1}] ${section.heading}\n${section.text}\n\n`;
    });
  }

  if (content.specs.length > 0) {
    formatted += `SPECIFICATIONS:\n`;
    content.specs.forEach(spec => {
      formatted += `- ${spec.label}: ${spec.value}\n`;
    });
    formatted += '\n';
  }

  if (content.features.length > 0) {
    formatted += `FEATURES:\n`;
    content.features.forEach(f => {
      formatted += `- ${f}\n`;
    });
    formatted += '\n';
  }

  if (content.images.length > 0) {
    formatted += `IMAGES:\n`;
    content.images.forEach(img => {
      formatted += `- ${img}\n`;
    });
  }

  return formatted;
}

const EXTRACTION_PROMPT = `You are a data extraction specialist. Analyze the following pre-processed content from a Hyundai Australia vehicle page and extract structured vehicle information.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "title": "Vehicle name/title",
  "tagline": "Short marketing tagline (1 sentence)",
  "description": "Comprehensive description combining all marketing copy about the vehicle (3-5 sentences)",
  "introHeading": "Main introduction heading (e.g., 'Introducing ELEXIO') or null",
  "introText": "Introduction paragraph text or null",
  "designHeading": "Design section heading or null",
  "designText": "Design description paragraph or null",
  "technologyHeading": "Technology section heading or null",
  "technologyText": "Technology description paragraph or null",
  "performanceHeading": "Performance/driving section heading or null",
  "performanceText": "Performance description paragraph or null",
  "safetyHeading": "Safety section heading or null",
  "safetyText": "Safety description paragraph or null",
  "comfortHeading": "Comfort/Interior section heading or null",
  "comfortText": "Comfort description paragraph or null",
  "specs": {
    "range": "EV range in km (e.g., '546km') or null",
    "battery": "Battery capacity (e.g., '77.4 kWh') or null",
    "chargingTime": "Fast charging time (e.g., '18 min to 80%') or null",
    "acceleration": "0-100 time (e.g., '5.1s') or null",
    "power": "Engine/motor power (e.g., '225kW') or null",
    "torque": "Torque (e.g., '350Nm') or null",
    "fuelConsumption": "Fuel economy (e.g., '7.1L/100km') or null",
    "seating": "Number of seats (e.g., '5' or '7') or null",
    "towing": "Towing capacity (e.g., '2500kg') or null"
  },
  "features": ["Array of specific features with details - max 10 items"],
  "highlights": ["Array of key marketing headlines/selling points - max 5 items"],
  "heroImageDesktop": "URL of the main desktop hero image (prefer 1920px wide) or null - select from IMAGES list",
  "heroImageMobile": "URL of mobile hero image (prefer 767px wide) or null - select from IMAGES list",
  "galleryImages": ["Array of image URLs from IMAGES list - max 6, for gallery display"]
}

Rules:
1. Create a compelling description by combining the marketing copy from content sections
2. Match headings to appropriate sections (intro, design, technology, performance, safety, comfort)
3. Extract specs with exact values and units
4. Features should be specific with details when available
5. Highlights should be compelling marketing phrases
6. For images, select the best ones from the IMAGES list provided
7. Prefer larger/desktop images for heroImageDesktop, smaller for heroImageMobile
8. Return null for fields not found, empty arrays for features/highlights/images if none found

CONTENT:
`;

/**
 * Extract vehicle data using Cheerio + Groq AI hybrid approach
 */
export async function extractVehicleDataWithAI(
  html: string,
  slug: string
): Promise<AIExtractedVehicleData | null> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.log('[AI Scraper] GROQ_API_KEY not configured, skipping AI extraction');
    return null;
  }

  try {
    // Step 1: Use Cheerio to extract clean, structured content
    console.log(`[AI Scraper] Preprocessing HTML with Cheerio for ${slug}`);
    const extractedContent = extractContentWithCheerio(html, slug);

    // Step 2: Format content for AI
    const formattedContent = formatContentForAI(extractedContent);

    console.log(`[AI Scraper] Extracted ${extractedContent.sections.length} sections, ${extractedContent.specs.length} specs, ${extractedContent.images.length} images`);
    console.log(`[AI Scraper] Formatted content size: ${formattedContent.length} chars (vs raw HTML: ${html.length} chars)`);
    console.log(`[AI Scraper] Token reduction: ~${Math.round((1 - formattedContent.length / html.length) * 100)}%`);

    // Step 3: Send to Groq for intelligent structuring
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: EXTRACTION_PROMPT + formattedContent,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      console.error('[AI Scraper] Empty response from Groq');
      return null;
    }

    // Parse the JSON response
    try {
      const jsonStr = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const data = JSON.parse(jsonStr) as AIExtractedVehicleData;

      // Validate and clean the data
      return validateAndCleanData(data, slug, extractedContent.images);
    } catch (parseError) {
      console.error('[AI Scraper] Failed to parse Groq response:', parseError);
      console.error('[AI Scraper] Raw response:', response.substring(0, 500));
      return null;
    }
  } catch (error: any) {
    console.error('[AI Scraper] Error:', error.message);
    return null;
  }
}

/**
 * Validate and clean the extracted data
 */
function validateAndCleanData(
  data: AIExtractedVehicleData,
  slug: string,
  availableImages: string[]
): AIExtractedVehicleData {
  const HYUNDAI_BASE_URL = 'https://www.hyundai.com';

  const ensureFullUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${HYUNDAI_BASE_URL}${url}`;
    return undefined;
  };

  // Use images from Cheerio extraction if AI didn't select any
  const galleryImages = data.galleryImages?.length > 0
    ? data.galleryImages.map(ensureFullUrl).filter((u): u is string => !!u).slice(0, 6)
    : availableImages.slice(0, 6);

  // Select hero images from available if not specified
  let heroDesktop = ensureFullUrl(data.heroImageDesktop);
  let heroMobile = ensureFullUrl(data.heroImageMobile);

  if (!heroDesktop && availableImages.length > 0) {
    // Prefer larger images for desktop
    const desktopImg = availableImages.find(img =>
      img.includes('1920') || img.includes('desktop') || img.includes('hero')
    ) || availableImages[0];
    heroDesktop = desktopImg;
  }

  if (!heroMobile && availableImages.length > 0) {
    // Prefer mobile-sized images
    const mobileImg = availableImages.find(img =>
      img.includes('767') || img.includes('mobile') || img.includes('375')
    ) || availableImages[Math.min(1, availableImages.length - 1)];
    heroMobile = mobileImg;
  }

  return {
    title: data.title || formatVehicleName(slug),
    tagline: data.tagline || '',
    description: data.description || '',
    introHeading: data.introHeading || undefined,
    introText: data.introText || undefined,
    designHeading: data.designHeading || undefined,
    designText: data.designText || undefined,
    technologyHeading: data.technologyHeading || undefined,
    technologyText: data.technologyText || undefined,
    performanceHeading: data.performanceHeading || undefined,
    performanceText: data.performanceText || undefined,
    safetyHeading: data.safetyHeading || undefined,
    safetyText: data.safetyText || undefined,
    comfortHeading: data.comfortHeading || undefined,
    comfortText: data.comfortText || undefined,
    specs: {
      range: data.specs?.range || undefined,
      battery: data.specs?.battery || undefined,
      chargingTime: data.specs?.chargingTime || undefined,
      acceleration: data.specs?.acceleration || undefined,
      power: data.specs?.power || undefined,
      torque: data.specs?.torque || undefined,
      fuelConsumption: data.specs?.fuelConsumption || undefined,
      seating: data.specs?.seating || undefined,
      towing: data.specs?.towing || undefined,
    },
    features: Array.isArray(data.features)
      ? data.features.filter(f => typeof f === 'string' && f.length > 0).slice(0, 10)
      : [],
    highlights: Array.isArray(data.highlights)
      ? data.highlights.filter(h => typeof h === 'string' && h.length > 0).slice(0, 5)
      : [],
    heroImageDesktop: heroDesktop,
    heroImageMobile: heroMobile,
    galleryImages,
  };
}

/**
 * Format a vehicle name from slug
 */
function formatVehicleName(slug: string): string {
  return slug
    .split('-')
    .map(word => {
      if (word.toLowerCase() === 'n') return 'N';
      if (word.toLowerCase() === 'i30') return 'i30';
      if (word.toLowerCase() === 'i20') return 'i20';
      if (word.toLowerCase() === 'ioniq') return 'IONIQ';
      if (word.toLowerCase() === 'ev') return 'EV';
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
