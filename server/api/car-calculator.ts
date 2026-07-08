type CalculatorRouteResolution = {
  apiModelName: string;
  preferredPowertrain?: string;
  preferredVariantGroupName?: string;
  fallbackModelNames?: string[];
};

const knownModelImages: Record<string, string> = {
  'ioniq 6': 'https://www.hyundai.com/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ6_Front34_640x331.png',
  '2023 ioniq 6': 'https://www.hyundai.com/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ6_Front34_640x331.png',
  'ioniq-6': 'https://www.hyundai.com/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ6_Front34_640x331.png',
  'ioniq 5': 'https://www.hyundai.com/content/dam/hyundai/au/en/awards-page/2026/ioniq-5/IONIQ5_Front34_640x331-CarsGuide.png',
  'ioniq-5': 'https://www.hyundai.com/content/dam/hyundai/au/en/awards-page/2026/ioniq-5/IONIQ5_Front34_640x331-CarsGuide.png',
  'ioniq 5 n': 'https://www.hyundai.com/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ5N_Front_Performance_Blue_640x331.png',
  'ioniq-5-n': 'https://www.hyundai.com/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ5N_Front_Performance_Blue_640x331.png',
  'ioniq 9': 'https://www.hyundai.com/content/dam/hyundai/au/en/models/ioniq-9-2025/3-4-images-colors/side-profile/models/IONIQ9-Models_Front34_640x331.png',
  'ioniq-9': 'https://www.hyundai.com/content/dam/hyundai/au/en/models/ioniq-9-2025/3-4-images-colors/side-profile/models/IONIQ9-Models_Front34_640x331.png',
};

const calculatorRouteResolutions: Record<string, CalculatorRouteResolution> = {
  'kona-hybrid': {
    apiModelName: 'kona',
    preferredPowertrain: 'Hybrid',
    preferredVariantGroupName: 'KONA Hybrid',
  },
  'tucson-hybrid': {
    apiModelName: 'tucson',
    preferredPowertrain: 'Hybrid',
    preferredVariantGroupName: 'TUCSON Hybrid',
  },
  'santa-fe-hybrid': {
    apiModelName: 'santa-fe',
    preferredPowertrain: 'Hybrid',
    preferredVariantGroupName: 'SANTA FE Hybrid',
  },
  'palisade-hybrid': {
    apiModelName: 'palisade',
    preferredPowertrain: 'Hybrid',
    preferredVariantGroupName: 'PALISADE Elite (8-seat)',
  },
  'i30-n-line': {
    apiModelName: 'i30',
    preferredVariantGroupName: 'i30 Sedan N Line',
  },
  'i30-sedan': {
    apiModelName: 'i30',
    preferredVariantGroupName: 'i30 Sedan',
  },
  'i30-sedan-n-line': {
    apiModelName: 'i30',
    preferredVariantGroupName: 'i30 Sedan N Line',
  },
  'i30-sedan-hybrid': {
    apiModelName: 'i30',
    preferredPowertrain: 'Hybrid',
    preferredVariantGroupName: 'i30 Sedan Hybrid',
  },
  'ioniq5': {
    apiModelName: 'ioniq-5',
  },
  'ioniq-5': {
    apiModelName: 'ioniq-5',
  },
  'ioniq5-n': {
    apiModelName: 'ioniq-5-n',
    fallbackModelNames: ['ioniq-5'],
  },
  'ioniq-5-n': {
    apiModelName: 'ioniq-5-n',
    fallbackModelNames: ['ioniq-5'],
  },
  'ioniq6': {
    apiModelName: 'ioniq-6',
  },
  'ioniq-6': {
    apiModelName: 'ioniq-6',
  },
  'ioniq6-n': {
    apiModelName: 'ioniq-6',
  },
  'ioniq-6-n': {
    apiModelName: 'ioniq-6',
  },
  'ioniq9': {
    apiModelName: 'ioniq-9',
  },
  'ioniq-9': {
    apiModelName: 'ioniq-9',
  },
};

