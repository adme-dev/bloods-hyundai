import { SignJWT, jwtVerify } from 'jose';

/**
 * Get JWT secrets lazily to avoid module load-time errors
 * and to properly access runtime config
 */
function getSecrets() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Try runtime config first, then fall back to process.env
  const jwtSecret = process.env.NUXT_JWT_SECRET;
  const jwtRefreshSecret = process.env.NUXT_JWT_REFRESH_SECRET;
  
  // In production, require secrets to be set
  if (isProduction && (!jwtSecret || jwtSecret.length < 32)) {
    throw new Error('NUXT_JWT_SECRET must be set to a secure value (min 32 characters) in production');
  }
  
  // Use the same secret for refresh if not explicitly set (with warning)
  const finalJwtSecret = jwtSecret || 'dev-only-secret-key-min-32-chars-long';
  const finalRefreshSecret = jwtRefreshSecret || finalJwtSecret;
  
  return {
    secret: new TextEncoder().encode(finalJwtSecret),
    refreshSecret: new TextEncoder().encode(finalRefreshSecret),
  };
}

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
  const { secret } = getSecrets();
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
  const { refreshSecret } = getSecrets();
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
  const { secret } = getSecrets();
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
  const { refreshSecret } = getSecrets();
  try {
    const { payload } = await jwtVerify(token, refreshSecret);
    return payload as { userId: string; dealerId: string };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}










