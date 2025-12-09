import { d as defineEventHandler, g as getQuery, c as createError } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue';
import 'consola';

const carCalculator = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { modelname, postcode = "3000", displaypowertrain = "true" } = query;
  if (!modelname) {
    throw createError({
      statusCode: 400,
      message: "modelname is required"
    });
  }
  try {
    const url = `https://www.hyundai.com/content/api/au/hyundai/v3/carpricecalculator?postcode=${postcode}&modelname=${modelname}&displaypowertrain=${displaypowertrain}`;
    console.log("[Calculator API] Fetching:", url);
    const response = await $fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      }
    });
    return {
      success: true,
      model: modelname,
      ...response
    };
  } catch (error) {
    console.error("[Calculator API] Error:", error.message);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to fetch car calculator data"
    });
  }
});

export { carCalculator as default };
//# sourceMappingURL=car-calculator.mjs.map
