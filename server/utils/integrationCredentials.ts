import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

type CredentialContext = {
  masterSecret: string;
  dealerId: string;
  provider: string;
  kind: string;
};

const VERSION = 'v1';
const ROOT_SECRET_MIN_LENGTH = 32;
const MAX_CREDENTIAL_LENGTH = 4_096;

export function encryptIntegrationCredential(plaintext: string, context: CredentialContext): string {
  const value = plaintext.trim();
  if (!value || value.length > MAX_CREDENTIAL_LENGTH) {
    throw new Error('Integration credential must be between 1 and 4096 characters');
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(context.masterSecret), iv);
  cipher.setAAD(Buffer.from(additionalAuthenticatedData(context)));
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv, tag, encrypted]
    .map(part => typeof part === 'string' ? part : part.toString('base64url'))
    .join(':');
}

export function decryptIntegrationCredential(serialized: string, context: CredentialContext): string {
  try {
    const [version, ivValue, tagValue, encryptedValue, ...extra] = serialized.split(':');
    if (version !== VERSION || !ivValue || !tagValue || !encryptedValue || extra.length) {
      throw new Error('Invalid encrypted credential format');
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      deriveKey(context.masterSecret),
      Buffer.from(ivValue, 'base64url'),
    );
    decipher.setAAD(Buffer.from(additionalAuthenticatedData(context)));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
    if (!decrypted) throw new Error('Credential decrypted to an empty value');
    return decrypted;
  } catch {
    throw new Error('Unable to decrypt integration credential');
  }
}

export function credentialHint(value: string): string {
  const trimmed = value.trim();
  return trimmed ? `…${trimmed.slice(-4)}` : 'Not set';
}

export function integrationCredentialMasterSecret(): string {
  return String(
    process.env.DEALER_CREDENTIALS_ENCRYPTION_KEY
    || process.env.NUXT_JWT_SECRET
    || process.env.JWT_SECRET
    || '',
  );
}

export function canEncryptIntegrationCredentials(): boolean {
  return integrationCredentialMasterSecret().length >= ROOT_SECRET_MIN_LENGTH;
}

function deriveKey(masterSecret: string): Buffer {
  if (masterSecret.length < ROOT_SECRET_MIN_LENGTH) {
    throw new Error('Integration credential root secret must be at least 32 characters');
  }
  return Buffer.from(hkdfSync(
    'sha256',
    Buffer.from(masterSecret),
    Buffer.from('bloods-hyundai-integration-credentials'),
    Buffer.from('aes-256-gcm:v1'),
    32,
  ));
}

function additionalAuthenticatedData(context: Omit<CredentialContext, 'masterSecret'>): string {
  return `${VERSION}:${context.dealerId}:${context.provider}:${context.kind}`;
}
