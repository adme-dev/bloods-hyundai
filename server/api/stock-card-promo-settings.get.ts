import { eq } from 'drizzle-orm';
import { dbHttp as db } from '../utils/db';
import { dealers } from '../database/schema';
import { DEFAULT_DEALER_SLUG, resolveDealerSlug } from '../utils/tenant';
import {
  defaultStockCardPromoSettings,
  defaultStockPageHeader,
  isPromoWindowActive,
  promoNow,
  readStockCardPromoSettings,
  type StockCardPromoSettings,
} from '../../shared/stockCardPromo';

/**
 * Public API endpoint for stock card promotion settings.
 * Drives was/now pricing, badges, comments, the scrolling banner and the
 * promo graphics interleaved between vehicle cards.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const fallbackSlug = config.public.dealerSlug || process.env.DEALER_SLUG || DEFAULT_DEALER_SLUG;
  const dealerSlug = resolveDealerSlug(event, fallbackSlug);

  try {
    const [dealer] = await db
      .select({ settings: dealers.settings })
      .from(dealers)
      .where(eq(dealers.slug, dealerSlug))
      .limit(1);

    const settings = (dealer && readStockCardPromoSettings(dealer.settings)) || defaultStockCardPromoSettings();

    return { success: true, settings: toPublicSettings(settings) };
  } catch (error: any) {
    console.error('Error fetching stock card promotion settings:', error);
    return { success: true, settings: defaultStockCardPromoSettings() };
  }
});

/**
 * Only ship promotions that are inside their scheduled date window; expired
 * or future-dated entries stay admin-only.
 */
function toPublicSettings(settings: StockCardPromoSettings): StockCardPromoSettings {
  const now = promoNow();
  const headerActive = settings.stockHeader.enabled
    && settings.stockHeader.desktop
    && isPromoWindowActive(settings.stockHeader.start, settings.stockHeader.end, now);

  return {
    ...settings,
    offers: settings.offers.filter((offer) => isPromoWindowActive(offer.start, offer.end, now)),
    groups: settings.groups.filter(
      (rule) => rule.enabled && isPromoWindowActive(rule.start, rule.end, now),
    ),
    graphics: {
      ...settings.graphics,
      items: settings.graphics.items.filter(
        (item) => item.enabled && item.image && isPromoWindowActive(item.start, item.end, now),
      ),
    },
    stockHeader: headerActive ? settings.stockHeader : defaultStockPageHeader(),
  };
}
