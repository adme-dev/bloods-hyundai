import type {
  HyundaiOemAdapter,
  HyundaiOemCarCalculatorParams,
  HyundaiOemVariantPriceParams,
} from '../types/hyundai-oem';
import {
  DEFAULT_HERO_BANNER,
  extractHeroBanners,
  prependBaseUrl,
} from './hyundaiOffers';
import { toModelSummaries } from './modelSummaries';

const HYUNDAI_BASE_URL = 'https://www.hyundai.com';
const HYUNDAI_API_BASE = `${HYUNDAI_BASE_URL}/content/api/au/hyundai`;

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, HYUNDAI_BASE_URL);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

function carCalculatorEndpoint(params: HyundaiOemCarCalculatorParams): string {
  return buildUrl('/content/api/au/hyundai/v3/carpricecalculator', {
    postcode: params.postcode,
    modelname: params.modelName,
    displaypowertrain: params.displayPowertrain ?? true,
  });
}

function variantPriceEndpoint(params: HyundaiOemVariantPriceParams): string {
  return buildUrl('/content/api/au/hyundai/v3/variantpricecalculator', {
    variantId: params.variantId,
    optionCost: params.optionCost ?? '0',
    postcode: params.postcode,
  });
}

export const HYUNDAI_AU_OEM_ADAPTER: HyundaiOemAdapter = {
  oem: 'hyundai',
  market: 'AU',
  baseUrl: HYUNDAI_BASE_URL,
  endpoints: {
    absoluteUrl: prependBaseUrl,
    models: () => `${HYUNDAI_API_BASE}/v3/carpricecalculator/models`,
    modelAdditional: () => `${HYUNDAI_API_BASE}/pcm1/v1/modeladditional`,
    offers: () => `${HYUNDAI_BASE_URL}/au/en/offers`,
    offerDetail: (modelSlug, variantId) => buildUrl(`/au/en/offers/${modelSlug}/offer-detail`, { variantId }),
    carCalculator: carCalculatorEndpoint,
    variantPrice: variantPriceEndpoint,
  },
  models: {
    toModelSummaries,
  },
  offers: {
    defaultHeroBanner: DEFAULT_HERO_BANNER,
    extractHeroBanners,
  },
};
