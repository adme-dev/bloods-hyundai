import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyHyundaiNavigationToSiteConfig,
  compileHyundaiNavigationSitelinks,
  createDefaultHyundaiNavigationSettings,
  normalizeHyundaiNavigationSettings,
} from '../app/utils/siteNavigation.ts';

describe('Hyundai site navigation settings', () => {
  it('compiles admin navigation settings to legacy public nav fields', () => {
    const settings = normalizeHyundaiNavigationSettings({
      links: [
        { id: 'stock', label: 'Our stock', url: '/car-sales' },
        { id: 'offers', label: 'Latest Offers', url: '/special-offers' },
        { id: 'service', label: 'Book a Service', url: '/service', destinationScope: 'service' },
        { id: 'ignored', label: '', url: '/empty-label' },
      ],
      collections: {
        mainnav: [
          { linkId: 'stock' },
          { linkId: 'offers', children: [{ linkId: 'service' }] },
          { linkId: 'missing' },
        ],
        mobileSections: [
          {
            id: 'shop',
            heading: 'Shop',
            items: [{ linkId: 'stock' }, { linkId: 'offers' }],
          },
        ],
        footer: [
          {
            id: 'popular',
            heading: 'Popular',
            items: [{ linkId: 'stock' }, { linkId: 'service' }],
          },
        ],
        quickLinks: [{ linkId: 'service' }],
      },
    });

    const compiled = compileHyundaiNavigationSitelinks(settings);

    assert.deepEqual(compiled.mainnav, [
      { name: 'Our stock', url: '/car-sales' },
      {
        name: 'Latest Offers',
        url: '/special-offers',
        children: [{ name: 'Book a Service', url: '/service' }],
      },
    ]);
    assert.deepEqual(compiled.mobilenav, [
      {
        heading: 'Shop',
        links: [
          { title: 'Our stock', url: '/car-sales' },
          { title: 'Latest Offers', url: '/special-offers' },
        ],
      },
    ]);
    assert.deepEqual(compiled.footer, [
      {
        heading: 'Popular',
        links: [
          { title: 'Our stock', url: '/car-sales' },
          { title: 'Book a Service', url: '/service' },
        ],
      },
    ]);
    assert.deepEqual(compiled.quick_links, [
      { title: 'Book a Service', url: '/service' },
    ]);
  });

  it('creates useful Hyundai defaults from dealer details', () => {
    const defaults = createDefaultHyundaiNavigationSettings({
      themeUrl: 'https://bloodhyundai.com.au/',
      hyundaiNationalUrl: 'https://www.hyundai.com/au/en',
    });
    const compiled = compileHyundaiNavigationSitelinks(defaults);

    assert.equal(defaults.domains.themeUrl, 'https://bloodhyundai.com.au');
    assert.equal(defaults.domains.hyundaiNationalUrl, 'https://www.hyundai.com/au/en');
    assert.deepEqual(
      compiled.mainnav.map((item) => item.name),
      ['Our stock', 'Latest Offers', 'Finance', 'Fleet', 'Sell my car']
    );
    assert.equal(compiled.footer.length > 0, true);
  });

  it('applies compiled navigation to legacy site config fields', () => {
    const settings = normalizeHyundaiNavigationSettings({
      links: [
        { id: 'stock', label: 'Our stock', url: '/car-sales' },
        { id: 'service', label: 'Book a Service', url: '/service' },
      ],
      collections: {
        mainnav: [{ linkId: 'stock' }],
        mobileSections: [],
        footer: [{ id: 'service', heading: 'Service', items: [{ linkId: 'service' }] }],
        quickLinks: [{ linkId: 'service' }],
      },
    });

    const config = applyHyundaiNavigationToSiteConfig({
      name: 'Blood Hyundai',
      promotional: [],
      navigation: { secondary: [{ name: 'Keep me', url: '/keep' }] },
      sitelinks: { legal: [{ title: 'Privacy', url: '/privacy' }] },
    }, settings);

    assert.deepEqual(config.navigation.main, [{ name: 'Our stock', url: '/car-sales' }]);
    assert.deepEqual(config.navigation.secondary, [{ name: 'Keep me', url: '/keep' }]);
    assert.deepEqual(config.sitelinks.mainnav, [{ name: 'Our stock', url: '/car-sales' }]);
    assert.deepEqual(config.sitelinks.footer, [
      { heading: 'Service', links: [{ title: 'Book a Service', url: '/service' }] },
    ]);
    assert.deepEqual(config.sitelinks.legal, [{ title: 'Privacy', url: '/privacy' }]);
    assert.deepEqual(config.quick_links, [{ title: 'Book a Service', url: '/service' }]);
  });
});
