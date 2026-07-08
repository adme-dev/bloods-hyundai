import { db } from '../../../../utils/db';
import { customers, customerActivities, customerRetentionProfiles } from '../../../../database/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const dealerId = event.context.dealerId;
  const userId = event.context.userId;
  const customerId = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!customerId) {
    throw createError({
      statusCode: 400,
      message: 'Customer ID is required',
    });
  }

  if (!body.activityType) {
    throw createError({
      statusCode: 400,
      message: 'Activity type is required',
    });
  }

  // Verify the customer belongs to the caller's dealer (tenancy / IDOR guard).
  const owning = await db.query.customers.findFirst({
    where: and(eq(customers.id, customerId), eq(customers.dealerId, dealerId)),
    columns: { id: true },
  });
  if (!owning) {
    throw createError({ statusCode: 404, message: 'Customer not found' });
  }

  // Create activity
  const [newActivity] = await db.insert(customerActivities).values({
    dealerId,
    customerId,
    enquiryId: body.enquiryId || null,
    taskId: body.taskId || null,
    activityType: body.activityType,
    activityDate: body.activityDate ? new Date(body.activityDate) : new Date(),
    subject: body.subject || null,
    description: body.description || null,
    notes: body.notes || null,
    callDuration: body.callDuration || null,
    callOutcome: body.callOutcome || null,
    emailLogId: body.emailLogId || null,
    createdBy: userId,
    isSystemGenerated: body.isSystemGenerated || false,
    metadata: body.metadata || {},
  }).returning();

  // Update last contact/engagement date on retention profile
  const isContactActivity = ['call_outbound', 'call_inbound', 'email_sent', 'sms_sent', 'meeting'].includes(body.activityType);

  if (isContactActivity) {
    await db.update(customerRetentionProfiles)
      .set({
        lastContactDate: new Date(),
        lastEngagementDate: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(customerRetentionProfiles.customerId, customerId),
        eq(customerRetentionProfiles.dealerId, dealerId)
      ));
  } else {
    // Just update engagement date for other activities
    await db.update(customerRetentionProfiles)
      .set({
        lastEngagementDate: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(customerRetentionProfiles.customerId, customerId),
        eq(customerRetentionProfiles.dealerId, dealerId)
      ));
  }

  // Fetch with creator info
  const activityWithCreator = await db.query.customerActivities.findFirst({
    where: eq(customerActivities.id, newActivity.id),
    with: {
      creator: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return {
    success: true,
    activity: activityWithCreator,
  };
});
