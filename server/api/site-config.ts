/**
 * GET /api/site-config
 * Fetches tenant-aware site configuration with CDN + local fallback
 *
 * Features:
 * - Host-based dealer resolution for multi-tenant deployments
 * - 10-minute server-side cache, keyed per tenant host
 * - Automatic cache invalidation with ?refresh=true
 * - CDN fallback for dealer-specific config files
 * - Local fallback for development when CDN is unreachable
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { dbHttp as db } from '../utils/db';
import { dealers } from '../database/schema';
import { eq } from 'drizzle-orm';
import { getRequestURL } from 'h3';
import { DEFAULT_DEALER_SLUG, resolveDealerSlug, resolveTenantCacheKey, resolveTenantFromHostname } from '../utils/tenant';

interface SiteConfig {
  name: string;
  promotional: any[];
  scripts: {
    google: {
      analytics: string[];
      gtm: string;
    };
    facebook?: {
      pageid: string;
    };
  };
  websiteUrl?: string;
  dealerSlug?: string;
  siteUrl?: string;
  [key: string]: any;
}

interface DealerRow {
  slug: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  settings?: Record<string, any> | null;
}

const CACHE_MAX_AGE = 60 * 10; // 10 minutes
const CACHE_STALE_MAX_AGE = 60 * 30; // Serve stale for 30 minutes while revalidating

function buildTenantCdnUrls(cdnUrl: string, dealerSlug: string, path: string): string[] {
  const trimmed = cdnUrl.replace(/\/+$/, '');
  const tenantMatch = trimmed.match(/\/files\/([^/]+)$/);
  const tenantBase = tenantMatch
    ? trimmed.replace(/\/files\/[^/]+$/, `/files/${dealerSlug}`)
    : `${trimmed}/files/${dealerSlug}`;
  const allowLegacyPath = !tenantMatch || tenantMatch[1] === dealerSlug;

  return Array.from(new Set([
    `${tenantBase}/${path}`,
    ...(allowLegacyPath ? [`${trimmed}/${path}`] : []),
  ]));
}

function loadLocalFallback(): SiteConfig | null {
  try {
    const possiblePaths = [
      join(process.cwd(), 'server/data/site-config.json'),
      join(process.cwd(), '.nuxt/dev/server/data/site-config.json'),
    ];

    for (const fallbackPath of possiblePaths) {
      if (existsSync(fallbackPath)) {
        const data = readFileSync(fallbackPath, 'utf-8');
        return JSON.parse(data);
      }
    }
    return null;
  } catch (error: any) {
    console.warn('[Site Config] Could not load local fallback:', error.message);
    return null;
  }
}

function localFallbackMatchesDealer(localConfig: SiteConfig | null, dealerSlug: string): localConfig is SiteConfig {
  if (!localConfig) return false;

  const name = String(localConfig.name || '').toLowerCase();
  if (name.includes('sale hyundai')) {
    return dealerSlug === 'sale-hyundai';
  }

  if (name.includes('blood hyundai')) {
    return dealerSlug === 'blood-hyundai';
  }

  return true;
}

async function fetchTenantConfig(cdnUrl: string, dealerSlug: string): Promise<SiteConfig | null> {
  const candidateUrls = buildTenantCdnUrls(cdnUrl, dealerSlug, 'config/config.json');

  for (const url of candidateUrls) {
    try {
      const data = await $fetch<SiteConfig>(url, {
        headers: { Accept: 'application/json' },
        timeout: 5000,
      });

      if (data && typeof data === 'object') {
        return data;
      }
    } catch (error: any) {
      console.warn('[Site Config] CDN fetch failed for', url, '-', error?.message);
    }
  }

  return null;
}

function mergeSiteConfig(baseConfig: SiteConfig, dealer: DealerRow, requestOrigin: string): SiteConfig {
  const siteUrl = dealer.websiteUrl || requestOrigin || baseConfig.websiteUrl || '';

  return {
    ...baseConfig,
    name: dealer.name || baseConfig.name,
    logo: dealer.logoUrl || baseConfig.logo,
    showroom_address: dealer.address || baseConfig.showroom_address,
    phone: dealer.phone || baseConfig.phone,
    websiteUrl: siteUrl,
    siteUrl,
    dealerSlug: dealer.slug,
    ...(dealer.settings?.siteConfig && typeof dealer.settings.siteConfig === 'object'
      ? dealer.settings.siteConfig
      : {}),
  };
}

export default defineCachedEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const requestUrl = getRequestURL(event);
  const requestOrigin = requestUrl.origin || config.public.siteUrl || '';
  const fallbackSlug = config.public.dealerSlug || process.env.DEALER_SLUG || DEFAULT_DEALER_SLUG;
  const dealerSlug = resolveDealerSlug(event, fallbackSlug);
  const hostTenant = resolveTenantFromHostname(requestUrl.hostname, fallbackSlug);

  const defaultConfig: SiteConfig = {
    name: hostTenant.name,
    promotional: [],
    scripts: { google: { analytics: [], gtm: '' } },
    websiteUrl: requestOrigin || hostTenant.siteUrl || '',
    siteUrl: requestOrigin || hostTenant.siteUrl || '',
    dealerSlug,
  };

  try {
    const [dealer] = await db
      .select({
        slug: dealers.slug,
        name: dealers.name,
        phone: dealers.phone,
        address: dealers.address,
        websiteUrl: dealers.websiteUrl,
        logoUrl: dealers.logoUrl,
        settings: dealers.settings,
      })
      .from(dealers)
      .where(eq(dealers.slug, dealerSlug))
      .limit(1);

    const localConfig = loadLocalFallback();
    const matchingLocalConfig = localFallbackMatchesDealer(localConfig, dealerSlug)
      ? localConfig
      : null;
    const remoteConfig = config.public.cdnUrl
      ? await fetchTenantConfig(config.public.cdnUrl, dealerSlug)
      : null;

    const chosenBaseConfig =
      remoteConfig ||
      (matchingLocalConfig && matchingLocalConfig.name ? matchingLocalConfig : null) ||
      defaultConfig;

    const mergedConfig = dealer
      ? mergeSiteConfig(chosenBaseConfig, dealer as DealerRow, requestOrigin)
      : {
          ...chosenBaseConfig,
          websiteUrl: chosenBaseConfig.websiteUrl || requestOrigin || hostTenant.siteUrl || '',
          siteUrl: chosenBaseConfig.siteUrl || requestOrigin || hostTenant.siteUrl || '',
          dealerSlug,
        };

    return {
      config: mergedConfig,
      _cached: false,
      _timestamp: Date.now(),
    };
  } catch (error: any) {
    console.warn('[Site Config] Falling back to defaults:', error?.message);
    const localConfig = loadLocalFallback();
    const matchingLocalConfig = localFallbackMatchesDealer(localConfig, dealerSlug)
      ? localConfig
      : null;

    return {
      config: matchingLocalConfig
        ? {
            ...matchingLocalConfig,
            websiteUrl: matchingLocalConfig.websiteUrl || requestOrigin || hostTenant.siteUrl || '',
            siteUrl: matchingLocalConfig.siteUrl || requestOrigin || hostTenant.siteUrl || '',
            dealerSlug,
          }
        : defaultConfig,
      _cached: false,
      _timestamp: Date.now(),
    };
  }
}, {
  maxAge: CACHE_MAX_AGE,
  staleMaxAge: CACHE_STALE_MAX_AGE,
  name: 'site-config',
  getKey: (event) => resolveTenantCacheKey(event, 'site-config-data'),
  shouldBypassCache: (event) => {
    const query = getQuery(event);
    return query.refresh === 'true';
  },
});
