import { createHmac } from 'node:crypto';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const config = useRuntimeConfig();
  const enabled = String(config.realtimeEventsEnabled || process.env.REALTIME_EVENTS_ENABLED || '').toLowerCase() === 'true';
  const wsUrl = config.public.adminRealtimeUrl || process.env.NUXT_PUBLIC_ADMIN_REALTIME_URL || '';
  const clientSecret = config.realtimeClientSecret || process.env.REALTIME_CLIENT_SECRET || process.env.ADMIN_REALTIME_CLIENT_SECRET || '';

  if (!enabled) {
    return { enabled: false, reason: 'Realtime events disabled' };
  }

  if (!wsUrl || !clientSecret) {
    throw createError({ statusCode: 503, message: 'Realtime client endpoint is not configured' });
  }

  const timestamp = String(Date.now());
  const token = createHmac('sha256', clientSecret)
    .update(`${user.dealerId}.${timestamp}`)
    .digest('hex');

  return {
    enabled: true,
    dealerId: user.dealerId,
    wsUrl,
    timestamp,
    token,
  };
});
