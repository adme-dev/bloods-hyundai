import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from '../database/schema';
import ws from 'ws';

// Configure Neon for WebSocket support (required for serverless)
neonConfig.webSocketConstructor = ws;

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








