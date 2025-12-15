/**
 * GET /api/hyundai-offers
 * Fetches and parses Hyundai Australia offers data
 * Migrated from: src/functions/get-hyundai-offers.js
 */

interface Offer {
  id: string | null;
  type: string;
  formattedValue: string | null;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  disclaimerCode: string | null;
  disclaimer: string | null;
  priority: number;
}

interface Variant {
  id: string;
  serviceId: number | null;
  modelName: string;
  modelGroup: string;
  variantName: string;
  variantGroup: string;
  variantFullName: string;
  specifications: string;
  fuelType: string | null;
  engineType: string | null;
  transmission: string | null;
  price: number | null;
  formattedPrice: string | null;
  image: string | null;
  imageAltText: string;
  featured: boolean;
  highlighted: boolean;
  primaryCategory: string | null;
  categories: string[];
  offers: Offer[];
  primaryOffer: Offer | null;
  hasValueOffer: boolean;
  offerType: string | null;
  offerAmount: string | null;
  offerCode: string | null;
  offerDescription: string | null;
  offerDisclaimer: string | null;
}

export default defineEventHandler(async (event) => {
  const url = 'https://www.hyundai.com/au/en/offers';

  try {
    // Fetch the HTML page
    const html = await $fetch<string>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-AU,en;q=0.9',
      },
    });

    // Extract the offers data from the embedded script
    const offersData = extractOffersData(html);

    if (!offersData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Offers data not found on page',
      });
    }

    // Extract hero banner
    const heroBanner = extractHeroBanner(html);

    // Transform and return the data
    const transformedData = transformOffersData(offersData, heroBanner);

    // Set cache headers
    setResponseHeaders(event, {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json',
    });

    return transformedData;
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch offers data',
      message: error.message,
    });
  }
});

function extractOffersData(html: string): any {
  const patterns = [
    /window\.hyundaiData\s*\[\s*["']offersData["']\s*\]\s*=\s*(\[[\s\S]*?\]);?\s*(?:<\/script>|window\.)/,
    /window\.hyundaiData\["offersData"\]\s*=\s*(\[[\s\S]*?\]);?\s*<\/script>/,
    /hyundaiData\["offersData"\]\s*=\s*(\[[\s\S]*?\]);/,
    /"offersData"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
  ];

  for (const regex of patterns) {
    const match = html.match(regex);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        continue;
      }
    }
  }

  return null;
}

function extractHeroBanner(html: string): string {
  const patterns = [
    /src="([^"]*DAC-Q4-Web-BANNER[^"]*\.(?:jpg|png|webp)[^"]*)"/i,
    /src="([^"]*offers[^"]*banner[^"]*\.(?:jpg|png|webp)[^"]*)"/i,
    /src="([^"]*\/content\/dam\/hyundai\/au\/en\/offers\/[^"]*\.(?:jpg|png|webp)[^"]*)"/i,
  ];

  for (const regex of patterns) {
    const match = html.match(regex);
    if (match && match[1]) {
      return prependBaseUrl(match[1]);
    }
  }

  return 'https://www.hyundai.com/content/dam/hyundai/au/en/images/offers/2025/10/imgi_18_DAC-Q4-Web-BANNER_1920x720.jpg';
}

function prependBaseUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `https://www.hyundai.com${path}`;
}

