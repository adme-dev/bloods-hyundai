import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';
import { parseAvgSaleValue } from '../../../utils/metrics/avgSaleValue';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;

  if (!user || !dealerId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const body = await readBody(event);
  const { targets } = body;

  if (!targets || typeof targets !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'Invalid targets data',
    });
  }

  // Validate targets
  const validatedTargets = {
    monthlyLeads: Math.max(1, Number(targets.monthlyLeads) || 50),
    monthlyConversions: Math.max(1, Number(targets.monthlyConversions) || 15),
    conversionRateTarget: Math.min(100, Math.max(1, Number(targets.conversionRateTarget) || 30)),
    accessoriesRevenueTarget: Math.max(0, Number(targets.accessoriesRevenueTarget) || 10000),
    responseTimeHours: Math.max(0.5, Number(targets.responseTimeHours) || 1),
    criticalResponseHours: Math.max(1, Number(targets.criticalResponseHours) || 24),
    monthlyTestDrives: Math.max(0, Number(targets.monthlyTestDrives) || 25),
    testDriveConversionTarget: Math.min(100, Math.max(1, Number(targets.testDriveConversionTarget) || 50)),
  };

  try {
    // Get current dealer settings
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

    // Merge with existing settings
    const currentSettings = dealer.settings as Record<string, any> || {};
    const currentMarketing = (currentSettings.marketing as Record<string, any>) || {};
    // Only touch marketing.avgSaleValue when the key is present in the body — this
    // preserves marketing.integrations (GA4/Meta/Google config) untouched, and avoids
    // clearing a previously-saved avgSaleValue when the caller omits the field.
    const updatedMarketing = Object.prototype.hasOwnProperty.call(body, 'avgSaleValue')
      ? { ...currentMarketing, avgSaleValue: parseAvgSaleValue(body.avgSaleValue) }
      : currentMarketing;
    const updatedSettings = {
      ...currentSettings,
      salesTargets: validatedTargets,
      marketing: updatedMarketing,
    };

    // Update dealer settings
    await db
      .update(dealers)
      .set({
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(dealers.id, dealerId));

    return {
      success: true,
      targets: validatedTargets,
      avgSaleValue: updatedMarketing.avgSaleValue ?? null,
    };
  } catch (error: any) {
    console.error('Error updating sales targets:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to update sales targets',
    });
  }
});
