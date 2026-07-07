/**
 * API route to get a random selection of featured accessories
 * Used for homepage promotion of the accessories store
 */

// Sample models to fetch accessories from (ones we know have accessories)
const FEATURED_MODELS = [
  { name: 'Tucson', groupId: '990EEC2C-4AFE-4AD2-B016-73BCD2EB5B44' },
  { name: 'Kona', groupId: '9F6AA9F2-17C6-4148-B47B-1054467C933B' },
  { name: 'Santa Fe', groupId: 'B58EB7A1-CD96-435C-A728-8E7748FE7520' },
  { name: 'i30', groupId: 'C4994B0D-A89D-4113-B6CD-B5D9352512C3' },
  { name: 'Palisade', groupId: 'A15B22F2-30DE-4B8C-8A95-9E814662ECDD' },
  { name: 'Staria', groupId: 'E14E5076-A170-4F6C-86EF-AEF77027B46A' },
];

const CACHE_MAX_AGE = 60 * 30;
const CACHE_STALE_MAX_AGE = 60 * 60;

// Helper to parse price
const parsePrice = (value: any): number | null => {
  if (value === null || value === undefined || value === 'null' || value === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

async function fetchAccessoriesForModel(model: { name: string; groupId: string }) {
  try {
    const apiUrl = `https://www.hyundai.com/content/api/au/hyundai/v3/accessories?groupId=${model.groupId}`;

    const data = await $fetch<any>(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      timeout: 5000,
      retry: 0,
    });

    if (!data?.accessories) {
      return [];
    }

    return data.accessories
      .filter((acc: any) => {
        const price = parsePrice(acc.rrpIncFitment) || parsePrice(acc.price);
        return price !== null && price > 0 && acc.image;
      })
      .map((acc: any) => ({
        id: acc.accessoryId || acc.id,
        name: acc.partName || acc.name,
        description: acc.description,
        price: parsePrice(acc.rrpIncFitment) || parsePrice(acc.price) || 0,
        category: acc.category,
        image: acc.image ? (acc.image.startsWith('http') ? acc.image : `https://www.hyundai.com${acc.image}`) : null,
        isPopular: acc.isFeature || false,
        modelName: model.name,
        modelSlug: model.name.toLowerCase().replace(/\s+/g, '-'),
      }));
  } catch (err: any) {
    console.warn(`[Featured Accessories] Failed to fetch from ${model.name}:`, err?.message || err);
    return [];
  }
}

export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event);
  const limit = parseInt(query.limit as string) || 8;

  try {
    // Pick 2-3 random models to fetch accessories from
    const shuffledModels = shuffleArray(FEATURED_MODELS);
    const selectedModels = shuffledModels.slice(0, 3);

    const allAccessories = (await Promise.all(selectedModels.map(fetchAccessoriesForModel))).flat();

    if (allAccessories.length === 0) {
      return {
        success: false,
        error: 'No accessories available',
        accessories: [],
      };
    }

    // Prioritize popular items, then shuffle
    const popular = allAccessories.filter(a => a.isPopular);
    const regular = allAccessories.filter(a => !a.isPopular);

    // Take some popular ones first, then fill with regular
    const popularCount = Math.min(Math.ceil(limit / 2), popular.length);
    const regularCount = limit - popularCount;

    const selectedAccessories = [
      ...shuffleArray(popular).slice(0, popularCount),
      ...shuffleArray(regular).slice(0, regularCount),
    ];

    // Final shuffle to mix them up
    const finalAccessories = shuffleArray(selectedAccessories);

    return {
      success: true,
      accessories: finalAccessories,
      totalAvailable: allAccessories.length,
      modelsUsed: selectedModels.map(m => m.name),
    };
  } catch (error: any) {
    console.error('[Featured Accessories] Error:', error.message);

    return {
      success: false,
      error: 'Failed to fetch featured accessories',
      accessories: [],
    };
  }
}, {
  maxAge: CACHE_MAX_AGE,
  staleMaxAge: CACHE_STALE_MAX_AGE,
  name: 'featured-accessories',
  getKey: (event) => `featured-accessories:${parseInt(getQuery(event).limit as string) || 8}`,
});
