import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildBreadcrumbSchema,
  buildDealerSchema,
  getDocumentCacheHeaders,
  shouldExcludeFromSitemap,
} from '../shared/seo.ts';

describe('SEO and cache helpers', () => {
  it('prevents browser storage while allowing short CDN caching for public document routes', () => {
    const headers = getDocumentCacheHeaders('/');

    assert.equal(headers['Cache-Control'], 'no-cache, no-store, must-revalidate');
    assert.match(headers['Netlify-CDN-Cache-Control'], /max-age=300/);
    assert.match(headers['CDN-Cache-Control'], /stale-while-revalidate=3600/);
  });

  it('keeps private and user-specific document routes out of caches', () => {
    for (const path of ['/admin', '/admin/login', '/portal/login', '/secure-vehicle/123', '/payment-success']) {
      const headers = getDocumentCacheHeaders(path);

      assert.equal(headers['Cache-Control'], 'no-cache, no-store, must-revalidate');
      assert.equal(headers['Netlify-CDN-Cache-Control'], 'no-store');
      assert.equal(headers['CDN-Cache-Control'], 'no-store');
    }
  });

  it('excludes private and utility routes from the public sitemap', () => {
    assert.equal(shouldExcludeFromSitemap('/admin/login'), true);
    assert.equal(shouldExcludeFromSitemap('/portal/vehicles'), true);
    assert.equal(shouldExcludeFromSitemap('/payment-success'), true);
    assert.equal(shouldExcludeFromSitemap('/vehicle/tucson'), false);
    assert.equal(shouldExcludeFromSitemap('/car-sales'), false);
  });

  it('builds complete AutoDealer schema from available dealer config fields', () => {
    const schema = buildDealerSchema({
      siteUrl: 'https://bloodhyundai.com.au',
      site: {
        name: 'Blood Hyundai',
        logo: 'https://cdn.example.com/logo.png',
        phone: '(03) 5221 7233',
        showroom_address: 'Cnr Fyans Street & LaTrobe Terrace, Geelong VIC 3220',
        departments: {
          sales: {
            phone: '(03) 5221 7233',
            address: 'Cnr Fyans Street & LaTrobe Terrace, Geelong VIC 3220',
            trading: {
              monday: [{ open: '8:30 am', close: '5:30 pm' }],
            },
          },
        },
      },
    });

    assert.equal(schema['@type'], 'AutoDealer');
    assert.equal(schema.url, 'https://bloodhyundai.com.au');
    assert.equal(schema.address.streetAddress, 'Cnr Fyans Street & LaTrobe Terrace');
    assert.equal(schema.address.addressLocality, 'Geelong');
    assert.equal(schema.address.addressRegion, 'VIC');
    assert.equal(schema.address.postalCode, '3220');
    assert.equal(schema.openingHoursSpecification[0].dayOfWeek, 'Monday');
    assert.equal(schema.openingHoursSpecification[0].opens, '08:30');
  });

  it('builds canonical breadcrumb item URLs', () => {
    const schema = buildBreadcrumbSchema({
      siteUrl: 'https://bloodhyundai.com.au',
      path: '/vehicle/tucson',
    });

    assert.deepEqual(schema.itemListElement.map((item) => item.item), [
      'https://bloodhyundai.com.au/',
      'https://bloodhyundai.com.au/vehicle',
      'https://bloodhyundai.com.au/vehicle/tucson',
    ]);
  });
});
