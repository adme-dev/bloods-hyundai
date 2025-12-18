import { eq } from 'drizzle-orm';
import { db } from '../../../../utils/db';
import { dealers } from '../../../../database/schema';
import type { RoutingRule } from '../../../../utils/routing';

/**
 * Add a new routing rule
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

  const body = await readBody(event);
  const newRule: RoutingRule = body.rule;

  if (!newRule || !newRule.id || !newRule.name || !newRule.actions) {
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
    
    // Check for duplicate ID
    if (currentRules.some(r => r.id === newRule.id)) {
      throw createError({
        statusCode: 400,
        message: 'Rule with this ID already exists',
      });
    }

    // Add new rule
    const updatedRules = [...currentRules, newRule];

    // Update database
    await db
      .update(dealers)
      .set({ routingRules: updatedRules })
      .where(eq(dealers.id, dealerId));

    return {
      success: true,
      rule: newRule,
      message: 'Routing rule created successfully',
    };
  } catch (error: any) {
    console.error('Error creating routing rule:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to create routing rule',
    });
  }
});








