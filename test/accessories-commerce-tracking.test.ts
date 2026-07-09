import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildAccessoriesCommercePayload,
  buildAccessoryCommerceEvent,
} from '../app/utils/accessoriesCommerceTracking.ts';

const towBar = {
  id: 'tow-bar',
  name: 'Tow Bar Kit',
  price: 1499,
  category: 'Towing',
  categoryName: 'Towing',
  partNumber: 'HY-TOW-1',
};

const protectionPack = {
  id: 'protection-pack',
  name: 'Protection Pack',
  price: 899,
  savingsAmount: 120,
};

describe('accessories commerce tracking', () => {
  it('builds GA4 ecommerce payloads for accessory cart events', () => {
    const payload = buildAccessoriesCommercePayload({
      items: [{ accessory: towBar, quantity: 2, type: 'accessory' }],
      selectedModel: { name: 'Tucson', slug: 'tucson' },
    });

    assert.equal(payload.currency, 'AUD');
    assert.equal(payload.value, 2998);
    assert.equal(payload.items_count, 2);
    assert.equal(payload.vehicle_model, 'Tucson');
    assert.deepEqual(payload.items[0], {
      item_id: 'tow-bar',
      item_name: 'Tow Bar Kit',
      item_brand: 'Hyundai',
      item_category: 'Accessories',
      item_category2: 'Towing',
      item_variant: 'accessory',
      price: 1499,
      quantity: 2,
      accessory_type: 'accessory',
      part_number: 'HY-TOW-1',
    });
  });

  it('builds named dataLayer events with ecommerce and cart context', () => {
    const event = buildAccessoryCommerceEvent('add_to_cart', {
      items: [{ accessory: protectionPack, quantity: 1, type: 'pack' }],
      selectedModel: { name: 'Kona', slug: 'kona' },
      source: 'accessories_store',
    });

    assert.equal(event.event, 'add_to_cart');
    assert.equal(event.source, 'accessories_store');
    assert.equal(event.accessoryCartValue, 899);
    assert.equal(event.accessoryCartItemCount, 1);
    assert.equal(event.ecommerce.items[0].item_category, 'Accessory Packs');
    assert.equal(event.ecommerce.items[0].item_variant, 'pack');
  });
});
