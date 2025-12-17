/**
 * GET /api/hyundai-offers/:id
 * Fetches detailed offer data for a specific variant
 * Migrated from: src/functions/get-hyundai-offer-by-id.js
 */

// Known serviceID mappings by model and variant
const KNOWN_MAPPINGS: Record<string, Record<string, number[]>> = {
  'santa fe': {
    'hybrid calligraphy': [1370, 1371],
    'hybrid elite': [1369],
    hybrid: [1368],
    calligraphy: [1365, 1366, 1367],
    elite: [1364],
    default: [1362, 1363, 1364, 1365, 1366, 1367, 1368, 1369, 1370, 1371],
  },
  tucson: {
    'hybrid premium': [1376],
    'hybrid elite': [1375],
    hybrid: [1374],
    premium: [1373],
    elite: [1372],
    default: [1372, 1373, 1374, 1375, 1376],
  },
  ioniq: {
    epiq: [1377, 1378],
    dynamiq: [1379],
    techniq: [1380],
    default: [1377, 1378, 1379, 1380],
  },
  kona: {
    electric: [1381, 1382],
    hybrid: [1383, 1384],
    default: [1381, 1382, 1383, 1384, 1385],
  },
  palisade: {
    calligraphy: [1386, 1387, 1388, 1389],
    elite: [1390, 1391],
    default: [1386, 1387, 1388, 1389, 1390, 1391],
  },
  venue: {
    default: [1392, 1393, 1394, 1395],
  },
  i30: {
    default: [1020, 1021, 1022, 1023, 1024, 1025, 1026, 1027],
  },
};

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const query = getQuery(event);
  const modelName = (query.model as string) || '';
  const variantName = (query.variant as string) || '';

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Variant ID is required',
    });
  }

  try {
    const modelSlug = modelName
      ? modelName.toLowerCase().replace(/\s+/g, '-')
      : '2025-santa-fe';

    // Get candidate serviceIDs
    const serviceIdCandidates = getServiceIdCandidates(modelName, variantName);

    // Try to find offer data by testing serviceIDs
    const results = await Promise.allSettled(
      serviceIdCandidates.map(async (serviceId) => {
        const url = `https://www.hyundai.com/au/en/offers/${modelSlug}/offer-detail?variantId=${serviceId}`;
        const html = await $fetch<string>(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: 'text/html',
            'Accept-Language': 'en-AU,en;q=0.9',
          },
        }).catch(() => '');
        const data = extractOfferDetailData(html);
        return { serviceId, data };
      })
    );

    // Find a result with offer data
    let detailedOffer: any = null;
    const normalizedVariant = normalizeVariantName(variantName);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.data?.offers?.length > 0) {
        const data = result.value.data;
        const foundVariantFull = `${data.fuelType || ''} ${data.variantGroup || ''}`.trim();
        const foundVariant = normalizeVariantName(foundVariantFull);

        if (isVariantMatch(normalizedVariant, foundVariant, variantName)) {
          detailedOffer = data;
          break;
        }
      }
    }

    // Build response
    const response: any = {
      id,
      ...detailedOffer,
      hasValueOffer: !!detailedOffer?.offers?.length,
    };

    // Extract primary offer
    if (detailedOffer?.offers?.length > 0) {
      const primary = detailedOffer.offers[0];
      response.offerType = primary.type || 'VALUE OFFER';
      response.offerAmount = primary.formattedValue;
      response.offerCode = primary.disclaimerCode;
      response.offerDescription = primary.title;
      response.disclaimer = primary.disclaimer;
    }

    setResponseHeaders(event, {
      'Cache-Control': 'public, max-age=3600',
    });

    return response;
  } catch (error: any) {
    console.error('Error fetching offer:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch offer data',
      message: error.message,
    });
  }
});

function getServiceIdCandidates(modelName: string, variantName: string): number[] {
  const model = (modelName || '').toLowerCase();
  const variant = (variantName || '').toLowerCase();

  for (const [modelPattern, variants] of Object.entries(KNOWN_MAPPINGS)) {
    if (model.includes(modelPattern)) {
      for (const [variantPattern, ids] of Object.entries(variants)) {
        if (variantPattern !== 'default' && variant.includes(variantPattern)) {
          return ids;
        }
      }
      return variants.default || [];
    }
  }

  return [1360, 1361, 1362, 1363, 1364, 1365, 1366, 1367, 1368, 1369, 1370];
}

