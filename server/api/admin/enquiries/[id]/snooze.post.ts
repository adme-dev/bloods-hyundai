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

  const body = await readBody<{ duration: string; customDate?: string }>(event);
  
  // Calculate snooze until date
  let snoozedUntil: Date;
  const now = new Date();
  
  switch (body.duration) {
    case '1h':
      snoozedUntil = new Date(now.getTime() + 60 * 60 * 1000);
      break;
    case '3h':
      snoozedUntil = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      break;
    case 'tomorrow':
      snoozedUntil = new Date(now);
      snoozedUntil.setDate(snoozedUntil.getDate() + 1);
      snoozedUntil.setHours(9, 0, 0, 0);
      break;
    case 'next_week':
      snoozedUntil = new Date(now);
      snoozedUntil.setDate(snoozedUntil.getDate() + 7);
      snoozedUntil.setHours(9, 0, 0, 0);
      break;
    case 'custom':
      if (!body.customDate) {
        throw createError({ statusCode: 400, message: 'Custom date is required' });
      }
      snoozedUntil = new Date(body.customDate);
      break;
    default:
      throw createError({ statusCode: 400, message: 'Invalid duration' });
  }

  // Update enquiry
  const [updated] = await db
    .update(enquiries)
    .set({
      snoozedUntil,
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
    action: 'snoozed',
    entityType: 'enquiry',
    newValue: { snoozedUntil: snoozedUntil.toISOString(), duration: body.duration },
  });

  return {
    success: true,
    enquiry: updated,
  };
});

