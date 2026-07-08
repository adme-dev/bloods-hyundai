import { db } from '../../../utils/db';
import { customers, customerRetentionProfiles, customerActivities } from '../../../database/schema';
import { pickSafeCustomer } from '../../../utils/customerSafe';
import { VALID_LIFECYCLE_STAGES, type LifecycleStage } from '~~/shared/constants/salesFunnel';

export default defineEventHandler(async (event) => {
  const dealerId = event.context.dealerId;
  const userId = event.context.userId;
  const body = await readBody(event);

  // Validate required fields
  if (!body.firstName || !body.lastName || !body.email) {
    throw createError({
      statusCode: 400,
      message: 'First name, last name, and email are required',
    });
  }

  // Validate lifecycle stage against the canonical set
  if (body.lifecycleStage && !VALID_LIFECYCLE_STAGES.includes(body.lifecycleStage as LifecycleStage)) {
    throw createError({
      statusCode: 400,
      message: `Invalid lifecycle stage. Valid values: ${VALID_LIFECYCLE_STAGES.join(', ')}`,
    });
  }

  // Check if customer with email already exists for this dealer
  const existingCustomer = await db.query.customers.findFirst({
    where: (customers, { and, eq }) =>
      and(eq(customers.dealerId, dealerId), eq(customers.email, body.email)),
  });

  if (existingCustomer) {
    throw createError({
      statusCode: 409,
      message: 'A customer with this email already exists',
    });
  }

  // Create customer
  const [newCustomer] = await db.insert(customers).values({
    dealerId,
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone || null,
    address: body.address || null,
    suburb: body.suburb || null,
    state: body.state || null,
    postcode: body.postcode || null,
    isActive: true,
    emailVerified: false,
  }).returning();

  // Create retention profile
  const [retentionProfile] = await db.insert(customerRetentionProfiles).values({
    dealerId,
    customerId: newCustomer.id,
    lifecycleStage: body.lifecycleStage || 'prospect',
    riskScore: '0',
    riskLevel: 'low',
    engagementScore: '50',
    lastContactDate: new Date(),
    preferredContactMethod: body.preferredContactMethod || 'email',
    marketingConsent: body.marketingConsent !== false,
    consentObtainedDate: new Date(),
    notes: body.notes || null,
    isActive: true,
  }).returning();

  // Log activity
  await db.insert(customerActivities).values({
    dealerId,
    customerId: newCustomer.id,
    activityType: 'note',
    activityDate: new Date(),
    subject: 'Customer Created',
    description: `Customer record created with lifecycle stage: ${body.lifecycleStage || 'prospect'}`,
    createdBy: userId,
    isSystemGenerated: true,
  });

  return {
    success: true,
    customer: {
      ...pickSafeCustomer(newCustomer),
      retentionProfile,
    },
  };
});
