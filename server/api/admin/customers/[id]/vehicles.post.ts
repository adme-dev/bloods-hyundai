import { db } from '../../../../utils/db';
import { customers, customerVehicles, customerActivities } from '../../../../database/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const dealerId = event.context.dealerId;
  const userId = event.context.userId;
  const customerId = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!dealerId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  if (!customerId) {
    throw createError({ statusCode: 400, message: 'Customer ID is required' });
  }
  if (!body.make || !body.model) {
    throw createError({ statusCode: 400, message: 'Vehicle make and model are required' });
  }

  // Verify the customer belongs to the caller's dealer (tenancy / IDOR guard).
  const owning = await db.query.customers.findFirst({
    where: and(eq(customers.id, customerId), eq(customers.dealerId, dealerId)),
    columns: { id: true },
  });
  if (!owning) {
    throw createError({ statusCode: 404, message: 'Customer not found' });
  }

  const [vehicle] = await db.insert(customerVehicles).values({
    dealerId,
    customerId,
    make: body.make,
    model: body.model,
    year: body.year || null,
    registration: body.registration || null,
    vin: body.vin || null,
    color: body.color || null,
    engineType: body.engineType || null,
    transmission: body.transmission || null,
    currentOdometer: body.currentOdometer || null,
    notes: body.notes || null,
    isActive: true,
  }).returning();

  // Log the activity on the customer timeline.
  await db.insert(customerActivities).values({
    dealerId,
    customerId,
    activityType: 'vehicle_added',
    activityDate: new Date(),
    subject: 'Vehicle added',
    description: `${body.make} ${body.model}${body.registration ? ` (${body.registration})` : ''}`,
    createdBy: userId,
    isSystemGenerated: false,
  });

  return { success: true, vehicle };
});
