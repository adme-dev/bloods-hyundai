import { db } from '../../../../utils/db';
import { serviceAppointments, users, customers, customerVehicles, serviceHistory } from '../../../../database/schema';
import { eq, and, desc } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const dealerId = user.dealerId;
  const appointmentId = getRouterParam(event, 'id');

  if (!appointmentId) {
    throw createError({ statusCode: 400, message: 'Appointment ID is required' });
  }

  // Get appointment with related data
  const [appointment] = await db
    .select()
    .from(serviceAppointments)
    .where(and(
      eq(serviceAppointments.id, appointmentId),
      eq(serviceAppointments.dealerId, dealerId)
    ));

  if (!appointment) {
    throw createError({ statusCode: 404, message: 'Appointment not found' });
  }

  const technicianPromise = appointment.assignedTechnicianId
    ? db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        department: users.department,
      })
      .from(users)
      .where(and(
        eq(users.id, appointment.assignedTechnicianId),
        eq(users.dealerId, dealerId)
      ))
      .then(([tech]) => tech ?? null)
    : Promise.resolve(null);

  const serviceAdvisorPromise = appointment.assignedServiceAdvisorId
    ? db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(and(
        eq(users.id, appointment.assignedServiceAdvisorId),
        eq(users.dealerId, dealerId)
      ))
      .then(([advisor]) => advisor ?? null)
    : Promise.resolve(null);

  const customerPromise = appointment.customerId
    ? db
      .select({
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
        suburb: customers.suburb,
        state: customers.state,
        postcode: customers.postcode,
      })
      .from(customers)
      .where(and(
        eq(customers.id, appointment.customerId),
        eq(customers.dealerId, dealerId)
      ))
      .then(([cust]) => cust ?? null)
    : Promise.resolve(null);

  const vehiclePromise = appointment.vehicleId
    ? db
      .select()
      .from(customerVehicles)
      .where(and(
        eq(customerVehicles.id, appointment.vehicleId),
        eq(customerVehicles.dealerId, dealerId)
      ))
      .then(([veh]) => veh ?? null)
    : Promise.resolve(null);

  const vehicleServiceHistoryPromise = appointment.vehicleRegistration
    ? db
      .select({
        id: serviceHistory.id,
        serviceDate: serviceHistory.serviceDate,
        serviceType: serviceHistory.serviceType,
        odometerReading: serviceHistory.odometerReading,
        workPerformed: serviceHistory.workPerformed,
        totalCost: serviceHistory.totalCost,
      })
      .from(serviceHistory)
      .innerJoin(customerVehicles, eq(serviceHistory.vehicleId, customerVehicles.id))
      .where(and(
        eq(customerVehicles.registration, appointment.vehicleRegistration),
        eq(serviceHistory.dealerId, dealerId)
      ))
      .orderBy(desc(serviceHistory.serviceDate))
      .limit(10)
    : Promise.resolve([]);

  const techniciansPromise = db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      department: users.department,
    })
    .from(users)
    .where(and(
      eq(users.dealerId, dealerId),
      eq(users.isActive, true),
      eq(users.department, 'service')
    ));

  const [
    technician,
    serviceAdvisor,
    customer,
    vehicle,
    vehicleServiceHistory,
    technicians,
  ] = await Promise.all([
    technicianPromise,
    serviceAdvisorPromise,
    customerPromise,
    vehiclePromise,
    vehicleServiceHistoryPromise,
    techniciansPromise,
  ]);

  return {
    appointment: {
      ...appointment,
      customerName: `${appointment.customerFirstName} ${appointment.customerLastName}`,
      vehicleDisplay: `${appointment.vehicleYear || ''} ${appointment.vehicleMake} ${appointment.vehicleModel}`.trim(),
    },
    technician,
    serviceAdvisor,
    customer,
    vehicle,
    vehicleServiceHistory,
    availableTechnicians: technicians.map(t => ({
      ...t,
      name: `${t.firstName} ${t.lastName}`,
    })),
  };
});
