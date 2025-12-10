import { db } from '../../../utils/db';
import { enquiries } from '../../../database/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }


  // Get total counts by type
  const typeCounts = await db
    .select({
      type: enquiries.type,
      total: sql<number>`count(*)::int`,
    })
    .from(enquiries)
    .where(eq(enquiries.dealerId, user.dealerId))
    .groupBy(enquiries.type);

  // Get weekly counts by type
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyCounts = await db
    .select({
      type: enquiries.type,
      weekly: sql<number>`count(*)::int`,
    })
    .from(enquiries)
    .where(
      and(
        eq(enquiries.dealerId, user.dealerId),
        gte(enquiries.createdAt, oneWeekAgo)
      )
    )
    .groupBy(enquiries.type);

  // Build stats object
  const formStats: Record<string, any> = {};
  
  const formTypes = ['vehicle', 'contact', 'finance', 'service', 'sell_car', 'parts', 'accessories', 'test_drive'];
  
  for (const formType of formTypes) {
    const totalRow = typeCounts.find(r => r.type === formType);
    const weeklyRow = weeklyCounts.find(r => r.type === formType);
    
    formStats[formType] = {
      total: totalRow?.total || 0,
      weekly: weeklyRow?.weekly || 0,
      weeklyChange: weeklyRow?.weekly || 0,
      // Default notification counts (can be fetched from form_settings table later)
      notifications: {
        admin: 1,
        customer: 1,
      },
    };
  }

  return {
    formStats,
  };
});


