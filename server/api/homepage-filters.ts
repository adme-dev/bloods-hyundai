/**
 * GET /api/homepage-filters
 *
 * Lightweight endpoint for homepage filter data.
 * Queries Supabase directly for aggregated filter metadata.
 *
 * Returns ~5KB instead of ~700KB (99% reduction)
 */

import { createClient } from '@supabase/supabase-js';

// Blood Motor Group seller IDs (matches carsales-feed.ts JSON sources)
const SELLER_IDS = {
  BLOOD_HYUNDAI: '49b41e33-6e72-b64d-43a2-7897e61c1bf0',
  BLOOD_MOTOR_GROUP: '646680a2-406b-2430-bde8-761a48e4a2ed', // "new-cars" bucket - include all
  GEELONG_MAZDA: '41bba4aa-6460-dbd6-30f7-7f31dfa5ef61',
};

const ALL_SELLER_IDS = Object.values(SELLER_IDS);

/**
 * Business logic filter - matches carsales-feed.ts logic
 * - Blood Motor Group: include all vehicles
 * - Blood Hyundai / Geelong Mazda:
 *   - Hyundai brand → only Demo or New
 *   - Other brands → only Used
 */
function shouldIncludeVehicle(vehicle: VehicleRow): boolean {
  // Blood Motor Group (new-cars bucket) - include all
  if (vehicle.seller_id === SELLER_IDS.BLOOD_MOTOR_GROUP) {
    return true;
  }

  // For Blood Hyundai and Geelong Mazda buckets
  const isHyundai = vehicle.make?.toLowerCase() === 'hyundai';
  const condition = vehicle.condition?.toLowerCase() || '';
  const isDemo = condition.includes('demo');
  const isNew = condition.includes('new');
  const isUsed = condition.includes('used');

  if (isHyundai) {
    // Hyundai should be demo or new
    return isDemo || isNew;
  } else {
    // Non-Hyundai should be used
    return isUsed;
  }
}

// Weekly payment calculation (matches carsales-feed.ts)
function calculateWeeklyPayment(price: number, annualInterestRate = 9.8, loanTermYears = 5): number {
  if (!price || price <= 0) return 0;
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const loanTermMonths = loanTermYears * 12;
  const i = Math.pow(1 + monthlyInterestRate, loanTermMonths);
  const payment = i !== 1 ? (price * monthlyInterestRate * i) / (i - 1) : 0;
  return Math.round((payment * 12) / 52);
}

const roundToTen = (num: number) => Math.round(num / 10) * 10;
const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

