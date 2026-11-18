import { eq, sql } from 'drizzle-orm';
import { dealers } from '../../../database/schema';
import { dbHttp } from '../../../utils/db';
import { isVehicleDescriptionMode, type VehicleDescriptionSettings } from '../../../../shared/vehicleDescriptions';

export default defineEventHandler(async (event) => {
  const { user, dealerId } = event.context;
  if (!user || !dealerId) throw createError({ statusCode: 401, message: 'Unauthorized' });
  if (!['admin', 'dealer_admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' });
  }
  const body = await readBody(event);
  if (!isVehicleDescriptionMode(body?.mode)) {
    throw createError({ statusCode: 422, message: 'Choose a valid vehicle description mode' });
  }
  const settings: VehicleDescriptionSettings = { mode: body.mode };
  // Change only this key, preserving concurrent updates to other dealer settings.
  const [updated] = await dbHttp.update(dealers).set({
    settings: sql`jsonb_set(coalesce(${dealers.settings}, '{}'::jsonb), '{vehicleDescriptions}', ${JSON.stringify(settings)}::jsonb, true)`,
    updatedAt: new Date(),
  }).where(eq(dealers.id, dealerId)).returning({ id: dealers.id });
  if (!updated) throw createError({ statusCode: 404, message: 'Dealer not found' });
  setResponseHeader(event, 'Cache-Control', 'no-store');
  return { success: true, settings };
});
