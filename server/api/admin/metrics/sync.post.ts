// server/api/admin/metrics/sync.post.ts
// "Refresh now" from the MarketingTab. Dealer-scoped session auth.
import { runMetricsSync } from '../../../utils/metrics/sync';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  const results = await runMetricsSync(user.dealerId);
  return { results };
});
