/**
 * Customer JWT utilities using jose (Cloudflare Workers compatible)
 * 
 * This module provides JWT functions specifically for customer authentication.
 * Uses 'jose' library which works on edge runtimes (Cloudflare Workers).
 */
import { SignJWT, jwtVerify } from 'jose';

export interface CustomerJWTPayload {
  customerId: string;
  dealerId: string;
  email: string;
  type: 'customer';
}

/**
 * Get the JWT secret as a Uint8Array for jose
 */
function getSecret(): Uint8Array {
  const config = useRuntimeConfig();
  const secret = config.jwtSecret || 'default-secret-for-development-only';
  return new TextEncoder().encode(secret);
}

/**
 * Sign a customer JWT access token
 * Expires in 7 days
 */
export async function signCustomerToken(payload: CustomerJWTPayload): Promise<string> {
  const secret = getSecret();
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

/**
 * Verify and decode a customer token
 */
export async function verifyCustomerToken(token: string): Promise<CustomerJWTPayload> {
  const secret = getSecret();
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as CustomerJWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired customer token');
  }
}
