// netlify/functions/metrics-sync-cron.mts
// Daily marketing metrics sync. Calls the site's internal endpoint with the cron secret.
import type { Config } from '@netlify/functions';

export default async () => {
  const base = process.env.URL || 'https://bloodhyundai.com.au';
  const secret = process.env.METRICS_CRON_SECRET;
  if (!secret) {
    console.error('[metrics-sync-cron] METRICS_CRON_SECRET not set — skipping');
    return;
  }
  const res = await fetch(`${base}/api/internal/metrics-sync`, {
    method: 'POST',
    headers: { 'x-cron-secret': secret },
  });
  console.log(`[metrics-sync-cron] status ${res.status}`);
};

export const config: Config = { schedule: '30 18 * * *' }; // 18:30 UTC = 04:30 AEST, after ad platforms settle the prior day
