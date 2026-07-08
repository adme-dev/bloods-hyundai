import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getHomepageSellerConfig,
  getInventoryFeedSources,
} from '../server/utils/inventory-config';

describe('tenant inventory config', () => {
  it('uses tenant inventory feed sources before env and hard-coded fallbacks', () => {
    const sources = getInventoryFeedSources('bloods-hyundai', {
      feedSources: [
        { url: 'https://inventory.example.test/blood.json', role: 'primary' },
        { url: 'https://inventory.example.test/group.json', role: 'group' },
      ],
    });

    assert.deepEqual(sources, [
      { url: 'https://inventory.example.test/blood.json', role: 'primary' },
      { url: 'https://inventory.example.test/group.json', role: 'group' },
    ]);
  });

  it('maps tenant feedUrls to deterministic source roles when feedSources is absent', () => {
    const sources = getInventoryFeedSources('sale-hyundai', {
      feedUrls: [
        'https://inventory.example.test/sale.json',
        'https://inventory.example.test/group.json',
        'https://inventory.example.test/secondary.json',
      ],
    });

    assert.deepEqual(sources, [
      { url: 'https://inventory.example.test/sale.json', role: 'primary' },
      { url: 'https://inventory.example.test/group.json', role: 'group' },
      { url: 'https://inventory.example.test/secondary.json', role: 'secondary' },
    ]);
  });

  it('uses tenant seller IDs for homepage filters before Blood fallback IDs', () => {
    const config = getHomepageSellerConfig('bloods-hyundai', {
      primarySellerIds: ['tenant-primary'],
      groupSellerIds: ['tenant-group'],
      secondarySellerIds: ['tenant-secondary'],
    });

    assert.deepEqual(config, {
      primary: ['tenant-primary'],
      group: ['tenant-group'],
      secondary: ['tenant-secondary'],
    });
  });
});
