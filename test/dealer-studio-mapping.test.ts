import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildDealerStudioLeadPayload,
  dealerStudioCategoryForEnquiry,
  dealerStudioSourceForEnquiry,
} from '../server/utils/dealerStudio/mapping.ts';
import {
  readDealerStudioSettings,
  writeDealerStudioSettings,
} from '../server/utils/dealerStudio/settings.ts';

const enquiry = (overrides: Record<string, unknown> = {}) => ({
  id: '7f013aa8-fe82-4d98-8685-2947cf1b3d78',
  type: 'vehicle',
  source: 'website',
  firstName: 'Jane',
  lastName: 'Citizen',
  email: ' jane@example.com ',
  phone: ' 0412345678 ',
  postcode: '3199',
  message: 'Interested in a test drive',
  vehicleStockId: 'BLOODS-123',
  vehicleInfo: { condition: 'used', make: 'Hyundai', model: 'Tucson', year: 2024 },
  utmSource: 'google',
  utmMedium: 'cpc',
  utmCampaign: 'tucson-search',
  utmTerm: null,
  utmContent: null,
  gclid: 'gclid-123',
  gbraid: null,
  wbraid: null,
  fbclid: null,
  msclkid: null,
  landingPage: 'https://bloodhyundai.com.au/vehicle/tucson?gclid=gclid-123',
  referrer: 'https://google.com/',
  userAgent: 'test-agent',
  tradeInInfo: null,
  financeDetails: null,
  sellCarDetails: null,
  accessoriesCart: null,
  ...overrides,
});

const settings = {
  enabled: true,
  dealershipId: 123,
  dealershipSlug: 'bloods-hyundai',
  dealershipName: 'Bloods Hyundai',
  locationId: 456,
  locationName: 'Sales',
  defaultUserEmail: 'sales@bloods.example',
  lastTestedAt: null,
};

describe('Dealer Studio lead mapping', () => {
  it('maps every local enquiry type to an accepted Dealer Studio category', () => {
    assert.equal(dealerStudioCategoryForEnquiry({ type: 'contact' }), 'General Enquiry');
    assert.equal(dealerStudioCategoryForEnquiry({ type: 'vehicle', vehicleInfo: { condition: 'used' } }), 'Used Vehicle Enquiry');
    assert.equal(dealerStudioCategoryForEnquiry({ type: 'vehicle', vehicleInfo: { condition: 'demo' } }), 'New Vehicle Enquiry');
    assert.equal(dealerStudioCategoryForEnquiry({ type: 'finance' }), 'Finance Enquiry');
    assert.equal(dealerStudioCategoryForEnquiry({ type: 'test_drive' }), 'Test Drive Booking');
    assert.equal(dealerStudioCategoryForEnquiry({ type: 'service' }), 'Service Enquiry');
    assert.equal(dealerStudioCategoryForEnquiry({ type: 'parts' }), 'Parts Enquiry');
    assert.equal(dealerStudioCategoryForEnquiry({ type: 'accessories' }), 'Parts Enquiry');
    assert.equal(dealerStudioCategoryForEnquiry({ type: 'sell_car' }), 'Sell My Car Enquiry');
    assert.equal(dealerStudioCategoryForEnquiry({ type: 'fleet' }), 'Fleet Enquiry');
    assert.equal(dealerStudioCategoryForEnquiry({ type: 'special_offer' }), 'Special Offer Enquiry');
    assert.equal(dealerStudioCategoryForEnquiry({ type: 'special-offer-test-drive' }), 'Test Drive Booking');
  });

  it('uses exact provider source values', () => {
    assert.equal(dealerStudioSourceForEnquiry('carsales'), 'Carsales');
    assert.equal(dealerStudioSourceForEnquiry('autotrader'), 'Autotrader');
    assert.equal(dealerStudioSourceForEnquiry('meta_lead_ads'), 'Facebook');
    assert.equal(dealerStudioSourceForEnquiry('/vehicle/tucson'), 'Website');
  });

  it('builds a compliant payload with attribution and no duplicate customer email', () => {
    const result = buildDealerStudioLeadPayload(enquiry(), settings);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.deepEqual(result.payload.lead, {
      name: 'Jane Citizen',
      first_name: 'Jane',
      last_name: 'Citizen',
      email: 'jane@example.com',
      phone: '0412345678',
      postcode: '3199',
      message: 'Interested in a test drive',
      dealership_id: 123,
      category: 'Used Vehicle Enquiry',
      source: 'Website',
      location_id: 456,
      stocknum: 'BLOODS-123',
      provider: 'Bloods Hyundai Admin',
      provider_id: '7f013aa8-fe82-4d98-8685-2947cf1b3d78',
      user_email: 'sales@bloods.example',
      send_customer_email: false,
      linked_query_params: {
        gclid: 'gclid-123',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'tucson-search',
      },
      visited_pages: ['https://bloodhyundai.com.au/vehicle/tucson?gclid=gclid-123'],
      user_agent: 'test-agent',
      fields: {
        local_enquiry_id: '7f013aa8-fe82-4d98-8685-2947cf1b3d78',
        landing_page: 'https://bloodhyundai.com.au/vehicle/tucson?gclid=gclid-123',
        referrer: 'https://google.com/',
        vehicle_details: { condition: 'used', make: 'Hyundai', model: 'Tucson', year: 2024 },
      },
    });
  });

  it('retains the local lead but rejects export when Dealer Studio required fields are missing', () => {
    const result = buildDealerStudioLeadPayload(enquiry({ phone: null }), settings);
    assert.deepEqual(result, {
      ok: false,
      errors: ['Customer phone is required by Dealer Studio'],
    });
  });
});

describe('Dealer Studio settings', () => {
  it('is disabled by default and preserves unrelated dealer settings', () => {
    assert.equal(readDealerStudioSettings({}).enabled, false);
    const current = { popup: { enabled: true } };
    const next = writeDealerStudioSettings(current, settings);
    assert.deepEqual(next.popup, current.popup);
    assert.deepEqual(next.externalCrm, {
      provider: 'dealer_studio',
      ...settings,
    });
  });
});
