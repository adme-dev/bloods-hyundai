import { and, eq } from 'drizzle-orm';
import { db } from '../../../../utils/db';
import { enquiries } from '../../../../database/schema';
import { logEnquiryActivity } from '../../../../utils/enquiryActivity';
import { VALID_ENQUIRY_STATUSES, type EnquiryStatus } from '~~/shared/constants/salesFunnel';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const enquiryId = getRouterParam(event, 'id');
  if (!enquiryId) {
    throw createError({ statusCode: 400, message: 'Enquiry ID is required' });
  }

  const body = await readBody(event);
  const { status, lostReason } = body;

  if (!status || !VALID_ENQUIRY_STATUSES.includes(status as EnquiryStatus)) {
    throw createError({
      statusCode: 400,
      message: `Invalid status. Valid values: ${VALID_ENQUIRY_STATUSES.join(', ')}`,
    });
  }

  // Verify the enquiry belongs to the caller's dealer (tenancy / IDOR guard).
  const current = await db.query.enquiries.findFirst({
    where: and(eq(enquiries.id, enquiryId), eq(enquiries.dealerId, dealerId)),
    columns: { id: true, status: true },
  });
  if (!current) {
    throw createError({ statusCode: 404, message: 'Enquiry not found' });
  }

  try {
    await db.transaction(async (tx) => {
      const patch: Record<string, any> = { status, updatedAt: new Date() };
      if (status === 'lost') {
        patch.lostReason = lostReason ?? null;
        if (typeof body.lostNotes === 'string') patch.lostNotes = body.lostNotes;
      }

      await tx
        .update(enquiries)
        .set(patch)
        .where(and(eq(enquiries.id, enquiryId), eq(enquiries.dealerId, dealerId)));

      await logEnquiryActivity(
        {
          dealerId,
          enquiryId,
          userId: user.userId,
          action: `Status changed to ${status}`,
          entityType: 'status',
          oldValue: { status: current.status },
          newValue: { status },
        },
        tx,
      );
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating enquiry status:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to update enquiry status',
    });
  }
});
