import { HYUNDAI_AU_OEM_ADAPTER } from './hyundaiOemAdapter';

export type CalculatorRouteResolution = {
  apiModelName: string;
  preferredPowertrain?: string;
  preferredVariantGroupName?: string;
  fallbackModelNames: string[];
};

type TenantLike = {
  oem?: unknown;
} | null | undefined;

const knownModelImages: Record<string, string> = {
  'ioniq 6': 'https://www.hyundai.com/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ6_Front34_640x331.png',
  '2023 ioniq 6': 'https://www.hyundai.com/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ6_Front34_640x331.png',
  'ioniq-6': 'https://www.hyundai.com/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ6_Front34_640x331.png',
  'ioniq 5': 'https://www.hyundai.com/content/dam/hyundai/au/en/awards-page/2026/ioniq-5/IONIQ5_Front34_640x331-CarsGuide.png',
  'ioniq-5': 'https://www.hyundai.com/content/dam/hyundai/au/en/awards-page/2026/ioniq-5/IONIQ5_Front34_640x331-CarsGuide.png',
  'ioniq 5 n': 'https://www.hyundai.com/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ5N_Front_Performance_Blue_640x331.png',
  'ioniq-5-n': 'https://www.hyundai.com/content/dam/hyundai/au/en/models/front-3-4-models/IONIQ5N_Front_Performance_Blue_640x331.png',
  'ioniq 9': 'https://www.hyundai.com/content/dam/hyundai/au/en/models/ioniq-9-2025/3-4-images-colors/side-profile/models/IONIQ9-Models_Front34_640x331.png',
  'ioniq-9': 'https://www.hyundai.com/content/dam/hyundai/au/en/models/ioniq-9-2025/3-4-images-colors/side-profile/models/IONIQ9-Models_Front34_640x331.png',
};

const calculatorRouteResolutions: Record<string, Omit<CalculatorRouteResolution, 'fallbackModelNames'> & { fallbackModelNames?: string[] }> = {
  'kona-hybrid': {
    apiModelName: 'kona',
    preferredPowertrain: 'Hybrid',
    preferredVariantGroupName: 'KONA Hybrid',
  },
  'tucson-hybrid': {
    apiModelName: 'tucson',
    preferredPowertrain: 'Hybrid',
    preferredVariantGroupName: 'TUCSON Hybrid',
  },
  'santa-fe-hybrid': {
    apiModelName: 'santa-fe',
    preferredPowertrain: 'Hybrid',
    preferredVariantGroupName: 'SANTA FE Hybrid',
  },
  'palisade-hybrid': {
    apiModelName: 'palisade',
    preferredPowertrain: 'Hybrid',
    preferredVariantGroupName: 'PALISADE Elite (8-seat)',
  },
  'i30-n-line': {
    apiModelName: 'i30',
    preferredVariantGroupName: 'i30 Sedan N Line',
  },
  'i30-sedan': {
    apiModelName: 'i30',
    preferredVariantGroupName: 'i30 Sedan',
  },
  'i30-sedan-n-line': {
    apiModelName: 'i30',
    preferredVariantGroupName: 'i30 Sedan N Line',
  },
  'i30-sedan-hybrid': {
    apiModelName: 'i30',
    preferredPowertrain: 'Hybrid',
    preferredVariantGroupName: 'i30 Sedan Hybrid',
  },
  ioniq5: {
    apiModelName: 'ioniq-5',
  },
  'ioniq-5': {
    apiModelName: 'ioniq-5',
  },
  'ioniq5-n': {
    apiModelName: 'ioniq-5-n',
    fallbackModelNames: ['ioniq-5'],
  },
  'ioniq-5-n': {
    apiModelName: 'ioniq-5-n',
    fallbackModelNames: ['ioniq-5'],
  },
  ioniq6: {
    apiModelName: 'ioniq-6',
  },
  'ioniq-6': {
    apiModelName: 'ioniq-6',
  },
  'ioniq6-n': {
    apiModelName: 'ioniq-6',
  },
  'ioniq-6-n': {
    apiModelName: 'ioniq-6',
  },
  ioniq9: {
    apiModelName: 'ioniq-9',
  },
  'ioniq-9': {
    apiModelName: 'ioniq-9',
  },
};

export function normalizeModelSlug(modelname: string): string {
  return modelname.trim().toLowerCase().replace(/^20\d{2}[-_\s]+/i, '');
}

export function normalizeHyundaiAssetUrl(url?: string | null): string | null {
  return HYUNDAI_AU_OEM_ADAPTER.endpoints.absoluteUrl(url || null);
}

export function getKnownModelImage(...names: Array<string | null | undefined>): string | null {
  for (const name of names) {
    if (!name) continue;
    const normalized = normalizeModelSlug(name).replace(/\s+/g, '-');
    const spaced = normalizeModelSlug(name).replace(/-/g, ' ');
    const image = knownModelImages[normalized] || knownModelImages[spaced];
    if (image) return image;
  }
  return null;
}

export function getCalculatorRouteResolution(modelname: string): CalculatorRouteResolution {
  const slug = normalizeModelSlug(modelname);
  const explicitResolution = calculatorRouteResolutions[slug];

  if (explicitResolution) {
    return {
      ...explicitResolution,
      fallbackModelNames: explicitResolution.fallbackModelNames || [],
    };
  }

  const fallbackModelNames = new Set<string>();

  if (slug.endsWith('-hybrid')) {
    fallbackModelNames.add(slug.replace(/-hybrid$/, ''));
  }

  if (slug.includes('-sedan')) {
    fallbackModelNames.add(slug.split('-sedan')[0]);
  }

  return {
    apiModelName: slug,
    fallbackModelNames: Array.from(fallbackModelNames).filter((name) => name && name !== slug),
  };
}

export function hasCalculatorInventory(modelData: any): boolean {
  return Boolean(
    modelData &&
    ((Array.isArray(modelData.variantGroups) && modelData.variantGroups.length > 0) ||
      (Array.isArray(modelData.variants) && modelData.variants.length > 0))
  );
}

export function buildHyundaiCalculatorUrl(params: {
  modelName: string;
  postcode: string;
  displayPowertrain: string | boolean;
}): string {
  return HYUNDAI_AU_OEM_ADAPTER.endpoints.carCalculator({
    modelName: params.modelName,
    postcode: params.postcode,
    displayPowertrain: params.displayPowertrain,
  });
}

export function getHyundaiModelAdditionalUrl(): string {
  return HYUNDAI_AU_OEM_ADAPTER.endpoints.modelAdditional();
}

export function isHyundaiCalculatorTenant(tenant: TenantLike): boolean {
  return tenant?.oem === 'hyundai';
}

export function getSafeCalculatorErrorPayload(statusCode?: number): { statusCode: number; message: string } {
  if (statusCode === 400) {
    return {
      statusCode: 400,
      message: 'Model name is required.',
    };
  }

  if (statusCode === 404) {
    return {
      statusCode: 404,
      message: 'Calculator data is not available for this model right now.',
    };
  }

  return {
    statusCode: 502,
    message: 'Calculator data is temporarily unavailable. Please try again later.',
  };
}
