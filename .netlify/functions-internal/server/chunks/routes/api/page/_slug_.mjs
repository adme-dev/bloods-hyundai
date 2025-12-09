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
  const config = useRuntimeConfig();
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({
      statusCode: 400,
      message: "Page slug is required"
    });
  }
  if (!config.public.apiUrl) {
    return {
      success: true,
      page: {
        title: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
        content: "",
        slug
      }
    };
  }
  try {
    const url = `${config.public.apiUrl}/page/${slug}`;
    const response = await $fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });
    return {
      success: true,
      page: response.page || response
    };
  } catch (error) {
    console.error("[Page API] Error:", error.message);
    return {
      success: true,
      page: {
        title: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
        content: "",
        slug
      }
    };
  }
});

export { _slug_ as default };
//# sourceMappingURL=_slug_.mjs.map
