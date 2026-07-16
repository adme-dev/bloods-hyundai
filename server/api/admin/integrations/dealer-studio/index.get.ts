import { and, desc, eq, sql } from 'drizzle-orm';
import { dealers, enquiries, leadExportDeliveries } from '../../../../database/schema';
import { db } from '../../../../utils/db';
import { dealerStudioCredentialStatus } from '../../../../utils/dealerStudio/credential';
import { readDealerStudioSettings } from '../../../../utils/dealerStudio/settings';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user?.dealerId) throw createError({ statusCode: 401, message: 'Unauthorized' });

  const [dealer] = await db.select({ settings: dealers.settings })
    .from(dealers)
    .where(eq(dealers.id, user.dealerId))
    .limit(1);
  if (!dealer) throw createError({ statusCode: 404, message: 'Dealer not found' });

  const [summary] = await db.select({
    total: sql<number>`count(*)::int`,
    pending: sql<number>`count(*) filter (where ${leadExportDeliveries.status} in ('pending', 'sending', 'failed_retryable'))::int`,
    synced: sql<number>`count(*) filter (where ${leadExportDeliveries.status} = 'synced')::int`,
    failed: sql<number>`count(*) filter (where ${leadExportDeliveries.status} in ('failed_validation', 'failed_permanent'))::int`,
  }).from(leadExportDeliveries).where(and(
    eq(leadExportDeliveries.dealerId, user.dealerId),
    eq(leadExportDeliveries.provider, 'dealer_studio'),
  ));

  const recent = await db.select({
    id: leadExportDeliveries.id,
    enquiryId: leadExportDeliveries.enquiryId,
    status: leadExportDeliveries.status,
    attempts: leadExportDeliveries.attempts,
    providerLeadId: leadExportDeliveries.providerLeadId,
    providerClusterId: leadExportDeliveries.providerClusterId,
    lastError: leadExportDeliveries.lastError,
    syncedAt: leadExportDeliveries.syncedAt,
    updatedAt: leadExportDeliveries.updatedAt,
    customerFirstName: enquiries.firstName,
    customerLastName: enquiries.lastName,
    enquiryType: enquiries.type,
  }).from(leadExportDeliveries)
    .innerJoin(enquiries, and(
      eq(enquiries.id, leadExportDeliveries.enquiryId),
      eq(enquiries.dealerId, user.dealerId),
    ))
    .where(and(
      eq(leadExportDeliveries.dealerId, user.dealerId),
      eq(leadExportDeliveries.provider, 'dealer_studio'),
    ))
    .orderBy(desc(leadExportDeliveries.updatedAt))
    .limit(25);

  const credential = await dealerStudioCredentialStatus(user.dealerId);
  return {
    ...credential,
    settings: readDealerStudioSettings(dealer.settings),
    summary: summary || { total: 0, pending: 0, synced: 0, failed: 0 },
    recent,
  };
});
