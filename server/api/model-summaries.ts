import { toModelSummaries } from '../utils/modelSummaries';

export default defineCachedEventHandler(async () => {
  try {
    const allVariants = await $fetch('/api/all-variants');
    return toModelSummaries(allVariants);
  } catch (error: any) {
    console.error('[model-summaries] Error:', error.message);
    return {
      success: false,
      totalModels: 0,
      vehicleCategories: [],
      groupedByCategory: {},
      models: [],
      variants: [],
      error: 'Failed to fetch model summaries',
    };
  }
}, {
  maxAge: 60 * 30,
  staleMaxAge: 60 * 60,
  name: 'model-summaries',
  getKey: () => 'model-summaries-v1',
});
