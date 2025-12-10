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

  // Get technician info if assigned
  let technician = null;
  if (appointment.assignedTechnicianId) {
    const [tech] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        department: users.department,
      })
      .from(users)
      .where(eq(users.id, appointment.assignedTechnicianId));
    technician = tech;
  }

  // Get service advisor info if assigned
  let serviceAdvisor = null;
  if (appointment.assignedServiceAdvisorId) {
    const [advisor] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, appointment.assignedServiceAdvisorId));
    serviceAdvisor = advisor;
  }

  // Get customer info if linked
  let customer = null;
  if (appointment.customerId) {
    const [cust] = await db
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
      .where(eq(customers.id, appointment.customerId));
    customer = cust;
  }

  // Get vehicle info if linked
  let vehicle = null;
  if (appointment.vehicleId) {
    const [veh] = await db
      .select()
      .from(customerVehicles)
      .where(eq(customerVehicles.id, appointment.vehicleId));
    vehicle = veh;
  }

  // Get service history for this vehicle registration
  let vehicleServiceHistory: any[] = [];
  if (appointment.vehicleRegistration) {
    vehicleServiceHistory = await db
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
      .limit(10);
  }

  // Get available technicians for assignment
  const technicians = await db
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
