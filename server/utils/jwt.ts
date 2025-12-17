import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.NUXT_JWT_SECRET || 'your-secret-key-min-32-characters-long';
const JWT_REFRESH_SECRET = process.env.NUXT_JWT_REFRESH_SECRET || 'your-refresh-secret-key-min-32-characters';

// Convert string secret to Uint8Array for jose
const secret = new TextEncoder().encode(JWT_SECRET);
const refreshSecret = new TextEncoder().encode(JWT_REFRESH_SECRET);

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







