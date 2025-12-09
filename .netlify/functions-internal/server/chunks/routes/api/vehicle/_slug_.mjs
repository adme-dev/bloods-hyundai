import { d as defineEventHandler, a as getRouterParam, c as createError, u as useRuntimeConfig } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue';
import 'consola';

const _slug_ = defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({
      statusCode: 400,
      message: "Vehicle slug is required"
    });
  }
  const config = useRuntimeConfig();
  const oemRawCdnUrl = config.public.oemRawCdnUrl || process.env.NUXT_PUBLIC_OEM_RAW_CDN_URL || "https://hyundaioem.b-cdn.net/raw";
  try {
    const vehicleUrl = `${oemRawCdnUrl}/${slug}.json`;
    console.log(`[Vehicle API] Fetching vehicle data from: ${vehicleUrl}`);
    const response = await $fetch(vehicleUrl, {
      headers: {
        "Accept": "application/json"
      }
    });
    const vehicleData = Array.isArray(response) ? response[0] : response;
    if (!vehicleData) {
      throw createError({
        statusCode: 404,
        message: `Vehicle not found: ${slug}`
      });
    }
    return {
      success: true,
      vehicle: vehicleData,
      slug
    };
  } catch (error) {
    console.error(`[Vehicle API] Error fetching vehicle ${slug}:`, error.message);
    if (error.statusCode === 404 || error.status === 404) {
      throw createError({
        statusCode: 404,
        message: `Vehicle not found: ${slug}`
      });
    }
    throw createError({
      statusCode: 500,
      message: `Failed to fetch vehicle data: ${error.message}`
    });
  }
});

export { _slug_ as default };
//# sourceMappingURL=_slug_.mjs.map
