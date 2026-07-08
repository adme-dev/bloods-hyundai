import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sanitizeIpAddress } from '../server/utils/intakeValidation.ts';
import { normalizeEnquiryType } from '../shared/constants/enquiryTypes.ts';

describe('sanitizeIpAddress', () => {
  it('accepts valid IPv4 and takes the first of a forwarded chain', () => {
    assert.equal(sanitizeIpAddress('203.0.113.5'), '203.0.113.5');
    assert.equal(sanitizeIpAddress('203.0.113.5, 10.0.0.1'), '203.0.113.5');
  });
  it('rejects spoofed / malformed values', () => {
    assert.equal(sanitizeIpAddress('not-an-ip'), null);
    assert.equal(sanitizeIpAddress('999.1.1.1'), null);
    assert.equal(sanitizeIpAddress(''), null);
    assert.equal(sanitizeIpAddress(null), null);
    assert.equal(sanitizeIpAddress(undefined), null);
  });
  it('accepts an IPv6-looking value', () => {
    assert.equal(sanitizeIpAddress('2001:db8::1'), '2001:db8::1');
  });
});

describe('normalizeEnquiryType', () => {
  it('passes valid types through', () => {
    assert.equal(normalizeEnquiryType('sell_car'), 'sell_car');
    assert.equal(normalizeEnquiryType('vehicle'), 'vehicle');
  });
  it('normalizes unknown/garbage types to contact', () => {
    assert.equal(normalizeEnquiryType('<script>'), 'contact');
    assert.equal(normalizeEnquiryType(undefined), 'contact');
    assert.equal(normalizeEnquiryType(42), 'contact');
  });
});
