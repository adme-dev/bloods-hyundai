import { db } from '../../../utils/db';
import { enquiries } from '../../../database/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const dealerId = event.context.dealerId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Total enquiries
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(enquiries)
    .where(eq(enquiries.dealerId, dealerId));
  
  // New today
  const [{ newToday }] = await db
    .select({ newToday: sql<number>`count(*)` })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, today)
    ));
  
  // By status
  const byStatus = await db
    .select({
      status: enquiries.status,
      count: sql<number>`count(*)`,
    })
    .from(enquiries)
    .where(eq(enquiries.dealerId, dealerId))
    .groupBy(enquiries.status);
  
  // By type
  const byType = await db
    .select({
      type: enquiries.type,
      count: sql<number>`count(*)`,
    })
    .from(enquiries)
    .where(eq(enquiries.dealerId, dealerId))
    .groupBy(enquiries.type);
  
  return {
    total: Number(total),
    newToday: Number(newToday),
    byStatus,
    byType,
  };
});







