import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  deliveryFailureUpdate,
  planDealerStudioQueue,
} from '../server/utils/dealerStudio/deliveryPolicy.ts';

const configured = {
  enabled: true,
  dealershipId: 123,
  dealershipSlug: 'bloods-hyundai',
  dealershipName: 'Bloods Hyundai',
  locationId: 456,
  locationName: 'Sales',
  defaultUserEmail: null,
  lastTestedAt: null,
};

const validEnquiry = {
  id: '7f013aa8-fe82-4d98-8685-2947cf1b3d78',
  type: 'contact',
  source: 'website',
  firstName: 'Jane',
  lastName: 'Citizen',
  email: 'jane@example.com',
  phone: '0412345678',
  archivedAt: null,
};

describe('Dealer Studio delivery policy', () => {
  it('queues valid leads only when the integration is enabled', () => {
    assert.deepEqual(planDealerStudioQueue(validEnquiry, configured), { status: 'pending', error: null });
    assert.deepEqual(planDealerStudioQueue(validEnquiry, { ...configured, enabled: false }), { status: 'skipped', error: null });
    assert.deepEqual(planDealerStudioQueue({ ...validEnquiry, archivedAt: new Date() }, configured), { status: 'skipped', error: null });
  });

  it('records missing required fields as validation failures without dropping the local lead', () => {
    assert.deepEqual(planDealerStudioQueue({ ...validEnquiry, phone: null }, configured), {
      status: 'failed_validation',
      error: 'Customer phone is required by Dealer Studio',
    });
  });

  it('retries explicit provider outages but stops after five attempts', () => {
    const now = new Date('2026-07-16T00:00:00Z');
    const retry = deliveryFailureUpdate({
      ok: false,
      kind: 'retryable',
      status: 503,
      error: 'Unavailable',
    }, 1, now);
    assert.equal(retry.status, 'failed_retryable');
    assert.equal(retry.nextAttemptAt?.toISOString(), '2026-07-16T00:02:00.000Z');

    const exhausted = deliveryFailureUpdate({
      ok: false,
      kind: 'retryable',
      status: 503,
      error: 'Unavailable',
    }, 5, now);
    assert.equal(exhausted.status, 'failed_permanent');
    assert.equal(exhausted.nextAttemptAt, null);
  });

  it('does not automatically retry ambiguous timeouts or configuration failures', () => {
    const now = new Date('2026-07-16T00:00:00Z');
    const ambiguous = deliveryFailureUpdate({
      ok: false,
      kind: 'ambiguous',
      status: null,
      error: 'Timed out',
    }, 1, now);
    assert.equal(ambiguous.status, 'failed_permanent');
    assert.match(ambiguous.lastError, /manual review/i);

    const config = deliveryFailureUpdate({
      ok: false,
      kind: 'configuration',
      status: 401,
      error: 'Unauthorized',
    }, 1, now);
    assert.equal(config.status, 'failed_permanent');
  });
});

describe('Dealer Studio delivery migration', () => {
  const migration = readFileSync(
    new URL('../scripts/migrations/2026-07-16-dealer-studio-lead-export.sql', import.meta.url),
    'utf8',
  );

  it('creates a tenant-scoped durable delivery table with one provider delivery per enquiry', () => {
    assert.match(migration, /CREATE TABLE IF NOT EXISTS lead_export_deliveries/i);
    assert.match(migration, /dealer_id uuid NOT NULL REFERENCES dealers/i);
    assert.match(migration, /enquiry_id uuid NOT NULL REFERENCES enquiries/i);
    assert.match(migration, /UNIQUE \(provider, enquiry_id\)/i);
    assert.match(migration, /provider_cluster_id/i);
    assert.match(migration, /next_attempt_at/i);
  });
});
