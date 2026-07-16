import { and, eq } from 'drizzle-orm';
import { dealerIntegrationCredentials } from '../../database/schema';
import { db } from '../db';
import {
  canEncryptIntegrationCredentials,
  decryptIntegrationCredential,
  integrationCredentialMasterSecret,
} from '../integrationCredentials';

export const DEALER_STUDIO_PROVIDER = 'dealer_studio';
export const DEALER_STUDIO_CREDENTIAL_KIND = 'api_key';

export async function resolveDealerStudioApiKey(dealerId: string): Promise<string> {
  const stored = await findStoredCredential(dealerId);
  if (stored) {
    return decryptIntegrationCredential(stored.encryptedValue, {
      masterSecret: integrationCredentialMasterSecret(),
      dealerId,
      provider: DEALER_STUDIO_PROVIDER,
      kind: DEALER_STUDIO_CREDENTIAL_KIND,
    });
  }
  return environmentDealerStudioApiKey();
}

export async function dealerStudioCredentialStatus(dealerId: string) {
  const stored = await findStoredCredential(dealerId);
  const environmentConfigured = Boolean(environmentDealerStudioApiKey());
  return {
    credentialConfigured: Boolean(stored || environmentConfigured),
    credentialSource: stored ? 'admin' as const : environmentConfigured ? 'environment' as const : 'none' as const,
    credentialHint: stored?.credentialHint || null,
    credentialUpdatedAt: stored?.updatedAt || null,
    credentialStorageReady: canEncryptIntegrationCredentials(),
    cronSecretConfigured: Boolean(process.env.DEALER_STUDIO_CRON_SECRET),
  };
}

export function environmentDealerStudioApiKey(): string {
  return String(process.env.DEALER_STUDIO_API_KEY || '').trim();
}

async function findStoredCredential(dealerId: string) {
  const [stored] = await db.select({
    encryptedValue: dealerIntegrationCredentials.encryptedValue,
    credentialHint: dealerIntegrationCredentials.credentialHint,
    updatedAt: dealerIntegrationCredentials.updatedAt,
  }).from(dealerIntegrationCredentials).where(and(
    eq(dealerIntegrationCredentials.dealerId, dealerId),
    eq(dealerIntegrationCredentials.provider, DEALER_STUDIO_PROVIDER),
    eq(dealerIntegrationCredentials.credentialKind, DEALER_STUDIO_CREDENTIAL_KIND),
  )).limit(1);
  return stored || null;
}
