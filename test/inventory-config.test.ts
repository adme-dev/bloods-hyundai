import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getHomepageSellerConfig,
  getInventoryFeedSources,
  getInventorySources,
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

  it('builds tenant inventory sources with provider metadata and role seller IDs', () => {
    const sources = getInventorySources('sale-hyundai', {
      provider: 'carsales',
      sources: [
        { url: 'https://inventory.example.test/sale.json', role: 'primary' },
        { url: 'https://inventory.example.test/group.json', role: 'group', provider: 'driveagent' },
      ],
      primarySellerIds: ['sale-primary'],
      groupSellerIds: ['sale-group'],
    });

    assert.deepEqual(sources, [
      {
        provider: 'carsales',
        transport: 'json-feed',
        url: 'https://inventory.example.test/sale.json',
        role: 'primary',
        sellerIds: ['sale-primary'],
        enabled: true,
      },
      {
        provider: 'driveagent',
        transport: 'json-feed',
        url: 'https://inventory.example.test/group.json',
        role: 'group',
        sellerIds: ['sale-group'],
        enabled: true,
      },
    ]);
  });

  it('keeps legacy feed source output compatible when contract sources are configured', () => {
    const sources = getInventoryFeedSources('sale-hyundai', {
      sources: [
        { url: 'https://inventory.example.test/disabled.json', role: 'primary', enabled: false },
        { url: 'https://inventory.example.test/sale.json', role: 'primary', sellerIds: ['sale-primary'] },
      ],
      feedUrls: ['https://inventory.example.test/legacy.json'],
    });

    assert.deepEqual(sources, [
      { url: 'https://inventory.example.test/sale.json', role: 'primary' },
    ]);
  });
});
