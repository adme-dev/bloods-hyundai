import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calculateLeadSignalCoverage,
  classifyCrmLeadSource,
  summarizeLeadSources,
  type CrmLeadSignal,
} from '../server/utils/metrics/crmReport.ts';

const lead = (over: Partial<CrmLeadSignal> = {}): CrmLeadSignal => ({
  source: 'website',
  type: 'vehicle',
  status: 'new_lead',
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  vehicleStockId: null,
  syncedToCrm: false,
  crmRef: null,
  externalRef: null,
  ...over,
});

describe('crm marketing report helpers', () => {
  it('classifies external marketplace lead sources', () => {
    assert.deepEqual(classifyCrmLeadSource(lead({ source: 'Carsales email lead' })), {
      key: 'carsales',
      label: 'Carsales',
      category: 'external_marketplace',
    });
    assert.deepEqual(classifyCrmLeadSource(lead({ externalRef: 'AutoTrader-123' })), {
      key: 'autotrader',
      label: 'Autotrader',
      category: 'external_marketplace',
    });
  });

  it('classifies paid social and paid search from UTM values', () => {
    assert.equal(classifyCrmLeadSource(lead({ utmSource: 'instagram', utmMedium: 'paid_social' })).key, 'meta_paid');
    assert.equal(classifyCrmLeadSource(lead({ utmSource: 'google', utmMedium: 'cpc' })).key, 'google_paid');
  });

  it('calculates CRM signal coverage percentages', () => {
    const out = calculateLeadSignalCoverage([
      lead({ source: '/vehicle/abc', utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'brand', vehicleStockId: 'S1', syncedToCrm: true, crmRef: 'CRM-1' }),
      lead({ source: null, externalRef: 'Carsales-2' }),
    ]);

    assert.equal(out.total, 2);
    assert.equal(out.withSource, 1);
    assert.equal(out.withAnyUtm, 1);
    assert.equal(out.withCampaign, 1);
    assert.equal(out.withPaidAttribution, 1);
    assert.equal(out.withVehicle, 1);
    assert.equal(out.syncedToCrm, 1);
    assert.equal(out.sourceCoverage, 50);
    assert.equal(out.utmCoverage, 50);
    assert.equal(out.crmSyncCoverage, 50);
  });

  it('summarizes lead sources in descending volume order', () => {
    const out = summarizeLeadSources([
      lead({ source: 'Carsales' }),
      lead({ source: 'Carsales', syncedToCrm: true, utmCampaign: 'used-stock' }),
      lead({ utmSource: 'google', utmMedium: 'cpc' }),
    ]);

    assert.equal(out[0]!.key, 'carsales');
    assert.equal(out[0]!.total, 2);
    assert.equal(out[0]!.crmSynced, 1);
    assert.equal(out[0]!.withCampaign, 1);
    assert.equal(out[1]!.key, 'google_paid');
  });
});
