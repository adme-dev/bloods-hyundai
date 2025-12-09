/**
 * API route to get accessories for a model
 * Matches the Netlify Function logic with groupId lookup
 * Enhanced for the Accessories Store R&D feature
 */

// Known accessories group IDs (scraped from Hyundai accessories pages)
// These are CMS-specific IDs that differ from the calculator API's modelSeriesId
const ACCESSORIES_GROUP_IDS: Record<string, string> = {
  // Model name (lowercase) -> groupId
  // SUVs
  'tucson': '990EEC2C-4AFE-4AD2-B016-73BCD2EB5B44',
  '2025-tucson': '990EEC2C-4AFE-4AD2-B016-73BCD2EB5B44',
  'kona': '9F6AA9F2-17C6-4148-B47B-1054467C933B',
  '2025-kona': '9F6AA9F2-17C6-4148-B47B-1054467C933B',
  'venue': '4AEAFF7A-088F-4686-AE85-CEF84E83D8EE',
  'santa-fe': 'B58EB7A1-CD96-435C-A728-8E7748FE7520',
  '2025-santa-fe': 'B58EB7A1-CD96-435C-A728-8E7748FE7520',
  'santafe': 'B58EB7A1-CD96-435C-A728-8E7748FE7520',
  'palisade': 'A15B22F2-30DE-4B8C-8A95-9E814662ECDD',
  '2026-palisade': 'A15B22F2-30DE-4B8C-8A95-9E814662ECDD',
  
  // Hatch & Sedan
  'i30': 'C4994B0D-A89D-4113-B6CD-B5D9352512C3',
  '2025-i30': 'C4994B0D-A89D-4113-B6CD-B5D9352512C3',
  'i30-sedan': 'I30_SEDAN_GROUP_ID',
  'sonata': 'SONATA_GROUP_ID',
  
  // Electric
  'ioniq5': 'IONIQ5_GROUP_ID',
  'ioniq-5': 'IONIQ5_GROUP_ID',
  'ioniq6': 'IONIQ6_GROUP_ID',
  'ioniq-6': 'IONIQ6_GROUP_ID',
  'ioniq5n': 'IONIQ5N_GROUP_ID',
  'ioniq-5-n': 'IONIQ5N_GROUP_ID',
  'ioniq9': 'IONIQ9_GROUP_ID',
  'ioniq-9': 'IONIQ9_GROUP_ID',
  'inster': 'INSTER_GROUP_ID',
  
  // Performance
  'i30n': 'I30N_GROUP_ID',
  'i30-n': 'I30N_GROUP_ID',
  'i30-sedan-n': 'I30_SEDAN_N_GROUP_ID',
  'i20n': 'I20N_GROUP_ID',
  'i20-n': 'I20N_GROUP_ID',
  
  // Vans
  'staria': 'E14E5076-A170-4F6C-86EF-AEF77027B46A',
  'staria-load': 'E14E5076-A170-4F6C-86EF-AEF77027B46A',
};

// Accessory category display names and icons
const CATEGORY_INFO: Record<string, { displayName: string; icon: string; order: number }> = {
  'Interior': { displayName: 'Interior', icon: '🪑', order: 1 },
  'Exterior': { displayName: 'Exterior', icon: '🚗', order: 2 },
  'Protection': { displayName: 'Protection', icon: '🛡️', order: 3 },
  'Cargo': { displayName: 'Cargo & Storage', icon: '📦', order: 4 },
  'Towing': { displayName: 'Towing', icon: '🔗', order: 5 },
  'Lifestyle': { displayName: 'Lifestyle', icon: '🏕️', order: 6 },
  'Audio & Electronics': { displayName: 'Audio & Electronics', icon: '🔊', order: 7 },
  'Wheels': { displayName: 'Wheels & Tyres', icon: '🛞', order: 8 },
  'Safety': { displayName: 'Safety', icon: '🦺', order: 9 },
  'Packs': { displayName: 'Value Packs', icon: '💰', order: 10 },
};

