/**
 * GET /api/carsales-feed
 * Fetches vehicle listings and filter data from Supabase
 *
 * Features:
 * - 10-minute server-side cache (hidden from browser network tab when using SSR)
 * - Automatic cache invalidation
 * - Stale-while-revalidate for better performance
 */

// Helper functions
const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
const roundToTen = (num: number) => Math.round(num / 10) * 10;

function calculateWeeklyPayment(price: number, annualInterestRate = 9.8, loanTermYears = 5) {
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const loanTermMonths = loanTermYears * 12;
  const i = Math.pow(1 + monthlyInterestRate, loanTermMonths);
  const payment = i !== 1 ? (price * monthlyInterestRate * i) / (i - 1) : 0;
  return (payment * 12) / 52;
}

function createFiltersFromVehicles(vehicles: any[]) {
  const filterData = {
    conditions: new Map(),
    models: new Map(),
    badges: new Set(),
    colours: new Map(),
    bodyTypes: new Map(),
    transmissions: new Map(),
    drivetrains: new Map(),
    fuels: new Map(),
    seats: new Map(),
    doors: new Map(),
    priceRange: { min: Number.MAX_SAFE_INTEGER, max: 0 },
    kmsRange: { min: Number.MAX_SAFE_INTEGER, max: 0 }
  };

  for (const vehicle of vehicles) {
    filterData.priceRange.max = Math.max(filterData.priceRange.max, vehicle.price || 0);
    filterData.priceRange.min = Math.min(filterData.priceRange.min, vehicle.price || 0);
    filterData.kmsRange.max = Math.max(filterData.kmsRange.max, vehicle.kms || 0);
    filterData.kmsRange.min = Math.min(filterData.kmsRange.min, vehicle.kms || 0);

    vehicle.condition?.value?.forEach((val: string) => filterData.conditions.set(val, true));
    vehicle.body?.value?.forEach((val: string) => filterData.bodyTypes.set(val, true));
    vehicle.transmission?.value?.forEach((val: string) => filterData.transmissions.set(val, true));
    vehicle.drivetrain?.value?.forEach((val: string) => filterData.drivetrains.set(val, true));
    vehicle.fuel?.value?.forEach((val: string) => filterData.fuels.set(val, true));
    vehicle.seats?.value?.forEach((val: string) => filterData.seats.set(val, true));
    vehicle.doors?.value?.forEach((val: string) => filterData.doors.set(val, true));
    vehicle.colour?.value?.forEach((colour: string) => filterData.colours.set(capitalize(colour), true));
    vehicle.badge?.value?.forEach((val: string) => filterData.badges.add(val));

    vehicle.model?.value?.forEach((value: string, index: number) => {
      const modelKey = JSON.stringify({
        value,
        displayValue: vehicle.model.displayValue?.[index],
        displayMake: vehicle.model.displayMake?.[index]?.displayValue?.[0],
        displayBody: vehicle.model.displayBody?.[index]
      });
      filterData.models.set(modelKey, true);
    });
  }

  const minWeeklyPayment = calculateWeeklyPayment(filterData.priceRange.min);
  const maxWeeklyPayment = calculateWeeklyPayment(filterData.priceRange.max);

  return [
    { name: "condition", displayName: "Condition", type: "checkbox", data: Array.from(filterData.conditions.keys()).map(value => ({ value, displayValue: capitalize(value as string) })) },
    { name: "model", displayName: "Models", type: "multiselect", data: Array.from(filterData.models.keys()).map(json => JSON.parse(json as string)) },
    { name: "badge", displayName: "Badges", type: "checkbox", data: Array.from(filterData.badges).sort().map(value => ({ value: value || "", displayValue: value ? capitalize(value as string) : "Select a badge" })) },
    { name: "colour", displayName: "Colour", type: "checkbox", data: Array.from(filterData.colours.keys()).map(colour => ({ value: (colour as string).toLowerCase(), displayValue: colour })) },
    { name: "price", displayName: "Budget", type: "slider", data: { max: filterData.priceRange.max, min: filterData.priceRange.min, step: 500 } },
    { name: "perweek", displayName: "Per week budget", type: "slider", data: { min: roundToTen(minWeeklyPayment), max: roundToTen(maxWeeklyPayment), step: 10 } },
    { name: "kms", displayName: "Kilometres", type: "slider", data: { max: filterData.kmsRange.max, min: filterData.kmsRange.min, step: 1000 } },
    { name: "body", displayName: "Body", type: "checkbox", data: Array.from(filterData.bodyTypes.keys()).map(value => ({ value, displayValue: capitalize(value as string) })) },
    { name: "transmission", displayName: "Transmission", type: "checkbox", data: Array.from(filterData.transmissions.keys()).map(value => ({ value: value || "", displayValue: value ? capitalize(value as string) : "Undefined" })) },
    { name: "drivetrain", displayName: "Drive Train", type: "checkbox", data: Array.from(filterData.drivetrains.keys()).map(value => ({ value: value || "", displayValue: value || "Undefined" })) },
    { name: "fuel", displayName: "Fuel Type", type: "checkbox", data: Array.from(filterData.fuels.keys()).map(value => ({ value: value || "", displayValue: value || "Undefined" })) },
    { name: "seats", displayName: "Seating Capacity", type: "checkbox", data: Array.from(filterData.seats.keys()).map(value => ({ value: value || "", displayValue: value || "Undefined" })) },
  ];
}

