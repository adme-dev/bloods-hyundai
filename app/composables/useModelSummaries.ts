export const useModelSummaries = () => {
  const { data, pending, error, refresh } = useFetch<any>('/api/model-summaries', {
    key: 'model-summaries',
    server: true,
    lazy: false,
    default: () => ({
      success: false,
      models: [],
      variants: [],
      groupedByCategory: {},
      vehicleCategories: [],
    }),
    transform: (data: any) => {
      if (!data?.success) {
        return {
          success: false,
          models: [],
          variants: [],
          groupedByCategory: {},
          vehicleCategories: [],
        };
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
