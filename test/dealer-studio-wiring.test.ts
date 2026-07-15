import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('Dealer Studio ingestion wiring', () => {
  for (const path of [
    'server/api/submit-enquiry.post.ts',
    'server/api/enquiry.post.ts',
    'server/api/sell-my-car.post.ts',
    'server/api/inbound-leads/email.post.ts',
  ]) {
    it(`durably queues leads created by ${path}`, () => {
      const contents = source(path);
      assert.match(contents, /queueDealerStudioExport/);
      assert.match(contents, /await queueDealerStudioExport\(enquiry,\s*(dealer|matched\.dealer)\)/);
    });
  }

  it('provides a secret-protected scheduled dispatcher', () => {
    const endpoint = source('server/api/internal/dealer-studio-deliveries.post.ts');
    const cron = source('netlify/functions/dealer-studio-deliveries-cron.mts');
    assert.match(endpoint, /DEALER_STUDIO_CRON_SECRET/);
    assert.match(endpoint, /processDueDealerStudioExports/);
    assert.match(cron, /x-dealer-studio-cron-secret/);
    assert.match(cron, /schedule:\s*['"]\*\/2 \* \* \* \*['"]/);
  });
});

describe('Dealer Studio admin API contract', () => {
  it('never serializes the API key and verifies configured choices against authorised details', () => {
    const getEndpoint = source('server/api/admin/integrations/dealer-studio/index.get.ts');
    const putEndpoint = source('server/api/admin/integrations/dealer-studio/index.put.ts');
    const testEndpoint = source('server/api/admin/integrations/dealer-studio/test.post.ts');
    assert.doesNotMatch(getEndpoint, /apiKey\s*:/);
    assert.match(putEndpoint, /fetchDealerStudioApiKeyDetails/);
    assert.match(putEndpoint, /Insufficient permissions/);
    assert.match(testEndpoint, /fetchDealerStudioApiKeyDetails/);
  });

  it('tenant-scopes manual retries', () => {
    const retryEndpoint = source('server/api/admin/integrations/dealer-studio/[enquiryId]/retry.post.ts');
    assert.match(retryEndpoint, /user\.dealerId/);
    assert.match(retryEndpoint, /resetDealerStudioDeliveryForRetry/);
    assert.match(retryEndpoint, /processDueDealerStudioExports/);
  });
});
