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
import { DEFAULT_DEALER_SLUG, resolveDealerSiteUrl, resolveDealerSlug, resolveDealerSlugAliases, resolveTenantCacheKey, resolveTenantFromHostname } from '../utils/tenant';
import { buildTenantCdnUrls } from '../utils/tenant-cdn';
import { invalidateNitroFunctionCache } from '../utils/cache-refresh';
import { applyHomepageSliderOverride, readHomepageSliderSettings } from '../../shared/homepageSlider';

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

function loadLocalFallback(dealerSlug?: string): SiteConfig | null {
  try {
    const dealerSpecificPaths = dealerSlug
      ? resolveDealerSlugAliases(dealerSlug).flatMap((slug) => [
          join(process.cwd(), `server/data/site-config.${slug}.json`),
          join(process.cwd(), `.nuxt/dev/server/data/site-config.${slug}.json`),
        ])
      : [];
    const possiblePaths = [
      ...dealerSpecificPaths,
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

  if (/blood'?s?\s+hyundai/.test(name)) {
    return resolveDealerSlugAliases(dealerSlug).some((slug) => slug === 'blood-hyundai' || slug === 'bloods-hyundai');
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

  const mergedConfig = {
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

  return applyHomepageSliderOverride(
    mergedConfig,
    readHomepageSliderSettings(dealer.settings),
  ) as SiteConfig;
}

function normalizeSiteConfig(siteConfig: SiteConfig, dealerSlug: string): SiteConfig {
  const normalizedConfig: SiteConfig = { ...siteConfig };
  const navigationMain = Array.isArray(normalizedConfig.navigation?.main)
    ? normalizedConfig.navigation.main
    : null;
  const sitelinksMainNav = Array.isArray(normalizedConfig.sitelinks?.mainnav)
    ? normalizedConfig.sitelinks.mainnav
    : null;

  if (!navigationMain && sitelinksMainNav) {
    normalizedConfig.navigation = {
      ...(normalizedConfig.navigation || {}),
      main: sitelinksMainNav,
    };
  }

  if (!sitelinksMainNav && navigationMain) {
    normalizedConfig.sitelinks = {
      ...(normalizedConfig.sitelinks || {}),
      mainnav: navigationMain,
    };
  }

  if (['blood-hyundai', 'bloods-hyundai'].includes(dealerSlug)) {
    normalizedConfig.name = 'Blood Hyundai';
  }

  return normalizedConfig;
}

interface ResolvedRequestContext {
  dealerSlug: string;
  requestOrigin: string;
  hostTenantName: string;
  hostTenantSiteUrl: string;
  cdnUrl: string;
}

function buildDefaultConfig(ctx: ResolvedRequestContext): SiteConfig {
  return {
    name: ctx.hostTenantName,
    promotional: [],
    scripts: { google: { analytics: [], gtm: '' } },
    websiteUrl: ctx.requestOrigin || ctx.hostTenantSiteUrl || '',
    siteUrl: ctx.requestOrigin || ctx.hostTenantSiteUrl || '',
    dealerSlug: ctx.dealerSlug,
  };
}

/**
 * Build the full site config. Throws when the result would be degraded
 * (no dealer row AND no CDN/local base config), so a transient DB/CDN
 * failure is never cached — the caller serves an uncached fallback and the
 * next request retries. Previously the catch-all returned a bare default
 * (no navigation) which defineCachedEventHandler then cached for 10-40
 * minutes: one blip during a deploy hid the nav site-wide until expiry.
 */
async function buildFullSiteConfig(ctx: ResolvedRequestContext) {
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
    .where(eq(dealers.slug, ctx.dealerSlug))
    .limit(1);

  const localConfig = loadLocalFallback(ctx.dealerSlug);
  const matchingLocalConfig = localFallbackMatchesDealer(localConfig, ctx.dealerSlug)
    ? localConfig
    : null;
  const remoteConfig = ctx.cdnUrl
    ? await fetchTenantConfig(ctx.cdnUrl, ctx.dealerSlug)
    : null;

  const baseConfig =
    remoteConfig ||
    (matchingLocalConfig && matchingLocalConfig.name ? matchingLocalConfig : null);

  // No real base config AND no dealer row = degraded result; refuse to cache it.
  if (!baseConfig && !dealer) {
    throw new Error('site-config degraded: no dealer row and no base config source');
  }

  const chosenBaseConfig = baseConfig || buildDefaultConfig(ctx);

  const mergedConfig = dealer
    ? mergeSiteConfig(chosenBaseConfig, dealer as DealerRow, ctx.requestOrigin)
    : {
        ...chosenBaseConfig,
        websiteUrl: chosenBaseConfig.websiteUrl || ctx.requestOrigin || ctx.hostTenantSiteUrl || '',
        siteUrl: chosenBaseConfig.siteUrl || ctx.requestOrigin || ctx.hostTenantSiteUrl || '',
        dealerSlug: ctx.dealerSlug,
      };

  return normalizeSiteConfig(mergedConfig, ctx.dealerSlug);
}

// Success results cached per tenant for CACHE_MAX_AGE (+ stale window);
// thrown (degraded) results are NOT cached by design.
const getCachedSiteConfig = defineCachedFunction(
  async (cacheKey: string, ctx: ResolvedRequestContext) => buildFullSiteConfig(ctx),
  {
    maxAge: CACHE_MAX_AGE,
    staleMaxAge: CACHE_STALE_MAX_AGE,
    name: 'site-config',
    getKey: (cacheKey: string) => cacheKey,
  },
);

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const requestUrl = getRequestURL(event);
  const requestOrigin = resolveDealerSiteUrl(event, config.public.siteUrl || requestUrl.origin || '');
  const fallbackSlug = config.public.dealerSlug || process.env.DEALER_SLUG || DEFAULT_DEALER_SLUG;
  const dealerSlug = resolveDealerSlug(event, fallbackSlug);
  const hostTenant = resolveTenantFromHostname(requestUrl.hostname, fallbackSlug);

  const ctx: ResolvedRequestContext = {
    dealerSlug,
    requestOrigin,
    hostTenantName: hostTenant.name,
    hostTenantSiteUrl: hostTenant.siteUrl || '',
    cdnUrl: config.public.cdnUrl || '',
  };

  const cacheKey = resolveTenantCacheKey(event, 'site-config-data:v3');
  const forceRefresh = getQuery(event).refresh === 'true';

  try {
    if (forceRefresh) {
      await invalidateNitroFunctionCache(useStorage('cache'), 'site-config', cacheKey);
    }

    const siteConfig = await getCachedSiteConfig(cacheKey, ctx);
    setResponseHeader(event, 'Cache-Control', 'no-store');

    return {
      config: siteConfig,
      _cached: !forceRefresh,
      _timestamp: Date.now(),
    };
  } catch (error: any) {
    // Degraded path: serve the best uncached fallback; next request retries.
    console.warn('[Site Config] Serving uncached fallback:', error?.message);
    const localConfig = loadLocalFallback(dealerSlug);
    const matchingLocalConfig = localFallbackMatchesDealer(localConfig, dealerSlug)
      ? localConfig
      : null;

    const fallbackConfig = matchingLocalConfig
      ? {
          ...matchingLocalConfig,
          websiteUrl: matchingLocalConfig.websiteUrl || requestOrigin || hostTenant.siteUrl || '',
          siteUrl: matchingLocalConfig.siteUrl || requestOrigin || hostTenant.siteUrl || '',
          dealerSlug,
        }
      : buildDefaultConfig(ctx);

    setResponseHeader(event, 'Cache-Control', 'no-store');
    return {
      config: normalizeSiteConfig(fallbackConfig, dealerSlug),
      _cached: false,
      _degraded: true,
      _timestamp: Date.now(),
    };
  }
});
