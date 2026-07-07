/**
 * API route to get all Hyundai vehicle variants
 * 
 * DATA STRATEGY:
 * 1. modeladditional API - Gets all models with metadata (images, URLs, displayPowertrain)
 * 2. carpricecalculator/models API - Gets category structure and pricing summary
 * 3. Coming Soon vehicles from RYI pages
 * 4. Local known model metadata fills OEM omissions without extra waterfalls
 */

interface CpcCategory {
  categoryId: string;
  name: string;
  description?: string;
  order: number;
}

interface CpcModel {
  modelId: string;
  modelName: string;
  capsModelName?: string;
  categoryId?: string;
  image?: string;
  imageAltText?: string;
  priceLow?: number;
  priceHigh?: number;
  priceEnabled?: boolean;
  priceDisclaimer?: string;
  order?: number;
  calculatorUrl?: string;
  numberOfOptions?: number;
}

interface CpcResponse {
  categories: CpcCategory[];
  models: CpcModel[];
}

const CACHE_MAX_AGE = 60 * 60 * 6;
const CACHE_STALE_MAX_AGE = 60 * 60 * 24;

export default defineCachedEventHandler(async (event) => {
  const refreshRequested = getQuery(event).refresh === 'true';

  setResponseHeaders(event, {
    'Cache-Control': refreshRequested
      ? 'no-store, max-age=0'
      : `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_STALE_MAX_AGE}`,
    'Content-Type': 'application/json',
  });

  try {
    // Fetch from primary sources in parallel
    const [cpcData, modelsAdditionalData, comingSoonResponse] = await Promise.all([
      $fetch<CpcResponse>(
        'https://www.hyundai.com/content/api/au/hyundai/v3/carpricecalculator/models',
        { timeout: 20000 }
      ),
      $fetch<any[]>(
        'https://www.hyundai.com/content/api/au/hyundai/pcm1/v1/modeladditional',
        { timeout: 20000 }
      ).catch((err: Error) => {
        console.warn('[API] Failed to fetch modeladditional:', err.message);
        return [];
      }),
      $fetch<any>('/api/coming-soon-vehicles', { timeout: 15000 }).catch((err: Error) => {
        console.warn('[API] Failed to fetch coming soon vehicles:', err.message);
        return { success: false, vehicles: [] };
      }),
    ]);

    if (!cpcData?.categories || !cpcData?.models) {
      return {
        success: false,
        error: 'Unexpected CPC API response format',
        variants: [],
        groupedByCategory: {},
      };
    }

    // Build category lookup from CPC API
    const cpcCategories = new Map<string, CpcCategory>();
    cpcData.categories.forEach((cat: CpcCategory) => {
      cpcCategories.set(cat.categoryId, cat);
    });

    // Build modeladditional lookup for extra details.
    const modelAdditionalByName = new Map<string, any>();
    
    if (modelsAdditionalData && Array.isArray(modelsAdditionalData)) {
      modelsAdditionalData.forEach((m: any) => {
        const name = m.model?.model;
        if (name) {
          modelAdditionalByName.set(name.toLowerCase(), m);
        }
      });
    }

    // Known images for models that may be missing from CPC
    // Based on https://www.hyundai.com/au/en/cars official images
    const knownImages: Record<string, string> = {
      // Electric
      'ioniq 6': '/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ6_Front34_640x331.png',
      '2023 ioniq 6': '/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ6_Front34_640x331.png',
      'kona electric': '/content/dam/hyundai/au/en/models/front-3-4-models/KONA_Electric_Front34_640x331.png',
      // Hybrid
      'kona hybrid': '/content/dam/hyundai/au/en/models/front-3-4-models/Hyundai_Models_KONA_Hybrid_Front34_640x3311.png',
      'tucson hybrid': '/content/dam/hyundai/au/en/models/tucson-2024/awards-2025/v2/TUCSON_Hybrid-Elite_Front34_640x331.png',
      'santa fe hybrid': '/content/dam/hyundai/au/en/models/front-3-4-models/Hyundai_Models_SANTA_FE_Hybrid_Front34_640x331_COTY.png',
      'palisade hybrid': '/content/dam/hyundai/au/en/models/palisade/2026-palisade/front-34/PALISADE_MY26_Front34_640x331_v2.png',
      'i30 sedan hybrid': '/content/dam/hyundai/au/en/models/front-3-4-models/i30_Sedan_Hybrid_Front34_640x331.png',
      // Hatch & Sedan
      'i30 n line': '/content/dam/hyundai/au/en/models/front-3-4-models/i30_N_Line_Front34_640x331.png',
      'i30 sedan': '/content/dam/hyundai/au/en/models/front-3-4-models/i30_Sedan_Hybrid_Front34_640x331.png',
      'i30 sedan n line': '/content/dam/hyundai/au/en/models/front-3-4-models/i30_Sedan_NLine_Front34_640x331.png',
      // Runout
      '2025 tucson': '/content/dam/hyundai/au/en/models/front-3-4-models/TUCSON_Hybrid_Front34_640x331.png',
      '2025 santa fe': '/content/dam/hyundai/au/en/models/front-3-4-models/Hyundai_SANTA_FE_Front34_COTY_640x331.png',
      '2025 palisade': '/content/dam/hyundai/au/en/models/front-3-4-models/PALISADE_Front34_640x331.png',
      '2025 ioniq 5': '/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ5_Front34_640x331.png',
    };

    // Helper to get image URL
    const getImageUrl = (modelName: string, cpcImage?: string): string | null => {
      if (cpcImage) {
        return cpcImage.startsWith('http') ? cpcImage : `https://www.hyundai.com${cpcImage}`;
      }
      const fallback = knownImages[modelName.toLowerCase()];
      if (fallback) {
        return `https://www.hyundai.com${fallback}`;
      }
      // Try to get from modeladditional
      const additional = modelAdditionalByName.get(modelName.toLowerCase());
      if (additional?.desktopImageUrl) {
        return `https://www.hyundai.com${additional.desktopImageUrl}`;
      }
      return null;
    };

    const groupedByCategory: Record<string, any> = {};
    const allModels: any[] = [];
    const processedSlugs = new Set<string>();

    // Helper to add model to a category
    const addToCategory = (model: any, categoryName: string, categoryDescription: string = '') => {
      if (!groupedByCategory[categoryName]) {
        groupedByCategory[categoryName] = {
          name: categoryName,
          description: categoryDescription,
          models: []
        };
      }
      
      // Check if model already exists in this category
      const existsInCategory = groupedByCategory[categoryName].models.some(
        (m: any) => m.slug === model.slug
      );
      
      if (!existsInCategory) {
        groupedByCategory[categoryName].models.push({ ...model, category: categoryName });
      }
    };

    // Helper to create model object
    const createModel = (cpcModel: CpcModel, categoryName: string, categoryDescription: string) => {
      const slug = cpcModel.modelName.toLowerCase().replace(/\s+/g, '-');
      const additional = modelAdditionalByName.get(cpcModel.modelName.toLowerCase());
      
      return {
        id: cpcModel.modelId,
        modelId: cpcModel.modelId,
        name: cpcModel.modelName,
        slug: slug,
        category: categoryName,
        categoryDescription: categoryDescription,
        image: getImageUrl(cpcModel.modelName, cpcModel.image),
        mobileImage: getImageUrl(cpcModel.modelName, cpcModel.image),
        desktopImage: getImageUrl(cpcModel.modelName, cpcModel.image),
        lowPrice: cpcModel.priceLow,
        highPrice: cpcModel.priceHigh,
        priceEnabled: cpcModel.priceEnabled || false,
        priceDisclaimer: cpcModel.priceDisclaimer || '',
        modelUrl: additional?.modelUrl 
          ? `https://www.hyundai.com${additional.modelUrl}`
          : null,
        calculatorUrl: cpcModel.calculatorUrl
          ? `https://www.hyundai.com${cpcModel.calculatorUrl}`
          : null,
        isNPerformance: additional?.isNPerformance || cpcModel.modelName.includes(' N'),
        order: cpcModel.order || 999,
        variantId: cpcModel.modelId,
        fuelType: categoryName === 'Electric' ? 'Electric' : 
                  categoryName === 'Hybrid' ? 'Hybrid' : 'Petrol',
        hasOffer: false,
        isNew: cpcModel.modelName.includes('2025') || cpcModel.modelName.includes('2026') || 
               cpcModel.modelName === 'INSTER' || cpcModel.modelName === 'IONIQ 9',
        hideInListing: additional?.hideInListing || false,
        numberOfOptions: cpcModel.numberOfOptions || 0,
      };
    };

    // STEP 1: Process models WITH categoryId (main current models)
    cpcData.models.forEach((cpcModel: CpcModel) => {
      if (!cpcModel.categoryId || !cpcModel.priceEnabled) return;
      
      // Skip test models
      if (cpcModel.modelName.toLowerCase().includes('test') ||
          cpcModel.modelName.toLowerCase().includes('qa') ||
          cpcModel.modelName.toLowerCase().includes('copy') ||
          cpcModel.modelName === 'Merchandise') {
        return;
      }

      const category = cpcCategories.get(cpcModel.categoryId);
      if (!category) return;

      const model = createModel(cpcModel, category.name, category.description || '');
      const slug = model.slug;

      if (!processedSlugs.has(slug)) {
        addToCategory(model, category.name, category.description || '');
        allModels.push(model);
        processedSlugs.add(slug);
      }
    });

    // STEP 2: Process models WITHOUT categoryId but determine category by name
    cpcData.models.forEach((cpcModel: CpcModel) => {
      // Skip models that already have categoryId (processed above)
      if (cpcModel.categoryId) return;
      if (!cpcModel.priceEnabled) return;
      
      // Skip test models
      if (cpcModel.modelName.toLowerCase().includes('test') ||
          cpcModel.modelName.toLowerCase().includes('qa') ||
          cpcModel.modelName.toLowerCase().includes('copy') ||
          cpcModel.modelName === 'Merchandise' ||
          cpcModel.modelName === 'Accent') { // Accent is discontinued
        return;
      }

      const modelName = cpcModel.modelName;
      const modelNameLower = modelName.toLowerCase();
      const slug = modelNameLower.replace(/\s+/g, '-');
      
      // Skip if already processed
      if (processedSlugs.has(slug)) return;

      let categoryName: string | null = null;
      let categoryDescription = '';

      // Determine category by name patterns
      // Runout: Only specific 2025 models that are being replaced
      // Based on https://www.hyundai.com/au/en/cars/category/runout
      const runoutModels = ['2025 TUCSON', '2025 SANTA FE', '2025 PALISADE', '2025 IONIQ 5'];
      if (runoutModels.includes(modelName)) {
        categoryName = 'Runout';
        categoryDescription = 'The following models are currently in runout.';
      }
      
      // Electric: Contains "Electric" or is IONIQ (except Hybrid/N)
      if (!categoryName && (
        modelNameLower.includes('electric') ||
        (modelNameLower.includes('ioniq') && !modelNameLower.includes('hybrid') && !modelNameLower.endsWith(' n'))
      )) {
        categoryName = 'Electric';
        categoryDescription = cpcCategories.get('54A732E0-1CC3-4DF0-93D1-41A62C12E4E2')?.description || 
          "Hyundai's Electric line up where innovation, advanced technology and thoughtful design come together.";
      }

      // Hybrid: Contains "Hybrid"
      if (!categoryName && modelNameLower.includes('hybrid')) {
        categoryName = 'Hybrid';
        categoryDescription = cpcCategories.get('8FCA4200-978C-42E5-A824-55D4C67FFFD0')?.description ||
          "Hyundai's Hybrid line up where excellent efficiency meets outstanding performance.";
      }

      // Hatch and Sedan: i30 variants (non-N)
      if (!categoryName && modelNameLower.startsWith('i30') && !modelNameLower.includes(' n')) {
        categoryName = 'Hatch and Sedan';
        categoryDescription = 'Perfect for urban explorers, every small car in our range is fun, zippy and full of personality.';
      }

      if (categoryName) {
        const model = createModel(cpcModel, categoryName, categoryDescription);
        addToCategory(model, categoryName, categoryDescription);
        allModels.push(model);
        processedSlugs.add(slug);
      }
    });

    // STEP 3: Add specific models that match Hyundai AU website lineup
    // Based on https://www.hyundai.com/au/en/cars
    // Only add models that have their own pages on the official site
    
    const hybridDescription = cpcCategories.get('8FCA4200-978C-42E5-A824-55D4C67FFFD0')?.description ||
      "Hyundai's Hybrid line up where excellent efficiency meets outstanding performance.";
    const hatchSedanDescription = cpcCategories.get('AE896C0D-1F2D-44E4-801F-CCAA5E51EFC1')?.description ||
      'Perfect for urban explorers, every small car in our range is fun, zippy and full of personality.';
    
    // Models to add that aren't in CPC with categoryId but are on the official site
    const additionalModels = [
      // Hybrid models
      { name: 'KONA Hybrid', category: 'Hybrid', categoryDesc: hybridDescription, fuelType: 'Hybrid', isNew: false },
      { name: 'TUCSON Hybrid', category: 'Hybrid', categoryDesc: hybridDescription, fuelType: 'Hybrid', isNew: true },
      { name: 'SANTA FE Hybrid', category: 'Hybrid', categoryDesc: hybridDescription, fuelType: 'Hybrid', isNew: false },
      { name: 'PALISADE Hybrid', category: 'Hybrid', categoryDesc: hybridDescription, fuelType: 'Hybrid', isNew: true },
      { name: 'i30 Sedan Hybrid', category: 'Hybrid', categoryDesc: hybridDescription, fuelType: 'Hybrid', isNew: false },
      // Hatch & Sedan models
      { name: 'i30 N Line', category: 'Hatch and Sedan', categoryDesc: hatchSedanDescription, fuelType: 'Petrol', isNew: false },
      { name: 'i30 Sedan', category: 'Hatch and Sedan', categoryDesc: hatchSedanDescription, fuelType: 'Petrol', isNew: false },
      { name: 'i30 Sedan N Line', category: 'Hatch and Sedan', categoryDesc: hatchSedanDescription, fuelType: 'Petrol', isNew: false },
    ];
    
    additionalModels.forEach((modelDef, index) => {
      const slug = modelDef.name.toLowerCase().replace(/\s+/g, '-');
      
      // Skip if already processed
      if (processedSlugs.has(slug)) return;
      
      // Find base model name for lookups
      const baseModelName = modelDef.name.split(' ')[0].toLowerCase();
      const baseModelAdditional = modelAdditionalByName.get(baseModelName);
      const baseModel = allModels.find(m => m.name.toLowerCase() === baseModelName);
      
      const model = {
        id: `model-${slug}`,
        modelId: `model-${slug}`,
        name: modelDef.name,
        slug: slug,
        category: modelDef.category,
        categoryDescription: modelDef.categoryDesc,
        image: getImageUrl(modelDef.name, undefined),
        mobileImage: getImageUrl(modelDef.name, undefined),
        desktopImage: getImageUrl(modelDef.name, undefined),
        lowPrice: baseModel?.lowPrice || null,
        highPrice: baseModel?.highPrice || null,
        priceEnabled: baseModel?.priceEnabled !== false,
        priceDisclaimer: baseModel?.priceDisclaimer || '',
        modelUrl: baseModelAdditional?.modelUrl 
          ? `https://www.hyundai.com${baseModelAdditional.modelUrl}`
          : null,
        calculatorUrl: baseModelAdditional?.calculatorUrl
          ? `https://www.hyundai.com${baseModelAdditional.calculatorUrl}`
          : null,
        isNPerformance: modelDef.name.includes(' N ') || modelDef.name.endsWith(' N'),
        order: index + 10,
        variantId: `model-${slug}`,
        fuelType: modelDef.fuelType,
        hasOffer: true,
        isNew: modelDef.isNew,
        hideInListing: false,
      };

      addToCategory(model, modelDef.category, modelDef.categoryDesc);
      allModels.push(model);
      processedSlugs.add(slug);
    });

    // STEP 5: Add Coming Soon vehicles
    const comingSoonVehicles = comingSoonResponse?.vehicles || [];
    if (comingSoonVehicles.length > 0) {
      const comingSoonDescription = 'Register your interest in these upcoming vehicles';
      
      comingSoonVehicles.forEach((vehicle: any, index: number) => {
        const slug = vehicle.slug;
        if (processedSlugs.has(slug)) return;

        const model = {
          id: vehicle.id || `coming-soon-${slug}`,
          modelId: vehicle.id,
          name: vehicle.name,
          slug: slug,
          category: 'Coming Soon',
          categoryDescription: comingSoonDescription,
          image: vehicle.image,
          mobileImage: vehicle.image,
          desktopImage: vehicle.image,
          lowPrice: null,
          highPrice: null,
          priceEnabled: false,
          priceDisclaimer: 'Pricing to be announced',
          modelUrl: vehicle.hyundaiUrl,
          calculatorUrl: null,
          isNPerformance: vehicle.name.includes(' N'),
          order: index,
          variantId: vehicle.id,
          fuelType: 'Electric',
          hasOffer: false,
          isNew: true,
          isComingSoon: true,
          form: true,
          tagline: vehicle.tagline,
        };

        addToCategory(model, 'Coming Soon', comingSoonDescription);
        allModels.push(model);
        processedSlugs.add(slug);
      });
    }

    // Sort models within each category by order
    Object.values(groupedByCategory).forEach((category: any) => {
      category.models.sort((a: any, b: any) => (a.order || 999) - (b.order || 999));
    });

    // Sort all models by order
    allModels.sort((a, b) => (a.order || 999) - (b.order || 999));

    // Get category names sorted using CPC category order
    const categoryOrder = cpcData.categories
      .sort((a, b) => a.order - b.order)
      .map(c => c.name);
    
    const categories = Object.keys(groupedByCategory).sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return {
      success: true,
      totalModels: allModels.length,
      vehicleCategories: categories,
      groupedByCategory,
      variants: allModels,
    };
  } catch (error: any) {
    console.error('[API] all-variants error:', error);

    return {
      success: false,
      error: error.message || 'Failed to fetch variants',
      variants: [],
      groupedByCategory: {},
    };
  }
}, {
  maxAge: CACHE_MAX_AGE,
  staleMaxAge: CACHE_STALE_MAX_AGE,
  name: 'all-variants',
  getKey: () => 'all-variants-v1',
  shouldBypassCache: (event) => getQuery(event).refresh === 'true',
});
