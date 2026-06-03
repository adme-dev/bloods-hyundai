import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { Pool, neonConfig, neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import * as schema from '../database/schema';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error('NEON_DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

const httpClient = neon(connectionString);
export const dbHttp = drizzleHttp(httpClient, { schema });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Tenant isolation is currently enforced by explicit `dealer_id` WHERE clauses
// in every admin handler — no RLS policies exist on public.* tables. This
// wrapper validates the UUID and is the single place to add RLS plumbing if
// policies are introduced later. The previous implementation issued
// `SET LOCAL app.current_dealer_id = ...` against the pool outside any
// transaction, which is a no-op and an extra round-trip per request.
export async function withTenantContext<T>(
  dealerId: string,
  callback: (tx?: typeof db) => Promise<T>
): Promise<T> {
  if (!UUID_RE.test(dealerId)) {
    throw new Error('Invalid dealer ID format');
  }
  return callback();
}

// Run work inside a transaction with `SET LOCAL app.current_dealer_id` set.
// Use this only when an RLS policy actually depends on the GUC; otherwise
// `withTenantContext` is sufficient and cheaper. The callback MUST use the
// passed-in `tx` for the GUC to apply.
export async function withRlsTenantContext<T>(
  dealerId: string,
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  if (!UUID_RE.test(dealerId)) {
    throw new Error('Invalid dealer ID format');
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_dealer_id', ${dealerId}, true)`);
    return callback(tx as typeof db);
  });
}

export function getPool() {
  return pool;
}

export { schema };
