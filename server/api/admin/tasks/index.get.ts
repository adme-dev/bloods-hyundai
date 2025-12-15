import { db } from '../../../utils/db';
import { customerTasks, customers } from '../../../database/schema';
import { eq, and, desc, sql, lte, gte, or } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const dealerId = event.context.dealerId;
  const userId = event.context.userId;
  const query = getQuery(event);

  // Build where conditions
  const conditions = [eq(customerTasks.dealerId, dealerId)];

  // Filter by status
  const status = query.status as string;
  if (status && status !== 'all') {
    if (status === 'active') {
      conditions.push(
        or(
          eq(customerTasks.status, 'pending'),
          eq(customerTasks.status, 'in_progress'),
          eq(customerTasks.status, 'overdue')
        )!
      );
    } else {
      conditions.push(eq(customerTasks.status, status));
    }
  }

  // Filter by assigned user
  if (query.assignedTo === 'me') {
    conditions.push(eq(customerTasks.assignedTo, userId));
  } else if (query.assignedTo === 'unassigned') {
    conditions.push(sql`${customerTasks.assignedTo} IS NULL`);
  } else if (query.assignedTo && query.assignedTo !== 'all') {
    conditions.push(eq(customerTasks.assignedTo, query.assignedTo as string));
  }

  // Filter by task type
  if (query.taskType && query.taskType !== 'all') {
    conditions.push(eq(customerTasks.taskType, query.taskType as string));
  }

  // Filter by due date
  if (query.dueDate) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    switch (query.dueDate) {
      case 'overdue':
        conditions.push(lte(customerTasks.dueDate, now));
        conditions.push(
          or(
            eq(customerTasks.status, 'pending'),
            eq(customerTasks.status, 'in_progress')
          )!
        );
        break;
      case 'today':
        conditions.push(gte(customerTasks.dueDate, today));
        conditions.push(lte(customerTasks.dueDate, tomorrow));
        break;
      case 'this_week':
        conditions.push(gte(customerTasks.dueDate, today));
        conditions.push(lte(customerTasks.dueDate, nextWeek));
        break;
    }
  }

  // Pagination
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const offset = (page - 1) * limit;

  // Get tasks with related data
  const tasks = await db.query.customerTasks.findMany({
    where: and(...conditions),
    with: {
      customer: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      assignedUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      creator: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [desc(customerTasks.dueDate)],
    limit,
    offset,
  });

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customerTasks)
    .where(and(...conditions));

  // Get stats
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [overdueStats] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customerTasks)
    .where(and(
      eq(customerTasks.dealerId, dealerId),
      lte(customerTasks.dueDate, now),
      or(
        eq(customerTasks.status, 'pending'),
        eq(customerTasks.status, 'in_progress')
      )!
    ));

  const [todayStats] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customerTasks)
    .where(and(
      eq(customerTasks.dealerId, dealerId),
      gte(customerTasks.dueDate, today),
      lte(customerTasks.dueDate, tomorrow),
      or(
        eq(customerTasks.status, 'pending'),
        eq(customerTasks.status, 'in_progress')
      )!
    ));

  const [myTasksStats] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customerTasks)
    .where(and(
      eq(customerTasks.dealerId, dealerId),
      eq(customerTasks.assignedTo, userId),
      or(
        eq(customerTasks.status, 'pending'),
        eq(customerTasks.status, 'in_progress')
      )!
    ));

  return {
    tasks,
    pagination: {
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
    },
    stats: {
      overdue: Number(overdueStats.count),
      dueToday: Number(todayStats.count),
      myTasks: Number(myTasksStats.count),
    },
  };
});
