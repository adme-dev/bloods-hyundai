import { eq } from 'drizzle-orm';
import { dealers } from '../../../database/schema';
import { db } from '../../../utils/db';
import { upsertInboundLeadEmailAddress, type InboundLeadSource } from '../../../utils/leadIngestion/emailAddresses';

const SOURCES = new Set<InboundLeadSource>(['carsales', 'autotrader', 'hyundai_oem', 'meta_lead_ads', 'other']);

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody<{ source?: string; label?: string }>(event);
  if (!body?.source || !SOURCES.has(body.source as InboundLeadSource)) {
    throw createError({ statusCode: 422, message: 'A valid lead source is required' });
  }

  const config = useRuntimeConfig();
  const [dealer] = await db
    .select({ slug: dealers.slug, settings: dealers.settings })
    .from(dealers)
    .where(eq(dealers.id, user.dealerId))
    .limit(1);

  if (!dealer) {
    throw createError({ statusCode: 404, message: 'Dealer not found' });
  }

  const next = upsertInboundLeadEmailAddress((dealer.settings as Record<string, any>) || {}, {
    source: body.source as InboundLeadSource,
    label: body.label,
    domain: config.inboundLeadEmailDomain || null,
    dealerSlug: dealer.slug,
  });

  await db
    .update(dealers)
    .set({ settings: next.settings, updatedAt: new Date() })
    .where(eq(dealers.id, user.dealerId));

  return {
    configured: Boolean(config.inboundLeadEmailDomain),
    address: next.address,
  };
});