// Function to scrape groupId from accessories page
async function scrapeGroupId(modelName: string): Promise<string | null> {
  try {
    // Normalize model name for URL
    const urlModelName = modelName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/^20\d{2}-/, '');
    
    const pageUrl = `https://www.hyundai.com/au/en/owning/accessories/${urlModelName}`;
    console.log('[Accessories API] Scraping groupId from:', pageUrl);
    
    const html = await $fetch<string>(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      timeout: 15000,
    });
    
    // Extract model-series-id from the accessories-precom-v2 component
    const match = html.match(/model-series-id="([^"]+)"/);
    if (match && match[1]) {
      console.log('[Accessories API] Found groupId:', match[1]);
      return match[1];
    }
    
    return null;
  } catch (error: any) {
    console.error('[Accessories API] Failed to scrape groupId:', error.message);
    return null;
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  let groupId = query.groupId as string | undefined;
  const modelName = (query.model || query.modelName) as string | undefined;

  // If no groupId but modelName provided, look it up or scrape it
  if (!groupId && modelName) {
    const normalizedName = modelName.toLowerCase().replace(/\s+/g, '-');
    
    // Check our known mappings first
    groupId = ACCESSORIES_GROUP_IDS[normalizedName];
    
    // If not in our cache, try to scrape it
    if (!groupId || groupId.includes('_GROUP_ID')) {
      console.log('[Accessories API] GroupId not cached, scraping for:', modelName);
      groupId = await scrapeGroupId(modelName) || undefined;
    }
  }

  if (!groupId) {
    return {
      success: false,
      error: 'Accessories group ID is required. Use ?groupId=xxx or ?model=model-name',
      hint: 'The groupId is a CMS-specific ID. You can also provide a model name (e.g., ?model=tucson) and we will look it up.',
      knownModels: Object.keys(ACCESSORIES_GROUP_IDS).filter(k => !ACCESSORIES_GROUP_IDS[k].includes('_GROUP_ID')),
      accessories: [],
      accessoryPacks: [],
    };
  }

  try {
    // Fetch accessories using the groupId
    const apiUrl = `https://www.hyundai.com/content/api/au/hyundai/v3/accessories?groupId=${groupId}`;
    console.log('[Accessories API] Fetching:', apiUrl);
    
    let data: any = null;
    try {
      data = await $fetch<any>(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        timeout: 20000,
      });
      console.log('[Accessories API] Found', data.accessories?.length || 0, 'accessories');
    } catch (err: any) {
      console.error('[Accessories API] API failed:', err.message);
    }

    if (!data || ((!data.accessories || data.accessories.length === 0) && (!data.accessoryPacks || data.accessoryPacks.length === 0))) {
      return {
        success: false,
        error: 'No accessories data found for this group ID.',
        groupId,
        modelName,
        accessories: [],
        accessoryPacks: [],
      };
    }

    // Helper to parse price - handles "null" strings and actual nulls
    const parsePrice = (value: any): number | null => {
      if (value === null || value === undefined || value === 'null' || value === '') return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    // Separate regular accessories from packs (packs have category "Packs")
    const rawAccessories = (data.accessories || []).filter((acc: any) => acc.category !== 'Packs');
    const rawPacks = (data.accessoryPacks || []).length > 0 
      ? data.accessoryPacks 
      : (data.accessories || []).filter((acc: any) => acc.category === 'Packs');

    // Process accessories - map from Hyundai API field names to our standard names
    // Filter out accessories with no valid price
    const accessories = rawAccessories
      .filter((acc: any) => {
        const price = parsePrice(acc.rrpIncFitment) || parsePrice(acc.price);
        return price !== null && price > 0;
      })
      .map((acc: any) => ({
        id: acc.accessoryId || acc.id,  // Hyundai uses accessoryId
        name: acc.partName || acc.name,  // Hyundai uses partName
        description: acc.description,
        price: parsePrice(acc.rrpIncFitment) || parsePrice(acc.price) || 0,  // Hyundai uses rrpIncFitment
        rrp: parsePrice(acc.rrpExFitment) || parsePrice(acc.rrp) || 0,
        category: acc.category,
        categoryName: acc.category,  // Hyundai doesn't have categoryName, use category
        image: acc.image ? (acc.image.startsWith('http') ? acc.image : `https://www.hyundai.com${acc.image}`) : null,
        thumbnail: acc.imageHero ? (acc.imageHero.startsWith('http') ? acc.imageHero : `https://www.hyundai.com${acc.imageHero}`) : null,
        partNumber: acc.partNumber,
        isPopular: acc.isFeature || false,
        isFitted: acc.fitmentRequired || false,
        fittingPrice: acc.fitmentTime ? parseFloat(acc.fitmentTime) : null,
        features: acc.features || [],
        disclaimer: acc.disclaimer,
        variants: acc.variants || [],
      }));

    // Process accessory packs - map from Hyundai API field names
    // Filter out packs with no valid price
    const accessoryPacks = rawPacks
      .filter((pack: any) => {
        const price = parsePrice(pack.rrpIncFitment) || parsePrice(pack.price);
        return price !== null && price > 0;
      })
      .map((pack: any) => ({
        id: pack.accessoryId || pack.packId || pack.id,  // Packs also use accessoryId
        name: pack.partName || pack.packName || pack.name,  // Packs also use partName
        title: pack.partName || pack.title || pack.packName,
        description: pack.description,
        price: parsePrice(pack.rrpIncFitment) || parsePrice(pack.price) || 0,
        rrp: parsePrice(pack.rrpExFitment) || parsePrice(pack.rrp) || 0,
        savingsAmount: parsePrice(pack.savings) || parsePrice(pack.savingsAmount) || 0,
        image: pack.image ? (pack.image.startsWith('http') ? pack.image : `https://www.hyundai.com${pack.image}`) : null,
        imageHero: pack.imageHero ? (pack.imageHero.startsWith('http') ? pack.imageHero : `https://www.hyundai.com${pack.imageHero}`) : null,
        imageCloseUp1: pack.imageCloseUp1 ? (pack.imageCloseUp1.startsWith('http') ? pack.imageCloseUp1 : `https://www.hyundai.com${pack.imageCloseUp1}`) : null,
        imageCloseUp2: pack.imageCloseUp2 ? (pack.imageCloseUp2.startsWith('http') ? pack.imageCloseUp2 : `https://www.hyundai.com${pack.imageCloseUp2}`) : null,
        category: pack.category,
        categoryName: pack.category,
        partNumber: pack.partNumber,
        isFitted: pack.fitmentRequired || false,
        isPopular: pack.isFeature || false,
        disclaimer: pack.disclaimer,
        // Pack's accessories array contains references, not full accessory objects
        includedAccessories: (pack.accessories || []).map((acc: any) => ({
          id: acc.accessoryId,
          quantity: acc.quantity || 1,
          citation: acc.citation,
          order: acc.order,
        })),
      }));

    // Group accessories by category
    const categorizedAccessories: Record<string, any[]> = {};
    accessories.forEach((acc: any) => {
      const category = acc.categoryName || acc.category || 'Other';
      if (!categorizedAccessories[category]) {
        categorizedAccessories[category] = [];
      }
      categorizedAccessories[category].push(acc);
    });

    // Sort categories by display order
    const sortedCategories = Object.keys(categorizedAccessories).sort((a, b) => {
      const orderA = CATEGORY_INFO[a]?.order || 99;
      const orderB = CATEGORY_INFO[b]?.order || 99;
      return orderA - orderB;
    });

    // Enhance categories with display info
    const categoryInfo = sortedCategories.map(cat => ({
      key: cat,
      displayName: CATEGORY_INFO[cat]?.displayName || cat,
      icon: CATEGORY_INFO[cat]?.icon || '📦',
      count: categorizedAccessories[cat]?.length || 0,
    }));

    return {
      success: true,
      groupId,
      modelName,
      totalAccessories: accessories.length,
      totalPacks: accessoryPacks.length,
      accessories,
      accessoryPacks,
      categorizedAccessories,
      categories: sortedCategories,
      categoryInfo,
      modelSpecifications: data.modelSpecifications || [],
      variants: data.variants || [],
    };
  } catch (error: any) {
    console.error('[Accessories API] Error:', error.message);
    
    return {
      success: false,
      error: 'Failed to fetch accessories',
      message: error.message,
      accessories: [],
      accessoryPacks: [],
    };
  }
});
