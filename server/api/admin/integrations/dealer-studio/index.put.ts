import { eq } from 'drizzle-orm';
import { dealers } from '../../../../database/schema';
import { db } from '../../../../utils/db';
import { fetchDealerStudioApiKeyDetails } from '../../../../utils/dealerStudio/client';
import { resolveDealerStudioApiKey } from '../../../../utils/dealerStudio/credential';
import { writeDealerStudioSettings } from '../../../../utils/dealerStudio/settings';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user?.dealerId) throw createError({ statusCode: 401, message: 'Unauthorized' });
  if (!['admin', 'dealer_admin'].includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' });
  }

  const body = await readBody<{
    enabled?: boolean;
    dealershipId?: number | null;
    locationId?: number | null;
    defaultUserEmail?: string | null;
  }>(event);
  if (typeof body?.enabled !== 'boolean') {
    throw createError({ statusCode: 422, message: 'Enabled state is required' });
  }

  const [dealer] = await db.select({ settings: dealers.settings })
    .from(dealers)
    .where(eq(dealers.id, user.dealerId))
    .limit(1);
  if (!dealer) throw createError({ statusCode: 404, message: 'Dealer not found' });

  if (!body.enabled) {
    const current = (dealer.settings as Record<string, any>)?.externalCrm || {};
    const updatedSettings = writeDealerStudioSettings(dealer.settings, {
      enabled: false,
      dealershipId: positiveInteger(current.dealershipId),
      dealershipSlug: optionalString(current.dealershipSlug),
      dealershipName: optionalString(current.dealershipName),
      locationId: positiveInteger(current.locationId),
      locationName: optionalString(current.locationName),
      defaultUserEmail: optionalString(current.defaultUserEmail),
      lastTestedAt: optionalString(current.lastTestedAt),
    });
    await db.update(dealers).set({ settings: updatedSettings, updatedAt: new Date() })
      .where(eq(dealers.id, user.dealerId));
    return { success: true, settings: updatedSettings.externalCrm };
  }

  const dealershipId = positiveInteger(body.dealershipId);
  const locationId = positiveInteger(body.locationId);
  if (!dealershipId || !locationId) {
    throw createError({ statusCode: 422, message: 'Dealership and location are required' });
  }

  let details;
  try {
    const apiKey = await resolveDealerStudioApiKey(user.dealerId);
    details = await fetchDealerStudioApiKeyDetails(apiKey);
  } catch (error: any) {
    throw createError({ statusCode: 422, message: error?.message || 'Dealer Studio connection failed' });
  }
  if (!details.permissions.includes('create:lead')) {
    throw createError({ statusCode: 422, message: 'Insufficient permissions: Dealer Studio key requires create:lead' });
  }
  const dealership = details.dealerships.find(item => item.id === dealershipId);
  if (!dealership) throw createError({ statusCode: 422, message: 'Selected dealership is not authorised for this API key' });
  const location = dealership.locations.find(item => item.id === locationId);
  if (!location) throw createError({ statusCode: 422, message: 'Selected location does not belong to the dealership' });
  const defaultUserEmail = optionalString(body.defaultUserEmail);
  if (defaultUserEmail && !dealership.users.some(item => item.email === defaultUserEmail)) {
    throw createError({ statusCode: 422, message: 'Selected salesperson does not belong to the dealership' });
  }

  const settings = {
    enabled: true,
    dealershipId: dealership.id,
    dealershipSlug: dealership.slug,
    dealershipName: dealership.name,
    locationId: location.id,
    locationName: location.name,
    defaultUserEmail,
    lastTestedAt: new Date().toISOString(),
  };
  const updatedSettings = writeDealerStudioSettings(dealer.settings, settings);
  await db.update(dealers).set({ settings: updatedSettings, updatedAt: new Date() })
    .where(eq(dealers.id, user.dealerId));
  return { success: true, settings };
});

function positiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
