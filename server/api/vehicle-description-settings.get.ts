import { inArray } from 'drizzle-orm';
import { dealers } from '../database/schema';
import { dbHttp } from '../utils/db';
import { DEFAULT_DEALER_SLUG, resolveDealerSlug, resolveDealerSlugAliases } from '../utils/tenant';
import { readVehicleDescriptionSettings, type VehicleDescriptionSettings } from '../../shared/vehicleDescriptions';

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');
  const config = useRuntimeConfig();
  const slug = resolveDealerSlug(event, config.public.dealerSlug || process.env.DEALER_SLUG || DEFAULT_DEALER_SLUG);
  try {
    const [dealer] = await dbHttp.select({ settings: dealers.settings }).from(dealers)
      .where(inArray(dealers.slug, resolveDealerSlugAliases(slug))).limit(1);
    return { success: true, settings: readVehicleDescriptionSettings(dealer?.settings) };
  } catch (error) {
    console.error('Failed to load vehicle description settings:', error);
    // On a database outage, preserve comments without overriding an AI opt-out.
    return { success: false, settings: { mode: 'dealer_only' } satisfies VehicleDescriptionSettings };
  }
});