const normalizeModelSlug = (modelname: string) =>
  modelname.trim().toLowerCase().replace(/^20\d{2}[-_\s]+/i, '');

const normalizeHyundaiAssetUrl = (url?: string | null): string | null => {
  if (!url) return null;
  return url.startsWith('http') ? url : `https://www.hyundai.com${url}`;
};

const getKnownModelImage = (...names: Array<string | null | undefined>): string | null => {
  for (const name of names) {
    if (!name) continue;
    const normalized = normalizeModelSlug(name).replace(/\s+/g, '-');
    const spaced = normalizeModelSlug(name).replace(/-/g, ' ');
    const image = knownModelImages[normalized] || knownModelImages[spaced];
    if (image) return image;
  }
  return null;
};

const getCalculatorRouteResolution = (modelname: string): CalculatorRouteResolution => {
  const slug = normalizeModelSlug(modelname);
  const explicitResolution = calculatorRouteResolutions[slug];

  if (explicitResolution) {
    return explicitResolution;
  }

  const fallbackModelNames = new Set<string>();

  if (slug.endsWith('-hybrid')) {
    fallbackModelNames.add(slug.replace(/-hybrid$/, ''));
  }

  if (slug.includes('-sedan')) {
    fallbackModelNames.add(slug.split('-sedan')[0]);
  }

  return {
    apiModelName: slug,
    fallbackModelNames: Array.from(fallbackModelNames).filter((name) => name && name !== slug),
  };
};

