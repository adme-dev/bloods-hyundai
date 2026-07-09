export interface VehicleModelSummary {
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
  segment_desc?: string;
  startingPrice?: string | number;
  variant_link?: string;
}

export interface ModelSummariesResponse {
  success: boolean;
  totalModels?: number;
  vehicleCategories: string[];
  groupedByCategory: Record<string, {
    name: string;
    description: string;
    models: VehicleModelSummary[];
  }>;
  models: VehicleModelSummary[];
  variants: VehicleModelSummary[];
}

const emptyModelSummaries = (): ModelSummariesResponse => ({
  success: false,
  models: [],
  variants: [],
  groupedByCategory: {},
  vehicleCategories: [],
});

export const useModelSummaries = () => {
  const { data, pending, error, refresh } = useFetch<ModelSummariesResponse>('/api/model-summaries', {
    key: 'model-summaries',
    server: true,
    lazy: false,
    default: emptyModelSummaries,
    transform: (data) => {
      if (!data?.success) {
        return emptyModelSummaries();
      }

      return data;
    },
    onResponseError({ response }) {
      console.error('[useModelSummaries] Error fetching model summaries:', response.status, response.statusText);
    },
  });

  const models = computed(() => data.value?.models || data.value?.variants || []);
  const variants = computed(() => models.value);
  const groupedByCategory = computed(() => data.value?.groupedByCategory || {});
  const vehicleCategories = computed(() => data.value?.vehicleCategories || []);
  const success = computed(() => data.value?.success || false);

  return {
    models,
    variants,
    groupedByCategory,
    vehicleCategories,
    success,
    pending,
    error,
    refresh,
    data,
  };
};