function normalizeVariantName(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/[–—-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[0-9]+\s*seat/gi, '')
    .trim();
}

function isVariantMatch(target: string, found: string, originalTarget: string): boolean {
  const keyTerms = ['calligraphy', 'elite', 'premium', 'hybrid', 'electric', 'dynamiq', 'epiq', 'techniq'];

  const targetLower = (originalTarget || '').toLowerCase();
  const foundLower = (found || '').toLowerCase();

  let matchCount = 0;
  let mismatchCount = 0;

  for (const term of keyTerms) {
    const targetHas = targetLower.includes(term);
    const foundHas = foundLower.includes(term);

    if (targetHas && foundHas) {
      matchCount++;
    } else if (targetHas !== foundHas) {
      mismatchCount++;
    }
  }

  return (matchCount > 0 && mismatchCount === 0) || (matchCount === 0 && mismatchCount === 0);
}

function extractOfferDetailData(html: string): any {
  const patterns = [
    /window\.hyundaiData\['offersData'\]\s*=\s*(\[[\s\S]*?\]);/,
    /window\.hyundaiData\["offersData"\]\s*=\s*(\[[\s\S]*?\]);/,
  ];

  for (const regex of patterns) {
    const match = html.match(regex);
    if (match && match[1]) {
      try {
        const data = JSON.parse(match[1]);
        if (data?.length > 0 && data[0]?.variants) {
          return parseOfferDetailData(data[0]);
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

function parseOfferDetailData(data: any): any {
  const result: any = {
    variantName: null,
    variantFullName: null,
    specifications: null,
    modelName: null,
    variantGroup: null,
    fuelType: null,
    engineType: null,
    transmission: null,
    serviceId: null,
    price: null,
    formattedPrice: null,
    heroImage: null,
    offers: [],
    keyFeatures: [],
    globalDisclaimers: [],
  };

  if (data.variants) {
    const v = data.variants;
    result.variantName = v.variantName || null;
    result.specifications = v.variantName || null;
    result.modelName = v.modelName || v.modelGroup || null;
    result.variantGroup = v.variantGroup || null;
    result.fuelType = v.fuelType || null;
    result.engineType = v.engineType || null;
    result.transmission = v.transmission || null;
    result.serviceId = v.serviceID || null;

    if (v.modelName || v.modelGroup) {
      const model = v.modelName || v.modelGroup;
      const fuel = v.fuelType ? ` ${v.fuelType}` : '';
      const group = v.variantGroup ? ` ${v.variantGroup}` : '';
      result.variantFullName = `${model}${fuel}${group}`.replace(/\s+/g, ' ').trim();
    }

    if (v.price) {
      result.price = v.price;
      result.formattedPrice = `$${Number(v.price).toLocaleString()}`;
    }

    if (v.image) {
      result.heroImage = v.image.startsWith('http') ? v.image : `https://www.hyundai.com${v.image}`;
    }

    if (v.keyFeatures && Array.isArray(v.keyFeatures)) {
      result.keyFeatures = v.keyFeatures;
    }

    if (v.offerPackages && Array.isArray(v.offerPackages)) {
      for (const pkg of v.offerPackages) {
        if (pkg.offers && Array.isArray(pkg.offers)) {
          for (const offer of pkg.offers) {
            result.offers.push({
              id: offer.offerId || null,
              type: offer.type || 'VALUE OFFER',
              formattedValue: offer.formattedValue || null,
              title: offer.title || null,
              subtitle: offer.subtitle || null,
              body: offer.body || null,
              disclaimerCode: offer.disclaimerCitation || null,
              disclaimer: offer.disclaimer || null,
              priority: offer.priority || 0,
            });
          }
        }
      }
    }
  }

  if (data.globalDisclaimers && Array.isArray(data.globalDisclaimers)) {
    result.globalDisclaimers = data.globalDisclaimers.map((d: any) => ({
      name: d.name || null,
      disclaimer: d.disclaimer || null,
      citation: d.disclaimerCitation || null,
    }));
  }

  return result;
}








