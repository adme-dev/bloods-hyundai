import { eq } from 'drizzle-orm';
import { db, withTenantContext } from '../../../../utils/db';
import { enquiries, enquiryActivityLog } from '../../../../database/schema';

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
  const body = await readBody(event);
  const { status } = body;

  if (!status || !['new', 'in_progress', 'contacted', 'closed'].includes(status)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid status',
    });
  }

  try {
    await withTenantContext(dealerId, async () => {
      // Update enquiry status
      await db
        .update(enquiries)
        .set({ 
          status,
          updatedAt: new Date(),
        })
        .where(eq(enquiries.id, enquiryId));

      // Log activity
      await db.insert(enquiryActivityLog).values({
        enquiryId,
        userId: user.id,
        action: `Status changed to ${status}`,
        metadata: { oldStatus: body.oldStatus, newStatus: status },
      });
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

