/**
 * GET /api/search
 * Searches vehicles from the carsales feed
 * Uses cached data from /api/carsales-feed (server-side, no HTTP call)
 */

import { getTenantForwardHeaders } from '../utils/tenant-headers';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  try {
    // Use internal $fetch which leverages Nitro's route caching
    // This doesn't make an HTTP call - it calls the handler directly
    const feedResponse = await $fetch<{ vehiclesData: any[]; filters: any[] }>('/api/carsales-feed', {
      headers: getTenantForwardHeaders(event),
    });

    if (!feedResponse) {
      console.error('[Search API] No response from carsales-feed');
      return {
        success: false,
        vehicles: [],
        total: 0,
        page: 1,
        limit: 24,
        facets: {},
        error: 'No response from feed',
      };
    }

    let vehicles = feedResponse.vehiclesData || [];

    // Helper function to extract numeric price
    const getPrice = (vehicle: any): number => {
      const price = vehicle.price;
      if (!price) return 0;
      if (typeof price === 'number') return price;
      if (typeof price === 'string') {
        const parsed = parseFloat(price.replace(/[^0-9.-]+/g, ''));
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    // Helper function to extract numeric year
    const getYear = (vehicle: any): number => {
      if (vehicle.year?.value?.[0]) {
        const year = parseInt(String(vehicle.year.value[0]));
        return isNaN(year) ? 0 : year;
      }
      if (vehicle.year?.displayValue?.[0]) {
        const year = parseInt(String(vehicle.year.displayValue[0]));
        return isNaN(year) ? 0 : year;
      }
      if (typeof vehicle.year === 'number') return vehicle.year;
      if (typeof vehicle.year === 'string') {
        const year = parseInt(vehicle.year);
        return isNaN(year) ? 0 : year;
      }
      return vehicle.releaseyear ? parseInt(String(vehicle.releaseyear)) || 0 : 0;
    };
    
    // =================================================================
    // FACETED SEARCH LOGIC (E-commerce Vehicle Search Style)
    // =================================================================
    // Hierarchical: Make -> Model -> Badge
    // - Same level selections are OR'd (Ford OR Hyundai)
    // - Different levels are AND'd but scoped to their parent
    // 
    // With makeModels and modelBadges associations:
    // - makeModels: "ford:ranger,hyundai:venue" tells us Ranger is under Ford
    // - modelBadges: "venue:elite" tells us Elite badge is under Venue
    //
    // Example: make=ford,hyundai & model=ranger & badge=elite & makeModels=ford:ranger & modelBadges=venue:elite
    // This is INVALID - elite is for venue but venue isn't selected
    // 
    // Example: make=ford,hyundai & model=ranger,venue & badge=elite & makeModels=ford:ranger,hyundai:venue & modelBadges=venue:elite
    // Result: All Ford Rangers + Only Hyundai Venue Elite
    // =================================================================
    
    // Apply condition filter
    if (query.condition) {
      const conditions = String(query.condition).split(',').map(c => c.toLowerCase().trim());
      vehicles = vehicles.filter(vehicle => {
        const vehicleConditions = vehicle.condition?.value || [];
        return vehicleConditions.some((vc: string) => 
          conditions.some(c => vc.toLowerCase().includes(c))
        );
      });
    }
    
    // Parse all filter parameters
    const makes = query.make ? String(query.make).split(',').map(m => m.toLowerCase().trim()) : [];
    const models = query.model ? String(query.model).split(',').map(m => m.toLowerCase().trim()) : [];
    const badges = query.badge ? String(query.badge).split(',').map(b => b.toLowerCase().trim()) : [];
    
    // Parse hierarchical associations
    // makeModels format: "ford:ranger,ford:f-150,hyundai:venue"
    const makeModelsMap = new Map<string, Set<string>>(); // make -> set of models
    const modelToMake = new Map<string, string>(); // model -> make
    if (query.makeModels) {
      String(query.makeModels).split(',').forEach(assoc => {
        const [make, model] = assoc.split(':').map(s => s.toLowerCase().trim());
        if (make && model) {
          if (!makeModelsMap.has(make)) makeModelsMap.set(make, new Set());
          makeModelsMap.get(make)!.add(model);
          modelToMake.set(model, make);
        }
      });
    }
    
    // modelBadges format: "venue:elite,ranger:xlt"
    const modelBadgesMap = new Map<string, Set<string>>(); // model -> set of badges
    const badgeToModel = new Map<string, string>(); // badge -> model
    if (query.modelBadges) {
      String(query.modelBadges).split(',').forEach(assoc => {
        const [model, badge] = assoc.split(':').map(s => s.toLowerCase().trim());
        if (model && badge) {
          if (!modelBadgesMap.has(model)) modelBadgesMap.set(model, new Set());
          modelBadgesMap.get(model)!.add(badge);
          badgeToModel.set(badge, model);
        }
      });
    }
    
    // Helper to get vehicle's make/model/badge
    const getVehicleMake = (vehicle: any): string => {
      const directMake = vehicle.make?.value?.[0] || vehicle.make?.displayValue?.[0] || '';
      if (directMake) return directMake.toLowerCase();
      const displayMakes = vehicle.model?.displayMake || [];
      for (const makeObj of displayMakes) {
        if (makeObj?.displayValue?.[0]) return makeObj.displayValue[0].toLowerCase();
      }
      return '';
    };
    
    const getVehicleModel = (vehicle: any): string => {
      // Use model.value (slug format with hyphens) for matching against URL params
      // Fall back to displayValue if value is not available
      return (vehicle.model?.value?.[0] || vehicle.model?.displayValue?.[0] || '').toLowerCase();
    };
    
    const getVehicleBadge = (vehicle: any): string => {
      return (vehicle.badge?.value?.[0] || vehicle.badge?.displayValue?.[0] || '').toLowerCase();
    };
    
    // Apply faceted filtering if any make/model/badge filters are set
    if (makes.length > 0 || models.length > 0 || badges.length > 0) {
      vehicles = vehicles.filter(vehicle => {
        const vMake = getVehicleMake(vehicle);
        const vModel = getVehicleModel(vehicle);
        const vBadge = getVehicleBadge(vehicle);
        
        // CASE 1: No make filter - just filter by model/badge
        if (makes.length === 0) {
          if (models.length === 0) {
            return badges.length === 0 || badges.some(b => vBadge.includes(b));
          }
          const matchesModel = models.some(m => vModel.includes(m));
          if (!matchesModel) return false;
          if (badges.length === 0) return true;
          
          // Check if this model has badge requirements
          const modelBadges = modelBadgesMap.get(vModel);
          if (modelBadges && modelBadges.size > 0) {
            return [...modelBadges].some(b => vBadge.includes(b));
          }
          return true; // Model selected but no badge requirement for it
        }
        
        // CASE 2: Make filter exists
        const matchesMake = makes.some(m => vMake.includes(m));
        if (!matchesMake) return false;
        
        // Check if this make has any model filters
        const modelsForThisMake = makeModelsMap.get(vMake);
        
        if (!modelsForThisMake || modelsForThisMake.size === 0) {
          // This make has NO model filter - show all vehicles of this make
          // Unless there's a badge filter that applies globally
          if (badges.length === 0) return true;
          // Check if any badge is selected that could apply
          return badges.some(b => vBadge.includes(b));
        }
        
        // This make HAS model filters - check if vehicle's model is one of them
        const matchesModelForMake = [...modelsForThisMake].some(m => vModel.includes(m));
        if (!matchesModelForMake) return false;
        
        // Vehicle matches make AND model. Check badge requirements.
        if (badges.length === 0) return true;
        
        // Check if this specific model has badge requirements
        const badgesForThisModel = modelBadgesMap.get(vModel);
        if (!badgesForThisModel || badgesForThisModel.size === 0) {
          // This model has NO badge filter - show all vehicles of this model
          return true;
        }
        
        // This model HAS badge filters - vehicle must match one
        return [...badgesForThisModel].some(b => vBadge.includes(b));
      });
    }
    
    if (query.body) {
      const bodies = String(query.body).split(',').map(b => b.toLowerCase().trim());
      vehicles = vehicles.filter(vehicle => {
        const vehicleBodies = vehicle.body?.value || [];
        return vehicleBodies.some((vb: string) => 
          bodies.some(b => vb.toLowerCase().includes(b))
        );
      });
    }
    
    if (query.transmission) {
      const transmissions = String(query.transmission).split(',').map(t => t.toLowerCase().trim());
      vehicles = vehicles.filter(vehicle => {
        const vehicleTransmissions = vehicle.transmission?.value || [];
        return vehicleTransmissions.some((vt: string) => 
          transmissions.some(t => vt.toLowerCase().includes(t))
        );
      });
    }
    
    if (query.fuelType || query.fuel) {
      const fuelType = String(query.fuelType || query.fuel).toLowerCase();
      vehicles = vehicles.filter(vehicle => {
        const vehicleFuels = vehicle.fuel?.value || [];
        return vehicleFuels.some((vf: string) => vf.toLowerCase().includes(fuelType));
      });
    }
    
    if (query.colour) {
      const colours = String(query.colour).split(',').map(c => c.toLowerCase().trim());
      vehicles = vehicles.filter(vehicle => {
        const vehicleColours = vehicle.colour?.value || [];
        return vehicleColours.some((vc: string) => 
          colours.some(c => vc.toLowerCase().includes(c))
        );
      });
    }

    if (query.minPrice) {
      const minPrice = parseInt(String(query.minPrice));
      if (!isNaN(minPrice)) {
        vehicles = vehicles.filter(vehicle => getPrice(vehicle) >= minPrice);
      }
    }

    if (query.maxPrice) {
      const maxPrice = parseInt(String(query.maxPrice));
      if (!isNaN(maxPrice)) {
        vehicles = vehicles.filter(vehicle => getPrice(vehicle) <= maxPrice);
      }
    }

    if (query.minYear) {
      const minYear = parseInt(String(query.minYear));
      if (!isNaN(minYear)) {
        vehicles = vehicles.filter(vehicle => getYear(vehicle) >= minYear);
      }
    }

    if (query.maxYear) {
      const maxYear = parseInt(String(query.maxYear));
      if (!isNaN(maxYear)) {
        vehicles = vehicles.filter(vehicle => getYear(vehicle) <= maxYear);
      }
    }
    
    if (query.minOdometer || query.minKms) {
      const minKms = parseInt(String(query.minOdometer || query.minKms));
      vehicles = vehicles.filter(vehicle => (vehicle.kms || 0) >= minKms);
    }
    
    if (query.maxOdometer || query.maxKms) {
      const maxKms = parseInt(String(query.maxOdometer || query.maxKms));
      vehicles = vehicles.filter(vehicle => (vehicle.kms || 0) <= maxKms);
    }
    
    if (query.keyword || query.q) {
      const keyword = String(query.keyword || query.q).toLowerCase();
      vehicles = vehicles.filter(vehicle => {
        const title = vehicle.title?.toLowerCase() || '';
        const make = vehicle.model?.displayMake?.map((m: any) => 
          m?.displayValue?.join(' ') || ''
        ).join(' ').toLowerCase() || '';
        const model = vehicle.model?.displayValue?.join(' ').toLowerCase() || '';
        const badge = vehicle.badge?.value?.join(' ').toLowerCase() || '';
        return title.includes(keyword) || make.includes(keyword) || 
               model.includes(keyword) || badge.includes(keyword);
      });
    }
    
    // Apply sorting
    const sortBy = String(query.sort || 'price-asc');
    const sortOrder = query.order || (sortBy.includes('desc') ? 'desc' : 'asc');

    // Helper to check if vehicle is "new" condition
    const isNewCondition = (vehicle: any): boolean => {
      const conditions = vehicle.condition?.value || [];
      return conditions.some((c: string) => c.toLowerCase().includes('new'));
    };

    vehicles.sort((a, b) => {
      let aVal: any, bVal: any;

      if (sortBy.includes('price')) {
        aVal = getPrice(a);
        bVal = getPrice(b);

        // POA vehicles (price = 0) should always sort to the end
        const aIsPOA = aVal === 0;
        const bIsPOA = bVal === 0;
        if (aIsPOA && !bIsPOA) return 1;  // a is POA, push to end
        if (!aIsPOA && bIsPOA) return -1; // b is POA, push to end
        if (aIsPOA && bIsPOA) return 0;   // both POA, keep order

        // New vehicles should appear before used vehicles
        const aIsNew = isNewCondition(a);
        const bIsNew = isNewCondition(b);
        if (aIsNew && !bIsNew) return -1; // a is new, comes first
        if (!aIsNew && bIsNew) return 1;  // b is new, comes first
      } else if (sortBy.includes('year')) {
        aVal = getYear(a);
        bVal = getYear(b);
      } else if (sortBy.includes('kms') || sortBy.includes('odometer')) {
        aVal = a.kms || 0;
        bVal = b.kms || 0;
      } else {
        aVal = a.title || '';
        bVal = b.title || '';
      }

      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });
    
    // Pagination
    const page = parseInt(String(query.page || 1));
    const limit = parseInt(String(query.limit || 24));
    const total = vehicles.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedVehicles = vehicles.slice(start, end);

    return {
      success: true,
      vehicles: paginatedVehicles,
      total,
      page,
      limit,
      facets: {},
    };
  } catch (error: any) {
    console.error('[Search API] Error:', error.message);
    
    // Return empty results instead of error for search
    return {
      success: false,
      vehicles: [],
      total: 0,
      page: 1,
      limit: 24,
      facets: {},
      error: error.message,
    };
  }
});







