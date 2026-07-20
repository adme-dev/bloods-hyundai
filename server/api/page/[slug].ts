import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DEFAULT_DEALER_SLUG, resolveDealerSlug, resolveDealerSlugAliases, resolveTenantCacheKey } from '../../utils/tenant';
import { buildTenantCdnUrls } from '../../utils/tenant-cdn';
import { invalidateNitroFunctionCache } from '../../utils/cache-refresh';

type PageApiResponse = {
  success: boolean;
  page: unknown;
  _source?: string;
};

// Try to load local fallback page data for development
function loadLocalPageFallback(slug: string, dealerSlug: string): unknown | null {
  try {
    const fallbackPath = join(process.cwd(), `server/data/pages/${slug}.json`);
    if (existsSync(fallbackPath)) {
      const data = readFileSync(fallbackPath, 'utf-8');
      const pageData = JSON.parse(data);
      if (data.toLowerCase().includes('sale hyundai') && dealerSlug !== 'sale-hyundai') {
        return null;
      }

      if (
        /blood'?s?\s+hyundai/.test(data.toLowerCase()) &&
        !resolveDealerSlugAliases(dealerSlug).some((alias) => alias === 'blood-hyundai' || alias === 'bloods-hyundai')
      ) {
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

async function buildPageSource(
  slug: string,
  dealerSlug: string,
  cdnUrl: string,
  apiUrl: string,
): Promise<PageApiResponse> {
  // Try fetching from CDN first (WordPress exported JSON)
  if (cdnUrl) {
    for (const tenantCdnUrl of buildTenantCdnUrls(cdnUrl, dealerSlug, `pages/${slug}.json`)) {
      try {
        const response = await $fetch<unknown[]>(tenantCdnUrl, {
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
  if (apiUrl) {
    try {
      const url = `${apiUrl}/page/${slug}`;

      const response = await $fetch<unknown>(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      return {
        success: true,
        page: getPagePayload(response),
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
}

const getCachedPage = defineCachedFunction(
  async (
    _cacheKey: string,
    slug: string,
    dealerSlug: string,
    cdnUrl: string,
    apiUrl: string,
  ) => buildPageSource(slug, dealerSlug, cdnUrl, apiUrl),
  {
    maxAge: CACHE_MAX_AGE,
    staleMaxAge: CACHE_STALE_MAX_AGE,
    name: 'page-content',
    getKey: (cacheKey: string) => cacheKey,
  },
);

export default defineEventHandler(async (event): Promise<PageApiResponse> => {
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
  const cacheKey = resolveTenantCacheKey(event, `page:${slug}`);
  const query = getQuery(event);

  if (query.refresh === 'true') {
    await invalidateNitroFunctionCache(useStorage('cache'), 'page-content', cacheKey);
  }

  setResponseHeader(event, 'Cache-Control', 'no-store');
  return await getCachedPage(
    cacheKey,
    slug,
    dealerSlug,
    config.public.cdnUrl || '',
    config.public.apiUrl || '',
  );
});

function getPagePayload(response: unknown) {
  return isRecord(response) && response.page ? response.page : response;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
