import type { ModelSummariesResponse } from '../utils/modelSummaries';

export interface HyundaiOemHeroBanners {
  desktop: string;
  mobile: string | null;
}

export interface HyundaiOemCarCalculatorParams {
  modelName: string;
  postcode: string;
  displayPowertrain?: boolean | string;
}

export interface HyundaiOemVariantPriceParams {
  variantId: string;
  postcode: string;
  optionCost?: string | number;
}

export interface HyundaiOemEndpoints {
  absoluteUrl(path: string | null): string | null;
  models(): string;
  modelAdditional(): string;
  offers(): string;
  offerDetail(modelSlug: string, variantId: string | number): string;
  carCalculator(params: HyundaiOemCarCalculatorParams): string;
  variantPrice(params: HyundaiOemVariantPriceParams): string;
}

export interface HyundaiOemModelsAdapter {
  toModelSummaries(rawData: unknown): ModelSummariesResponse;
}

export interface HyundaiOemOffersAdapter {
  defaultHeroBanner: string;
  extractHeroBanners(html: string): HyundaiOemHeroBanners;
}

export interface HyundaiOemAdapter {
  oem: 'hyundai';
  market: 'AU';
  baseUrl: string;
  endpoints: HyundaiOemEndpoints;
  models: HyundaiOemModelsAdapter;
  offers: HyundaiOemOffersAdapter;
}
