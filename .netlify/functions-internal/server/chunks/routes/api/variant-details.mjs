import { d as defineEventHandler, g as getQuery, u as useRuntimeConfig } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue';
import 'consola';

const variantDetails = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const variantId = query.variantId;
  if (!variantId) {
    return {
      success: false,
      error: "Variant ID is required"
    };
  }
  if (!config.public.apiUrl) {
    return {
      success: false,
      error: "API URL not configured",
      variant: null
    };
  }
  try {
    const response = await $fetch(`${config.public.apiUrl}/get-hyundai-variant-by-id`, {
      method: "GET",
      params: { variantId }
    });
    if (!response.success) {
      return {
        success: false,
        error: response.error || "Failed to fetch variant details"
      };
    }
    return {
      success: true,
      variant: response.variant || null,
      variants: response.variants || [],
      accessories: response.accessories || [],
      features: response.features || []
    };
  } catch (error) {
    console.error("[API] variant-details error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch variant details"
    };
  }
});

export { variantDetails as default };
//# sourceMappingURL=variant-details.mjs.map
