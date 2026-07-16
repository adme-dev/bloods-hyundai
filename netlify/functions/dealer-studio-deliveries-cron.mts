import type { Config } from '@netlify/functions';

export default async () => {
  const base = process.env.URL || 'https://bloodhyundai.com.au';
  const secret = process.env.DEALER_STUDIO_CRON_SECRET;
  if (!secret) {
    console.error('[dealer-studio-cron] DEALER_STUDIO_CRON_SECRET not set — skipping');
    return;
  }
  const response = await fetch(`${base}/api/internal/dealer-studio-deliveries`, {
    method: 'POST',
    headers: { 'x-dealer-studio-cron-secret': secret },
  });
  if (!response.ok) console.error(`[dealer-studio-cron] status ${response.status}`);
};

export const config: Config = { schedule: '*/2 * * * *' };
