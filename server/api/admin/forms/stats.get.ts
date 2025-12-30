import { db } from '../../../utils/db';
import { enquiries, dealers } from '../../../database/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  // Get dealer settings to check form active status
  const [dealer] = await db
    .select()
    .from(dealers)
    .where(eq(dealers.id, user.dealerId));

  const dealerSettings = (dealer?.settings as any) || {};
  const formsSettings = dealerSettings.forms || {};

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
  
  const formTypes = ['vehicle', 'contact', 'finance', 'service', 'sell_car', 'parts', 'accessories', 'test_drive', 'special_offer'];
  
  for (const formType of formTypes) {
    const totalRow = typeCounts.find(r => r.type === formType);
    const weeklyRow = weeklyCounts.find(r => r.type === formType);
    const formSettings = formsSettings[formType] || {};
    const notifications = formSettings.notifications || [];
    
    // Count active admin and customer notifications
    const adminNotifications = notifications.filter((n: any) => n.type === 'admin' && n.isActive !== false).length || 1;
    const customerNotifications = notifications.filter((n: any) => n.type === 'customer' && n.isActive !== false).length || 1;
    
    formStats[formType] = {
      total: totalRow?.total || 0,
      weekly: weeklyRow?.weekly || 0,
      weeklyChange: weeklyRow?.weekly || 0,
      // Get isActive from saved settings, default to true
      isActive: formSettings.isActive ?? true,
      notifications: {
        admin: adminNotifications,
        customer: customerNotifications,
      },
    };
  }

  return {
    formStats,
  };
});










