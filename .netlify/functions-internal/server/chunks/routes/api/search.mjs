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

const search = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  const params = {};
  if (query.make) params.make = String(query.make);
  if (query.model) params.model = String(query.model);
  if (query.condition) params.condition = String(query.condition);
  if (query.body) params.body = String(query.body);
  if (query.transmission) params.transmission = String(query.transmission);
  if (query.fuelType) params.fuelType = String(query.fuelType);
  if (query.colour) params.colour = String(query.colour);
  if (query.minPrice) params.minPrice = String(query.minPrice);
  if (query.maxPrice) params.maxPrice = String(query.maxPrice);
  if (query.minYear) params.minYear = String(query.minYear);
  if (query.maxYear) params.maxYear = String(query.maxYear);
  if (query.minOdometer) params.minOdometer = String(query.minOdometer);
  if (query.maxOdometer) params.maxOdometer = String(query.maxOdometer);
  if (query.sort) params.sort = String(query.sort);
  if (query.order) params.order = String(query.order);
  if (query.page) params.page = String(query.page);
  if (query.limit) params.limit = String(query.limit);
  if (query.keyword) params.keyword = String(query.keyword);
  try {
    const apiUrl = config.public.apiUrl || "https://your-api.com";
    const searchParams = new URLSearchParams(params);
    const url = `${apiUrl}/search?${searchParams.toString()}`;
    console.log("[Search API] Fetching:", url);
    const response = await $fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });
    return {
      success: true,
      vehicles: response.vehicles || response.results || [],
      total: response.total || response.count || 0,
      page: response.page || parseInt(params.page) || 1,
      limit: response.limit || parseInt(params.limit) || 24,
      facets: response.facets || {}
    };
  } catch (error) {
    console.error("[Search API] Error:", error.message);
    return {
      success: false,
      vehicles: [],
      total: 0,
      page: 1,
      limit: 24,
      facets: {},
      error: error.message
    };
  }
});

export { search as default };
//# sourceMappingURL=search.mjs.map
