type AccessoryTrackingItem = {
  id: string;
  name: string;
  price: number;
  category?: string;
  categoryName?: string;
  partNumber?: string;
  savingsAmount?: number;
};

type AccessoryCartTrackingItem = {
  accessory: AccessoryTrackingItem;
  quantity: number;
  type: 'accessory' | 'pack';
};

type SelectedAccessoryModel = {
  name?: string;
  slug?: string;
} | null | undefined;

type AccessoriesCommercePayloadInput = {
  items: AccessoryCartTrackingItem[];
  selectedModel?: SelectedAccessoryModel;
};

type AccessoriesCommerceEventInput = AccessoriesCommercePayloadInput & {
  source?: string;
  reason?: string;
};

export type AccessoriesCommerceEventName =
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'accessories_quote_start'
  | 'accessories_quote_submit'
  | 'clear_cart';

const ACCESSORY_CURRENCY = 'AUD';

const toMoney = (value: number | null | undefined) => {
  return Number((value || 0).toFixed(2));
};

export const buildAccessoriesCommercePayload = ({
  items,
  selectedModel,
}: AccessoriesCommercePayloadInput) => {
  const ecommerceItems = items.map(item => ({
    item_id: item.accessory.id,
    item_name: item.accessory.name,
    item_brand: 'Hyundai',
    item_category: item.type === 'pack' ? 'Accessory Packs' : 'Accessories',
    item_category2: item.accessory.categoryName || item.accessory.category,
    item_variant: item.type,
    price: toMoney(item.accessory.price),
    quantity: item.quantity,
    accessory_type: item.type,
    part_number: item.accessory.partNumber,
  }));

  const value = items.reduce((total, item) => total + (item.accessory.price * item.quantity), 0);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return {
    currency: ACCESSORY_CURRENCY,
    value: toMoney(value),
    items_count: itemCount,
    vehicle_model: selectedModel?.name,
    vehicle_model_slug: selectedModel?.slug,
    items: ecommerceItems,
  };
};

export const buildAccessoryCommerceEvent = (
  event: AccessoriesCommerceEventName,
  input: AccessoriesCommerceEventInput,
) => {
  const ecommerce = buildAccessoriesCommercePayload(input);

  return {
    event,
    source: input.source || 'accessories_store',
    reason: input.reason,
    accessoryCartValue: ecommerce.value,
    accessoryCartItemCount: ecommerce.items_count,
    accessoryVehicleModel: ecommerce.vehicle_model,
    ecommerce,
  };
};

export const pushAccessoryCommerceEvent = (
  event: AccessoriesCommerceEventName,
  input: AccessoriesCommerceEventInput,
) => {
  if (!import.meta.client || typeof window === 'undefined') return;

  const win = window as typeof window & { dataLayer?: Array<Record<string, unknown>> };
  win.dataLayer = win.dataLayer || [];
  win.dataLayer.push(buildAccessoryCommerceEvent(event, input));
};
