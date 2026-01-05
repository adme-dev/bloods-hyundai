/**
 * Password hashing utilities using bcryptjs
 * 
 * Uses bcryptjs (pure JavaScript) instead of bcrypt (native)
 * for Cloudflare Workers compatibility.
 */
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}










