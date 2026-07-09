import { eq } from 'drizzle-orm';
import { dealers } from '../../../database/schema';
import { db } from '../../../utils/db';
import { listInboundLeadEmailAddresses } from '../../../utils/leadIngestion/emailAddresses';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const config = useRuntimeConfig();
  const [dealer] = await db
    .select({ settings: dealers.settings })
    .from(dealers)
    .where(eq(dealers.id, user.dealerId))
    .limit(1);

  return {
    configured: Boolean(config.inboundLeadEmailDomain),
    ...listInboundLeadEmailAddresses(
      (dealer?.settings as Record<string, any>) || {},
      config.inboundLeadEmailDomain || null,
    ),
  };
});
