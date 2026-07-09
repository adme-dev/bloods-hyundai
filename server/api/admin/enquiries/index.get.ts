import { db } from '../../../utils/db';
import { enquiries, users } from '../../../database/schema';
import { eq, desc, and, ilike, or, sql, isNull, isNotNull, lte, gt } from 'drizzle-orm';

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

  // Assignment filter: 'unassigned' → no owner; 'assigned' → any owner;
  // any other value is treated as a specific user id.
  if (query.assigned) {
    if (query.assigned === 'unassigned') {
      conditions.push(isNull(enquiries.assignedTo));
    } else if (query.assigned === 'assigned') {
      conditions.push(isNotNull(enquiries.assignedTo));
    } else {
      conditions.push(eq(enquiries.assignedTo, query.assigned as string));
    }
  }

  if (query.search) {
    const searchTerm = `%${query.search}%`;
    conditions.push(
      or(
        ilike(enquiries.firstName, searchTerm),
        ilike(enquiries.lastName, searchTerm),
        ilike(enquiries.email, searchTerm),
      )!
    );
  }
  
  // Pagination with security limit to prevent DoS
  const MAX_LIMIT = 100;
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit as string) || 20));
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
  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enquiries)
    .where(and(...conditions));
  const count = countRow?.count ?? 0;

  // Per-view counts for the tab badges (dealer-scoped, independent of the
  // status/type/search/assigned filters — they reflect how many items live
  // in each view).
  const dealerScope = eq(enquiries.dealerId, dealerId);
  const inboxCond = and(
    dealerScope,
    isNull(enquiries.archivedAt),
    or(isNull(enquiries.snoozedUntil), lte(enquiries.snoozedUntil, now))!,
  );
  const snoozedCond = and(
    dealerScope,
    isNull(enquiries.archivedAt),
    isNotNull(enquiries.snoozedUntil),
    gt(enquiries.snoozedUntil, now),
  );
  const archivedCond = and(dealerScope, isNotNull(enquiries.archivedAt));

  const [inboxRows, snoozedRows, archivedRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(enquiries).where(inboxCond),
    db.select({ count: sql<number>`count(*)` }).from(enquiries).where(snoozedCond),
    db.select({ count: sql<number>`count(*)` }).from(enquiries).where(archivedCond),
  ]);

  return {
    enquiries: results,
    counts: {
      inbox: Number(inboxRows[0]?.count ?? 0),
      snoozed: Number(snoozedRows[0]?.count ?? 0),
      archived: Number(archivedRows[0]?.count ?? 0),
    },
    pagination: {
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
    },
  };
});









