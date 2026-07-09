import { db } from '../../../../../utils/db';
import { serviceAppointments, users } from '../../../../../database/schema';
import { eq, and } from 'drizzle-orm';

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

  const { technicianId, serviceAdvisorId } = body;

  // Verify appointment exists and belongs to dealer
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

  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  // Validate and assign technician
  if (technicianId !== undefined) {
    if (technicianId === null) {
      updateData.assignedTechnicianId = null;
    } else {
      // Verify technician exists and belongs to dealer
      const [technician] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.id, technicianId),
          eq(users.dealerId, dealerId),
          eq(users.isActive, true)
        ));

      if (!technician) {
        throw createError({ statusCode: 400, message: 'Invalid technician' });
      }

      updateData.assignedTechnicianId = technicianId;
    }
  }

  // Validate and assign service advisor
  if (serviceAdvisorId !== undefined) {
    if (serviceAdvisorId === null) {
      updateData.assignedServiceAdvisorId = null;
    } else {
      // Verify service advisor exists and belongs to dealer
      const [advisor] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.id, serviceAdvisorId),
          eq(users.dealerId, dealerId),
          eq(users.isActive, true)
        ));

      if (!advisor) {
        throw createError({ statusCode: 400, message: 'Invalid service advisor' });
      }

      updateData.assignedServiceAdvisorId = serviceAdvisorId;
    }
  }

  // Update the appointment
  const [updated] = await db
    .update(serviceAppointments)
    .set(updateData)
    .where(eq(serviceAppointments.id, appointmentId))
    .returning();

  if (!updated) {
    throw createError({
      statusCode: 404,
      message: 'Appointment not found',
    });
  }

  // Get updated technician/advisor names for response
  let technicianName = null;
  let advisorName = null;

  if (updated.assignedTechnicianId) {
    const [tech] = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, updated.assignedTechnicianId));
    if (tech) technicianName = `${tech.firstName} ${tech.lastName}`;
  }

  if (updated.assignedServiceAdvisorId) {
    const [advisor] = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, updated.assignedServiceAdvisorId));
    if (advisor) advisorName = `${advisor.firstName} ${advisor.lastName}`;
  }

  return {
    success: true,
    appointment: {
      ...updated,
      technicianName,
      advisorName,
    },
    message: 'Assignment updated successfully',
  };
});
