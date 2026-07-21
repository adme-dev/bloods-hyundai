import { eq } from 'drizzle-orm';
import { dealers } from '../../../database/schema';
import { invalidateNitroFunctionCache } from '../../../utils/cache-refresh';
import { db } from '../../../utils/db';
import { resolveTenantCacheKey } from '../../../utils/tenant';
import { parseHomepageSliderInput } from '../../../../shared/homepageSlider';

const EDITOR_ROLES = ['admin', 'dealer_admin', 'manager'];

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const dealerId = event.context.dealerId;
  if (!user || !dealerId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  if (!EDITOR_ROLES.includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' });
  }

  const body = await readBody(event);
  const parsed = parseHomepageSliderInput(body, {
    allowedImageHosts: getAllowedImageHosts(),
  });
  if (!parsed.ok) {
    throw createError({
      statusCode: 422,
      message: 'Invalid homepage slider settings',
      data: { errors: parsed.errors },
    });
  }

  try {
    const [dealer] = await db
      .select({ settings: dealers.settings })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);
    if (!dealer) throw createError({ statusCode: 404, message: 'Dealer not found' });

    const currentSettings = (dealer.settings as Record<string, unknown>) || {};
    await db
      .update(dealers)
      .set({
        settings: {
          ...currentSettings,
          homepageSlider: parsed.value,
        },
        updatedAt: new Date(),
      })
      .where(eq(dealers.id, dealerId));

    await invalidateNitroFunctionCache(
      useStorage('cache'),
      'site-config',
      resolveTenantCacheKey(event, 'site-config-data:v3'),
    );
    setResponseHeader(event, 'Cache-Control', 'no-store');

    return {
      success: true,
      message: parsed.value.slides.some((slide) => slide.enabled)
        ? 'Homepage slider published successfully'
        : 'Homepage slider cleared successfully',
      settings: parsed.value,
    };
  } catch (error: any) {
    if (error?.statusCode) throw error;
    console.error('Failed to update homepage slider settings:', error);
    throw createError({ statusCode: 500, message: 'Failed to update homepage slider settings' });
  }
});

function getAllowedImageHosts() {
  const config = useRuntimeConfig();
  const hosts = new Set([
    'bloodhyundai.com.au',
    'www.bloodhyundai.com.au',
    'driveagent.b-cdn.net',
    'driveagentmedia.b-cdn.net',
  ]);

  for (const rawUrl of [config.r2PublicUrl, config.public.siteUrl, config.public.cdnUrl]) {
    if (typeof rawUrl !== 'string' || !rawUrl) continue;
    try { hosts.add(new URL(rawUrl).hostname.toLowerCase()); }
    catch { /* Invalid runtime URLs are ignored; validation remains deny-by-default. */ }
  }

  return hosts;
}
