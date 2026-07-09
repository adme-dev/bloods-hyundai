import { db } from '../../../../utils/db';
import { serviceAppointments, users } from '../../../../database/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const dealerId = user.dealerId;
  const query = getQuery(event);

  // Default to current week if no dates provided
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const dateFrom = query.dateFrom
    ? new Date(query.dateFrom as string)
    : startOfWeek;
  const dateTo = query.dateTo
    ? new Date(query.dateTo as string)
    : endOfWeek;

  // Get appointments for the date range
  const appointments = await db
    .select({
      id: serviceAppointments.id,
      customerFirstName: serviceAppointments.customerFirstName,
      customerLastName: serviceAppointments.customerLastName,
      customerPhone: serviceAppointments.customerPhone,
      vehicleMake: serviceAppointments.vehicleMake,
      vehicleModel: serviceAppointments.vehicleModel,
      vehicleYear: serviceAppointments.vehicleYear,
      vehicleRegistration: serviceAppointments.vehicleRegistration,
      scheduledDate: serviceAppointments.scheduledDate,
      scheduledTime: serviceAppointments.scheduledTime,
      estimatedDuration: serviceAppointments.estimatedDuration,
      serviceType: serviceAppointments.serviceType,
      status: serviceAppointments.status,
      priority: serviceAppointments.priority,
      assignedTechnicianId: serviceAppointments.assignedTechnicianId,
      technicianFirstName: users.firstName,
      technicianLastName: users.lastName,
    })
    .from(serviceAppointments)
    .leftJoin(users, eq(serviceAppointments.assignedTechnicianId, users.id))
    .where(and(
      eq(serviceAppointments.dealerId, dealerId),
      gte(serviceAppointments.scheduledDate, dateFrom),
      lte(serviceAppointments.scheduledDate, dateTo)
    ))
    .orderBy(serviceAppointments.scheduledDate, serviceAppointments.scheduledTime);

  // Group appointments by date
  const appointmentsByDate: Record<string, any[]> = {};

  for (const apt of appointments) {
    const dateKey = apt.scheduledDate.toISOString().split('T')[0] || '';
    if (!dateKey) continue;
    if (!appointmentsByDate[dateKey]) {
      appointmentsByDate[dateKey] = [];
    }
    appointmentsByDate[dateKey]?.push({
      id: apt.id,
      title: `${apt.vehicleYear || ''} ${apt.vehicleMake} ${apt.vehicleModel}`.trim(),
      customer: `${apt.customerFirstName} ${apt.customerLastName}`,
      phone: apt.customerPhone,
      registration: apt.vehicleRegistration,
      time: apt.scheduledTime,
      duration: apt.estimatedDuration,
      serviceType: apt.serviceType,
      status: apt.status,
      priority: apt.priority,
      technician: apt.technicianFirstName
        ? `${apt.technicianFirstName} ${apt.technicianLastName}`
        : null,
      technicianId: apt.assignedTechnicianId,
    });
  }

  // Get daily counts by status
  const dailyCounts = await db
    .select({
      date: sql<string>`date_trunc('day', ${serviceAppointments.scheduledDate})::date`,
      status: serviceAppointments.status,
      count: sql<number>`count(*)`,
    })
    .from(serviceAppointments)
    .where(and(
      eq(serviceAppointments.dealerId, dealerId),
      gte(serviceAppointments.scheduledDate, dateFrom),
      lte(serviceAppointments.scheduledDate, dateTo)
    ))
    .groupBy(
      sql`date_trunc('day', ${serviceAppointments.scheduledDate})::date`,
      serviceAppointments.status
    );

  // Build daily summary
  const dailySummary: Record<string, { total: number; pending: number; confirmed: number; in_progress: number; completed: number }> = {};

  for (const count of dailyCounts) {
    const dateKey = count.date;
    if (!dailySummary[dateKey]) {
      dailySummary[dateKey] = { total: 0, pending: 0, confirmed: 0, in_progress: 0, completed: 0 };
    }
    dailySummary[dateKey].total += Number(count.count);
    if (count.status === 'pending') dailySummary[dateKey].pending += Number(count.count);
    if (count.status === 'confirmed') dailySummary[dateKey].confirmed += Number(count.count);
    if (count.status === 'in_progress') dailySummary[dateKey].in_progress += Number(count.count);
    if (count.status === 'completed') dailySummary[dateKey].completed += Number(count.count);
  }

  // Get technicians for filtering
  const technicians = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(and(
      eq(users.dealerId, dealerId),
      eq(users.isActive, true),
      eq(users.department, 'service')
    ));

  return {
    dateRange: {
      from: dateFrom.toISOString(),
      to: dateTo.toISOString(),
    },
    appointments: appointmentsByDate,
    dailySummary,
    technicians: technicians.map(t => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`,
    })),
    totalAppointments: appointments.length,
  };
});
