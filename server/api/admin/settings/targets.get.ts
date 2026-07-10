import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  try {
    const [dealer] = await db
      .select({
        settings: dealers.settings,
      })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!dealer) {
      throw createError({
        statusCode: 404,
        message: 'Dealer not found',
      });
    }

    // Extract targets from dealer settings
    const settings = dealer.settings as Record<string, any> || {};
    const targets = settings.salesTargets || {
      monthlyLeads: 50,
      monthlyConversions: 15,
      conversionRateTarget: 30,
      accessoriesRevenueTarget: 10000,
      responseTimeHours: 1,
      criticalResponseHours: 24,
      monthlyTestDrives: 25,
      testDriveConversionTarget: 50,
    };
    const avgSaleValue: number | null = settings.marketing?.avgSaleValue ?? null;

    return { targets, avgSaleValue };
  } catch (error: any) {
    console.error('Error fetching sales targets:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch sales targets',
    });
  }
});
