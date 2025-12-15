import { and, eq } from 'drizzle-orm';
import { enquiries, enquiryActivityLog } from '../../../../database/schema';
import { db } from '../../../../utils/db';

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user?.dealerId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const enquiryId = getRouterParam(event, 'id');

  if (!enquiryId) {
    throw createError({ statusCode: 400, message: 'Enquiry ID is required' });
  }

  const body = await readBody(event).catch(() => ({}));
  const { crmRef, externalRef, synced } = body ?? {};

  const hasChanges =
    typeof crmRef !== 'undefined' ||
    typeof externalRef !== 'undefined' ||
    typeof synced !== 'undefined';

  if (!hasChanges) {
    throw createError({ statusCode: 400, message: 'No CRM changes provided' });
  }

  const current = await db.query.enquiries.findFirst({
    where: and(eq(enquiries.id, enquiryId), eq(enquiries.dealerId, user.dealerId)),
    columns: {
      id: true,
      syncedToCrm: true,
      crmRef: true,
      externalRef: true,
    },
  });

  if (!current) {
    throw createError({ statusCode: 404, message: 'Enquiry not found' });
  }

  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (typeof synced === 'boolean') {
    updateData.syncedToCrm = synced;
  }

  if (typeof crmRef !== 'undefined') {
    updateData.crmRef = crmRef ? String(crmRef).trim() : null;
  }

  if (typeof externalRef !== 'undefined') {
    updateData.externalRef = externalRef ? String(externalRef).trim() : null;
  }

  const [updated] = await db
    .update(enquiries)
    .set(updateData)
    .where(and(eq(enquiries.id, enquiryId), eq(enquiries.dealerId, user.dealerId)))
    .returning();

  if (!updated) {
    throw createError({ statusCode: 500, message: 'Failed to update CRM metadata' });
  }

  const newValue = {
    syncedToCrm: typeof updateData.syncedToCrm !== 'undefined' ? updateData.syncedToCrm : current.syncedToCrm,
    crmRef: typeof updateData.crmRef !== 'undefined' ? updateData.crmRef : current.crmRef,
    externalRef:
      typeof updateData.externalRef !== 'undefined' ? updateData.externalRef : current.externalRef,
  };

  const action = typeof updateData.syncedToCrm === 'boolean'
    ? updateData.syncedToCrm
      ? 'Synced to CRM'
      : 'Marked as not synced'
    : 'Updated CRM metadata';

  await db.insert(enquiryActivityLog).values({
    dealerId: user.dealerId,
    enquiryId,
    userId: user.id,
    action,
    entityType: 'crm',
    oldValue: {
      syncedToCrm: current.syncedToCrm,
      crmRef: current.crmRef,
      externalRef: current.externalRef,
    },
    newValue,
  });

  return {
    success: true,
    enquiry: updated,
  };
});





