/**
 * API route to get all Hyundai vehicle variants
 * 
 * DATA STRATEGY:
 * 1. modeladditional API - Gets all models with metadata (images, URLs, displayPowertrain)
 * 2. carpricecalculator/models API - Gets category structure and pricing summary
 * 3. For models with displayPowertrain=true, fetch detailed carpricecalculator?modelname={name}
 *    to get variant groups (e.g., i30 N Line, i30 N Line Premium)
 * 4. Coming Soon vehicles from RYI pages
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

interface VariantGroup {
  id: string;
  name: string;
  image: string;
  imageAltText?: string;
  lowestVariantPrice?: string;
  priceEnabled?: boolean;
  features?: any[];
}

interface DetailedCpcResponse {
  model: string;
  modelId: string;
  displayPowertrain?: boolean;
  powertrains?: string[];
  categories?: { name: string; isPrimary?: boolean }[];
  variantGroups?: VariantGroup[];
  priceEnabled?: boolean;
}

export default defineEventHandler(async (event) => {
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

    // Build modeladditional lookup for extra details and identify models needing detailed fetch
    const modelAdditionalByName = new Map<string, any>();
    const modelsNeedingDetailedFetch: string[] = []; // Models with displayPowertrain=true
    
    if (modelsAdditionalData && Array.isArray(modelsAdditionalData)) {
      modelsAdditionalData.forEach((m: any) => {
        const name = m.model?.model;
        if (name) {
          modelAdditionalByName.set(name.toLowerCase(), m);
          // Models with displayPowertrain=true have variant groups (like i30 N Line)
          // These models often have hideInListing=true for the parent but we need their variants
          // Exclude EVs that don't have combustion variants, and STARIA (commercial vehicle)
          if (m.displayPowertrain && 
              m.priceEnabled !== false &&
              !['IONIQ', 'INSTER', 'STARIA'].some(e => name.toUpperCase().includes(e))) {
            modelsNeedingDetailedFetch.push(name);
          }
        }
      });
    }

    // Fetch detailed variant groups for models with displayPowertrain=true
    // This gives us i30 N Line, KONA variants, TUCSON variants, etc.
    const detailedVariantGroups = new Map<string, VariantGroup[]>();
    const detailedModelCategories = new Map<string, string>();
    
    if (modelsNeedingDetailedFetch.length > 0) {
      const detailedFetches = modelsNeedingDetailedFetch.map(async (modelName) => {
        try {
          const response = await $fetch<DetailedCpcResponse[]>(
            `https://www.hyundai.com/content/api/au/hyundai/v3/carpricecalculator?postcode=2000&modelname=${encodeURIComponent(modelName)}&displaypowertrain=true`,
            { timeout: 15000 }
          );
          // Response is an array (different powertrain responses), take first one with variantGroups
          const data = Array.isArray(response) ? response[0] : response;
          if (data?.variantGroups && data.variantGroups.length > 0) {
            detailedVariantGroups.set(modelName.toLowerCase(), data.variantGroups);
            // Get category from the detailed response
            const category = data.categories?.find(c => c.isPrimary)?.name || data.categories?.[0]?.name;
            if (category) {
              detailedModelCategories.set(modelName.toLowerCase(), category);
            }
          }
        } catch (err: any) {
          console.warn(`[API] Failed to fetch detailed CPC for ${modelName}:`, err.message);
        }
      });
      
      await Promise.all(detailedFetches);
    }

    // Known images for models that may be missing from CPC
    const knownImages: Record<string, string> = {
      'ioniq 6': '/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ6_Front34_640x331.png',
      '2023 ioniq 6': '/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ6_Front34_640x331.png',
      'kona electric': '/content/dam/hyundai/au/en/models/front-3-4-models/KONA_Electric_Front34_640x331.png',
      'i30': '/content/dam/hyundai/au/en/models/front-3-4-models/i30_Front34_640x331.png',
      'i30 n line': '/content/dam/hyundai/au/en/models/i30/2025/front-3-4/n-line/i30_N_Line_Atlas_White-new.png',
      'i30 n line premium': '/content/dam/hyundai/au/en/models/i30/2025/front-3-4/n-line-premium/i30_N_Line_Premium_Atlas_White-new.png',
      'i30 sedan': '/content/dam/hyundai/au/en/models/i30-sedan/front-3-4-images/i30/i30_Sedan_Front34_MY24_Atlas_White.png',
      'i30 sedan elite': '/content/dam/hyundai/au/en/models/i30-sedan/front-3-4-images/elite/i30_Sedan_Front34_MY24_Elite_Atlas_White.png',
      'i30 sedan premium': '/content/dam/hyundai/au/en/models/i30-sedan/front-3-4-images/premium/i30_Sedan_Front34_MY24_Premium_Atlas_White.png',
      'i30 sedan n line': '/content/dam/hyundai/au/en/models/i30-sedan/front-3-4-images/n-line/i30_Sedan_Front34_MY24_NLine_Atlas_White.png',
      'i30 sedan n line premium': '/content/dam/hyundai/au/en/models/i30-sedan/front-3-4-images/n-line-premium/i30_Sedan_Front34_MY24_NLinePremium_Atlas_White.png',
      'i30 sedan hybrid': '/content/dam/hyundai/au/en/models/i30-sedan/front-3-4-images/hybrid/i30_Sedan_MY24_Front 3_4_Atlas_White.png',
      'i30 sedan hybrid elite': '/content/dam/hyundai/au/en/models/i30-sedan/front-3-4-images/hybrid-elite/i30_Sedan_MY24_Hybrid_Elite_Front_3_4_Atlas_White.png',
      '2025 tucson': '/content/dam/hyundai/au/en/models/tucson-2024/awards-2025/v2/TUCSON_ICE-Elite_Front34_640x331.png',
      '2025 santa fe': '/content/dam/hyundai/au/en/models/front-3-4-models/Hyundai_SANTA_FE_Front34_COTY_640x331.png',
      '2025 palisade': '/content/dam/hyundai/au/en/models/front-3-4-models/PALISADE_Front34_640x331.png',
      '2025 ioniq 5': '/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ5_Front34_640x331.png',
      'kona hybrid': '/content/dam/hyundai/au/en/models/front-3-4-models/Hyundai_Models_KONA_Hybrid_Front34_640x3311.png',
      'tucson hybrid': '/content/dam/hyundai/au/en/models/tucson-2024/awards-2025/v2/TUCSON_Hybrid-Elite_Front34_640x331.png',
      'santa fe hybrid': '/content/dam/hyundai/au/en/models/front-3-4-models/Hyundai_Models_SANTA_FE_Hybrid_Front34_640x331_COTY.png',
      'palisade hybrid': '/content/dam/hyundai/au/en/models/palisade/2026-palisade/front-34/PALISADE_MY26_Front34_640x331_v2.png',
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

    // STEP 3: Add variant groups from detailed CPC fetch
    // For i30: Include distinct body types and powertrain variants (N Line, Sedan, Hybrid)
    // For other models: Only include Hybrid variants (trim levels like Elite/Premium go to base model)
    detailedVariantGroups.forEach((variantGroups, baseModelName) => {
      const categoryName = detailedModelCategories.get(baseModelName) || 'Hatch and Sedan';
      const categoryDescription = cpcCategories.get('AE896C0D-1F2D-44E4-801F-CCAA5E51EFC1')?.description ||
        'Perfect for urban explorers, every small car in our range is fun, zippy and full of personality.';
      
      const baseModelAdditional = modelAdditionalByName.get(baseModelName);
      const isI30 = baseModelName.toLowerCase() === 'i30';
      
      variantGroups.forEach((vg: VariantGroup, index: number) => {
        const variantName = vg.name.trim();
        const variantNameLower = variantName.toLowerCase();
        const variantSlug = variantNameLower.replace(/\s+/g, '-');
        
        // Skip if already processed
        if (processedSlugs.has(variantSlug)) return;
        
        // Skip base variants that match parent model (e.g., "i30 Sedan" when we already have "i30")
        const isBaseVariant = variantNameLower === baseModelName.toLowerCase() || 
                              variantNameLower === `${baseModelName.toLowerCase()} sedan`;
        if (isBaseVariant) return;
        
        // Determine if this variant should be included
        // For i30: Include N Line, Hybrid, and distinct body variants
        // For other models: Only include Hybrid variants (not trim levels)
        const isHybrid = variantNameLower.includes('hybrid');
        const isNLine = variantNameLower.includes('n line');
        const isElectric = variantNameLower.includes('electric');
        
        // For non-i30 models, skip trim levels (Elite, Premium, Calligraphy)
        // These are not distinct models, just trim levels of the base model
        if (!isI30 && !isHybrid && !isElectric) {
          return; // Skip non-i30 ICE variants (they're just trim levels)
        }
        
        // For i30, only include meaningful variants (N Line, Hybrid, distinct body types)
        if (isI30 && !isNLine && !isHybrid) {
          // Skip basic i30 trim levels like "i30 Sedan Elite", "i30 Sedan Premium"
          if (variantNameLower.includes('elite') || 
              variantNameLower.includes('premium') ||
              variantNameLower === 'i30 sedan') {
            return;
          }
        }
        
        // Determine the correct category for this variant
        let variantCategory = categoryName;
        let variantCategoryDesc = categoryDescription;
        let fuelType = 'Petrol';
        
        // Hybrid variants go to Hybrid category
        if (isHybrid) {
          variantCategory = 'Hybrid';
          variantCategoryDesc = cpcCategories.get('8FCA4200-978C-42E5-A824-55D4C67FFFD0')?.description ||
            "Hyundai's Hybrid line up where excellent efficiency meets outstanding performance.";
          fuelType = 'Hybrid';
        }
        
        // Electric variants go to Electric category
        if (isElectric) {
          variantCategory = 'Electric';
          variantCategoryDesc = cpcCategories.get('54A732E0-1CC3-4DF0-93D1-41A62C12E4E2')?.description ||
            "Hyundai's Electric line up where innovation, advanced technology and thoughtful design come together.";
          fuelType = 'Electric';
        }
        
        // Get image from variant group or fallback
        let imageUrl = vg.image ? 
          (vg.image.startsWith('http') ? vg.image : `https://www.hyundai.com${vg.image}`) :
          getImageUrl(variantName, undefined);
        
        const variantModel = {
          id: vg.id || `variant-${variantSlug}`,
          modelId: vg.id || `variant-${variantSlug}`,
          name: variantName,
          slug: variantSlug,
          category: variantCategory,
          categoryDescription: variantCategoryDesc,
          image: imageUrl,
          mobileImage: imageUrl,
          desktopImage: imageUrl,
          lowPrice: vg.lowestVariantPrice ? parseFloat(vg.lowestVariantPrice) : null,
          highPrice: null,
          priceEnabled: vg.priceEnabled !== false,
          priceDisclaimer: '',
          modelUrl: baseModelAdditional?.modelUrl 
            ? `https://www.hyundai.com${baseModelAdditional.modelUrl}`
            : null,
          calculatorUrl: baseModelAdditional?.calculatorUrl
            ? `https://www.hyundai.com${baseModelAdditional.calculatorUrl}`
            : null,
          isNPerformance: variantName.includes(' N ') || variantName.endsWith(' N'),
          order: index + 10, // Offset to sort after main models
          variantId: vg.id || `variant-${variantSlug}`,
          fuelType: fuelType,
          hasOffer: false,
          isNew: false,
          hideInListing: false,
          baseModelName: baseModelName,
          isVariantGroup: true,
        };

        addToCategory(variantModel, variantCategory, variantCategoryDesc);
        allModels.push(variantModel);
        processedSlugs.add(variantSlug);
      });
    });

    // STEP 4: Add Hybrid variants for models that don't have detailed variant groups
    // These are SUV/sedan models that have Hybrid powertrain options
    const hybridDescription = cpcCategories.get('8FCA4200-978C-42E5-A824-55D4C67FFFD0')?.description ||
      "Hyundai's Hybrid line up where excellent efficiency meets outstanding performance.";
    
    // Models that have Hybrid variants (from displayPowertrain flag + known hybrids)
    const hybridModels = ['KONA', 'TUCSON', 'SANTA FE', 'PALISADE'];
    
    hybridModels.forEach((baseName, index) => {
      const hybridName = `${baseName} Hybrid`;
      const hybridSlug = hybridName.toLowerCase().replace(/\s+/g, '-');
      
      // Skip if already added (e.g., from detailed variant groups)
      if (processedSlugs.has(hybridSlug)) return;

      // Find base model to get pricing info
      const baseModel = allModels.find(m => m.name.toUpperCase() === baseName.toUpperCase());
      
      const hybridModel = {
        id: `hybrid-${hybridSlug}`,
        modelId: `hybrid-${hybridSlug}`,
        name: hybridName,
        slug: hybridSlug,
        category: 'Hybrid',
        categoryDescription: hybridDescription,
        image: getImageUrl(hybridName, undefined),
        mobileImage: getImageUrl(hybridName, undefined),
        desktopImage: getImageUrl(hybridName, undefined),
        lowPrice: baseModel?.lowPrice || null,
        highPrice: baseModel?.highPrice || null,
        priceEnabled: baseModel?.priceEnabled || false,
        priceDisclaimer: baseModel?.priceDisclaimer || '',
        modelUrl: baseModel?.modelUrl || null,
        calculatorUrl: baseModel?.calculatorUrl || null,
        isNPerformance: false,
        order: index + 1,
        variantId: `hybrid-${hybridSlug}`,
        fuelType: 'Hybrid',
        hasOffer: false,
        isNew: hybridName.includes('PALISADE') || hybridName.includes('TUCSON'),
        hideInListing: false,
        baseModelSlug: baseName.toLowerCase().replace(/\s+/g, '-'),
      };

      addToCategory(hybridModel, 'Hybrid', hybridDescription);
      allModels.push(hybridModel);
      processedSlugs.add(hybridSlug);
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
});
