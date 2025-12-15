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
      });
      
      // CDN returns array, get first item
      if (response && Array.isArray(response) && response.length > 0) {
        return {
          success: true,
          page: response[0],
        };
      }
    } catch (cdnError: any) {
      console.log('[Page API] CDN fetch failed, trying API:', cdnError.message);
    }
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






