/**
 * API route to get variant details by ID/slug
 */
type VariantDetailsSourceResponse = {
  success?: boolean;
  error?: string;
  variant?: unknown;
  variants?: unknown[];
  accessories?: unknown[];
  features?: unknown[];
};

type VariantDetailsApiResponse = {
  success: boolean;
  error?: string;
  variant?: unknown | null;
  variants?: unknown[];
  accessories?: unknown[];
  features?: unknown[];
};

export default defineEventHandler(async (event): Promise<VariantDetailsApiResponse> => {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  
  const variantId = query.variantId as string;
  
  if (!variantId) {
    return {
      success: false,
      error: 'Variant ID is required',
    };
  }
  
  // Check if API URL is configured
  if (!config.public.apiUrl) {
    return {
      success: false,
      error: 'API URL not configured',
      variant: null,
    };
  }
  
  try {
    // Fetch from external API
    const response = await $fetch<VariantDetailsSourceResponse>(`${config.public.apiUrl}/get-hyundai-variant-by-id`, {
      method: 'GET',
      params: { variantId },
    });
    
    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to fetch variant details',
      };
    }
    
    return {
      success: true,
      variant: response.variant || null,
      variants: response.variants || [],
      accessories: response.accessories || [],
      features: response.features || [],
    };
  } catch (error: any) {
    console.error('[API] variant-details error:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to fetch variant details',
    };
  }
});







