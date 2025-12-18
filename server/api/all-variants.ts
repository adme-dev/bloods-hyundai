/**
 * API route to get all Hyundai vehicle variants
 * Fetches directly from Hyundai Australia API
 * Also includes "Coming Soon" vehicles from RYI (Register Your Interest) pages
 * Replaces: src/functions/get-all-variants.js
 */
export default defineEventHandler(async (event) => {
  try {
    // Fetch models from Hyundai Australia API and coming soon vehicles in parallel
    const [modelsData, comingSoonResponse] = await Promise.all([
      $fetch<any[]>(
        'https://www.hyundai.com/content/api/au/hyundai/pcm1/v1/modeladditional',
        { timeout: 20000 }
      ),
      $fetch<any>('/api/coming-soon-vehicles', { timeout: 15000 }).catch((err: Error) => {
        console.warn('[API] Failed to fetch coming soon vehicles:', err.message);
        return { success: false, vehicles: [] };
      }),
    ]);

    if (!modelsData || !Array.isArray(modelsData)) {
      return {
        success: false,
        error: 'Unexpected API response format',
        variants: [],
        groupedByCategory: {},
      };
    }

    const groupedByCategory: Record<string, any> = {};
    const allModels: any[] = [];

    modelsData.forEach((modelData: any) => {
      const modelName = modelData.model?.model || 'Unknown';
      if (modelName === 'Merchandise' || modelName === 'Unknown') return;

      const categoryName = modelData.primaryCategory?.name || 'All';
      const categoryDescription = modelData.primaryCategory?.description || '';

      const model = {
        id: modelData.id,
        modelId: modelData.modelId,
        name: modelName,
        slug: modelName.toLowerCase().replace(/\s+/g, '-'),
        category: categoryName,
        categoryDescription: categoryDescription,
        image: modelData.desktopImageUrl
          ? `https://www.hyundai.com${modelData.desktopImageUrl}`
          : modelData.mobileImageUrl
            ? `https://www.hyundai.com${modelData.mobileImageUrl}`
            : null,
        mobileImage: modelData.mobileImageUrl
          ? `https://www.hyundai.com${modelData.mobileImageUrl}`
          : null,
        desktopImage: modelData.desktopImageUrl
          ? `https://www.hyundai.com${modelData.desktopImageUrl}`
          : null,
        lowPrice: modelData.lowPrice,
        highPrice: modelData.highPrice,
        priceEnabled: modelData.priceEnabled,
        priceDisclaimer: modelData.priceDisclaimer,
        modelUrl: modelData.modelUrl
          ? `https://www.hyundai.com${modelData.modelUrl}`
          : null,
        calculatorUrl: modelData.calculatorUrl
          ? `https://www.hyundai.com${modelData.calculatorUrl}`
          : null,
        isNPerformance: modelData.isNPerformance || false,
        order: modelData.order || 999,
        variantId: modelData.modelId,
        fuelType: categoryName === 'Electric' ? 'Electric' :
                  categoryName === 'Hybrid' ? 'Hybrid' : 'Petrol',
        hasOffer: false,
        isNew: modelName.includes('2025') || modelName.includes('INSTER'),
      };

      if (!groupedByCategory[categoryName]) {
        groupedByCategory[categoryName] = {
          name: categoryName,
          description: categoryDescription,
          models: []
        };
      }
      groupedByCategory[categoryName].models.push(model);
      allModels.push(model);
    });

    // Sort models within each category by order
    Object.values(groupedByCategory).forEach((category: any) => {
      category.models.sort((a: any, b: any) => a.order - b.order);
    });

    // Sort all models by order
    allModels.sort((a, b) => a.order - b.order);

    // Add Coming Soon vehicles if available
    const comingSoonVehicles = comingSoonResponse?.vehicles || [];
    if (comingSoonVehicles.length > 0) {
      // Get existing slugs to avoid duplicates
      const existingSlugs = new Set(allModels.map((m: any) => m.slug));

      const comingSoonModels: any[] = [];
      comingSoonVehicles.forEach((vehicle: any, index: number) => {
        // Skip if already exists in regular models
        if (existingSlugs.has(vehicle.slug)) return;

        const model = {
          id: vehicle.id || `coming-soon-${vehicle.slug}`,
          modelId: vehicle.id,
          name: vehicle.name,
          slug: vehicle.slug,
          category: 'Coming Soon',
          categoryDescription: 'Register your interest in these upcoming vehicles',
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
          form: true, // Triggers Register Interest form on vehicle page
          tagline: vehicle.tagline,
        };

        comingSoonModels.push(model);
        allModels.push(model);
      });

      // Add Coming Soon category if we have vehicles
      if (comingSoonModels.length > 0) {
        groupedByCategory['Coming Soon'] = {
          name: 'Coming Soon',
          description: 'Register your interest in these upcoming vehicles',
          models: comingSoonModels,
        };
      }
    }

    // Get category names sorted - Coming Soon at the end before All
    const categoryOrder = ['Electric', 'Hybrid', 'SUVs and People Movers', 'Performance', 'Hatch & Sedans', 'Runout', 'Coming Soon', 'All'];
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








