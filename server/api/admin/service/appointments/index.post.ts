import { db } from '../../../../utils/db';
import { serviceAppointments, enquiries, customers, customerVehicles } from '../../../../database/schema';
import { eq, and } from 'drizzle-orm';
import { ENQUIRY_STATUSES } from '~~/shared/constants/salesFunnel';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const dealerId = user.dealerId;
  const body = await readBody(event);

  const {
    // Required fields
    customerFirstName,
    customerLastName,
    customerEmail,
    vehicleMake,
    vehicleModel,
    scheduledDate,
    serviceType,
    // Optional fields
    customerPhone,
    vehicleYear,
    vehicleRegistration,
    vehicleVin,
    vehicleOdometer,
    scheduledTime,
    estimatedDuration,
    dropOffDate,
    dropOffTime,
    pickUpDate,
    pickUpTime,
    serviceDescription,
    customerNotes,
    isScheduledService,
    isPreviouslyServiced,
    hasOtherRepairs,
    requiresLoanCar,
    priority,
    assignedTechnicianId,
    assignedServiceAdvisorId,
    estimatedCost,
    // Link to existing records
    enquiryId,
    customerId,
    vehicleId,
  } = body;

  // Validation
  if (!customerFirstName || !customerLastName || !customerEmail) {
    throw createError({ statusCode: 400, message: 'Customer name and email are required' });
  }

  if (!vehicleMake || !vehicleModel) {
    throw createError({ statusCode: 400, message: 'Vehicle make and model are required' });
  }

  if (!scheduledDate) {
    throw createError({ statusCode: 400, message: 'Scheduled date is required' });
  }

  if (!serviceType) {
    throw createError({ statusCode: 400, message: 'Service type is required' });
  }

  // Check if there's an existing customer by email
  let existingCustomerId = customerId;
  if (!existingCustomerId) {
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(and(
        eq(customers.dealerId, dealerId),
        eq(customers.email, customerEmail.toLowerCase())
      ));

    if (existingCustomer) {
      existingCustomerId = existingCustomer.id;
    }
  }

  // Check if there's an existing vehicle by registration
  let existingVehicleId = vehicleId;
  if (!existingVehicleId && vehicleRegistration) {
    const [existingVehicle] = await db
      .select()
      .from(customerVehicles)
      .where(and(
        eq(customerVehicles.dealerId, dealerId),
        eq(customerVehicles.registration, vehicleRegistration.toUpperCase())
      ));

    if (existingVehicle) {
      existingVehicleId = existingVehicle.id;
    }
  }

  // Create the appointment
  const [appointment] = await db
    .insert(serviceAppointments)
    .values({
      dealerId,
      customerId: existingCustomerId,
      vehicleId: existingVehicleId,
      enquiryId,
      customerFirstName: customerFirstName.trim(),
      customerLastName: customerLastName.trim(),
      customerEmail: customerEmail.toLowerCase().trim(),
      customerPhone: customerPhone?.trim() || null,
      vehicleMake: vehicleMake.trim(),
      vehicleModel: vehicleModel.trim(),
      vehicleYear: vehicleYear || null,
      vehicleRegistration: vehicleRegistration?.toUpperCase().trim() || null,
      vehicleVin: vehicleVin?.trim() || null,
      vehicleOdometer: vehicleOdometer || null,
      scheduledDate: new Date(scheduledDate),
      scheduledTime: scheduledTime || null,
      estimatedDuration: estimatedDuration || null,
      dropOffDate: dropOffDate ? new Date(dropOffDate) : null,
      dropOffTime: dropOffTime || null,
      pickUpDate: pickUpDate ? new Date(pickUpDate) : null,
      pickUpTime: pickUpTime || null,
      serviceType,
      serviceDescription: serviceDescription || null,
      customerNotes: customerNotes || null,
      isScheduledService: isScheduledService || false,
      isPreviouslyServiced: isPreviouslyServiced || false,
      hasOtherRepairs: hasOtherRepairs || false,
      requiresLoanCar: requiresLoanCar || false,
      status: 'pending',
      priority: priority || 'normal',
      assignedTechnicianId: assignedTechnicianId || null,
      assignedServiceAdvisorId: assignedServiceAdvisorId || null,
      estimatedCost: estimatedCost || null,
    })
    .returning();

  // If this was created from an enquiry, update the enquiry status
  if (enquiryId) {
    await db
      .update(enquiries)
      .set({
        status: ENQUIRY_STATUSES.APPOINTMENT_SET,
        updatedAt: new Date(),
      })
      .where(and(eq(enquiries.id, enquiryId), eq(enquiries.dealerId, dealerId)));
  }

  return {
    success: true,
    appointment,
    message: 'Appointment created successfully',
  };
});
