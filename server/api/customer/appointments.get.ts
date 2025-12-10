import { db } from '../../utils/db';
import { serviceAppointments, customers } from '../../database/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'customer_token');

  if (!token) {
    throw createError({ statusCode: 401, message: 'Not authenticated' });
  }

  const config = useRuntimeConfig();
  let decoded: { customerId: string; dealerId: string };

  try {
    decoded = jwt.verify(token, config.jwtSecret || 'default-secret') as typeof decoded;
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid token' });
  }

  // Get customer to find their email
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, decoded.customerId));

  if (!customer) {
    throw createError({ statusCode: 404, message: 'Customer not found' });
  }

  // Get appointments linked to this customer (by ID or email)
  const appointments = await db
    .select({
      id: serviceAppointments.id,
      scheduledDate: serviceAppointments.scheduledDate,
      scheduledTime: serviceAppointments.scheduledTime,
      vehicleMake: serviceAppointments.vehicleMake,
      vehicleModel: serviceAppointments.vehicleModel,
      vehicleYear: serviceAppointments.vehicleYear,
      vehicleRegistration: serviceAppointments.vehicleRegistration,
      serviceType: serviceAppointments.serviceType,
      serviceDescription: serviceAppointments.serviceDescription,
      status: serviceAppointments.status,
      estimatedCost: serviceAppointments.estimatedCost,
      actualCost: serviceAppointments.actualCost,
      createdAt: serviceAppointments.createdAt,
      completedAt: serviceAppointments.completedAt,
    })
    .from(serviceAppointments)
    .where(and(
      eq(serviceAppointments.dealerId, decoded.dealerId),
      or(
        eq(serviceAppointments.customerId, decoded.customerId),
        eq(serviceAppointments.customerEmail, customer.email)
      )
    ))
    .orderBy(desc(serviceAppointments.scheduledDate));

  // Split into upcoming and past
  const now = new Date();
  const upcoming = appointments.filter(a =>
    new Date(a.scheduledDate) >= now && !['completed', 'cancelled'].includes(a.status)
  );
  const past = appointments.filter(a =>
    new Date(a.scheduledDate) < now || ['completed', 'cancelled'].includes(a.status)
  );

  return {
    upcoming: upcoming.map(a => ({
      ...a,
      vehicle: `${a.vehicleYear || ''} ${a.vehicleMake} ${a.vehicleModel}`.trim(),
    })),
    past: past.map(a => ({
      ...a,
      vehicle: `${a.vehicleYear || ''} ${a.vehicleMake} ${a.vehicleModel}`.trim(),
    })),
    total: appointments.length,
  };
});
