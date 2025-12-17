import { eq } from 'drizzle-orm';
import { db } from '../../../../utils/db';
import { dealers } from '../../../../database/schema';

/**
 * Get routing rules for the authenticated dealer
 */
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
        id: dealers.id,
        name: dealers.name,
        routingRules: dealers.routingRules,
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

    return {
      rules: dealer.routingRules || [],
      dealerName: dealer.name,
    };
  } catch (error: any) {
    console.error('Error fetching routing rules:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch routing rules',
    });
  }
});







