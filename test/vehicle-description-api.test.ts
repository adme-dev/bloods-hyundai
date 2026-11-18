import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, it } from 'node:test';
import ts from 'typescript';
import { eq, inArray, sql } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { dealers } from '../server/database/schema.ts';
import * as descriptions from '../shared/vehicleDescriptions.ts';
import { resolveDealerSlug, resolveDealerSlugAliases, DEFAULT_DEALER_SLUG } from '../server/utils/tenant.ts';

// Execute the actual endpoint handlers with an in-memory database boundary.
function endpoint(file: string, rows: unknown[] = []) {
  const queries: { where?: unknown; values?: any }[] = [];
  const dbHttp = {
    select() {
      const query: { where?: unknown } = {};
      queries.push(query);
      return { from: () => ({ where: (where: unknown) => {
        query.where = where;
        return { limit: async () => rows };
      } }) };
    },
    update() {
      const query: { where?: unknown; values?: any } = {};
      queries.push(query);
      return { set: (values: unknown) => {
        query.values = values;
        return { where: (where: unknown) => {
          query.where = where;
          return { returning: async () => rows };
        } };
      } };
    },
  };
  const source = readFileSync(new URL(`../server/api/${file}`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: { default?: (event: any) => Promise<any> } = {};
  const headers: Record<string, string> = {};
  vm.runInNewContext(compiled, {
    exports, process: { env: {} }, console,
    require: (name: string) => {
      if (name === 'drizzle-orm') return { eq, inArray, sql };
      if (name.endsWith('/schema')) return { dealers };
      if (name.endsWith('/db')) return { dbHttp };
      if (name.endsWith('/tenant')) return { resolveDealerSlug, resolveDealerSlugAliases, DEFAULT_DEALER_SLUG };
      if (name.endsWith('/vehicleDescriptions')) return descriptions;
      throw new Error(`Unexpected import ${name}`);
    },
    defineEventHandler: (handler: unknown) => handler,
    readBody: async (event: any) => event.body,
    createError: (value: any) => Object.assign(new Error(value.message), value),
    setResponseHeader: (_event: unknown, key: string, value: string) => { headers[key] = value; },
    useRuntimeConfig: () => ({ public: { dealerSlug: 'sale-hyundai' } }),
  });
  return { handler: exports.default!, queries, headers };
}

const adminEvent = (body: unknown, role = 'admin') => ({ context: { dealerId: 'dealer-a', user: { dealerId: 'dealer-a', role } }, body });
const query = (value: any) => new PgDialect().sqlToQuery(value);

describe('vehicle description settings API', () => {
  it('rejects unauthenticated reads/writes, sales writes and invalid modes before database access', async () => {
    for (const file of ['admin/settings/vehicle-descriptions.get.ts', 'admin/settings/vehicle-descriptions.put.ts']) {
      const api = endpoint(file);
      await assert.rejects(api.handler({ context: {} }), { statusCode: 401 });
      assert.equal(api.queries.length, 0);
    }
    const api = endpoint('admin/settings/vehicle-descriptions.put.ts');
    await assert.rejects(api.handler(adminEvent({ mode: 'both' }, 'sales')), { statusCode: 403 });
    for (const body of [null, {}, { mode: 'ai_only' }, { mode: {} }]) {
      await assert.rejects(api.handler(adminEvent(body)), { statusCode: 422 });
    }
    assert.equal(api.queries.length, 0);
  });

  it('reads the authenticated dealer and returns stored mode with no-store headers', async () => {
    const api = endpoint('admin/settings/vehicle-descriptions.get.ts', [{ settings: { vehicleDescriptions: { mode: 'ai_fallback' } } }]);
    const result = await api.handler(adminEvent(null));
    assert.equal(result.settings.mode, 'ai_fallback');
    assert.deepEqual(query(api.queries[0]!.where).params, ['dealer-a']);
    assert.equal(api.headers['Cache-Control'], 'no-store');
  });

  it('atomically saves only the description key on the authenticated dealer', async () => {
    for (const mode of descriptions.VEHICLE_DESCRIPTION_MODES) {
      const api = endpoint('admin/settings/vehicle-descriptions.put.ts', [{ id: 'dealer-a' }]);
      const result = await api.handler(adminEvent({ mode, dealerId: 'dealer-b', unrelated: 'overwrite' }));
      assert.equal(result.settings.mode, mode);
      assert.deepEqual(query(api.queries[0]!.where).params, ['dealer-a']);
      const update = query(api.queries[0]!.values.settings);
      assert.match(update.sql, /jsonb_set\(coalesce\("dealers"\."settings"/);
      assert.match(update.sql, /\{vehicleDescriptions\}/);
      assert.deepEqual(update.params, [JSON.stringify({ mode })]);
    }
  });

  it('does not report missing dealers as saved', async () => {
    const api = endpoint('admin/settings/vehicle-descriptions.put.ts');
    await assert.rejects(api.handler(adminEvent({ mode: 'both' })), { statusCode: 404 });
  });

  it('resolves the public Blood host and aliases instead of the Sale fallback tenant', async () => {
    const api = endpoint('vehicle-description-settings.get.ts', [{ settings: { vehicleDescriptions: { mode: 'dealer_only' }, privateKey: 'not-public' } }]);
    const result = await api.handler({ context: {}, node: { req: { headers: { host: 'bloodhyundai.com.au' }, url: '/' } } });
    assert.equal(result.settings.mode, 'dealer_only');
    assert.deepEqual(Object.keys(result.settings), ['mode']);
    assert.deepEqual(query(api.queries[0]!.where).params, ['bloods-hyundai', 'blood-hyundai']);
    assert.equal(api.headers['Cache-Control'], 'no-store');
  });
});
