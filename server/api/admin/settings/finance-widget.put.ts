import { eq } from 'drizzle-orm';
import { db } from '../../../utils/db';
import { dealers } from '../../../database/schema';

type VehicleCondition = 'new' | 'used' | 'demo';
const VALID_CONDITIONS: VehicleCondition[] = ['new', 'used', 'demo'];

/**
 * Admin API endpoint to update finance widget settings
 * PUT /api/admin/settings/finance-widget
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

  if (!['admin', 'dealer_admin'].includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: 'Insufficient permissions',
    });
  }

  const body = await readBody(event);
  const { useFinanceWidget, financeWidgetIframe, financeWidgetProvider, enabledConditions } = body;

  // Validate iframe (unchanged behavior)
  if (financeWidgetIframe) {
    const trimmedIframe = financeWidgetIframe.trim();
    const isUrl = /^https?:\/\//i.test(trimmedIframe);
    const isIframeHtml = /<iframe/i.test(trimmedIframe);

    if (!isUrl && !isIframeHtml) {
      throw createError({
        statusCode: 400,
        message: 'Invalid iframe: must be a URL starting with http(s):// or iframe HTML code',
      });
    }

    if (/^(javascript|data):/i.test(trimmedIframe)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid iframe URL: javascript: and data: protocols are not allowed',
      });
    }
  }

  // Validate enabledConditions
  if (!Array.isArray(enabledConditions)) {
    throw createError({
      statusCode: 400,
      message: 'enabledConditions must be an array',
    });
  }

  const normalized: VehicleCondition[] = [];
  for (const c of enabledConditions) {
    if (typeof c !== 'string' || !VALID_CONDITIONS.includes(c as VehicleCondition)) {
      throw createError({
        statusCode: 400,
        message: `Invalid condition '${c}'. Must be one of: ${VALID_CONDITIONS.join(', ')}`,
      });
    }
    if (!normalized.includes(c as VehicleCondition)) {
      normalized.push(c as VehicleCondition);
    }
  }

  if (normalized.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'enabledConditions must contain at least one condition',
    });
  }

  try {
    const [currentDealer] = await db
      .select({ settings: dealers.settings })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!currentDealer) {
      throw createError({
        statusCode: 404,
        message: 'Dealer not found',
      });
    }

    const currentSettings = (currentDealer.settings as Record<string, any>) || {};
    const updatedSettings = {
      ...currentSettings,
      financeWidget: {
        useFinanceWidget: Boolean(useFinanceWidget),
        financeWidgetIframe: financeWidgetIframe || null,
        financeWidgetProvider: financeWidgetProvider || null,
        enabledConditions: normalized,
      },
    };

    await db
      .update(dealers)
      .set({
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(dealers.id, dealerId));

    return {
      success: true,
      message: 'Finance widget settings updated successfully',
      settings: updatedSettings.financeWidget,
    };
  } catch (error: any) {
    console.error('Error updating finance widget settings:', error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: 'Failed to update finance widget settings',
    });
  }
});