// Cache configuration
const CACHE_MAX_AGE = 60 * 10; // 10 minutes
const CACHE_STALE_MAX_AGE = 60 * 30; // Serve stale for 30 minutes while revalidating

export default defineCachedEventHandler(async (event) => {
  // Supabase data URLs
  const urls = [
    'https://tsheefvkecaervnrxvdf.supabase.co/storage/v1/object/public/bucket/blood-hyundai/data.json',
    'https://tsheefvkecaervnrxvdf.supabase.co/storage/v1/object/public/bucket/blood-motor-group/data.json',
    'https://tsheefvkecaervnrxvdf.supabase.co/storage/v1/object/public/bucket/geelong-mazda/data.json'
  ];

  try {
    console.log('[Carsales Feed] Fetching from URLs:', urls);
    
    const responses = await Promise.all(
      urls.map(async (url, index) => {
        try {
          // Fetch the raw response
          const rawResponse = await $fetch<string>(url, { 
            timeout: 10000,
            responseType: 'text'
          });
          
          // Parse JSON manually
          let data: any;
          try {
            data = typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;
          } catch (parseError: any) {
            console.error(`[Carsales Feed] URL ${index}: Failed to parse JSON:`, parseError.message);
            console.error(`[Carsales Feed] URL ${index}: Response sample:`, rawResponse?.substring(0, 500));
            return [];
          }
          
          if (!Array.isArray(data)) {
            console.error(`[Carsales Feed] URL ${index} (${url}): Response is not an array, type: ${typeof data}`);
            if (data && typeof data === 'object') {
              console.error(`[Carsales Feed] URL ${index}: Response keys:`, Object.keys(data));
            }
            return [];
          }
          
          console.log(`[Carsales Feed] URL ${index} (${url}): Success, received ${data.length} vehicles`);
          return data;
        } catch (error: any) {
          console.error(`[Carsales Feed] URL ${index} (${url}): Error -`, error.message);
          return [];
        }
      })
    );

    console.log('[Carsales Feed] Received responses:', responses.map(r => Array.isArray(r) ? r.length : 'not array'));

    const uniqueIds = new Set();
    const vehicles: any[] = [];

    responses.forEach((data, urlIndex) => {
      if (!Array.isArray(data)) {
        console.log('[Carsales Feed] Response is not an array:', typeof data);
        return;
      }
      
      // Determine if this is the "new-cars" bucket (index 1) or "used" bucket (index 0)
      const isNewCarsBucket = urlIndex === 1;
      console.log(`[Carsales Feed] Processing bucket ${urlIndex} (${isNewCarsBucket ? 'new-cars' : 'used'}): ${data.length} vehicles`);
      
      for (const vehicle of data) {
        // Use identifier as the unique ID (not vehicle.id)
        const vehicleId = vehicle.identifier || vehicle.id || vehicle.stockid;
        if (!vehicleId) {
          console.warn('[Carsales Feed] Vehicle missing ID:', vehicle.title || vehicle.slug);
          continue;
        }
        if (uniqueIds.has(vehicleId)) continue;

        const isHyundai = vehicle.model?.displayMake?.some((makes: any) =>
          makes?.displayValue?.some((make: string) =>
            make?.toLowerCase().includes('hyundai')
          )
        );

        const conditionValues = vehicle.condition?.value || [];
        const isDemo = conditionValues.some((value: string) => value.toLowerCase().includes('demo'));
        const isNew = conditionValues.some((value: string) => value.toLowerCase().includes('new'));
        const isUsed = conditionValues.some((value: string) => value.toLowerCase().includes('used'));

        let shouldIncludeVehicle = false;
        
        // If it's from the "new-cars" bucket, include all vehicles (they're all new/demo inventory)
        if (isNewCarsBucket) {
          shouldIncludeVehicle = true;
        } else {
          // For the "used" bucket: Hyundai should be demo/new, others should be used
          if (isHyundai) {
            shouldIncludeVehicle = isDemo || isNew;
          } else {
            shouldIncludeVehicle = isUsed;
          }
        }

        // Debug logging for first few vehicles
        if (vehicles.length < 3) {
          console.log(`[Carsales Feed] Vehicle ${vehicleId}:`, {
            title: vehicle.title,
            isHyundai,
            condition: conditionValues,
            isNewCarsBucket,
            shouldIncludeVehicle,
            isDemo,
            isNew,
            isUsed
          });
        }

        if (shouldIncludeVehicle) {
          uniqueIds.add(vehicleId);
          
          // Ensure stockid is set for easy lookup
          if (!vehicle.stockid) {
            vehicle.stockid = vehicleId;
          }
          
          // Add suburb information if available
          const suburb = vehicle.address?.suburb || "Undefined";
          vehicle.suburb = {
            value: [suburb.toLowerCase()],
            displayValue: [suburb]
          };
          
          // Calculate weekly payment
          vehicle.perweek = Math.round(calculateWeeklyPayment(vehicle.price || 0));
          
          vehicles.push(vehicle);
        }
      }
    });

    // Mark last N vehicles as stock special (TODO: make configurable via admin)
    const stockSpecialCount = 7;
    const startIndex = Math.max(vehicles.length - stockSpecialCount, 0);
    for (let i = startIndex; i < vehicles.length; i++) {
      vehicles[i].stock_special = {
        value: ["stock-special"],
        displayValue: ["STOCK SPECIAL"]
      };
    }

    const filters = createFiltersFromVehicles(vehicles);

    console.log('[Carsales Feed] Returning vehicles:', vehicles.length, 'filters:', filters.length);

    return {
      vehiclesData: vehicles,
      filters,
      _cached: false,
      _timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error('Error fetching carsales feed:', error);
    return {
      vehiclesData: [],
      filters: [],
      _cached: false,
      _timestamp: Date.now(),
    };
  }
}, {
  maxAge: CACHE_MAX_AGE,
  staleMaxAge: CACHE_STALE_MAX_AGE,
  name: 'carsales-feed',
  getKey: () => 'carsales-feed-data',
  shouldBypassCache: (event) => {
    // Allow cache bypass with ?refresh=true query param (for admin use)
    const query = getQuery(event);
    return query.refresh === 'true';
  },
});








