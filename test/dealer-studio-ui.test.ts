import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('Dealer Studio admin setup', () => {
  it('provides an operator-facing connection and delivery page', () => {
    const page = source('app/pages/admin/settings/dealer-studio.vue');

    assert.match(page, /Dealer Studio LMS/);
    assert.match(page, /DEALER_STUDIO_API_KEY/);
    assert.match(page, /Save & verify key/);
    assert.match(page, /type="password"/);
    assert.match(page, /credentialSource/);
    assert.match(page, /Scheduled delivery security/);
    assert.match(page, /hosting environment/);
    assert.match(page, /Test connection/);
    assert.match(page, /Sandbox mode/);
    assert.match(page, /Dealer Studio-provided test dealership/);
    assert.match(page, /Send synthetic test lead/);
    assert.match(page, /\/api\/admin\/integrations\/dealer-studio\/sandbox-leads/);
    assert.match(page, /Authorised dealership/);
    assert.match(page, /Default location/);
    assert.match(page, /Delivery activity/);
    assert.match(page, /failed_validation/);
    assert.match(page, /\/api\/admin\/integrations\/dealer-studio/);
    assert.match(page, /\/retry/);
  });

  it('links the integration from the settings hub', () => {
    const settings = source('app/pages/admin/settings/index.vue');
    assert.match(settings, /\/admin\/settings\/dealer-studio/);
    assert.match(settings, /Dealer Studio LMS/);
  });
});

describe('Dealer Studio enquiry status', () => {
  it('returns the tenant-scoped delivery with enquiry details', () => {
    const endpoint = source('server/api/admin/enquiries/[id].get.ts');
    assert.match(endpoint, /leadExportDeliveries/);
    assert.match(endpoint, /dealerStudioDelivery/);
    assert.match(endpoint, /dealerId/);
  });

  it('shows real provider status and supports explicit retries', () => {
    const page = source('app/pages/admin/enquiries/[id].vue');
    assert.match(page, /Dealer Studio LMS/);
    assert.match(page, /dealerStudioDelivery/);
    assert.match(page, /Retry delivery/);
    assert.match(page, /\/api\/admin\/integrations\/dealer-studio\/\$\{enquiryId\}\/retry/);
  });
});
