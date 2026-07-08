import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getTenantForwardHeaders } from '../server/utils/tenant-headers';

describe('tenant forward headers', () => {
  it('forwards only tenant routing headers for internal API calls', () => {
    const headers = getTenantForwardHeaders({
      node: {
        req: {
          headers: {
            host: 'bloodhyundai.com.au',
            'x-forwarded-host': 'www.salehyundai.com.au',
            'x-forwarded-proto': 'https',
            cookie: 'session=secret',
            authorization: 'Bearer secret',
          },
        },
      },
    } as any);

    assert.deepEqual(headers, {
      Accept: 'application/json',
      host: 'bloodhyundai.com.au',
      'x-forwarded-host': 'www.salehyundai.com.au',
      'x-forwarded-proto': 'https',
    });
  });
});
