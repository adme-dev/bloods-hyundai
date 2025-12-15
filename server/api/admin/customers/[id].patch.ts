import { db } from '../../../utils/db';
import { customers, customerRetentionProfiles, customerActivities } from '../../../database/schema';
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

  // Update customer fields
  const customerUpdates: any = {};
  if (body.firstName !== undefined) customerUpdates.firstName = body.firstName;
  if (body.lastName !== undefined) customerUpdates.lastName = body.lastName;
  if (body.email !== undefined) customerUpdates.email = body.email;
  if (body.phone !== undefined) customerUpdates.phone = body.phone;
  if (body.address !== undefined) customerUpdates.address = body.address;
  if (body.suburb !== undefined) customerUpdates.suburb = body.suburb;
  if (body.state !== undefined) customerUpdates.state = body.state;
  if (body.postcode !== undefined) customerUpdates.postcode = body.postcode;

  if (Object.keys(customerUpdates).length > 0) {
    customerUpdates.updatedAt = new Date();
    await db.update(customers)
      .set(customerUpdates)
      .where(and(eq(customers.id, customerId), eq(customers.dealerId, dealerId)));
  }

  // Update retention profile if provided
  if (body.retentionProfile) {
    const profileUpdates: any = {};
    const rp = body.retentionProfile;

    if (rp.lifecycleStage !== undefined) profileUpdates.lifecycleStage = rp.lifecycleStage;
    if (rp.riskScore !== undefined) profileUpdates.riskScore = rp.riskScore;
    if (rp.riskLevel !== undefined) profileUpdates.riskLevel = rp.riskLevel;
    if (rp.engagementScore !== undefined) profileUpdates.engagementScore = rp.engagementScore;
    if (rp.lastContactDate !== undefined) profileUpdates.lastContactDate = new Date(rp.lastContactDate);
    if (rp.preferredContactMethod !== undefined) profileUpdates.preferredContactMethod = rp.preferredContactMethod;
    if (rp.doNotCall !== undefined) profileUpdates.doNotCall = rp.doNotCall;
    if (rp.doNotEmail !== undefined) profileUpdates.doNotEmail = rp.doNotEmail;
    if (rp.doNotSms !== undefined) profileUpdates.doNotSms = rp.doNotSms;
    if (rp.marketingConsent !== undefined) profileUpdates.marketingConsent = rp.marketingConsent;
    if (rp.estimatedBudget !== undefined) profileUpdates.estimatedBudget = rp.estimatedBudget;
    if (rp.purchaseTimeline !== undefined) profileUpdates.purchaseTimeline = rp.purchaseTimeline;
    if (rp.financePreference !== undefined) profileUpdates.financePreference = rp.financePreference;
    if (rp.tags !== undefined) profileUpdates.tags = rp.tags;
    if (rp.notes !== undefined) profileUpdates.notes = rp.notes;

    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updatedAt = new Date();

      // Check if profile exists
      const existingProfile = await db.query.customerRetentionProfiles.findFirst({
        where: and(
          eq(customerRetentionProfiles.customerId, customerId),
          eq(customerRetentionProfiles.dealerId, dealerId)
        ),
      });

      if (existingProfile) {
        await db.update(customerRetentionProfiles)
          .set(profileUpdates)
          .where(and(
            eq(customerRetentionProfiles.customerId, customerId),
            eq(customerRetentionProfiles.dealerId, dealerId)
          ));
      } else {
        // Create profile if it doesn't exist
        await db.insert(customerRetentionProfiles).values({
          dealerId,
          customerId,
          ...profileUpdates,
          lifecycleStage: profileUpdates.lifecycleStage || 'prospect',
          riskScore: profileUpdates.riskScore || '0',
          riskLevel: profileUpdates.riskLevel || 'low',
          engagementScore: profileUpdates.engagementScore || '50',
          isActive: true,
        });
      }
    }
  }

  // Log the update activity
  await db.insert(customerActivities).values({
    dealerId,
    customerId,
    activityType: 'status_change',
    activityDate: new Date(),
    subject: 'Customer Updated',
    description: 'Customer profile was updated',
    oldValue: existingCustomer,
    newValue: { ...customerUpdates, retentionProfile: body.retentionProfile },
    createdBy: userId,
    isSystemGenerated: false,
  });

  // Fetch updated customer
  const updatedCustomer = await db.query.customers.findFirst({
    where: and(eq(customers.id, customerId), eq(customers.dealerId, dealerId)),
  });

  const retentionProfile = await db.query.customerRetentionProfiles.findFirst({
    where: and(
      eq(customerRetentionProfiles.customerId, customerId),
      eq(customerRetentionProfiles.dealerId, dealerId)
    ),
  });

  return {
    success: true,
    customer: {
      ...updatedCustomer,
      retentionProfile,
    },
  };
});
