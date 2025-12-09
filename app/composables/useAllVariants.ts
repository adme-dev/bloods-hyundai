/**
 * Shared composable for fetching all variants
 * Uses a shared key to ensure only ONE fetch happens across all components
 * The key 'all-variants-shared' ensures Nuxt deduplicates the request
 * This ensures the API URL is hidden from browser network tab
 */
export const useAllVariants = () => {
  // Use a shared key to ensure deduplication - all components using this composable
  // will share the same fetch request, preventing duplicate calls
  const { data, pending, error, refresh } = useFetch<any>('/api/all-variants', {
    key: 'all-variants-shared', // CRITICAL: Shared key ensures only ONE fetch happens
    server: true, // Only fetch on server
    lazy: false, // Fetch eagerly during SSR to include in initial payload (prevents client fetch)
    default: () => ({ success: false, variants: [], groupedByCategory: {} }),
    transform: (data: any) => {
      if (!data || !data.success) {
        return { success: false, variants: [], groupedByCategory: {} };
      }
      return data;
    },
    onResponseError({ response }) {
      console.error('[useAllVariants] Error fetching variants:', response.status, response.statusText);
    },
  });

  // Return computed properties from fetch data
  const variants = computed(() => {
    return data.value?.variants || [];
  });

  const groupedByCategory = computed(() => {
    return data.value?.groupedByCategory || {};
  });

  const vehicleCategories = computed(() => {
    const grouped = groupedByCategory.value;
    if (grouped && Object.keys(grouped).length > 0) {
      return Object.keys(grouped);
    }
    return [];
  });

  const success = computed(() => {
    return data.value?.success || false;
  });

  return {
    variants,
    groupedByCategory,
    vehicleCategories,
    success,
    pending,
    error,
    refresh,
    // Raw data access if needed
    data,
  };
};

