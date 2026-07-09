import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildEnquiryCreatedRealtimeEvent,
  signRealtimePayload,
} from '../server/utils/realtime/contract.ts';

const dealerId = '5188455b-0ee6-4a34-8b79-3b054ed9d899';
const enquiryId = 'b27e47e9-16e9-4575-8bfd-24ce2dceafae';

describe('realtime event contract', () => {
  it('builds a dealer-scoped enquiry.created event with dashboard invalidation targets', () => {
    const event = buildEnquiryCreatedRealtimeEvent({
      id: enquiryId,
      dealerId,
      type: 'test_drive',
      firstName: 'Alex',
      lastName: 'Driver',
      email: 'alex@example.com',
      vehicleInfo: {
        year: 2026,
        make: 'Hyundai',
        model: 'Tucson',
        variant: 'Elite',
      },
    }, {
      eventId: '11111111-1111-4111-8111-111111111111',
      occurredAt: '2026-07-10T02:00:00.000Z',
      source: 'submit-enquiry',
    });

    assert.equal(event.version, 1);
    assert.equal(event.eventId, '11111111-1111-4111-8111-111111111111');
    assert.equal(event.dealerId, dealerId);
    assert.equal(event.type, 'enquiry.created');
    assert.equal(event.source, 'submit-enquiry');
    assert.deepEqual(event.entity, { type: 'enquiry', id: enquiryId });
    assert.deepEqual(event.invalidate, ['notifications', 'enquiries', 'dashboard']);
    assert.equal(event.summary?.customerName, 'Alex Driver');
    assert.equal(event.summary?.vehicleLabel, '2026 Hyundai Tucson Elite');
    assert.equal(event.summary?.message, 'Alex Driver - 2026 Hyundai Tucson Elite');
  });

  it('falls back to the email address when a customer name is not supplied', () => {
    const event = buildEnquiryCreatedRealtimeEvent({
      id: enquiryId,
      dealerId,
      type: 'contact',
      firstName: '',
      lastName: '',
      email: 'lead@example.com',
    }, {
      eventId: '22222222-2222-4222-8222-222222222222',
      occurredAt: '2026-07-10T02:00:00.000Z',
    });

    assert.equal(event.summary?.customerName, 'lead@example.com');
    assert.equal(event.summary?.message, 'lead@example.com');
  });

  it('signs publish payloads as sha256 HMAC over timestamp and body', () => {
    const signature = signRealtimePayload('secret', '1783650000000', '{"ok":true}');

    assert.equal(
      signature,
      'sha256=d294d5026fd1bc44a71de34b4e005eb26236bb091fc88249fee8eaf16b4b9985',
    );
  });
});
