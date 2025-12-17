import { db } from '../../../utils/db';
import { enquiries, users } from '../../../database/schema';
import { eq, desc, and, like, or, sql, isNull, isNotNull, lte, gt } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const dealerId = event.context.dealerId;
  const query = getQuery(event);
  
  // Build where conditions
  const conditions = [eq(enquiries.dealerId, dealerId)];
  
  // Filter by view type (inbox, snoozed, archived)
  const view = query.view as string || 'inbox';
  const now = new Date();
  
  if (view === 'archived') {
    // Show only archived
    conditions.push(isNotNull(enquiries.archivedAt));
  } else if (view === 'snoozed') {
    // Show only snoozed (not archived, snooze time in future)
    conditions.push(isNull(enquiries.archivedAt));
    conditions.push(isNotNull(enquiries.snoozedUntil));
    conditions.push(gt(enquiries.snoozedUntil, now));
  } else {
    // Inbox: not archived, and either not snoozed OR snooze time has passed
    conditions.push(isNull(enquiries.archivedAt));
    conditions.push(
      or(
        isNull(enquiries.snoozedUntil),
        lte(enquiries.snoozedUntil, now)
      )!
    );
  }
  
  if (query.status) {
    conditions.push(eq(enquiries.status, query.status as string));
  }
  
  if (query.type) {
    conditions.push(eq(enquiries.type, query.type as string));
  }
  
  if (query.search) {
    const searchTerm = `%${query.search}%`;
    conditions.push(
      or(
        like(enquiries.firstName, searchTerm),
        like(enquiries.lastName, searchTerm),
        like(enquiries.email, searchTerm),
      )!
    );
  }
  
  // Pagination
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const offset = (page - 1) * limit;
  
  // Get enquiries with assigned user
  const results = await db.query.enquiries.findMany({
    where: and(...conditions),
    with: {
      assignedUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: [desc(enquiries.createdAt)],
    limit,
    offset,
  });
  
  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enquiries)
    .where(and(...conditions));
  
  return {
    enquiries: results,
    pagination: {
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
    },
  };
});







