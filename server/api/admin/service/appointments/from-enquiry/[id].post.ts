import { db } from '../../../../../utils/db';
import { serviceAppointments, enquiries, customers, customerVehicles } from '../../../../../database/schema';
import { eq, and } from 'drizzle-orm';
import { ENQUIRY_STATUSES } from '~~/shared/constants/salesFunnel';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const dealerId = user.dealerId;
  const enquiryId = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!enquiryId) {
    throw createError({ statusCode: 400, message: 'Enquiry ID is required' });
  }

  // Get the enquiry
  const [enquiry] = await db
    .select()
    .from(enquiries)
    .where(and(
      eq(enquiries.id, enquiryId),
      eq(enquiries.dealerId, dealerId)
    ));

  if (!enquiry) {
    throw createError({ statusCode: 404, message: 'Enquiry not found' });
  }

  if (enquiry.type !== 'service') {
    throw createError({ statusCode: 400, message: 'This enquiry is not a service booking' });
  }

  // Extract vehicle info from enquiry
  const vehicleInfo = enquiry.vehicleInfo as any || {};
  const serviceInfo = (enquiry as any).serviceInfo || {};

  // Override values from body if provided
  const {
    scheduledDate,
    scheduledTime,
    serviceType,
    estimatedDuration,
    assignedTechnicianId,
    assignedServiceAdvisorId,
    estimatedCost,
    priority,
  } = body;

  if (!scheduledDate) {
    throw createError({ statusCode: 400, message: 'Scheduled date is required' });
  }

  // Check for existing customer
  let customerId = null;
  const [existingCustomer] = await db
    .select()
    .from(customers)
    .where(and(
      eq(customers.dealerId, dealerId),
      eq(customers.email, enquiry.email.toLowerCase())
    ));

  if (existingCustomer) {
    customerId = existingCustomer.id;
  }

  // Check for existing vehicle by registration
  let vehicleId = null;
  const registration = vehicleInfo.registration || serviceInfo.registration;
  if (registration) {
    const [existingVehicle] = await db
      .select()
      .from(customerVehicles)
      .where(and(
        eq(customerVehicles.dealerId, dealerId),
        eq(customerVehicles.registration, registration.toUpperCase())
      ));

    if (existingVehicle) {
      vehicleId = existingVehicle.id;
    }
  }

  // Create the appointment
  const [appointment] = await db
    .insert(serviceAppointments)
    .values({
      dealerId,
      enquiryId,
      customerId,
      vehicleId,
      customerFirstName: enquiry.firstName,
      customerLastName: enquiry.lastName,
      customerEmail: enquiry.email,
      customerPhone: enquiry.phone,
      vehicleMake: vehicleInfo.make || serviceInfo.vehicleMake || 'Unknown',
      vehicleModel: vehicleInfo.model || serviceInfo.vehicleModel || 'Unknown',
      vehicleYear: vehicleInfo.year?.toString() || serviceInfo.vehicleYear || null,
      vehicleRegistration: registration?.toUpperCase() || null,
      vehicleVin: vehicleInfo.vin || null,
      vehicleOdometer: serviceInfo.odometer || null,
      scheduledDate: new Date(scheduledDate),
      scheduledTime: scheduledTime || serviceInfo.preferredTime || null,
      estimatedDuration: estimatedDuration || null,
      dropOffDate: serviceInfo.preferredDate ? new Date(serviceInfo.preferredDate) : null,
      dropOffTime: serviceInfo.preferredTime || null,
      serviceType: serviceType || serviceInfo.serviceType || 'General Service',
      serviceDescription: enquiry.message,
      customerNotes: enquiry.message,
      isScheduledService: serviceInfo.serviceType?.includes('Scheduled') || false,
      isPreviouslyServiced: false,
      hasOtherRepairs: serviceInfo.serviceType?.includes('Repairs') || false,
      requiresLoanCar: false,
      status: 'confirmed',
      priority: priority || enquiry.priority,
      assignedTechnicianId: assignedTechnicianId || null,
      assignedServiceAdvisorId: assignedServiceAdvisorId || enquiry.assignedTo || null,
      estimatedCost: estimatedCost || null,
      confirmationSent: false,
    })
    .returning();

  // Update the enquiry status
  await db
    .update(enquiries)
    .set({
      status: ENQUIRY_STATUSES.APPOINTMENT_SET,
      contactedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(enquiries.id, enquiryId), eq(enquiries.dealerId, dealerId)));

  return {
    success: true,
    appointment,
    message: 'Appointment created from enquiry successfully',
  };
});
