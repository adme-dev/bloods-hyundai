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
    // Fetch from Hyundai car price calculator API
    const apiUrl = `https://www.hyundai.com/content/api/au/hyundai/v3/carpricecalculator?postcode=${postcode}&modelname=${modelname.toLowerCase()}&displaypowertrain=${displaypowertrain}`;
    
    // Also fetch modeladditional API to get priceDisclaimer
    const modelAdditionalUrl = 'https://www.hyundai.com/content/api/au/hyundai/pcm1/v1/modeladditional';
    
    console.log('[Calculator API] Fetching:', apiUrl);
    
    const [response, modelAdditionalResponse] = await Promise.all([
      $fetch<any>(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        timeout: 20000,
      }).catch((err: any) => {
        console.error('[Calculator API] Error fetching carpricecalculator:', err.message);
        throw err;
      }),
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
    
    console.log('[Calculator API] Raw response type:', Array.isArray(response) ? 'array' : typeof response);
    console.log('[Calculator API] Response length:', Array.isArray(response) ? response.length : 'N/A');
    
    const data = Array.isArray(response) ? response : (response ? [response] : []);
    
    // Find the matching model in modeladditional for priceDisclaimer
    const modelAdditionalData = Array.isArray(modelAdditionalResponse) ? modelAdditionalResponse : [];
    const matchingModel = modelAdditionalData.find((m: any) => {
      const modelName = (m.model?.model || '').toLowerCase().replace(/^20\d{2}\s+/, '').replace(/\s+/g, '-');
      return modelName.includes(modelname.toLowerCase()) || modelname.toLowerCase().includes(modelName);
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
    const modelData = data[0];
    
    if (!modelData) {
      console.error('[Calculator API] modelData is null or undefined');
      throw createError({
        statusCode: 500,
        message: 'Invalid data structure returned from API',
      });
    }
    
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
        image: group.image ? `https://www.hyundai.com${group.image}` : null,
        lowestPrice: group.lowestVariantPrice,
        priceEnabled: group.priceEnabled,
        powertrain: powertrain,
        // SmartSense info
        smartSenseIncluded: group.smartSenseIncluded,
        smartSenseIsOptional: group.smartSenseIsOptional,
        smartSenseDescription: group.smartSenseDescription,
        smartSenseDisclaimer: group.smartSenseDisclaimer,
        smartSenseImage: group.smartSenseImage ? `https://www.hyundai.com${group.smartSenseImage}` : null,
        features: group.features || [],
        optionPacks: (group.optionPacks || []).map((pack: any) => ({
          id: pack.id,
          optionPackId: pack.optionPackId,
          name: pack.name,
          title: pack.title,
          description: pack.description || pack.modalContent,
          modalImage: pack.modalImage ? `https://www.hyundai.com${pack.modalImage}` : null,
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
        image: colour.image ? `https://www.hyundai.com${colour.image}` : null,
        swatch: colour.swatch ? `https://www.hyundai.com${colour.swatch}` : null,
        isDefault: colour.isDefault,
        soldOut: colour.soldOut,
        trims: (colour.trims || []).map((trim: any) => ({
          id: trim.id,
          name: trim.name,
          code: trim.code,
          price: trim.price,
          swatch: trim.swatch ? `https://www.hyundai.com${trim.swatch}` : null,
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
              groupImage = firstColour.image.startsWith('http') 
                ? firstColour.image 
                : `https://www.hyundai.com${firstColour.image}`;
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
              existingGroup.image = firstColour.image.startsWith('http') 
                ? firstColour.image 
                : `https://www.hyundai.com${firstColour.image}`;
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
              group.image = firstColour.image.startsWith('http') 
                ? firstColour.image 
                : `https://www.hyundai.com${firstColour.image}`;
            }
          }
        }
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




