import { db } from '../../../utils/db';
import { customers, customerRetentionProfiles, customerActivities } from '../../../database/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const dealerId = event.context.dealerId;
  const userId = event.context.userId;
  const customerId = getRouterParam(event, 'id');

  if (!customerId) {
    throw createError({
      statusCode: 400,
      message: 'Customer ID is required',
    });
  }

  // Verify customer exists
  const existingCustomer = await db.query.customers.findFirst({
    where: and(eq(customers.id, customerId), eq(customers.dealerId, dealerId)),
  });

  if (!existingCustomer) {
    throw createError({
      statusCode: 404,
      message: 'Customer not found',
    });
  }

  // Soft delete - set isActive to false
  await db.update(customers)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(and(eq(customers.id, customerId), eq(customers.dealerId, dealerId)));

  // Also deactivate retention profile
  await db.update(customerRetentionProfiles)
    .set({
      isActive: false,
      lifecycleStage: 'inactive',
      updatedAt: new Date(),
    })
    .where(and(
      eq(customerRetentionProfiles.customerId, customerId),
      eq(customerRetentionProfiles.dealerId, dealerId)
    ));

  // Log the archive activity
  await db.insert(customerActivities).values({
    dealerId,
    customerId,
    activityType: 'status_change',
    activityDate: new Date(),
    subject: 'Customer Archived',
    description: 'Customer record was archived',
    createdBy: userId,
    isSystemGenerated: false,
  });

  return {
    success: true,
    message: 'Customer archived successfully',
  };
});
