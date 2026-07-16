import { and, eq } from 'drizzle-orm';
import {
  dealerIntegrationCredentialAudit,
  dealerIntegrationCredentials,
  dealers,
} from '../../../../database/schema';
import { db } from '../../../../utils/db';
import {
  DEALER_STUDIO_CREDENTIAL_KIND,
  DEALER_STUDIO_PROVIDER,
  environmentDealerStudioApiKey,
} from '../../../../utils/dealerStudio/credential';
import { readDealerStudioSettings } from '../../../../utils/dealerStudio/settings';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user?.dealerId) throw createError({ statusCode: 401, message: 'Unauthorized' });
  if (!['admin', 'dealer_admin'].includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' });
  }

  const [dealer] = await db.select({ settings: dealers.settings })
    .from(dealers)
    .where(eq(dealers.id, user.dealerId))
    .limit(1);
  if (!dealer) throw createError({ statusCode: 404, message: 'Dealer not found' });
  if (readDealerStudioSettings(dealer.settings).enabled && !environmentDealerStudioApiKey()) {
    throw createError({ statusCode: 409, message: 'Disable automatic lead delivery before removing its only API key' });
  }

  const [existing] = await db.select({
    id: dealerIntegrationCredentials.id,
    credentialHint: dealerIntegrationCredentials.credentialHint,
  }).from(dealerIntegrationCredentials).where(and(
    eq(dealerIntegrationCredentials.dealerId, user.dealerId),
    eq(dealerIntegrationCredentials.provider, DEALER_STUDIO_PROVIDER),
    eq(dealerIntegrationCredentials.credentialKind, DEALER_STUDIO_CREDENTIAL_KIND),
  )).limit(1);
  if (!existing) throw createError({ statusCode: 404, message: 'Admin-managed Dealer Studio key not found' });

  await db.transaction(async (tx) => {
    await tx.delete(dealerIntegrationCredentials).where(and(
      eq(dealerIntegrationCredentials.id, existing.id),
      eq(dealerIntegrationCredentials.dealerId, user.dealerId),
    ));
    await tx.insert(dealerIntegrationCredentialAudit).values({
      dealerId: user.dealerId,
      provider: DEALER_STUDIO_PROVIDER,
      credentialKind: DEALER_STUDIO_CREDENTIAL_KIND,
      action: 'removed',
      credentialHint: existing.credentialHint,
      actorUserId: user.id,
    });
  });

  return {
    success: true,
    credentialSource: environmentDealerStudioApiKey() ? 'environment' : 'none',
  };
});
