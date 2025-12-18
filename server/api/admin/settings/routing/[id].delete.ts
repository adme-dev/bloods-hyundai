import { eq } from 'drizzle-orm';
import { db } from '../../../../utils/db';
import { dealers } from '../../../../database/schema';
import type { RoutingRule } from '../../../../utils/routing';

/**
 * Delete a routing rule
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

  // Only admins can manage routing rules
  if (user.role !== 'dealer_admin') {
    throw createError({
      statusCode: 403,
      message: 'Only admins can manage routing rules',
    });
  }

  const ruleId = getRouterParam(event, 'id');

  try {
    // Get current rules
    const [dealer] = await db
      .select({ routingRules: dealers.routingRules })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!dealer) {
      throw createError({
        statusCode: 404,
        message: 'Dealer not found',
      });
    }

    const currentRules = (dealer.routingRules as RoutingRule[]) || [];
    
    // Filter out the rule to delete
    const updatedRules = currentRules.filter(r => r.id !== ruleId);
    
    if (updatedRules.length === currentRules.length) {
      throw createError({
        statusCode: 404,
        message: 'Rule not found',
      });
    }

    // Update database
    await db
      .update(dealers)
      .set({ routingRules: updatedRules })
      .where(eq(dealers.id, dealerId));

    return {
      success: true,
      message: 'Routing rule deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting routing rule:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to delete routing rule',
    });
  }
});








