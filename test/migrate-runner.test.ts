// test/migrate-runner.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseStatements, isNonTransactional, pendingMigrations } from '../scripts/migrate.ts';

describe('migrate runner helpers', () => {
  it('splits SQL into statements, ignoring comments and blank lines', () => {
    const sql = `-- comment\nCREATE TABLE a (id int);\n\nCREATE INDEX i ON a (id);\n`;
    assert.deepEqual(parseStatements(sql), ['CREATE TABLE a (id int)', 'CREATE INDEX i ON a (id)']);
  });
  it('flags files that must run outside a transaction', () => {
    assert.equal(isNonTransactional('CREATE INDEX CONCURRENTLY x ON a (id);'), true);
    assert.equal(isNonTransactional('-- migrate:no-transaction\nUPDATE a SET id=1;'), true);
    assert.equal(isNonTransactional('CREATE TABLE a (id int);'), false);
  });
  it('returns only files not yet applied, in order', () => {
    const all = ['2026-07-08-a.sql', '2026-07-09-b.sql', '2026-07-10-c.sql'];
    const applied = new Set(['2026-07-08-a.sql']);
    assert.deepEqual(pendingMigrations(all, applied), ['2026-07-09-b.sql', '2026-07-10-c.sql']);
  });
  it('drops standalone transaction-control statements (the runner owns the transaction)', () => {
    const sql = 'BEGIN;\nUPDATE a SET x = 1;\nCOMMIT;\n';
    assert.deepEqual(parseStatements(sql), ['UPDATE a SET x = 1']);
  });
});
