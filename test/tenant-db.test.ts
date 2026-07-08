import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('feature-flagged tenant resolver', () => {
  it('keeps the hard-coded fallback resolver when DB tenant resolution is disabled', async () => {
    const previous = process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER;
    const previousDatabaseUrl = process.env.NEON_DATABASE_URL;
    delete process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER;
    delete process.env.NEON_DATABASE_URL;

    const { isDbTenantResolverEnabled, resolveTenantContext } = await import('../server/utils/tenant-db.ts');

    assert.equal(isDbTenantResolverEnabled(), false);

    const result = await resolveTenantContext({
      node: {
        req: {
          headers: {
            host: 'www.salehyundai.com.au',
          },
        },
      },
    } as any);

    assert.equal(result.source, 'fallback-map');
    assert.equal(result.hostname, 'www.salehyundai.com.au');
    assert.equal(result.tenant.slug, 'sale-hyundai');
    assert.equal(result.tenant.name, 'Sale Hyundai');

    if (previous === undefined) {
      delete process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER;
    } else {
      process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER = previous;
    }

    if (previousDatabaseUrl === undefined) {
      delete process.env.NEON_DATABASE_URL;
    } else {
      process.env.NEON_DATABASE_URL = previousDatabaseUrl;
    }
  });

  it('carries tenant-owned Blood inventory settings through the fallback resolver', async () => {
    const previous = process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER;
    delete process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER;

    const { resolveTenantContext } = await import('../server/utils/tenant-db.ts');

    const result = await resolveTenantContext({
      node: {
        req: {
          headers: {
            host: 'bloodhyundai.com.au',
          },
        },
      },
    } as any);

    const inventory = result.tenant.settings.inventory;
    assert.equal(result.source, 'fallback-map');
    assert.equal(result.tenant.slug, 'bloods-hyundai');
    assert.equal(inventory?.provider, 'carsales');
    assert.equal(inventory?.sources?.length, 3);
    assert.equal(inventory?.sources?.[0]?.role, 'primary');
    assert.equal(inventory?.sources?.[0]?.sellerIds?.[0], '49b41e33-6e72-b64d-43a2-7897e61c1bf0');

    if (previous === undefined) {
      delete process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER;
    } else {
      process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER = previous;
    }
  });

  it('reports DB tenant resolution as enabled only when explicitly set to true', async () => {
    const previous = process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER;
    process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER = 'true';

    const { isDbTenantResolverEnabled } = await import('../server/utils/tenant-db.ts');

    assert.equal(isDbTenantResolverEnabled(), true);

    if (previous === undefined) {
      delete process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER;
    } else {
      process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER = previous;
    }
  });
});
