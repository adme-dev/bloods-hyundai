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

const accessories = defineEventHandler(async (event) => {
  var _a;
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const model = query.model;
  if (!model) {
    return {
      success: false,
      error: "Model is required",
      accessories: [],
      accessoryPacks: []
    };
  }
  if (!config.public.apiUrl) {
    return {
      success: true,
      accessories: [],
      accessoryPacks: []
    };
  }
  try {
    const response = await $fetch(`${config.public.apiUrl}/get-accessories`, {
      method: "GET",
      params: { model }
    });
    return {
      success: (_a = response.success) != null ? _a : true,
      accessories: response.accessories || [],
      accessoryPacks: response.accessoryPacks || []
    };
  } catch (error) {
    console.error("[API] accessories error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch accessories",
      accessories: [],
      accessoryPacks: []
    };
  }
});

export { accessories as default };
//# sourceMappingURL=accessories.mjs.map
