import { db } from '../../../utils/db';
import { serviceAppointments, users, enquiries } from '../../../database/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const dealerId = user.dealerId;
  const now = new Date();

  // Time boundaries
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(todayStart);
  monthStart.setDate(1);

  // ============================================================================
  // TODAY'S OVERVIEW
  // ============================================================================

  const [todayStats] = await db
    .select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${serviceAppointments.status} = 'pending')`,
      confirmed: sql<number>`count(*) filter (where ${serviceAppointments.status} = 'confirmed')`,
      inProgress: sql<number>`count(*) filter (where ${serviceAppointments.status} = 'in_progress')`,
      completed: sql<number>`count(*) filter (where ${serviceAppointments.status} = 'completed')`,
      cancelled: sql<number>`count(*) filter (where ${serviceAppointments.status} = 'cancelled')`,
    })
    .from(serviceAppointments)
    .where(and(
      eq(serviceAppointments.dealerId, dealerId),
      gte(serviceAppointments.scheduledDate, todayStart),
      lte(serviceAppointments.scheduledDate, todayEnd)
    ));

  // ============================================================================
  // THIS WEEK'S OVERVIEW
  // ============================================================================

  const [weekStats] = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`count(*) filter (where ${serviceAppointments.status} = 'completed')`,
      revenue: sql<number>`sum(cast(${serviceAppointments.actualCost} as numeric))`,
    })
    .from(serviceAppointments)
    .where(and(
      eq(serviceAppointments.dealerId, dealerId),
      gte(serviceAppointments.scheduledDate, weekStart),
      lte(serviceAppointments.scheduledDate, weekEnd)
    ));

  // ============================================================================
  // PENDING SERVICE ENQUIRIES (not yet converted to appointments)
  // ============================================================================

  const [pendingEnquiries] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      eq(enquiries.type, 'service'),
      eq(enquiries.status, 'new')
    ));

  // ============================================================================
  // TODAY'S APPOINTMENTS LIST
  // ============================================================================

  const todaysAppointments = await db
    .select({
      id: serviceAppointments.id,
      customerFirstName: serviceAppointments.customerFirstName,
      customerLastName: serviceAppointments.customerLastName,
      customerPhone: serviceAppointments.customerPhone,
      vehicleMake: serviceAppointments.vehicleMake,
      vehicleModel: serviceAppointments.vehicleModel,
      vehicleYear: serviceAppointments.vehicleYear,
      vehicleRegistration: serviceAppointments.vehicleRegistration,
      scheduledTime: serviceAppointments.scheduledTime,
      serviceType: serviceAppointments.serviceType,
      status: serviceAppointments.status,
      priority: serviceAppointments.priority,
      technicianFirstName: users.firstName,
      technicianLastName: users.lastName,
    })
    .from(serviceAppointments)
    .leftJoin(users, eq(serviceAppointments.assignedTechnicianId, users.id))
    .where(and(
      eq(serviceAppointments.dealerId, dealerId),
      gte(serviceAppointments.scheduledDate, todayStart),
      lte(serviceAppointments.scheduledDate, todayEnd)
    ))
    .orderBy(serviceAppointments.scheduledTime);

  // ============================================================================
  // UPCOMING APPOINTMENTS (Next 7 days)
  // ============================================================================

  const nextWeek = new Date(todayEnd);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingAppointments = await db
    .select({
      id: serviceAppointments.id,
      customerFirstName: serviceAppointments.customerFirstName,
      customerLastName: serviceAppointments.customerLastName,
      vehicleMake: serviceAppointments.vehicleMake,
      vehicleModel: serviceAppointments.vehicleModel,
      vehicleRegistration: serviceAppointments.vehicleRegistration,
      scheduledDate: serviceAppointments.scheduledDate,
      scheduledTime: serviceAppointments.scheduledTime,
      serviceType: serviceAppointments.serviceType,
      status: serviceAppointments.status,
    })
    .from(serviceAppointments)
    .where(and(
      eq(serviceAppointments.dealerId, dealerId),
      gte(serviceAppointments.scheduledDate, todayEnd),
      lte(serviceAppointments.scheduledDate, nextWeek),
      sql`${serviceAppointments.status} not in ('completed', 'cancelled', 'no_show')`
    ))
    .orderBy(serviceAppointments.scheduledDate, serviceAppointments.scheduledTime)
    .limit(10);

  // ============================================================================
  // TECHNICIAN WORKLOAD
  // ============================================================================

  const technicianWorkload = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      todayAssigned: sql<number>`count(*) filter (
        where ${serviceAppointments.scheduledDate} >= ${todayStart}
        and ${serviceAppointments.scheduledDate} <= ${todayEnd}
      )`,
      todayCompleted: sql<number>`count(*) filter (
        where ${serviceAppointments.scheduledDate} >= ${todayStart}
        and ${serviceAppointments.scheduledDate} <= ${todayEnd}
        and ${serviceAppointments.status} = 'completed'
      )`,
      weekTotal: sql<number>`count(*) filter (
        where ${serviceAppointments.scheduledDate} >= ${weekStart}
        and ${serviceAppointments.scheduledDate} <= ${weekEnd}
      )`,
    })
    .from(users)
    .leftJoin(serviceAppointments, eq(serviceAppointments.assignedTechnicianId, users.id))
    .where(and(
      eq(users.dealerId, dealerId),
      eq(users.isActive, true),
      eq(users.department, 'service')
    ))
    .groupBy(users.id, users.firstName, users.lastName);

  // ============================================================================
  // SERVICE TYPE BREAKDOWN (This month)
  // ============================================================================

  const serviceTypeBreakdown = await db
    .select({
      serviceType: serviceAppointments.serviceType,
      count: sql<number>`count(*)`,
      completed: sql<number>`count(*) filter (where ${serviceAppointments.status} = 'completed')`,
    })
    .from(serviceAppointments)
    .where(and(
      eq(serviceAppointments.dealerId, dealerId),
      gte(serviceAppointments.scheduledDate, monthStart)
    ))
    .groupBy(serviceAppointments.serviceType)
    .orderBy(desc(sql`count(*)`));

  // ============================================================================
  // OVERDUE APPOINTMENTS (Confirmed but past scheduled date)
  // ============================================================================

  const overdueAppointments = await db
    .select({
      id: serviceAppointments.id,
      customerFirstName: serviceAppointments.customerFirstName,
      customerLastName: serviceAppointments.customerLastName,
      vehicleRegistration: serviceAppointments.vehicleRegistration,
      scheduledDate: serviceAppointments.scheduledDate,
      serviceType: serviceAppointments.serviceType,
    })
    .from(serviceAppointments)
    .where(and(
      eq(serviceAppointments.dealerId, dealerId),
      lte(serviceAppointments.scheduledDate, todayStart),
      sql`${serviceAppointments.status} in ('pending', 'confirmed')`
    ))
    .orderBy(serviceAppointments.scheduledDate)
    .limit(5);

  return {
    today: {
      total: Number(todayStats.total),
      pending: Number(todayStats.pending),
      confirmed: Number(todayStats.confirmed),
      inProgress: Number(todayStats.inProgress),
      completed: Number(todayStats.completed),
      cancelled: Number(todayStats.cancelled),
      appointments: todaysAppointments.map(a => ({
        id: a.id,
        customer: `${a.customerFirstName} ${a.customerLastName}`,
        phone: a.customerPhone,
        vehicle: `${a.vehicleYear || ''} ${a.vehicleMake} ${a.vehicleModel}`.trim(),
        registration: a.vehicleRegistration,
        time: a.scheduledTime,
        serviceType: a.serviceType,
        status: a.status,
        priority: a.priority,
        technician: a.technicianFirstName
          ? `${a.technicianFirstName} ${a.technicianLastName}`
          : null,
      })),
    },
    week: {
      total: Number(weekStats.total),
      completed: Number(weekStats.completed),
      revenue: Number(weekStats.revenue) || 0,
      completionRate: weekStats.total > 0
        ? Math.round((Number(weekStats.completed) / Number(weekStats.total)) * 100)
        : 0,
    },
    pendingEnquiries: Number(pendingEnquiries.count),
    upcoming: upcomingAppointments.map(a => ({
      id: a.id,
      customer: `${a.customerFirstName} ${a.customerLastName}`,
      vehicle: `${a.vehicleMake} ${a.vehicleModel}`,
      registration: a.vehicleRegistration,
      date: a.scheduledDate,
      time: a.scheduledTime,
      serviceType: a.serviceType,
      status: a.status,
    })),
    technicianWorkload: technicianWorkload.map(t => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`,
      todayAssigned: Number(t.todayAssigned),
      todayCompleted: Number(t.todayCompleted),
      weekTotal: Number(t.weekTotal),
    })),
    serviceTypes: serviceTypeBreakdown.map(s => ({
      type: s.serviceType,
      count: Number(s.count),
      completed: Number(s.completed),
    })),
    overdueCount: overdueAppointments.length,
    overdueAppointments: overdueAppointments.map(a => ({
      id: a.id,
      customer: `${a.customerFirstName} ${a.customerLastName}`,
      registration: a.vehicleRegistration,
      scheduledDate: a.scheduledDate,
      serviceType: a.serviceType,
    })),
  };
});
