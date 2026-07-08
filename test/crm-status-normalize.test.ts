import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeEnquiryStatus } from '../shared/constants/salesFunnel.ts';

describe('normalizeEnquiryStatus', () => {
  it('maps legacy values to canonical', () => {
    assert.equal(normalizeEnquiryStatus('new'), 'new_lead');
    assert.equal(normalizeEnquiryStatus('in_progress'), 'appointment_set');
    assert.equal(normalizeEnquiryStatus('contacted'), 'appointment_set');
    assert.equal(normalizeEnquiryStatus('closed'), 'sold');
  });
  it('passes canonical values through unchanged', () => {
    assert.equal(normalizeEnquiryStatus('negotiating'), 'negotiating');
    assert.equal(normalizeEnquiryStatus('sold'), 'sold');
  });
  it('falls back to new_lead for unknown values', () => {
    assert.equal(normalizeEnquiryStatus('garbage'), 'new_lead');
  });
});
