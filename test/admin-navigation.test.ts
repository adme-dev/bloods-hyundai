import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildAdminNavigationResponse,
  canManageHyundaiNavigation,
  mergeDealerNavigationSettings,
} from '../server/utils/adminNavigation.ts';

describe('admin navigation settings helpers', () => {
  it('allows only manager/admin roles to publish navigation settings', () => {
    assert.equal(canManageHyundaiNavigation('dealer_admin'), true);
    assert.equal(canManageHyundaiNavigation('admin'), true);
    assert.equal(canManageHyundaiNavigation('manager'), true);
    assert.equal(canManageHyundaiNavigation('sales'), false);
    assert.equal(canManageHyundaiNavigation(undefined), false);
  });

  it('merges navigation into dealer settings without replacing other namespaces', () => {
    const now = new Date('2026-07-08T01:02:03.000Z');
    const currentSettings = {
      inventory: { sellerIds: ['seller-1'] },
      chatbot: { enabled: true },
    };

    const updated = mergeDealerNavigationSettings(currentSettings, {
      links: [{ id: 'stock', label: 'Our stock', url: '/car-sales' }],
      collections: {
        mainnav: [{ linkId: 'stock' }],
        mobileSections: [],
        footer: [],
        quickLinks: [],
      },
    }, 'user-1', now);

    assert.deepEqual(updated.inventory, { sellerIds: ['seller-1'] });
    assert.deepEqual(updated.chatbot, { enabled: true });
    assert.equal(updated.navigation.updatedAt, '2026-07-08T01:02:03.000Z');
    assert.equal(updated.navigation.updatedBy, 'user-1');
    assert.deepEqual(updated.navigation.links, [
      {
        id: 'stock',
        label: 'Our stock',
        url: '/car-sales',
        destinationScope: 'theme',
        target: '_self',
      },
    ]);
  });

  it('builds admin response with compiled public preview', () => {
    const response = buildAdminNavigationResponse({
      links: [{ id: 'stock', label: 'Our stock', url: '/car-sales' }],
      collections: {
        mainnav: [{ linkId: 'stock' }],
        mobileSections: [],
        footer: [],
        quickLinks: [{ linkId: 'stock' }],
      },
    }, {
      themeUrl: 'bloodhyundai.com.au',
      hyundaiNationalUrl: 'https://www.hyundai.com/au/en',
    });

    assert.equal(response.navigation.domains.themeUrl, 'https://bloodhyundai.com.au');
    assert.deepEqual(response.preview.sitelinks.mainnav, [
      { name: 'Our stock', url: '/car-sales' },
    ]);
    assert.deepEqual(response.preview.quick_links, [
      { title: 'Our stock', url: '/car-sales' },
    ]);
  });
});
