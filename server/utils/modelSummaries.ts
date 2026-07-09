export interface ModelSummary {
  id: string;
  modelId?: string;
  name: string;
  slug: string;
  category: string;
  categoryDescription: string;
  image: string | null;
  mobileImage: string | null;
  desktopImage: string | null;
  lowPrice?: number | null;
  highPrice?: number | null;
  priceEnabled?: boolean;
  modelUrl?: string | null;
  calculatorUrl?: string | null;
  isNPerformance?: boolean;
  order?: number;
  fuelType?: string;
  hasOffer?: boolean;
  isNew?: boolean;
  hideInListing?: boolean;
  isComingSoon?: boolean;
  form?: boolean;
  tagline?: string;
  title: { rendered: string };
  model_image: string | null;
  caption: string;
  vehiclecat: string;
}

interface ModelSummariesResponse {
  success: boolean;
  totalModels: number;
  vehicleCategories: string[];
  groupedByCategory: Record<string, { name: string; description: string; models: ModelSummary[] }>;
  models: ModelSummary[];
  variants: ModelSummary[];
}

type RawModelSummary = Record<string, unknown>;

const CATEGORY_ORDER = [
  'Electric',
  'Hybrid',
  'SUVs and People Movers',
  'Performance',
  'Hatch and Sedan',
  'Vans and Trucks',
  'Runout',
  'Coming Soon',
];

export function toModelSummaries(rawData: unknown): ModelSummariesResponse {
  if (!isRecord(rawData) || rawData.success !== true || !Array.isArray(rawData.variants)) {
    return emptyModelSummaries();
  }

  const seenModelKeys = new Set<string>();
  const models: ModelSummary[] = rawData.variants
    .filter(isRecord)
    .map(toModelSummary)
    .filter((model: ModelSummary) => {
      const key = model.slug || model.name.toLowerCase();
      if (!key || seenModelKeys.has(key)) {
        return false;
      }
      seenModelKeys.add(key);
      return true;
    });
  const vehicleCategories = Array.isArray(rawData.vehicleCategories) && rawData.vehicleCategories.length
    ? rawData.vehicleCategories.map(String)
    : getSortedCategories(models);

  const groupedByCategory: ModelSummariesResponse['groupedByCategory'] = models.reduce((groups: ModelSummariesResponse['groupedByCategory'], model: ModelSummary) => {
    const category = model.category || 'Other';
    groups[category] ||= {
      name: category,
      description: model.categoryDescription || '',
      models: [],
    };
    groups[category].models.push(model);
    return groups;
  }, {});

  Object.values(groupedByCategory).forEach((group) => {
    group.models.sort((a, b) => (a.order || 999) - (b.order || 999));
  });

  return {
    success: true,
    totalModels: models.length,
    vehicleCategories,
    groupedByCategory,
    models,
    variants: models,
  };
}

function emptyModelSummaries(): ModelSummariesResponse {
  return {
    success: false,
    totalModels: 0,
    vehicleCategories: [],
    groupedByCategory: {},
    models: [],
    variants: [],
  };
}

function toModelSummary(model: RawModelSummary): ModelSummary {
  const title = isRecord(model.title) ? optionalString(model.title.rendered) : undefined;
  const name = optionalString(model.name) || title || '';
  const image = optionalString(model.image) || optionalString(model.desktopImage) || optionalString(model.mobileImage) || null;
  const category = optionalString(model.category) || optionalString(model.vehiclecat) || '';
  const categoryDescription = optionalString(model.categoryDescription) || optionalString(model.caption) || '';

  return {
    id: String(model.id || model.modelId || model.slug || name),
    modelId: model.modelId ? String(model.modelId) : undefined,
    name,
    slug: optionalString(model.slug) || slugify(name),
    category,
    categoryDescription,
    image,
    mobileImage: optionalString(model.mobileImage) || image,
    desktopImage: optionalString(model.desktopImage) || image,
    lowPrice: optionalNumber(model.lowPrice) ?? null,
    highPrice: optionalNumber(model.highPrice) ?? null,
    priceEnabled: optionalBoolean(model.priceEnabled),
    modelUrl: optionalString(model.modelUrl) || null,
    calculatorUrl: optionalString(model.calculatorUrl) || null,
    isNPerformance: optionalBoolean(model.isNPerformance),
    order: optionalNumber(model.order) ?? undefined,
    fuelType: optionalString(model.fuelType),
    hasOffer: optionalBoolean(model.hasOffer),
    isNew: optionalBoolean(model.isNew),
    hideInListing: optionalBoolean(model.hideInListing),
    isComingSoon: optionalBoolean(model.isComingSoon),
    form: optionalBoolean(model.form),
    tagline: optionalString(model.tagline),
    title: { rendered: name },
    model_image: image,
    caption: categoryDescription,
    vehiclecat: category,
  };
}

function isRecord(value: unknown): value is RawModelSummary {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function optionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  return typeof value === 'string' ? value : String(value);
}

function optionalNumber(value: unknown): number | null | undefined {
  if (value == null) return value as null | undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function getSortedCategories(models: ModelSummary[]) {
  const categories = Array.from(new Set(models.map((model) => model.category).filter(Boolean)));
  return categories.sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a);
    const bIndex = CATEGORY_ORDER.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return a === 'Coming Soon' ? 1 : -1;
    if (bIndex !== -1) return b === 'Coming Soon' ? -1 : 1;
    return a.localeCompare(b);
  });
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
