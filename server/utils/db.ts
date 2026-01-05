import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from '../database/schema';
// @ts-expect-error - ws may be mocked in some environments
import ws from 'ws';

// Configure Neon for WebSocket support
// Cloudflare Workers have native WebSocket, but Node.js (Netlify) needs the ws package
// The ws import is aliased to empty for Cloudflare builds in nuxt.config.ts
if (ws && typeof ws === 'function') {
  neonConfig.webSocketConstructor = ws;
}

// Create connection pool
const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error('NEON_DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });

/**
 * Set tenant context for Row-Level Security (RLS)
 * This must be called before any queries that need tenant isolation
 *
 * @param dealerId - UUID of the dealer to set as current tenant
 */
export async function setTenantContext(dealerId: string) {
  // Validate UUID format to prevent SQL injection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(dealerId)) {
    throw new Error('Invalid dealer ID format');
  }
  await pool.query(`SET LOCAL app.current_dealer_id = '${dealerId}'`);
}

/**
 * Clear tenant context (useful for cleanup)
 */
export async function clearTenantContext() {
  await pool.query(`RESET app.current_dealer_id`);
}

/**
 * Execute a query within a tenant context
 * Automatically sets and clears the tenant context
 * 
 * @param dealerId - UUID of the dealer
 * @param callback - Function to execute with tenant context
 */
export async function withTenantContext<T>(
  dealerId: string,
  callback: () => Promise<T>
): Promise<T> {
  try {
    await setTenantContext(dealerId);
    return await callback();
  } finally {
    await clearTenantContext();
  }
}

/**
 * Get a database client for transaction support
 */
export function getPool() {
  return pool;
}

// Export schema for use in other files
export { schema };










