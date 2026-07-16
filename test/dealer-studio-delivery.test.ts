import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  deliveryFailureUpdate,
  planDealerStudioQueue,
} from '../server/utils/dealerStudio/deliveryPolicy.ts';
import { buildDealerStudioSandboxLead } from '../server/utils/dealerStudio/sandbox.ts';

const configured = {
  enabled: true,
  dealershipId: 123,
  dealershipSlug: 'bloods-hyundai',
  dealershipName: 'Bloods Hyundai',
  locationId: 456,
  locationName: 'Sales',
  defaultUserEmail: null,
  lastTestedAt: null,
  sandboxMode: false,
  sandboxDealershipId: null,
  sandboxDealershipSlug: null,
  sandboxDealershipName: null,
  sandboxLocationId: null,
  sandboxLocationName: null,
  sandboxDefaultUserEmail: null,
  sandboxConfirmedAt: null,
  sandboxLastSentAt: null,
  sandboxLastLeadId: null,
  sandboxLastLeadClusterId: null,
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

  it('never queues real enquiries while sandbox mode is active', () => {
    assert.deepEqual(planDealerStudioQueue(validEnquiry, {
      ...configured,
      sandboxMode: true,
    }), { status: 'skipped', error: null });
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

describe('Dealer Studio sandbox lead', () => {
  it('uses only server-generated synthetic identity data and the confirmed sandbox destination', () => {
    const payload = buildDealerStudioSandboxLead({
      ...configured,
      enabled: false,
      sandboxMode: true,
      sandboxDealershipId: 987,
      sandboxDealershipSlug: 'integration-test-dealer',
      sandboxDealershipName: 'Integration Test Dealer',
      sandboxLocationId: 654,
      sandboxLocationName: 'Sandbox Sales',
      sandboxDefaultUserEmail: 'sandbox-agent@example.com',
      sandboxConfirmedAt: '2026-07-16T00:00:00.000Z',
    }, new Date('2026-07-16T01:02:03.000Z'));

    assert.equal(payload.lead.dealership_id, 987);
    assert.equal(payload.lead.location_id, 654);
    assert.equal(payload.lead.send_customer_email, false);
    assert.equal(payload.lead.user_email, 'sandbox-agent@example.com');
    assert.match(String(payload.lead.name), /sandbox/i);
    assert.match(String(payload.lead.message), /do not contact/i);
    assert.match(String(payload.lead.provider_id), /^sandbox-/);
    assert.doesNotMatch(JSON.stringify(payload), /Jane|Citizen|0412345678|jane@example\.com/);
    assert.doesNotMatch(JSON.stringify(payload), /7f013aa8-fe82-4d98-8685-2947cf1b3d78/);
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

describe('Dealer Studio interrupted delivery recovery', () => {
  const service = readFileSync(
    new URL('../server/utils/dealerStudio/delivery.ts', import.meta.url),
    'utf8',
  );

  it('surfaces stale sending records for manual duplicate review', () => {
    assert.match(service, /STALE_SENDING_AFTER_MS/);
    assert.match(service, /eq\(leadExportDeliveries\.status, 'sending'\)/);
    assert.match(service, /confirm whether the lead exists before retrying/i);
  });
});
