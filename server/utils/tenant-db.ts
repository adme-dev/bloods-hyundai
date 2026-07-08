import { and, eq } from 'drizzle-orm';
import { dbHttp as db } from './db';
import { dealerDomains, dealers } from '../database/schema';
import type { H3Event } from 'h3';
import {
  DEFAULT_DEALER_SLUG,
  getRequestHostname,
  normalizeHostname,
  resolveTenantFromHostname,
  type TenantConfig,
} from './tenant';
import type { HyundaiTenant, TenantResolutionResult } from '../types/tenant';

function isDbTenantResolverEnabled(): boolean {
  return process.env.HYUNDAI_ENABLE_DB_TENANT_RESOLVER === 'true';
}

function toTenantConfigResult(
  tenant: TenantConfig,
  hostname: string,
  source: TenantResolutionResult['source']
): TenantResolutionResult {
  return {
    hostname,
    source,
    tenant: {
      slug: tenant.slug,
      name: tenant.name,
      siteUrl: tenant.siteUrl,
      domains: tenant.siteUrl ? [{ hostname, isPrimary: true, isActive: true }] : [],
      oem: 'hyundai',
      status: 'active',
      timezone: 'Australia/Melbourne',
      locale: 'en-AU',
      settings: {},
    },
  };
}

export async function resolveTenantFromDbHostname(
  hostname: string | null | undefined
): Promise<HyundaiTenant | null> {
  const normalizedHostname = normalizeHostname(hostname);
  if (!normalizedHostname) {
    return null;
  }

  const [row] = await db
    .select({
      dealerId: dealers.id,
      slug: dealers.slug,
      name: dealers.name,
      websiteUrl: dealers.websiteUrl,
      settings: dealers.settings,
      oem: dealers.oem,
      dealerActive: dealers.isActive,
      hostname: dealerDomains.hostname,
      isPrimary: dealerDomains.isPrimary,
      domainActive: dealerDomains.isActive,
    })
    .from(dealerDomains)
    .innerJoin(dealers, eq(dealerDomains.dealerId, dealers.id))
    .where(
      and(
        eq(dealerDomains.hostname, normalizedHostname),
        eq(dealerDomains.isActive, true),
        eq(dealers.isActive, true)
      )
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    id: row.dealerId,
    slug: row.slug,
    name: row.name,
    siteUrl: row.websiteUrl || undefined,
    domains: [
      {
        hostname: row.hostname,
        isPrimary: row.isPrimary,
        isActive: row.domainActive,
      },
    ],
    oem: 'hyundai',
    status: row.dealerActive ? 'active' : 'disabled',
    timezone: 'Australia/Melbourne',
    locale: 'en-AU',
    settings: row.settings && typeof row.settings === 'object' ? row.settings : {},
  };
}

export async function resolveTenantContext(
  event: H3Event,
  fallbackSlug = process.env.DEALER_SLUG || DEFAULT_DEALER_SLUG
): Promise<TenantResolutionResult> {
  const hostname = getRequestHostname(event);

  if (!isDbTenantResolverEnabled()) {
    return toTenantConfigResult(resolveTenantFromHostname(hostname, fallbackSlug), hostname, 'fallback-map');
  }

  try {
    const tenant = await resolveTenantFromDbHostname(hostname);
    if (tenant) {
      return { tenant, hostname, source: 'database' };
    }
  } catch (error: any) {
    console.warn('[Tenant Resolver] DB lookup failed; using fallback resolver:', error?.message);
  }

  return toTenantConfigResult(resolveTenantFromHostname(hostname, fallbackSlug), hostname, 'env-fallback');
}
