import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DEFAULT_DEALER_SLUG, resolveDealerSlug, resolveTenantCacheKey } from '../../utils/tenant';

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

// Try to load local fallback page data for development
function loadLocalPageFallback(slug: string, dealerSlug: string): any | null {
  try {
    const fallbackPath = join(process.cwd(), `server/data/pages/${slug}.json`);
    if (existsSync(fallbackPath)) {
      const data = readFileSync(fallbackPath, 'utf-8');
      const pageData = JSON.parse(data);
      if (data.toLowerCase().includes('sale hyundai') && dealerSlug !== 'sale-hyundai') {
        return null;
      }

      if (data.toLowerCase().includes('blood hyundai') && dealerSlug !== 'blood-hyundai') {
        return null;
      }

      console.log('[Page API] Loaded local fallback for:', slug);
      return pageData;
    }
    return null;
  } catch (error: any) {
    console.warn('[Page API] Could not load local fallback:', error.message);
    return null;
  }
}

const CACHE_MAX_AGE = 60 * 10;
const CACHE_STALE_MAX_AGE = 60 * 30;

export default defineCachedEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Page slug is required',
    });
  }

  const fallbackSlug = config.public.dealerSlug || process.env.DEALER_SLUG || DEFAULT_DEALER_SLUG;
  const dealerSlug = resolveDealerSlug(event, fallbackSlug);

  // Try fetching from CDN first (WordPress exported JSON)
  if (config.public.cdnUrl) {
    for (const cdnUrl of buildTenantCdnUrls(config.public.cdnUrl, dealerSlug, `pages/${slug}.json`)) {
      try {
        const response = await $fetch<any[]>(cdnUrl, {
          headers: {
            'Accept': 'application/json',
          },
          timeout: 5000, // 5 second timeout for faster fallback
        });

        // CDN returns array, get first item
        if (response && Array.isArray(response) && response.length > 0) {
          return {
            success: true,
            page: response[0],
          };
        }
      } catch (cdnError: any) {
        console.log('[Page API] CDN fetch failed, trying fallbacks:', cdnError.message);
      }
    }
  }

  // Try local fallback for development
  const localPage = loadLocalPageFallback(slug, dealerSlug);
  if (localPage) {
    // Local fallback could be array or object
    const pageData = Array.isArray(localPage) && localPage.length > 0 ? localPage[0] : localPage;
    return {
      success: true,
      page: pageData,
      _source: 'local-fallback',
    };
  }

  // Fallback to API if configured
  if (config.public.apiUrl) {
    try {
      const url = `${config.public.apiUrl}/page/${slug}`;

      const response = await $fetch<any>(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      return {
        success: true,
        page: response.page || response,
      };
    } catch (error: any) {
      console.error('[Page API] API Error:', error.message);
    }
  }

  // Return empty page if neither CDN nor API worked
  return {
    success: true,
    page: {
      title: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
      content: { rendered: '' },
      slug: slug,
    },
  };
}, {
  maxAge: CACHE_MAX_AGE,
  staleMaxAge: CACHE_STALE_MAX_AGE,
  name: 'page-content',
  getKey: (event) => resolveTenantCacheKey(event, `page:${getRouterParam(event, 'slug') || 'unknown'}`),
  shouldBypassCache: (event) => getQuery(event).refresh === 'true',
});