interface VehicleRow {
  seller_id: string;
  condition: string | null;
  make: string | null;
  model: string | null;
  body_style: string | null;
  dap_price: string | null;
  egc_price: string | null;
  transmission: string | null;
  drive: string | null;
  fuel_type: string | null;
  seats: number | null;
  odometer_reading: number | null;
}

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig();

  // Use environment variables for Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL || 'https://tsheefvkecaervnrxvdf.supabase.co';
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseKey) {
    console.error('[homepage-filters] SUPABASE_KEY not configured');
    return { error: 'Database not configured', filters: [] };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query only the fields needed for filters (not photos, descriptions, etc.)
    // Include seller_id for business logic filtering
    const { data: rawVehicles, error } = await supabase
      .from('vehicles')
      .select('seller_id, condition, make, model, body_style, dap_price, egc_price, transmission, drive, fuel_type, seats, odometer_reading')
      .in('seller_id', ALL_SELLER_IDS)
      .neq('sale_status', 'WITHDRAWN');

    if (error) {
      console.error('[homepage-filters] Supabase error:', error);
      return { error: 'Failed to fetch filters', filters: [] };
    }

    if (!rawVehicles || rawVehicles.length === 0) {
      return { filters: [], totalCount: 0 };
    }

    // Apply business logic filter (matches carsales-feed.ts)
    const vehicles = (rawVehicles as VehicleRow[]).filter(shouldIncludeVehicle);

    // Aggregate filter data
    const conditions = new Map<string, number>();
    const makes = new Map<string, { count: number; models: Map<string, number> }>();
    const bodyTypes = new Map<string, number>();
    const transmissions = new Map<string, number>();
    const drivetrains = new Map<string, number>();
    const fuelTypes = new Map<string, number>();
    const seats = new Map<string, number>();

    let minPrice = Number.MAX_SAFE_INTEGER;
    let maxPrice = 0;
    let minKms = Number.MAX_SAFE_INTEGER;
    let maxKms = 0;

    for (const v of vehicles) {
      // Condition counts
      if (v.condition) {
        const cond = v.condition.toLowerCase();
        conditions.set(cond, (conditions.get(cond) || 0) + 1);
      }

      // Make/Model counts
      if (v.make) {
        const makeLower = v.make.toLowerCase();
        if (!makes.has(makeLower)) {
          makes.set(makeLower, { count: 0, models: new Map() });
        }
        const makeData = makes.get(makeLower)!;
        makeData.count++;

        if (v.model) {
          makeData.models.set(v.model, (makeData.models.get(v.model) || 0) + 1);
        }
      }

      // Body type counts
      if (v.body_style) {
        const body = v.body_style.toLowerCase();
        bodyTypes.set(body, (bodyTypes.get(body) || 0) + 1);
      }

      // Transmission counts
      if (v.transmission) {
        const trans = v.transmission.toLowerCase();
        transmissions.set(trans, (transmissions.get(trans) || 0) + 1);
      }

      // Drivetrain counts
      if (v.drive) {
        const drive = v.drive.toLowerCase();
        drivetrains.set(drive, (drivetrains.get(drive) || 0) + 1);
      }

      // Fuel type counts
      if (v.fuel_type) {
        const fuel = v.fuel_type.toLowerCase();
        fuelTypes.set(fuel, (fuelTypes.get(fuel) || 0) + 1);
      }

      // Seats counts
      if (v.seats) {
        const seatStr = String(v.seats);
        seats.set(seatStr, (seats.get(seatStr) || 0) + 1);
      }

      // Price range
      const price = parseInt(v.dap_price || v.egc_price || '0') || 0;
      if (price > 0) {
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      }

      // Kms range
      if (v.odometer_reading && v.odometer_reading > 0) {
        minKms = Math.min(minKms, v.odometer_reading);
        maxKms = Math.max(maxKms, v.odometer_reading);
      }
    }

    // Calculate weekly payment range
    const minWeekly = calculateWeeklyPayment(minPrice);
    const maxWeekly = calculateWeeklyPayment(maxPrice);

    // Build response in format expected by FrontSearch
    const filters = [
      {
        name: 'condition',
        displayName: 'Condition',
        type: 'checkbox',
        data: Array.from(conditions.entries()).map(([value, count]) => ({
          value,
          displayValue: capitalize(value),
          count
        }))
      },
      {
        name: 'model',
        displayName: 'Models',
        type: 'multiselect',
        data: Array.from(makes.entries()).flatMap(([make, { models }]) =>
          Array.from(models.entries()).map(([model, count]) => ({
            value: model,
            displayValue: model,
            displayMake: capitalize(make),
            count
          }))
        )
      },
      {
        name: 'price',
        displayName: 'Budget',
        type: 'slider',
        data: {
          min: minPrice === Number.MAX_SAFE_INTEGER ? 0 : minPrice,
          max: maxPrice,
          step: 500
        }
      },
      {
        name: 'perweek',
        displayName: 'Per week budget',
        type: 'slider',
        data: {
          min: roundToTen(minWeekly),
          max: roundToTen(maxWeekly),
          step: 10
        }
      },
      {
        name: 'kms',
        displayName: 'Kilometres',
        type: 'slider',
        data: {
          min: minKms === Number.MAX_SAFE_INTEGER ? 0 : minKms,
          max: maxKms,
          step: 1000
        }
      },
      {
        name: 'body',
        displayName: 'Body',
        type: 'checkbox',
        data: Array.from(bodyTypes.entries()).map(([value, count]) => ({
          value,
          displayValue: capitalize(value),
          count
        }))
      },
      {
        name: 'transmission',
        displayName: 'Transmission',
        type: 'checkbox',
        data: Array.from(transmissions.entries()).map(([value, count]) => ({
          value,
          displayValue: capitalize(value),
          count
        }))
      },
      {
        name: 'drivetrain',
        displayName: 'Drive Train',
        type: 'checkbox',
        data: Array.from(drivetrains.entries()).map(([value, count]) => ({
          value,
          displayValue: value,
          count
        }))
      },
      {
        name: 'fuel',
        displayName: 'Fuel Type',
        type: 'checkbox',
        data: Array.from(fuelTypes.entries()).map(([value, count]) => ({
          value,
          displayValue: value,
          count
        }))
      },
      {
        name: 'seats',
        displayName: 'Seating Capacity',
        type: 'checkbox',
        data: Array.from(seats.entries()).map(([value, count]) => ({
          value,
          displayValue: value,
          count
        }))
      }
    ];

    // Build makes summary for FrontSearch
    const makesData = Array.from(makes.entries()).map(([make, { count }]) => ({
      value: make,
      displayValue: capitalize(make),
      count
    }));

    return {
      filters,
      makes: makesData,
      totalCount: vehicles.length,
      priceRange: {
        min: minPrice === Number.MAX_SAFE_INTEGER ? 0 : minPrice,
        max: maxPrice
      },
      perweekRange: {
        min: roundToTen(minWeekly),
        max: roundToTen(maxWeekly)
      },
      _cached: false,
      _timestamp: Date.now()
    };

  } catch (error: any) {
    console.error('[homepage-filters] Error:', error.message);
    return { error: 'Failed to fetch filters', filters: [] };
  }
}, {
  maxAge: 60 * 10, // 10 minutes cache
  staleMaxAge: 60 * 30, // Serve stale for 30 minutes
  name: 'homepage-filters',
  getKey: () => 'homepage-filters-v1'
});
