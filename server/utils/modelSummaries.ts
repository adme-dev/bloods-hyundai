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

export function toModelSummaries(rawData: any): ModelSummariesResponse {
  if (!rawData?.success || !Array.isArray(rawData.variants)) {
    return emptyModelSummaries();
  }

  const models = rawData.variants.map(toModelSummary);
  const vehicleCategories = Array.isArray(rawData.vehicleCategories) && rawData.vehicleCategories.length
    ? rawData.vehicleCategories
    : getSortedCategories(models);

  const groupedByCategory = models.reduce<ModelSummariesResponse['groupedByCategory']>((groups, model) => {
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

function toModelSummary(model: any): ModelSummary {
  const name = model.name || model.title?.rendered || '';
  const image = model.image || model.desktopImage || model.mobileImage || null;
  const category = model.category || model.vehiclecat || '';
  const categoryDescription = model.categoryDescription || model.caption || '';

  return {
    id: String(model.id || model.modelId || model.slug || name),
    modelId: model.modelId ? String(model.modelId) : undefined,
    name,
    slug: model.slug || slugify(name),
    category,
    categoryDescription,
    image,
    mobileImage: model.mobileImage || image,
    desktopImage: model.desktopImage || image,
    lowPrice: model.lowPrice ?? null,
    highPrice: model.highPrice ?? null,
    priceEnabled: model.priceEnabled,
    modelUrl: model.modelUrl || null,
    calculatorUrl: model.calculatorUrl || null,
    isNPerformance: model.isNPerformance,
    order: model.order,
    fuelType: model.fuelType,
    hasOffer: model.hasOffer,
    isNew: model.isNew,
    hideInListing: model.hideInListing,
    isComingSoon: model.isComingSoon,
    form: model.form,
    tagline: model.tagline,
    title: { rendered: name },
    model_image: image,
    caption: categoryDescription,
    vehiclecat: category,
  };
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
