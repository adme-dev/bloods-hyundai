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

  // Use the pre-sorted vehicleCategories from the API response
  // The API sorts categories with "Coming Soon" always at the end
  const vehicleCategories = computed(() => {
    // First try to use the pre-sorted array from the API
    if (data.value?.vehicleCategories && Array.isArray(data.value.vehicleCategories)) {
      return data.value.vehicleCategories;
    }
    // Fallback: compute from groupedByCategory with proper sorting
    const grouped = groupedByCategory.value;
    if (grouped && Object.keys(grouped).length > 0) {
      const categoryOrder = ['Electric', 'Hybrid', 'SUVs and People Movers', 'Performance', 'Hatch & Sedans', 'Runout', 'Coming Soon'];
      return Object.keys(grouped).sort((a, b) => {
        const aIndex = categoryOrder.indexOf(a);
        const bIndex = categoryOrder.indexOf(b);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return a === 'Coming Soon' ? 1 : -1;
        if (bIndex !== -1) return b === 'Coming Soon' ? -1 : 1;
        return a.localeCompare(b);
      });
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

