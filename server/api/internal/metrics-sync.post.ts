// server/api/internal/metrics-sync.post.ts
// Called by the Netlify scheduled function. Guarded by METRICS_CRON_SECRET.
import { db } from '../../utils/db';
import { dealers } from '../../database/schema';
import { runMetricsSync } from '../../utils/metrics/sync';

export default defineEventHandler(async (event) => {
  const secret = getHeader(event, 'x-cron-secret');
  if (!process.env.METRICS_CRON_SECRET || secret !== process.env.METRICS_CRON_SECRET) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const allDealers = await db.select({ id: dealers.id, settings: dealers.settings }).from(dealers);
  const results = [];
  for (const dealer of allDealers) {
    const integrations = (dealer.settings as Record<string, any>)?.marketing?.integrations;
    if (!integrations) continue;
    const dealerResults = await runMetricsSync(dealer.id);
    results.push({ dealerId: dealer.id, results: dealerResults });
  }
  return { results };
});
