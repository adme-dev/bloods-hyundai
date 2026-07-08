import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const migration = readFileSync(
  new URL('../database/migrations/005_seed_tenant_inventory_settings.sql', import.meta.url),
  'utf-8'
);

describe('tenant inventory settings migration', () => {
  it('seeds Blood inventory settings into dealer settings without replacing the full JSON document', () => {
    assert.match(migration, /UPDATE dealers\s+SET\s+settings = jsonb_set\(/i);
    assert.match(migration, /WHERE slug = 'bloods-hyundai'/);
    assert.match(migration, /blood-hyundai\/data\.json/);
    assert.match(migration, /blood-motor-group\/data\.json/);
    assert.match(migration, /geelong-mazda\/data\.json/);
    assert.match(migration, /49b41e33-6e72-b64d-43a2-7897e61c1bf0/);
  });
});
