import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Try to load local fallback page data for development
function loadLocalPageFallback(slug: string): any | null {
  try {
    const fallbackPath = join(process.cwd(), `server/data/pages/${slug}.json`);
    if (existsSync(fallbackPath)) {
      const data = readFileSync(fallbackPath, 'utf-8');
      const pageData = JSON.parse(data);
      console.log('[Page API] Loaded local fallback for:', slug);
      return pageData;
    }
    return null;
  } catch (error: any) {
    console.warn('[Page API] Could not load local fallback:', error.message);
    return null;
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Page slug is required',
    });
  }

  // Try fetching from CDN first (WordPress exported JSON)
  if (config.public.cdnUrl) {
    try {
      const cdnUrl = `${config.public.cdnUrl}/pages/${slug}.json`;
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

  // Try local fallback for development
  const localPage = loadLocalPageFallback(slug);
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
});








