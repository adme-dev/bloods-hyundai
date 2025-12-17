import { eq } from 'drizzle-orm';
import { db } from '../../../../utils/db';
import { dealers } from '../../../../database/schema';
import type { RoutingRule } from '../../../../utils/routing';

/**
 * Update an existing routing rule
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
  const body = await readBody(event);
  const updatedRule: RoutingRule = body.rule;

  if (!updatedRule || !updatedRule.id) {
    throw createError({
      statusCode: 400,
      message: 'Invalid rule data',
    });
  }

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
    
    // Find and update the rule
    const ruleIndex = currentRules.findIndex(r => r.id === ruleId);
    
    if (ruleIndex === -1) {
      throw createError({
        statusCode: 404,
        message: 'Rule not found',
      });
    }

    currentRules[ruleIndex] = updatedRule;

    // Update database
    await db
      .update(dealers)
      .set({ routingRules: currentRules })
      .where(eq(dealers.id, dealerId));

    return {
      success: true,
      rule: updatedRule,
      message: 'Routing rule updated successfully',
    };
  } catch (error: any) {
    console.error('Error updating routing rule:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to update routing rule',
    });
  }
});







