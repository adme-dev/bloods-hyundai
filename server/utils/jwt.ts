import { SignJWT, jwtVerify } from 'jose';

// In production, require JWT secrets to be set via environment variables
// Fallback to dev secrets only in development mode
const isProduction = process.env.NODE_ENV === 'production';

const JWT_SECRET = process.env.NUXT_JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.NUXT_JWT_REFRESH_SECRET;

// Fail fast in production if secrets are not configured
if (isProduction && (!JWT_SECRET || JWT_SECRET.length < 32)) {
  throw new Error('NUXT_JWT_SECRET must be set to a secure value (min 32 characters) in production');
}
if (isProduction && (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32)) {
  throw new Error('NUXT_JWT_REFRESH_SECRET must be set to a secure value (min 32 characters) in production');
}

// Use dev fallbacks only in non-production
const jwtSecret = JWT_SECRET || 'dev-only-secret-key-min-32-chars-long';
const jwtRefreshSecret = JWT_REFRESH_SECRET || 'dev-only-refresh-secret-min-32-chars';

// Convert string secret to Uint8Array for jose
const secret = new TextEncoder().encode(jwtSecret);
const refreshSecret = new TextEncoder().encode(jwtRefreshSecret);

export interface JWTPayload {
  userId: string;
  dealerId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

/**
 * Sign a JWT access token
 * Expires in 1 hour
 */
export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

/**
 * Sign a JWT refresh token
 * Expires in 7 days
 */
export async function signRefreshToken(payload: { userId: string; dealerId: string }): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(refreshSecret);
}

/**
 * Verify and decode an access token
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify and decode a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<{ userId: string; dealerId: string }> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret);
    return payload as { userId: string; dealerId: string };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}
