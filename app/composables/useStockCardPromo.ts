import {
  promoNow,
  resolveCardPromo,
  type ResolvedCardPromo,
  type StockCardPromoSettings,
} from '~~/shared/stockCardPromo';

type PromoResponse = { success: boolean; settings: StockCardPromoSettings };

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

  return { settings, promoFor };
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
    price: Number.isFinite(price) ? price : 0,
  };
}
