import { and, eq } from 'drizzle-orm';
import {
  dealerIntegrationCredentialAudit,
  dealerIntegrationCredentials,
} from '../../../../database/schema';
import { db } from '../../../../utils/db';
import {
  DEALER_STUDIO_CREDENTIAL_KIND,
  DEALER_STUDIO_PROVIDER,
} from '../../../../utils/dealerStudio/credential';
import { fetchDealerStudioApiKeyDetails } from '../../../../utils/dealerStudio/client';
import {
  canEncryptIntegrationCredentials,
  credentialHint as buildCredentialHint,
  encryptIntegrationCredential,
  integrationCredentialMasterSecret,
} from '../../../../utils/integrationCredentials';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user?.dealerId) throw createError({ statusCode: 401, message: 'Unauthorized' });
  if (!['admin', 'dealer_admin'].includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' });
  }

  const body = await readBody<{ apiKey?: unknown }>(event);
  const value = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';
  if (value.length < 8 || value.length > 500) {
    throw createError({ statusCode: 422, message: 'Dealer Studio API key must be between 8 and 500 characters' });
  }
  if (!canEncryptIntegrationCredentials()) {
    throw createError({
      statusCode: 503,
      message: 'Secure credential storage is unavailable. Configure DEALER_CREDENTIALS_ENCRYPTION_KEY before saving a key.',
    });
  }

  let details;
  try {
    details = await fetchDealerStudioApiKeyDetails(value);
  } catch (error: any) {
    throw createError({ statusCode: 422, message: error?.message || 'Dealer Studio rejected this API key' });
  }
  if (!details.permissions.includes('create:lead')) {
    throw createError({ statusCode: 422, message: 'Insufficient permissions: Dealer Studio key requires create:lead' });
  }

  const hint = buildCredentialHint(value);
  const encryptedValue = encryptIntegrationCredential(value, {
    masterSecret: integrationCredentialMasterSecret(),
    dealerId: user.dealerId,
    provider: DEALER_STUDIO_PROVIDER,
    kind: DEALER_STUDIO_CREDENTIAL_KIND,
  });
  const [existing] = await db.select({ id: dealerIntegrationCredentials.id })
    .from(dealerIntegrationCredentials)
    .where(and(
      eq(dealerIntegrationCredentials.dealerId, user.dealerId),
      eq(dealerIntegrationCredentials.provider, DEALER_STUDIO_PROVIDER),
      eq(dealerIntegrationCredentials.credentialKind, DEALER_STUDIO_CREDENTIAL_KIND),
    ))
    .limit(1);
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(dealerIntegrationCredentials).values({
      dealerId: user.dealerId,
      provider: DEALER_STUDIO_PROVIDER,
      credentialKind: DEALER_STUDIO_CREDENTIAL_KIND,
      encryptedValue,
      credentialHint: hint,
      keyVersion: 1,
      updatedBy: user.id,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: [
        dealerIntegrationCredentials.dealerId,
        dealerIntegrationCredentials.provider,
        dealerIntegrationCredentials.credentialKind,
      ],
      set: {
        encryptedValue,
        credentialHint: hint,
        keyVersion: 1,
        updatedBy: user.id,
        updatedAt: now,
      },
    });

    await tx.insert(dealerIntegrationCredentialAudit).values({
      dealerId: user.dealerId,
      provider: DEALER_STUDIO_PROVIDER,
      credentialKind: DEALER_STUDIO_CREDENTIAL_KIND,
      action: existing ? 'rotated' : 'created',
      credentialHint: hint,
      actorUserId: user.id,
    });
  });

  return {
    success: true,
    credential: { source: 'admin', hint, updatedAt: now },
    permissions: details.permissions,
    dealerships: details.dealerships,
  };
});
