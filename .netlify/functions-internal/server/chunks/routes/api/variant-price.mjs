import { d as defineEventHandler, g as getQuery, c as createError, u as useRuntimeConfig } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue';
import 'consola';

const variantPrice = defineEventHandler(async (event) => {
  useRuntimeConfig();
  const query = getQuery(event);
  const { variantId, postcode = "3000", optionCost = "0" } = query;
  if (!variantId) {
    throw createError({
      statusCode: 400,
      message: "variantId is required"
    });
  }
  try {
    const url = `https://www.hyundai.com/content/api/au/hyundai/v3/variantpricecalculator?variantId=${variantId}&optionCost=${optionCost}&postcode=${postcode}`;
    const response = await $fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      }
    });
    return {
      success: true,
      pricing: response
    };
  } catch (error) {
    console.error("[Variant Price API] Error:", error.message);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to fetch variant pricing"
    });
  }
});

export { variantPrice as default };
//# sourceMappingURL=variant-price.mjs.map
