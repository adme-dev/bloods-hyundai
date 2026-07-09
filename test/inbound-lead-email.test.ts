import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  extractEmailAddresses,
  findInboundLeadAddress,
  listInboundLeadEmailAddresses,
  parseInboundLeadEmail,
  upsertInboundLeadEmailAddress,
} from '../server/utils/leadIngestion/emailAddresses.ts';
import { classifyCrmLeadSource } from '../server/utils/metrics/crmReport.ts';

describe('inbound lead email helpers', () => {
  it('creates deterministic source addresses against the configured domain', () => {
    const out = upsertInboundLeadEmailAddress({}, {
      source: 'carsales',
      dealerSlug: 'bloods-hyundai',
      domain: 'leads.example.com',
      now: new Date('2026-07-09T00:00:00Z'),
    });

    assert.equal(out.address.email, 'bloods-hyundai-carsales@leads.example.com');
    assert.equal(out.address.label, 'Carsales');
    assert.equal(listInboundLeadEmailAddresses(out.settings, null).addresses.length, 1);
  });

  it('finds a registered address from email recipients', () => {
    const { settings } = upsertInboundLeadEmailAddress({}, {
      source: 'hyundai_oem',
      dealerSlug: 'bloods-hyundai',
      domain: 'leads.example.com',
    });

    const address = findInboundLeadAddress(settings, ['Hyundai <bloods-hyundai-hyundai-oem@leads.example.com>'], null);
    assert.equal(address?.source, 'hyundai_oem');
  });

  it('extracts customer details from a plain text platform email', () => {
    const parsed = parseInboundLeadEmail({
      from: 'noreply@carsales.com.au',
      to: 'bloods-hyundai-carsales@leads.example.com',
      subject: 'New Carsales lead',
      text: 'Name: Jane Citizen\nEmail: jane@example.com\nPhone: 0400000000\nMessage: Interested in the Tucson.',
    });

    assert.equal(parsed.customerEmail, 'jane@example.com');
    assert.equal(parsed.firstName, 'Jane');
    assert.equal(parsed.lastName, 'Citizen');
    assert.equal(parsed.phone, '0400000000');
    assert.match(parsed.message, /Interested in the Tucson/);
  });

  it('extracts addresses from display-name strings', () => {
    assert.deepEqual(extractEmailAddresses('Carsales <lead@carsales.com.au>'), ['lead@carsales.com.au']);
  });

  it('classifies Hyundai OEM and Meta inbound lead sources', () => {
    assert.equal(classifyCrmLeadSource({
      source: 'hyundai_oem',
      utmSource: 'hyundai_oem',
      utmMedium: 'email',
      externalRef: null,
      gclid: null,
      gbraid: null,
      wbraid: null,
      fbclid: null,
      msclkid: null,
      attributedPlatform: null,
    }).key, 'hyundai_oem');

    assert.equal(classifyCrmLeadSource({
      source: 'meta_lead_ads',
      utmSource: 'meta_lead_ads',
      utmMedium: 'email',
      externalRef: null,
      gclid: null,
      gbraid: null,
      wbraid: null,
      fbclid: null,
      msclkid: null,
      attributedPlatform: null,
    }).key, 'meta_lead_ads');
  });
});