const hasCalculatorInventory = (modelData: any) => {
  return Boolean(
    modelData &&
    ((Array.isArray(modelData.variantGroups) && modelData.variantGroups.length > 0) ||
      (Array.isArray(modelData.variants) && modelData.variants.length > 0))
  );
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  const modelname = (query.modelname || query.model || '') as string;
  const postcode = (query.postcode || '3000') as string;
  const displaypowertrain = (query.displaypowertrain || 'true') as string;

  if (!modelname) {
    throw createError({
      statusCode: 400,
      message: 'Model name is required. Use ?modelname=kona or ?modelname=venue',
    });
  }

  try {
    const routeResolution = getCalculatorRouteResolution(modelname);
    const calculatorModelCandidates = [
      routeResolution.apiModelName,
      ...(routeResolution.fallbackModelNames || []),
    ].filter((candidate, index, candidates) => candidate && candidates.indexOf(candidate) === index);
    let resolvedModelName = routeResolution.apiModelName;

    const fetchCalculatorData = async (apiModelName: string) => {
      const apiUrl = `https://www.hyundai.com/content/api/au/hyundai/v3/carpricecalculator?postcode=${postcode}&modelname=${apiModelName}&displaypowertrain=${displaypowertrain}`;

      console.log('[Calculator API] Fetching:', apiUrl);

      let lastError: any;

      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          return await $fetch<any>(apiUrl, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            },
            timeout: 20000,
          });
        } catch (err: any) {
          lastError = err;
          const statusCode = err?.statusCode || err?.response?.status;
          if (statusCode === 404 || attempt === 2) {
            break;
          }

          console.warn('[Calculator API] carpricecalculator fetch failed, retrying:', {
            model: apiModelName,
            attempt,
            message: err?.message,
          });
          await delay(750);
        }
      }

      console.error('[Calculator API] Error fetching carpricecalculator:', lastError?.message);
      throw lastError;
    };

    // Also fetch modeladditional API to get priceDisclaimer
    const modelAdditionalUrl = 'https://www.hyundai.com/content/api/au/hyundai/pcm1/v1/modeladditional';

    const [initialResponse, modelAdditionalResponse] = await Promise.all([
      fetchCalculatorData(calculatorModelCandidates[0]),
      $fetch<any>(modelAdditionalUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        timeout: 20000,
      }).catch(() => {
        console.warn('[Calculator API] Failed to fetch modeladditional, continuing without it');
        return [];
      }),
    ]);

    let response = initialResponse;
    let data = Array.isArray(response) ? response : (response ? [response] : []);
    let modelData = data[0];

    if (!hasCalculatorInventory(modelData) && calculatorModelCandidates.length > 1) {
      for (const fallbackModelName of calculatorModelCandidates.slice(1)) {
        console.warn('[Calculator API] Empty calculator data for model, trying fallback:', {
          requestedModel: modelname,
          previousModel: resolvedModelName,
          fallbackModel: fallbackModelName,
        });

        response = await fetchCalculatorData(fallbackModelName);
        data = Array.isArray(response) ? response : (response ? [response] : []);
        modelData = data[0];
        resolvedModelName = fallbackModelName;

        if (hasCalculatorInventory(modelData)) {
          break;
        }
      }
    }
    
    console.log('[Calculator API] Raw response type:', Array.isArray(response) ? 'array' : typeof response);
    console.log('[Calculator API] Response length:', Array.isArray(response) ? response.length : 'N/A');
    
    // Find the matching model in modeladditional for priceDisclaimer
    const modelAdditionalData = Array.isArray(modelAdditionalResponse) ? modelAdditionalResponse : [];
    const matchingModel = modelAdditionalData.find((m: any) => {
      const modelName = (m.model?.model || '').toLowerCase().replace(/^20\d{2}\s+/, '').replace(/\s+/g, '-');
      const requestedModelName = normalizeModelSlug(modelname);
      const canUseBroadRequestedMatch = requestedModelName.length >= 4;
      const canUseBroadResolvedMatch = resolvedModelName.length >= 4;

      return modelName.includes(requestedModelName) ||
        (canUseBroadRequestedMatch && requestedModelName.includes(modelName)) ||
        (canUseBroadResolvedMatch && (
          modelName.includes(resolvedModelName) ||
          resolvedModelName.includes(modelName)
        ));
    });
    const priceDisclaimer = matchingModel?.priceDisclaimer || null;

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('[Calculator API] No data returned from API for model:', modelname);
      throw createError({
        statusCode: 404,
        message: `No data found for model: ${modelname}. Please check the model name is correct.`,
      });
    }

    // The API returns an array with one item containing the model data
    if (!modelData) {
      console.error('[Calculator API] modelData is null or undefined');
      throw createError({
        statusCode: 500,
        message: 'Invalid data structure returned from API',
      });
    }

    if (!hasCalculatorInventory(modelData)) {
      console.error('[Calculator API] No calculator inventory returned for model:', {
        requestedModel: modelname,
        resolvedModel: resolvedModelName,
      });
      throw createError({
        statusCode: 404,
        message: `No calculator variants found for model: ${modelname}. Please check the model name is correct.`,
      });
    }

    const modelFallbackImage =
      normalizeHyundaiAssetUrl(matchingModel?.desktopImageUrl || matchingModel?.mobileImageUrl) ||
      getKnownModelImage(modelData.model, resolvedModelName, modelname);
    
    console.log('[Calculator API] Model data received:', {
      model: modelData.model,
      variantGroups: modelData.variantGroups?.length || 0,
      variants: modelData.variants?.length || 0,
    });

    // Process variant groups for easier consumption
    let variantGroups = (modelData.variantGroups || []).map((group: any) => {
      // Determine powertrain based on variant group name or associated engines
      const groupName = (group.name || '').toLowerCase();
      let powertrain = 'Petrol'; // Default
      
      if (groupName.includes('electric') || groupName.includes('ev')) {
        powertrain = 'Electric';
      } else if (groupName.includes('hybrid')) {
        powertrain = 'Hybrid';
      }
      
      // Also check variantEnginesAndTransmissions if available
      const engines = group.variantEnginesAndTransmissions || [];
      if (engines.some((e: string) => e.toLowerCase().includes('electric'))) {
        powertrain = 'Electric';
      } else if (engines.some((e: string) => e.toLowerCase().includes('hybrid'))) {
        powertrain = 'Hybrid';
      }
      
      return {
        id: group.id,
        name: group.name,
        image: normalizeHyundaiAssetUrl(group.image) || modelFallbackImage,
        lowestPrice: group.lowestVariantPrice,
        priceEnabled: group.priceEnabled,
        powertrain: powertrain,
        // SmartSense info
        smartSenseIncluded: group.smartSenseIncluded,
        smartSenseIsOptional: group.smartSenseIsOptional,
        smartSenseDescription: group.smartSenseDescription,
        smartSenseDisclaimer: group.smartSenseDisclaimer,
        smartSenseImage: normalizeHyundaiAssetUrl(group.smartSenseImage),
        features: group.features || [],
        optionPacks: (group.optionPacks || []).map((pack: any) => ({
          id: pack.id,
          optionPackId: pack.optionPackId,
          name: pack.name,
          title: pack.title,
          description: pack.description || pack.modalContent,
          modalImage: normalizeHyundaiAssetUrl(pack.modalImage),
          features: pack.features || [],
          price: pack.price || 0,
          isIntegratedOptionPack: pack.isIntegratedOptionPack,
          optional: pack.optional,
          cpcToggle: pack.cpcToggle,
          disablePriceModel: pack.disablePriceModel,
          variantEnginesAndTransmissions: pack.variantEnginesAndTransmissions || [],
        })),
      };
    });

    // Process variants
    let variants = (modelData.variants || []).map((variant: any) => ({
      id: variant.id,
      name: variant.name,
      variantGroup: variant.variantGroup,
      bodyType: variant.bodyType,
      engineType: variant.engineType,
      fuelType: variant.fuelType,
      transmissionType: variant.transmissionType,
      price: variant.price,
      priceEstimate: variant.priceEstimate,
      isHybrid: variant.isHybrid,
      isElectric: variant.isElectric,
      featuredOffer: variant.featuredOffer,
      soldOut: variant.soldOut,
      isSmartSense: variant.isSmartSense,
      // Pre-paid servicing options
      prePaid: variant.prePaid ? {
        serviceInterval: variant.prePaid.serviceInterval,
        isOverrideCopyForElectric: variant.prePaid.isOverrideCopyForElectric,
        plans: (variant.prePaid.prepaidServicePlanInYears || []).map((plan: any) => ({
          year: plan.year,
          price: plan.price,
        })),
      } : null,
      // Offer packages with disclaimers
      offerPackages: (variant.offerPackages || []).map((pkg: any) => ({
        packageId: pkg.packageId,
        priority: pkg.priority,
        target: pkg.target,
        validFrom: pkg.validFrom,
        validTo: pkg.validTo,
        offers: (pkg.offers || []).map((offer: any) => ({
          offerId: offer.offerId,
          formattedValue: offer.formattedValue,
          title: offer.title,
          subtitle: offer.subtitle,
          body: offer.body,
          type: offer.type,
          disclaimerCitation: offer.disclaimerCitation,
          disclaimer: offer.disclaimer,
          primaryOrSecondaryDisclaimer: offer.primaryOrSecondaryDisclaimer,
          priority: offer.priority,
        })),
      })),
      colours: (variant.colours || []).map((colour: any) => ({
        id: colour.id,
        name: colour.name,
        code: colour.code,
        price: colour.price,
        image: normalizeHyundaiAssetUrl(colour.image),
        swatch: normalizeHyundaiAssetUrl(colour.swatch),
        isDefault: colour.isDefault,
        soldOut: colour.soldOut,
        trims: (colour.trims || []).map((trim: any) => ({
          id: trim.id,
          name: trim.name,
          code: trim.code,
          price: trim.price,
          swatch: normalizeHyundaiAssetUrl(trim.swatch),
          isDefault: trim.isDefault,
        })),
      })),
    }));
    
    // If no variantGroups but we have variants, create variantGroups from variants
    if (variantGroups.length === 0 && variants.length > 0) {
      console.log('[Calculator API] No variantGroups found, creating from variants');
      
      // Group variants by variantGroup name or create individual groups
      const variantGroupsMap = new Map<string, any>();
      
      variants.forEach((variant: any) => {
        // Use variantGroup if available, otherwise use variant name as group name
        const groupName = variant.variantGroup || variant.name || 'All Variants';
        
        if (!variantGroupsMap.has(groupName)) {
          // Determine powertrain from variant
          let powertrain = 'Petrol';
          if (variant.isElectric) {
            powertrain = 'Electric';
          } else if (variant.isHybrid) {
            powertrain = 'Hybrid';
          } else {
            const variantName = (variant.name || '').toLowerCase();
            if (variantName.includes('electric') || variantName.includes('ev')) {
              powertrain = 'Electric';
            } else if (variantName.includes('hybrid')) {
              powertrain = 'Hybrid';
            }
          }
          
          // Try to get an image from the variant's first colour
          let groupImage = null;
          if (variant.colours && variant.colours.length > 0) {
            const firstColour = variant.colours[0];
            if (firstColour.image) {
              groupImage = normalizeHyundaiAssetUrl(firstColour.image);
            }
          }
          
          variantGroupsMap.set(groupName, {
            id: `group-${groupName.replace(/\s+/g, '-').toLowerCase()}`,
            name: groupName,
            image: groupImage,
            lowestPrice: variant.price || variant.priceEstimate || 0,
            priceEnabled: true,
            powertrain: powertrain,
            smartSenseIncluded: variant.isSmartSense || false,
            smartSenseIsOptional: false,
            smartSenseDescription: null,
            smartSenseDisclaimer: null,
            smartSenseImage: null,
            features: [],
            optionPacks: [],
            // Store reference to variants in this group for easier matching
            _variantNames: [variant.name],
          });
        } else {
          // Update lowest price if this variant is cheaper
          const existingGroup = variantGroupsMap.get(groupName);
          const variantPrice = variant.price || variant.priceEstimate || 0;
          if (variantPrice > 0 && (existingGroup.lowestPrice === 0 || variantPrice < existingGroup.lowestPrice)) {
            existingGroup.lowestPrice = variantPrice;
          }
          // Add variant name to the group's variant names list
          if (existingGroup._variantNames && !existingGroup._variantNames.includes(variant.name)) {
            existingGroup._variantNames.push(variant.name);
          }
          // Update image if group doesn't have one yet
          if (!existingGroup.image && variant.colours && variant.colours.length > 0) {
            const firstColour = variant.colours[0];
            if (firstColour.image) {
              existingGroup.image = normalizeHyundaiAssetUrl(firstColour.image);
            }
          }
        }
      });
      
      variantGroups = Array.from(variantGroupsMap.values());
      console.log('[Calculator API] Created', variantGroups.length, 'variantGroups from variants');
      
      // Ensure variants have the variantGroup property set to match the group name
      variants = variants.map((variant: any) => ({
        ...variant,
        variantGroup: variant.variantGroup || variantGroups.find((g: any) => 
          g._variantNames?.includes(variant.name) || g.name === variant.name
        )?.name || variant.name,
      }));
    }
    
    // Backfill images for variant groups that don't have them
    // Find matching variants and use their first colour image
    variantGroups.forEach((group: any) => {
      if (!group.image) {
        // Find variants that belong to this group
        const matchingVariants = variants.filter((v: any) => {
          return v.variantGroup === group.name || 
                 group.name === v.variantGroup ||
                 (group._variantNames && group._variantNames.includes(v.name));
        });
        
        // Get image from first variant's first colour
        if (matchingVariants.length > 0) {
          const firstVariant = matchingVariants[0];
          if (firstVariant.colours && firstVariant.colours.length > 0) {
            const firstColour = firstVariant.colours[0];
            if (firstColour.image) {
              group.image = normalizeHyundaiAssetUrl(firstColour.image);
            }
          }
        }
      }

      if (!group.image && modelFallbackImage) {
        group.image = modelFallbackImage;
      }
    });
    
    // Collect all unique disclaimers from offers
    const allDisclaimers: Array<{ citation: string; text: string }> = [];
    const disclaimerMap = new Map<string, { citation: string; text: string }>();
    
    variants.forEach((variant: any) => {
      (variant.offerPackages || []).forEach((pkg: any) => {
        (pkg.offers || []).forEach((offer: any) => {
          if (offer.disclaimer && offer.disclaimerCitation && !disclaimerMap.has(offer.disclaimerCitation)) {
            disclaimerMap.set(offer.disclaimerCitation, {
              citation: offer.disclaimerCitation,
              text: offer.disclaimer,
            });
          }
        });
      });
    });
    
    disclaimerMap.forEach((value) => allDisclaimers.push(value));
    
    // Collect SmartSense disclaimers from variant groups (deduplicated)
    const smartSenseDisclaimers = new Set<string>();
    variantGroups.forEach((group: any) => {
      if (group.smartSenseDisclaimer) {
        smartSenseDisclaimers.add(group.smartSenseDisclaimer);
      }
    });
    
    // Add SmartSense disclaimer if present (use citation 'S')
    if (smartSenseDisclaimers.size > 0 && !disclaimerMap.has('S')) {
      // Use the first one since they're typically identical
      const smartSenseText = Array.from(smartSenseDisclaimers)[0];
      allDisclaimers.push({
        citation: 'S',
        text: smartSenseText,
      });
    }

    // Get engines and powertrains
    const engines = modelData.engines || [];
    const powertrains = modelData.powertrains || [];
    const categories = modelData.categories || [];

    // Standard disclaimers
    const standardDisclaimers = [
      {
        citation: 'D',
        text: 'Drive away price is based on the postcode provided and includes 12 months registration, stamp duty, CTP insurance, dealer delivery and all on-road costs. Actual price may vary depending on your location and individual circumstances.',
      },
      {
        citation: 'P',
        text: 'Pre-Paid Servicing is valid for the selected period from the date of first registration. Services must be completed at an authorised Hyundai dealer. Terms and conditions apply.',
      },
    ];
    
    // Merge standard disclaimers with offer disclaimers (offer disclaimers take precedence)
    standardDisclaimers.forEach((d) => {
      if (!disclaimerMap.has(d.citation)) {
        allDisclaimers.push(d);
      }
    });

    const result = {
      success: true,
      requestedModel: modelname,
      resolvedModel: resolvedModelName,
      preferredPowertrain: routeResolution.preferredPowertrain || null,
      preferredVariantGroupName: routeResolution.preferredVariantGroupName || null,
      model: modelData.model,
      modelId: modelData.modelId,
      priceEnabled: modelData.priceEnabled,
      displayPowertrain: modelData.displayPowertrain,
      hasNLineOptionPack: modelData.modelHasNLineOptionPackEnabled,
      hasTechnologyOptionPack: modelData.modelHasTechnologyOptionPackEnabled,
      isBlueDrive: modelData.isBlueDrive,
      powertrains: powertrains,
      engines: engines,
      categories: categories,
      modelImage: modelFallbackImage,
      variantGroups: variantGroups,
      variants: variants,
      disclaimers: allDisclaimers,
      priceDisclaimer: priceDisclaimer,
      totalVariants: variants.length,
      totalVariantGroups: variantGroups.length,
    };
    
    console.log('[Calculator API] Returning result:', {
      success: result.success,
      model: result.model,
      variantGroupsCount: result.variantGroups.length,
      variantsCount: result.variants.length,
    });
    
    return result;
  } catch (error: any) {
    console.error('[Calculator API] Error:', error.message);
    
    throw createError({
      statusCode: error.statusCode || error.response?.status || 500,
      message: error.message || 'Failed to fetch calculator data',
    });
  }
});
