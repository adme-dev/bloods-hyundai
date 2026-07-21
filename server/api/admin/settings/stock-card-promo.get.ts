import { eq } from 'drizzle-orm';
import { dealers } from '../../../database/schema';
import { db } from '../../../utils/db';
import {
  STOCK_CARD_PROMO_MAX_GRAPHICS,
  STOCK_CARD_PROMO_MAX_GROUPS,
  STOCK_CARD_PROMO_MAX_INTERVAL,
  STOCK_CARD_PROMO_MAX_OFFERS,
  STOCK_CARD_PROMO_MIN_INTERVAL,
  defaultStockCardPromoSettings,
  readStockCardPromoSettings,
} from '../../../../shared/stockCardPromo';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;
  if (!user || !dealerId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  try {
    const [dealer] = await db
      .select({ settings: dealers.settings })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!dealer) throw createError({ statusCode: 404, message: 'Dealer not found' });

    const settings = readStockCardPromoSettings(dealer.settings) || defaultStockCardPromoSettings();
    return {
      success: true,
      source: settings.updatedAt ? 'custom' : 'default',
      settings,
      limits: {
        maxOffers: STOCK_CARD_PROMO_MAX_OFFERS,
        maxGroups: STOCK_CARD_PROMO_MAX_GROUPS,
        maxGraphics: STOCK_CARD_PROMO_MAX_GRAPHICS,
        minInterval: STOCK_CARD_PROMO_MIN_INTERVAL,
        maxInterval: STOCK_CARD_PROMO_MAX_INTERVAL,
        acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      },
    };
  } catch (error: any) {
    if (error?.statusCode) throw error;
    console.error('Failed to load stock card promotion settings:', error);
    throw createError({ statusCode: 500, message: 'Failed to load stock card promotion settings' });
  }
});
