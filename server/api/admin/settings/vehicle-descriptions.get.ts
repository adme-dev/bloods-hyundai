import { eq } from 'drizzle-orm';
import { dealers } from '../../../database/schema';
import { dbHttp } from '../../../utils/db';
import { readVehicleDescriptionSettings } from '../../../../shared/vehicleDescriptions';

export default defineEventHandler(async (event) => {
  const { user, dealerId } = event.context;
  if (!user || !dealerId) throw createError({ statusCode: 401, message: 'Unauthorized' });
  setResponseHeader(event, 'Cache-Control', 'no-store');
  const [dealer] = await dbHttp.select({ settings: dealers.settings }).from(dealers)
    .where(eq(dealers.id, dealerId)).limit(1);
  if (!dealer) throw createError({ statusCode: 404, message: 'Dealer not found' });
  return { success: true, settings: readVehicleDescriptionSettings(dealer.settings) };
});
