import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  normalizeAustralianPhone,
  validateRequiredCustomerPhone,
} from '../shared/utils/customerPhone.ts';

describe('customer phone validation', () => {
  it('normalizes Australian mobile and landline numbers for CRM delivery', () => {
    assert.equal(normalizeAustralianPhone('0412 345 678'), '0412345678');
    assert.equal(normalizeAustralianPhone('+61 412 345 678'), '0412345678');
    assert.equal(normalizeAustralianPhone('(03) 9123 4567'), '0391234567');
  });

  it('rejects missing, incomplete and fabricated-looking values', () => {
    assert.deepEqual(validateRequiredCustomerPhone(''), {
      ok: false,
      error: 'Phone number is required',
    });
    assert.deepEqual(validateRequiredCustomerPhone('0412 345'), {
      ok: false,
      error: 'Enter a valid Australian phone number',
    });
    assert.deepEqual(validateRequiredCustomerPhone('Not provided'), {
      ok: false,
      error: 'Enter a valid Australian phone number',
    });
  });

  it('returns the normalized number after validation', () => {
    assert.deepEqual(validateRequiredCustomerPhone('+61 412 345 678'), {
      ok: true,
      phone: '0412345678',
    });
  });
});

describe('controlled enquiry intake', () => {
  const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

  it('enforces and stores the normalized phone on the website endpoint', () => {
    const endpoint = source('server/api/submit-enquiry.post.ts');
    assert.match(endpoint, /validateRequiredCustomerPhone/);
    assert.match(endpoint, /phone:\s*phoneValidation\.phone/);
  });

  it('enforces and stores the normalized phone on the authenticated endpoint', () => {
    const endpoint = source('server/api/enquiry.post.ts');
    assert.match(endpoint, /validateRequiredCustomerPhone/);
    assert.match(endpoint, /phone:\s*phoneValidation\.phone/);
  });
});
