import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createDealerStudioLead,
  fetchDealerStudioApiKeyDetails,
} from '../server/utils/dealerStudio/client.ts';

describe('Dealer Studio API client', () => {
  it('validates and returns authorised dealership details without exposing the token', async () => {
    let request: { input: string; init?: RequestInit } | null = null;
    const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
      request = { input: String(input), init };
      return new Response(JSON.stringify({
        id: 1,
        permissions: ['create:lead'],
        dealerships: [{
          id: 123,
          name: 'Bloods Hyundai',
          slug: 'bloods-hyundai',
          locations: [{ id: 456, name: 'Sales', location_type: 'sales' }],
          users: [{ id: 789, name: 'Sales User', email: 'sales@example.com' }],
        }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const result = await fetchDealerStudioApiKeyDetails('top-secret', fetcher);
    assert.equal(result.dealerships[0]?.slug, 'bloods-hyundai');
    assert.equal(request?.input, 'https://dashboard.dealerstudio.com.au/api/v1/apikeys/apikey_details.json');
    assert.equal(new Headers(request?.init?.headers).get('authorization'), 'Bearer top-secret');
    assert.equal(JSON.stringify(result).includes('top-secret'), false);
  });

  it('rejects malformed successful responses at the third-party boundary', async () => {
    const fetcher = async () => new Response(JSON.stringify({ dealerships: 'wrong' }), { status: 200 });
    await assert.rejects(
      () => fetchDealerStudioApiKeyDetails('token', fetcher),
      /invalid API key details response/i,
    );
  });

  it('classifies successful, validation, authentication and retryable lead responses', async () => {
    const payload = { lead: { email: 'jane@example.com' } } as any;

    const created = await createDealerStudioLead('token', payload, async () =>
      new Response(JSON.stringify({ id: 12, lead_cluster_id: 34 }), { status: 201 }));
    assert.deepEqual(created, { ok: true, leadId: 12, leadClusterId: 34 });

    const invalid = await createDealerStudioLead('token', payload, async () =>
      new Response(JSON.stringify({ phone: ['is invalid'] }), { status: 422 }));
    assert.equal(invalid.ok, false);
    if (!invalid.ok) assert.equal(invalid.kind, 'validation');

    const unauthorised = await createDealerStudioLead('token', payload, async () =>
      new Response('Unauthorized', { status: 401 }));
    assert.equal(unauthorised.ok, false);
    if (!unauthorised.ok) assert.equal(unauthorised.kind, 'configuration');

    const unavailable = await createDealerStudioLead('token', payload, async () =>
      new Response('Unavailable', { status: 503 }));
    assert.equal(unavailable.ok, false);
    if (!unavailable.ok) assert.equal(unavailable.kind, 'retryable');
  });
});
