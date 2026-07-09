import { db } from '../../../../utils/db';
import { serviceAppointments, users } from '../../../../database/schema';
import { eq, and, gte, lte, desc, asc, sql, or, ilike } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const dealerId = user.dealerId;
  const query = getQuery(event);

  // Query params
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const status = query.status as string;
  const search = query.search as string;
  const dateFrom = query.dateFrom as string;
  const dateTo = query.dateTo as string;
  const technicianId = query.technicianId as string;
  const sortBy = query.sortBy as string || 'scheduledDate';
  const sortOrder = query.sortOrder as string || 'asc';

  // Build conditions
  const conditions = [eq(serviceAppointments.dealerId, dealerId)];

  if (status && status !== 'all') {
    conditions.push(eq(serviceAppointments.status, status));
  }

  if (search) {
    conditions.push(
      or(
        ilike(serviceAppointments.customerFirstName, `%${search}%`),
        ilike(serviceAppointments.customerLastName, `%${search}%`),
        ilike(serviceAppointments.customerEmail, `%${search}%`),
        ilike(serviceAppointments.vehicleRegistration, `%${search}%`),
        ilike(serviceAppointments.vehicleMake, `%${search}%`),
        ilike(serviceAppointments.vehicleModel, `%${search}%`)
      )!
    );
  }

  if (dateFrom) {
    conditions.push(gte(serviceAppointments.scheduledDate, new Date(dateFrom)));
  }

  if (dateTo) {
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);
    conditions.push(lte(serviceAppointments.scheduledDate, endDate));
  }

  if (technicianId) {
    conditions.push(eq(serviceAppointments.assignedTechnicianId, technicianId));
  }

  // Get total count
  const [countResultRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(serviceAppointments)
    .where(and(...conditions));
  const countResult = countResultRow ?? { count: 0 };

  // Build sort
  const sortColumn = sortBy === 'scheduledDate'
    ? serviceAppointments.scheduledDate
    : sortBy === 'createdAt'
      ? serviceAppointments.createdAt
      : sortBy === 'status'
        ? serviceAppointments.status
        : serviceAppointments.scheduledDate;

  const orderFn = sortOrder === 'desc' ? desc : asc;

  // Get appointments with technician info
  const appointments = await db
    .select({
      id: serviceAppointments.id,
      customerFirstName: serviceAppointments.customerFirstName,
      customerLastName: serviceAppointments.customerLastName,
      customerEmail: serviceAppointments.customerEmail,
      customerPhone: serviceAppointments.customerPhone,
      vehicleMake: serviceAppointments.vehicleMake,
      vehicleModel: serviceAppointments.vehicleModel,
      vehicleYear: serviceAppointments.vehicleYear,
      vehicleRegistration: serviceAppointments.vehicleRegistration,
      vehicleOdometer: serviceAppointments.vehicleOdometer,
      scheduledDate: serviceAppointments.scheduledDate,
      scheduledTime: serviceAppointments.scheduledTime,
      estimatedDuration: serviceAppointments.estimatedDuration,
      dropOffDate: serviceAppointments.dropOffDate,
      dropOffTime: serviceAppointments.dropOffTime,
      serviceType: serviceAppointments.serviceType,
      serviceDescription: serviceAppointments.serviceDescription,
      customerNotes: serviceAppointments.customerNotes,
      status: serviceAppointments.status,
      priority: serviceAppointments.priority,
      assignedTechnicianId: serviceAppointments.assignedTechnicianId,
      technicianFirstName: users.firstName,
      technicianLastName: users.lastName,
      estimatedCost: serviceAppointments.estimatedCost,
      confirmationSent: serviceAppointments.confirmationSent,
      reminderSent: serviceAppointments.reminderSent,
      createdAt: serviceAppointments.createdAt,
    })
    .from(serviceAppointments)
    .leftJoin(users, eq(serviceAppointments.assignedTechnicianId, users.id))
    .where(and(...conditions))
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset(offset);

  // Get status counts
  const statusCounts = await db
    .select({
      status: serviceAppointments.status,
      count: sql<number>`count(*)`,
    })
    .from(serviceAppointments)
    .where(eq(serviceAppointments.dealerId, dealerId))
    .groupBy(serviceAppointments.status);

  const statusMap = statusCounts.reduce((acc, s) => {
    acc[s.status] = Number(s.count);
    return acc;
  }, {} as Record<string, number>);

  return {
    appointments: appointments.map(a => ({
      ...a,
      customerName: `${a.customerFirstName} ${a.customerLastName}`,
      vehicle: `${a.vehicleYear || ''} ${a.vehicleMake} ${a.vehicleModel}`.trim(),
      technicianName: a.technicianFirstName
        ? `${a.technicianFirstName} ${a.technicianLastName}`
        : null,
    })),
    pagination: {
      page,
      limit,
      total: Number(countResult.count),
      totalPages: Math.ceil(Number(countResult.count) / limit),
    },
    statusCounts: {
      all: Object.values(statusMap).reduce((a, b) => a + b, 0),
      pending: statusMap.pending || 0,
      confirmed: statusMap.confirmed || 0,
      in_progress: statusMap.in_progress || 0,
      awaiting_parts: statusMap.awaiting_parts || 0,
      completed: statusMap.completed || 0,
      cancelled: statusMap.cancelled || 0,
      no_show: statusMap.no_show || 0,
    },
  };
});
