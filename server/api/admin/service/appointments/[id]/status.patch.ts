import { db } from '../../../../../utils/db';
import { serviceAppointments, serviceHistory, customerVehicles } from '../../../../../database/schema';
import { eq, and } from 'drizzle-orm';

const VALID_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'awaiting_parts',
  'completed',
  'cancelled',
  'no_show',
];

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const dealerId = user.dealerId;
  const appointmentId = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!appointmentId) {
    throw createError({ statusCode: 400, message: 'Appointment ID is required' });
  }

  const { status, completedOdometer, workPerformed, internalNotes } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    throw createError({
      statusCode: 400,
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  // Get current appointment
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

  // Build update data
  const updateData: Record<string, any> = {
    status,
    updatedAt: new Date(),
  };

  // Handle completion
  if (status === 'completed') {
    updateData.completedAt = new Date();
    if (completedOdometer) updateData.completedOdometer = completedOdometer;
    if (workPerformed) updateData.workPerformed = workPerformed;

    // Create service history record
    await db.insert(serviceHistory).values({
      dealerId,
      appointmentId,
      customerId: appointment.customerId,
      vehicleId: appointment.vehicleId,
      serviceDate: new Date(),
      serviceType: appointment.serviceType,
      odometerReading: completedOdometer || appointment.vehicleOdometer,
      workPerformed: workPerformed || appointment.serviceDescription || 'Service completed',
      technicianId: appointment.assignedTechnicianId,
      totalCost: appointment.actualCost || appointment.estimatedCost,
      invoiceNumber: appointment.invoiceNumber,
    });

    // Update vehicle's last service date if linked
    if (appointment.vehicleId) {
      await db
        .update(customerVehicles)
        .set({
          lastServiceDate: new Date(),
          currentOdometer: completedOdometer || appointment.vehicleOdometer,
          updatedAt: new Date(),
        })
        .where(eq(customerVehicles.id, appointment.vehicleId));
    }
  }

  // Handle actual drop-off tracking
  if (status === 'in_progress' && !appointment.actualDropOff) {
    updateData.actualDropOff = new Date();
  }

  // Add internal notes if provided
  if (internalNotes) {
    updateData.internalNotes = appointment.internalNotes
      ? `${appointment.internalNotes}\n\n[${new Date().toLocaleString()}] ${internalNotes}`
      : `[${new Date().toLocaleString()}] ${internalNotes}`;
  }

  // Update the appointment
  const [updated] = await db
    .update(serviceAppointments)
    .set(updateData)
    .where(eq(serviceAppointments.id, appointmentId))
    .returning();

  return {
    success: true,
    appointment: updated,
    message: `Appointment status updated to ${status}`,
  };
});
