import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  credentialHint,
  decryptIntegrationCredential,
  encryptIntegrationCredential,
  integrationCredentialMasterSecret,
} from '../server/utils/integrationCredentials.ts';

const context = {
  masterSecret: 'a-production-strength-root-secret-with-more-than-32-characters',
  dealerId: '7f013aa8-fe82-4d98-8685-2947cf1b3d78',
  provider: 'dealer_studio',
  kind: 'api_key',
};

describe('integration credential encryption', () => {
  it('round-trips a credential without storing plaintext', () => {
    const encrypted = encryptIntegrationCredential('dealer-studio-secret-key', context);
    assert.doesNotMatch(encrypted, /dealer-studio-secret-key/);
    assert.match(encrypted, /^v1:/);
    assert.equal(decryptIntegrationCredential(encrypted, context), 'dealer-studio-secret-key');
  });

  it('binds ciphertext to its dealer and purpose', () => {
    const encrypted = encryptIntegrationCredential('dealer-studio-secret-key', context);
    assert.throws(
      () => decryptIntegrationCredential(encrypted, { ...context, dealerId: '9c1f5a9c-d0db-4d88-8794-e597c4967145' }),
      /decrypt/i,
    );
  });

  it('requires a strong root secret and exposes only a short hint', () => {
    assert.throws(
      () => encryptIntegrationCredential('dealer-studio-secret-key', { ...context, masterSecret: 'short' }),
      /at least 32 characters/i,
    );
    assert.equal(credentialHint('dealer-studio-secret-key'), '…-key');
  });

  it('uses the existing Nuxt JWT secret when a dedicated encryption root is not configured', () => {
    const dedicated = process.env.DEALER_CREDENTIALS_ENCRYPTION_KEY;
    const nuxtJwt = process.env.NUXT_JWT_SECRET;
    const legacyJwt = process.env.JWT_SECRET;
    delete process.env.DEALER_CREDENTIALS_ENCRYPTION_KEY;
    process.env.NUXT_JWT_SECRET = context.masterSecret;
    delete process.env.JWT_SECRET;
    try {
      assert.equal(integrationCredentialMasterSecret(), context.masterSecret);
    } finally {
      restoreEnvironment('DEALER_CREDENTIALS_ENCRYPTION_KEY', dedicated);
      restoreEnvironment('NUXT_JWT_SECRET', nuxtJwt);
      restoreEnvironment('JWT_SECRET', legacyJwt);
    }
  });
});

describe('integration credential persistence', () => {
  const migration = readFileSync(
    new URL('../scripts/migrations/2026-07-16-dealer-integration-credentials.sql', import.meta.url),
    'utf8',
  );

  it('stores tenant-scoped encrypted credentials and append-only audit events', () => {
    assert.match(migration, /CREATE TABLE IF NOT EXISTS dealer_integration_credentials/i);
    assert.match(migration, /encrypted_value text NOT NULL/i);
    assert.match(migration, /UNIQUE \(dealer_id, provider, credential_kind\)/i);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS dealer_integration_credential_audit/i);
    assert.doesNotMatch(migration, /api_key text/i);
  });
});

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
