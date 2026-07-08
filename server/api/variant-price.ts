import { HYUNDAI_AU_OEM_ADAPTER } from '../utils/hyundaiOemAdapter';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  const { variantId, postcode = '3000', optionCost = '0' } = query;
  
  if (!variantId || variantId === '') {
    return {
      success: false,
      error: 'variantId is required',
      pricing: null,
    };
  }
  
  try {
    const url = HYUNDAI_AU_OEM_ADAPTER.endpoints.variantPrice({
      variantId: String(variantId),
      optionCost: String(optionCost),
      postcode: String(postcode),
    });
    
    const response = await $fetch<any>(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    
    // Log the response structure for debugging
    console.log('[Variant Price API] Response structure:', {
      variantId,
      postcode,
      optionCost,
      hasFinalDriveAwayPrice: !!response.finalDriveAwayPrice,
      hasMlp: !!response.mlp,
      hasMlpWithOptions: !!response.mlpWithOptions,
      hasOnRoadCosts: !!response.onRoadCosts,
      hasDealerDiscount: !!response.dealerDiscount,
      hasGst: !!response.gst,
      keys: Object.keys(response),
      sampleData: {
        finalDriveAwayPrice: response.finalDriveAwayPrice,
        mlp: response.mlp,
        mlpWithOptions: response.mlpWithOptions,
        onRoadCostsTotal: response.onRoadCosts?.onRoadCost || response.onRoadCosts?.total,
        dealerDiscount: response.dealerDiscount?.discount,
        gst: response.gst,
      },
    });
    
    return {
      success: true,
      pricing: response,
    };
  } catch (error: any) {
    console.error('[Variant Price API] Error:', error.message);
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch variant pricing',
    });
  }
});






