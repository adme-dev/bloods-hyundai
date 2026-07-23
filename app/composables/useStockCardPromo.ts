import {
  promoNow,
  resolveCardPromo,
  resolveCardScroller,
  type ResolvedCardPromo,
  type StockCardPromoSettings,
  type StockPromoGraphic,
} from '~~/shared/stockCardPromo';

type PromoResponse = { success: boolean; settings: StockCardPromoSettings };

export type PromoGridItem =
  | { type: 'vehicle'; key: string; vehicle: any }
  | { type: 'graphic'; key: string; graphic: StockPromoGraphic };

/**
 * Shared access to the dealer's stock card promotion settings
 * (was/now pricing, badges, comments, scrolling banner, group offers,
 * promo graphics and the stock page header).
 * All cards share a single cached fetch per tenant.
 */
export function useStockCardPromo() {
  const key = getRuntimeTenantCacheKey('stock-card-promo-settings');

  const { data } = useAsyncData<PromoResponse | null>(
    key,
    () => $fetch<PromoResponse>('/api/stock-card-promo-settings'),
    {
      getCachedData: (cacheKey, nuxtApp) => nuxtApp.payload.data[cacheKey] || nuxtApp.static.data[cacheKey],
      server: false,
      lazy: true,
      default: () => null,
    },
  );

  const settings = computed<StockCardPromoSettings | null>(() => data.value?.settings ?? null);

  const promoFor = (vehicle: any): ResolvedCardPromo | null => {
    const current = settings.value;
    if (!current || (!current.offers.length && !current.groups.length)) return null;
    // Windows are evaluated in the dealer's timezone, matching the server filter.
    return resolveCardPromo(current, vehicleAttrs(vehicle), promoNow());
  };

  const scrollerFor = (vehicle: any): { text: string; color: string } | null => {
    const current = settings.value;
    if (!current?.scrollers?.length) return null;
    // Windows are evaluated in the dealer's timezone, matching the server filter.
    return resolveCardScroller(current, vehicleAttrs(vehicle), promoNow());
  };

  /**
   * Interleaves the admin-managed promo graphics between vehicles at the
   * configured interval. Used by the homepage Stock Specials slider and the
   * /car-sales grid so both behave identically.
   */
  const gridItemsFor = (vehicles: any[]): PromoGridItem[] => {
    const items: PromoGridItem[] = (vehicles || []).map((vehicle: any, index: number) => ({
      type: 'vehicle',
      key: String(vehicle?.stockid || vehicle?.identifier || vehicle?.id || `vehicle-${index}`),
      vehicle,
    }));

    const graphics = settings.value?.graphics;
    const slots = graphics?.enabled
      ? graphics.items.filter((item) => item.enabled && item.image)
      : [];
    if (!slots.length) return items;

    const interval = Math.max(2, graphics?.interval || 3);
    const out: PromoGridItem[] = [];
    let graphicIndex = 0;
    items.forEach((item, index) => {
      out.push(item);
      if ((index + 1) % interval === 0 && index < items.length - 1) {
        const slot = slots[graphicIndex % slots.length]!;
        out.push({ type: 'graphic', key: `graphic-${graphicIndex}-${slot.id}`, graphic: slot });
        graphicIndex++;
      }
    });
    return out;
  };

  return { settings, promoFor, scrollerFor, gridItemsFor };
}

function vehicleAttrs(vehicle: any) {
  // displayValue first — the admin dropdowns and match counts are built from
  // display strings, so matching must see the same values.
  const first = (field: any) => field?.displayValue?.[0] || field?.value?.[0] || '';
  const price = typeof vehicle?.price === 'string' ? parseFloat(vehicle.price) : vehicle?.price;

  return {
    stockNumber: String(vehicle?.stockid || vehicle?.identifier || vehicle?.id || ''),
    make: first(vehicle?.make),
    model: first(vehicle?.model),
    variant: first(vehicle?.badge) || first(vehicle?.variant),
    condition: first(vehicle?.condition),
    fuel: first(vehicle?.fuel),
    price: Number.isFinite(price) ? price : 0,
  };
}
