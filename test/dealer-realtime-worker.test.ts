import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { describe, it } from 'node:test';
import worker from '../workers/dealer-realtime-events/src/index.js';

const secret = 'publish-secret';
const dealerId = '5188455b-0ee6-4a34-8b79-3b054ed9d899';
const enquiryId = 'b27e47e9-16e9-4575-8bfd-24ce2dceafae';

function validEvent(overrides = {}) {
  return {
    version: 1,
    eventId: '11111111-1111-4111-8111-111111111111',
    dealerId,
    type: 'enquiry.created',
    occurredAt: '2026-07-10T02:00:00.000Z',
    entity: { type: 'enquiry', id: enquiryId },
    invalidate: ['notifications', 'enquiries', 'dashboard'],
    ...overrides,
  };
}

function sign(timestamp, body) {
  return `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
}

function ctx() {
  return {
    waitUntil(promise) {
      return promise;
    },
  };
}

describe('dealer realtime Cloudflare Worker', () => {
  it('exposes a health endpoint', async () => {
    const response = await worker.fetch(new Request('https://worker.test/health'), {}, ctx());

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, service: 'dealer-realtime-events' });
  });

  it('rejects unsigned publish requests before queueing events', async () => {
    const sent = [];
    const response = await worker.fetch(new Request('https://worker.test/publish', {
      method: 'POST',
      body: JSON.stringify(validEvent()),
    }), {
      REALTIME_PUBLISH_SECRET: secret,
      REALTIME_EVENTS_QUEUE: { send: async event => sent.push(event) },
    }, ctx());

    assert.equal(response.status, 401);
    assert.equal(sent.length, 0);
  });

  it('rejects expired publish signatures', async () => {
    const body = JSON.stringify(validEvent());
    const timestamp = String(Date.now() - (6 * 60 * 1000));
    const response = await worker.fetch(new Request('https://worker.test/publish', {
      method: 'POST',
      headers: {
        'x-dealer-realtime-timestamp': timestamp,
        'x-dealer-realtime-signature': sign(timestamp, body),
      },
      body,
    }), {
      REALTIME_PUBLISH_SECRET: secret,
      REALTIME_EVENTS_QUEUE: { send: async () => undefined },
    }, ctx());

    assert.equal(response.status, 401);
    assert.match((await response.json()).error.message, /Expired timestamp/);
  });

  it('rejects signed events that do not match the realtime contract', async () => {
    const sent = [];
    const body = JSON.stringify(validEvent({ eventId: 'not-a-uuid' }));
    const timestamp = String(Date.now());
    const response = await worker.fetch(new Request('https://worker.test/publish', {
      method: 'POST',
      headers: {
        'x-dealer-realtime-timestamp': timestamp,
        'x-dealer-realtime-signature': sign(timestamp, body),
      },
      body,
    }), {
      REALTIME_PUBLISH_SECRET: secret,
      REALTIME_EVENTS_QUEUE: { send: async event => sent.push(event) },
    }, ctx());

    assert.equal(response.status, 422);
    assert.equal(sent.length, 0);
  });

  it('queues valid signed publish requests', async () => {
    const sent = [];
    const body = JSON.stringify(validEvent());
    const timestamp = String(Date.now());
    const response = await worker.fetch(new Request('https://worker.test/publish', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-dealer-realtime-timestamp': timestamp,
        'x-dealer-realtime-signature': sign(timestamp, body),
      },
      body,
    }), {
      REALTIME_PUBLISH_SECRET: secret,
      REALTIME_EVENTS_QUEUE: { send: async event => sent.push(event) },
    }, ctx());

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, queued: true });
    assert.deepEqual(sent, [validEvent()]);
  });

  it('rejects oversized publish bodies before queueing events', async () => {
    const sent = [];
    const body = 'x'.repeat((64 * 1024) + 1);
    const response = await worker.fetch(new Request('https://worker.test/publish', {
      method: 'POST',
      headers: {
        'content-length': String(body.length),
      },
      body,
    }), {
      REALTIME_PUBLISH_SECRET: secret,
      REALTIME_EVENTS_QUEUE: { send: async event => sent.push(event) },
    }, ctx());

    assert.equal(response.status, 413);
    assert.equal(sent.length, 0);
  });
});