function transformOffersData(rawData: any, heroBanner: string) {
  const data = Array.isArray(rawData) ? rawData[0] : rawData;

  if (!data) {
    return {
      heroBanner,
      highlightedCard: null,
      categories: [],
      variants: [],
      variantsById: {},
      globalDisclaimers: [],
      heading: '',
      body: '',
    };
  }

  // Build highlighted card
  const highlightedCard = data.highlightedCard
    ? {
        label: data.highlightedCard.label || '',
        backgroundImage: prependBaseUrl(data.highlightedCard.backgroundImage),
        backgroundImageAltText: data.highlightedCard.backgroundImageAltText || '',
        heading: data.heading || data.highlightedCard.heading || '',
        body: data.body || data.highlightedCard.body || '',
      }
    : null;

  // Process variants
  const variantsById: Record<string, Variant> = {};
  const allVariants: Variant[] = (data.variants || []).map((v: any) => {
    let primaryOffer: Offer | null = null;
    const offers: Offer[] = [];

    if (v.offerPackages && Array.isArray(v.offerPackages)) {
      for (const pkg of v.offerPackages) {
        if (pkg.offers && Array.isArray(pkg.offers)) {
          for (const offer of pkg.offers) {
            const offerData: Offer = {
              id: offer.offerId || null,
              type: offer.type || 'VALUE OFFER',
              formattedValue: offer.formattedValue || null,
              title: offer.title || null,
              subtitle: offer.subtitle || null,
              body: offer.body || null,
              disclaimerCode: offer.disclaimerCitation || null,
              disclaimer: offer.disclaimer || null,
              priority: offer.priority || 0,
            };
            offers.push(offerData);
            if (!primaryOffer) primaryOffer = offerData;
          }
        }
      }
    }

    const variant: Variant = {
      id: v.variantId || '',
      serviceId: v.serviceID || null,
      modelName: v.modelName || '',
      modelGroup: v.modelGroup || '',
      variantName: v.variantName || '',
      variantGroup: v.variantGroup || '',
      variantFullName: `${v.modelGroup || v.modelName || ''} ${v.fuelType || ''} ${v.variantGroup || ''}`
        .replace(/\s+/g, ' ')
        .trim(),
      specifications: v.variantName || '',
      fuelType: v.fuelType || null,
      engineType: v.engineType || null,
      transmission: v.transmission || null,
      price: v.price || null,
      formattedPrice: v.price ? `$${Number(v.price).toLocaleString()}` : null,
      image: prependBaseUrl(v.image),
      imageAltText: v.imageAltText || v.modelName || '',
      featured: v.featured || false,
      highlighted: v.highlighted || false,
      primaryCategory: v.primaryCategory || null,
      categories: v.categories || [],
      offers,
      primaryOffer,
      hasValueOffer: offers.length > 0,
      offerType: primaryOffer?.type || null,
      offerAmount: primaryOffer?.formattedValue || null,
      offerCode: primaryOffer?.disclaimerCode || null,
      offerDescription: primaryOffer?.title || null,
      offerDisclaimer: primaryOffer?.disclaimer || null,
    };

    variantsById[variant.id] = variant;
    if (variant.serviceId) {
      variantsById[`service_${variant.serviceId}`] = variant;
    }

    return variant;
  });

  // Build categories
  const variantsByModelAndGroup: Record<string, Variant> = {};
  for (const v of allVariants) {
    const key = `${v.modelGroup}|${v.variantGroup}`.toLowerCase();
    if (!variantsByModelAndGroup[key] || v.hasValueOffer) {
      variantsByModelAndGroup[key] = v;
    }
  }

  const allModels = (data.modelList || []).map((model: any) => {
    const modelVariants = (model.variantGroupList || [])
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((variantGroup: any) => {
        const lookupKey = `${model.name}|${variantGroup.name}`.toLowerCase();
        const matchedVariant = variantsByModelAndGroup[lookupKey];

        return {
          id: matchedVariant?.id || variantGroup.id,
          groupId: variantGroup.id,
          name: variantGroup.name || '',
          order: variantGroup.order || 0,
          ...(matchedVariant && {
            serviceId: matchedVariant.serviceId,
            price: matchedVariant.price,
            formattedPrice: matchedVariant.formattedPrice,
            variantFullName: matchedVariant.variantFullName,
            specifications: matchedVariant.specifications,
            fuelType: matchedVariant.fuelType,
            image: matchedVariant.image,
            hasValueOffer: matchedVariant.hasValueOffer,
            offerType: matchedVariant.offerType,
            offerAmount: matchedVariant.offerAmount,
            offers: matchedVariant.offers,
          }),
        };
      });

    return {
      id: model.id || '',
      name: model.name || '',
      image: prependBaseUrl(model.image),
      imageAltText: model.imageAltText || model.name || '',
      isCustomModel: model.isCustomModel || false,
      order: model.order || 0,
      categories: model.categories || [],
      variants: modelVariants,
    };
  });

  const categories = (data.categories || [])
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .map((category: any) => {
      const categoryModels = allModels
        .filter((model: any) => model.categories.includes(category.name))
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      return {
        name: category.name || '',
        description: category.description || '',
        order: category.order || 0,
        models: categoryModels,
      };
    })
    .filter((category: any) => category.models.length > 0);

  const globalDisclaimers = (data.globalDisclaimers || []).map((d: any) => ({
    id: d.id || d.disclaimerId || null,
    name: d.name || null,
    disclaimer: d.disclaimer || null,
    citation: d.disclaimerCitation || null,
    priority: d.priority || 0,
  }));

  return {
    heroBanner,
    highlightedCard,
    categories,
    variants: allVariants,
    variantsById,
    globalDisclaimers,
    heading: data.heading || '',
    body: data.body || '',
  };
}







