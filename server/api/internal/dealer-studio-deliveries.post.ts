import { processDueDealerStudioExports } from '../../utils/dealerStudio/delivery';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const expected = String(config.dealerStudioCronSecret || process.env.DEALER_STUDIO_CRON_SECRET || '');
  const provided = getHeader(event, 'x-dealer-studio-cron-secret');
  if (!expected || provided !== expected) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  const results = await processDueDealerStudioExports({ limit: 50 });
  return { processed: results.length, results };
});

