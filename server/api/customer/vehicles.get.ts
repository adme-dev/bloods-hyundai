import { db } from '../../utils/db';
import { customerVehicles, serviceHistory, customers } from '../../database/schema';
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

  // Get customer's vehicles
  const vehicles = await db
    .select({
      id: customerVehicles.id,
      make: customerVehicles.make,
      model: customerVehicles.model,
      year: customerVehicles.year,
      registration: customerVehicles.registration,
      vin: customerVehicles.vin,
      color: customerVehicles.color,
      currentOdometer: customerVehicles.currentOdometer,
      lastServiceDate: customerVehicles.lastServiceDate,
      nextServiceDue: customerVehicles.nextServiceDue,
    })
    .from(customerVehicles)
    .where(and(
      eq(customerVehicles.dealerId, decoded.dealerId),
      eq(customerVehicles.customerId, decoded.customerId),
      eq(customerVehicles.isActive, true)
    ))
    .orderBy(desc(customerVehicles.lastServiceDate));

  // Get service history for each vehicle
  const vehiclesWithHistory = await Promise.all(
    vehicles.map(async (vehicle) => {
      const history = await db
        .select({
          id: serviceHistory.id,
          serviceDate: serviceHistory.serviceDate,
          serviceType: serviceHistory.serviceType,
          odometerReading: serviceHistory.odometerReading,
          workPerformed: serviceHistory.workPerformed,
          totalCost: serviceHistory.totalCost,
          invoiceNumber: serviceHistory.invoiceNumber,
          recommendations: serviceHistory.recommendations,
        })
        .from(serviceHistory)
        .where(eq(serviceHistory.vehicleId, vehicle.id))
        .orderBy(desc(serviceHistory.serviceDate))
        .limit(5);

      return {
        ...vehicle,
        displayName: `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`.trim(),
        serviceHistory: history,
        serviceCount: history.length,
      };
    })
  );

  return {
    vehicles: vehiclesWithHistory,
    total: vehicles.length,
  };
});
