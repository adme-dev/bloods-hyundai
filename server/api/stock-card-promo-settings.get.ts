import { eq } from 'drizzle-orm';
import { dbHttp } from '../utils/db';
import { dealers } from '../database/schema';
import { invalidateNitroFunctionCache } from '../utils/cache-refresh';
import { DEFAULT_DEALER_SLUG, resolveDealerSlug, resolveTenantCacheKey } from '../utils/tenant';
import {
  defaultStockCardPromoSettings,
  defaultStockPageHeader,
  isPromoWindowActive,
  promoNow,
  readStockCardPromoSettings,
  type StockCardPromoSettings,
} from '../../shared/stockCardPromo';

export const STOCK_CARD_PROMO_CACHE_NAME = 'stock-card-promo';
export const STOCK_CARD_PROMO_CACHE_KEY = 'stock-card-promo-data:v1';

/**
 * Public API endpoint for stock card promotion settings.
 * Drives was/now pricing, badges, comments, group offers, the scrolling
 * banner, promo graphics between cards and the stock page header.
 *
 * Cached per tenant; the admin PUT invalidates this cache on every save so
 * published promotions appear immediately. `?refresh=true` forces a rebuild.
 */
export default defineEventHandler(async (event) => {
  const cacheKey = resolveTenantCacheKey(event, STOCK_CARD_PROMO_CACHE_KEY);
  const forceRefresh = getQuery(event).refresh === 'true';

  try {
    if (forceRefresh) {
      await invalidateNitroFunctionCache(useStorage('cache'), STOCK_CARD_PROMO_CACHE_NAME, cacheKey);
    }

    const config = useRuntimeConfig();
    const fallbackSlug = config.public.dealerSlug || process.env.DEALER_SLUG || DEFAULT_DEALER_SLUG;
    const dealerSlug = resolveDealerSlug(event, fallbackSlug);

    const settings = await getCachedPromoSettings(cacheKey, dealerSlug);
    setResponseHeader(event, 'Cache-Control', 'no-store');

    return { success: true, settings };
  } catch (error: any) {
    console.error('Error fetching stock card promotion settings:', error);
    return { success: true, settings: defaultStockCardPromoSettings() };
  }
});

const getCachedPromoSettings = defineCachedFunction(
  async (cacheKey: string, dealerSlug: string) => loadPublicSettings(dealerSlug),
  {
    maxAge: 300,
    staleMaxAge: 600,
    name: STOCK_CARD_PROMO_CACHE_NAME,
    getKey: (cacheKey: string) => cacheKey,
  },
);

async function loadPublicSettings(dealerSlug: string): Promise<StockCardPromoSettings> {
  const [dealer] = await dbHttp
    .select({ settings: dealers.settings })
    .from(dealers)
    .where(eq(dealers.slug, dealerSlug))
    .limit(1);

  const settings = (dealer && readStockCardPromoSettings(dealer.settings)) || defaultStockCardPromoSettings();
  return toPublicSettings(settings);
}

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
