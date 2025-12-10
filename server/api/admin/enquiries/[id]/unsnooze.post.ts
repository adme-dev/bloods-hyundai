import { db } from '../../../../utils/db';
import { enquiries, enquiryActivityLog } from '../../../../database/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const enquiryId = getRouterParam(event, 'id');
  if (!enquiryId) {
    throw createError({ statusCode: 400, message: 'Enquiry ID is required' });
  }

  // Update enquiry
  const [updated] = await db
    .update(enquiries)
    .set({
      snoozedUntil: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(enquiries.id, enquiryId),
        eq(enquiries.dealerId, user.dealerId)
      )
    )
    .returning();

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Enquiry not found' });
  }

  // Log activity
  await db.insert(enquiryActivityLog).values({
    dealerId: user.dealerId,
    enquiryId,
    userId: user.id,
    action: 'unsnoozed',
    entityType: 'enquiry',
  });

  return {
    success: true,
    enquiry: updated,
  };
});

