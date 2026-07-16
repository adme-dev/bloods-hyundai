import { db } from '../../../utils/db';
import { enquiries, leadExportDeliveries } from '../../../database/schema';
import { eq, and } from 'drizzle-orm';
import { autoBackfillEnquiryOptionPack } from '../../../utils/enquiries/optionPackBackfill';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const dealerId = event.context.dealerId;
  
  if (!id) {
    throw createError({ statusCode: 400, message: 'Enquiry ID is required' });
  }
  
  const enquiry = await db.query.enquiries.findFirst({
    where: and(
      eq(enquiries.id, id),
      eq(enquiries.dealerId, dealerId)
    ),
    with: {
      assignedUser: true,
      notes: {
        with: {
          user: true,
        },
        orderBy: (notes, { desc }) => [desc(notes.createdAt)],
      },
      activityLogs: {
        with: {
          user: true,
        },
        orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      },
    },
  });
  
  if (!enquiry) {
    throw createError({ statusCode: 404, message: 'Enquiry not found' });
  }
  
  const enrichedEnquiry = await autoBackfillEnquiryOptionPack(enquiry);
  const { notes = [], activityLogs = [], ...enquiryData } = enrichedEnquiry;

  const [dealerStudioDelivery] = await db.select({
    id: leadExportDeliveries.id,
    status: leadExportDeliveries.status,
    attempts: leadExportDeliveries.attempts,
    providerLeadId: leadExportDeliveries.providerLeadId,
    providerClusterId: leadExportDeliveries.providerClusterId,
    lastHttpStatus: leadExportDeliveries.lastHttpStatus,
    lastError: leadExportDeliveries.lastError,
    nextAttemptAt: leadExportDeliveries.nextAttemptAt,
    lastAttemptAt: leadExportDeliveries.lastAttemptAt,
    syncedAt: leadExportDeliveries.syncedAt,
    updatedAt: leadExportDeliveries.updatedAt,
  }).from(leadExportDeliveries).where(and(
    eq(leadExportDeliveries.enquiryId, id),
    eq(leadExportDeliveries.dealerId, dealerId),
    eq(leadExportDeliveries.provider, 'dealer_studio'),
  )).limit(1);
  
  return {
    enquiry: enquiryData,
    notes,
    activityLog: activityLogs,
    dealerStudioDelivery: dealerStudioDelivery || null,
  };
});
