// scripts/migrate.ts
// Applies pending SQL migrations from scripts/migrations/ to NEON_DATABASE_URL,
// recording each in a schema_migrations ledger so it runs exactly once.
// Wired into the Netlify build so code never serves ahead of its database.
// Local builds without NEON_DATABASE_URL are a no-op (logged), so `npm run build`
// still works offline.
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

/** Split a SQL file into individual statements (naive `;` split — safe for this
 * repo's DDL/UPDATE migrations, which contain no dollar-quoted bodies). Standalone
 * transaction-control statements are dropped: the runner owns the transaction. */
export function parseStatements(sql: string): string[] {
  const TXN_CONTROL = /^(begin|start\s+transaction|commit|rollback)$/i;
  return sql
    .split(/;\s*(?:\n|$)/)
    .map(s => s.replace(/^\s*--.*$/gm, '').trim())
    .filter(Boolean)
    .filter(s => !TXN_CONTROL.test(s));
}

/** True when the file must NOT be wrapped in a transaction (CONCURRENTLY, or an
 * explicit `-- migrate:no-transaction` header). */
export function isNonTransactional(sql: string): boolean {
  return /create\s+index\s+concurrently/i.test(sql) || /--\s*migrate:no-transaction/i.test(sql);
}

export function pendingMigrations(allFiles: string[], applied: Set<string>): string[] {
  return allFiles.filter(f => f.endsWith('.sql') && !applied.has(f)).sort();
}

/** Decide whether migrations should run in this build environment.
 * Netlify sets CONTEXT to 'production' | 'deploy-preview' | 'branch-deploy' | 'dev';
 * deploy previews receive production env vars, so gating on the DB URL alone is not enough. */
export function shouldRunMigrations(env: { CONTEXT?: string; NEON_DATABASE_URL?: string }): { run: boolean; reason: string } {
  if (env.CONTEXT && env.CONTEXT !== 'production') {
    return { run: false, reason: `CONTEXT=${env.CONTEXT} — migrations only run in production builds` };
  }
  if (!env.NEON_DATABASE_URL) {
    return { run: false, reason: 'NEON_DATABASE_URL not set — skipping (local build)' };
  }
  return { run: true, reason: 'production build with database URL' };
}

type MigrationLockClient = {
  query(sql: string, values?: unknown[]): Promise<unknown>;
};

const MIGRATION_LOCK_NAME = 'bloods-hyundai-schema-migrations:v1';

/** Serialize migration runners across every deployment connected to the same
 * database. This matters because both Netlify sites build from `main`, and
 * PostgreSQL `IF NOT EXISTS` DDL can still race while creating catalog types. */
export async function withMigrationLock<T>(
  client: MigrationLockClient,
  migrate: () => Promise<T>,
): Promise<T> {
  await client.query('SELECT pg_advisory_lock(hashtext($1))', [MIGRATION_LOCK_NAME]);
  try {
    return await migrate();
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', [MIGRATION_LOCK_NAME]);
  }
}

async function main() {
  const decision = shouldRunMigrations(process.env);
  if (!decision.run) {
    console.log(`[migrate] ${decision.reason}`);
    return;
  }
  const connectionString = process.env.NEON_DATABASE_URL!;
  const { Pool, neonConfig } = await import('@neondatabase/serverless');
  const ws = (await import('ws')).default;
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString });
  try {
    const lockClient = await pool.connect();
    try {
      await withMigrationLock(lockClient, async () => {
        await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
          filename varchar(255) PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
        const appliedRows = await pool.query('SELECT filename FROM schema_migrations');
        const applied = new Set<string>(appliedRows.rows.map((r: any) => r.filename));
        const all = readdirSync(MIGRATIONS_DIR);
        const pending = pendingMigrations(all, applied);
        if (!pending.length) { console.log('[migrate] up to date.'); return; }
        for (const file of pending) {
          const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
          console.log(`[migrate] applying ${file}`);
          const statements = parseStatements(sql);
          const record = 'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING';
          if (isNonTransactional(sql)) {
            // Must run OUTSIDE a transaction (e.g. CREATE INDEX CONCURRENTLY). One
            // dedicated connection so session-level SETs apply to later statements.
            const client = await pool.connect();
            try {
              for (const stmt of statements) await client.query(stmt);
              await client.query(record, [file]);
            } finally { client.release(); }
          } else {
            const client = await pool.connect();
            try {
              await client.query('BEGIN');
              for (const stmt of statements) await client.query(stmt);
              // Ledger row commits atomically with the migration it records.
              await client.query(record, [file]);
              await client.query('COMMIT');
            } catch (e) { await client.query('ROLLBACK'); throw e; }
            finally { client.release(); }
          }
          console.log(`[migrate] ✓ ${file}`);
        }
      });
    } finally {
      lockClient.release();
    }
  } finally { await pool.end(); }
}

// Only run when executed directly (not when imported by tests).
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  main().catch(err => { console.error('[migrate] FAILED:', err.message); process.exit(1); });
}
