import { H3Event } from 'h3';

export default defineEventHandler(async (event: H3Event) => {
  const slug = getRouterParam(event, 'slug');
  
  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Vehicle slug is required',
    });
  }

  const config = useRuntimeConfig();
  
  // The OEM RAW CDN URL where vehicle JSON files are stored
  const oemRawCdnUrl = config.public.oemRawCdnUrl || process.env.NUXT_PUBLIC_OEM_RAW_CDN_URL || 'https://hyundaioem.b-cdn.net/raw';
  
  try {
    // Fetch the vehicle JSON file from CDN based on slug
    const vehicleUrl = `${oemRawCdnUrl}/${slug}.json`;
    
    console.log(`[Vehicle API] Fetching vehicle data from: ${vehicleUrl}`);
    
    const response = await $fetch<any[]>(vehicleUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    // The response is an array, return the first item
    const vehicleData = Array.isArray(response) ? response[0] : response;
    
    if (!vehicleData) {
      throw createError({
        statusCode: 404,
        message: `Vehicle not found: ${slug}`,
      });
    }

    return {
      success: true,
      vehicle: vehicleData,
      slug,
    };
  } catch (error: any) {
    console.error(`[Vehicle API] Error fetching vehicle ${slug}:`, error.message);
    
    // If CDN fetch fails, return 404
    if (error.statusCode === 404 || error.status === 404) {
      throw createError({
        statusCode: 404,
        message: `Vehicle not found: ${slug}`,
      });
    }
    
    throw createError({
      statusCode: 500,
      message: `Failed to fetch vehicle data: ${error.message}`,
    });
  }
});




