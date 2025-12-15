import { db } from '../../../utils/db';
import { customers, customerRetentionProfiles, customerVehicles, customerActivities, customerTasks, serviceAppointments, enquiries } from '../../../database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const dealerId = event.context.dealerId;
  const customerId = getRouterParam(event, 'id');

  if (!customerId) {
    throw createError({
      statusCode: 400,
      message: 'Customer ID is required',
    });
  }

  // Get customer with related data
  const customer = await db.query.customers.findFirst({
    where: and(eq(customers.id, customerId), eq(customers.dealerId, dealerId)),
  });

  if (!customer) {
    throw createError({
      statusCode: 404,
      message: 'Customer not found',
    });
  }

  // Get retention profile
  const retentionProfile = await db.query.customerRetentionProfiles.findFirst({
    where: and(
      eq(customerRetentionProfiles.customerId, customerId),
      eq(customerRetentionProfiles.dealerId, dealerId)
    ),
  });

  // Get vehicles
  const vehicles = await db.query.customerVehicles.findMany({
    where: and(
      eq(customerVehicles.customerId, customerId),
      eq(customerVehicles.dealerId, dealerId),
      eq(customerVehicles.isActive, true)
    ),
    orderBy: [desc(customerVehicles.createdAt)],
  });

  // Get recent activities (last 50)
  const activities = await db.query.customerActivities.findMany({
    where: and(
      eq(customerActivities.customerId, customerId),
      eq(customerActivities.dealerId, dealerId)
    ),
    with: {
      creator: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [desc(customerActivities.activityDate)],
    limit: 50,
  });

  // Get pending tasks
  const tasks = await db.query.customerTasks.findMany({
    where: and(
      eq(customerTasks.customerId, customerId),
      eq(customerTasks.dealerId, dealerId),
      sql`${customerTasks.status} IN ('pending', 'in_progress', 'overdue')`
    ),
    with: {
      assignedUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [desc(customerTasks.dueDate)],
    limit: 10,
  });

  // Get service appointments
  const appointments = await db.query.serviceAppointments.findMany({
    where: and(
      eq(serviceAppointments.customerId, customerId),
      eq(serviceAppointments.dealerId, dealerId)
    ),
    orderBy: [desc(serviceAppointments.scheduledDate)],
    limit: 10,
  });

  // Get related enquiries
  const relatedEnquiries = await db.query.enquiries.findMany({
    where: and(
      eq(enquiries.dealerId, dealerId),
      eq(enquiries.email, customer.email)
    ),
    orderBy: [desc(enquiries.createdAt)],
    limit: 10,
  });

  // Calculate engagement metrics
  const totalActivities = activities.length;
  const emailActivities = activities.filter(a => a.activityType.includes('email')).length;
  const callActivities = activities.filter(a => a.activityType.includes('call')).length;
  const serviceCount = appointments.length;

  return {
    customer: {
      ...customer,
      retentionProfile,
      vehicles,
      activities,
      tasks,
      appointments,
      enquiries: relatedEnquiries,
      metrics: {
        totalActivities,
        emailActivities,
        callActivities,
        serviceCount,
        vehicleCount: vehicles.length,
        pendingTasks: tasks.length,
      },
    },
  };
});
