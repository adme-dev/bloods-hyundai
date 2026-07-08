/**
 * Canonical enquiry types produced by the public forms and understood by
 * routing/filters. Server-side intake normalizes anything else to 'contact'
 * so an arbitrary client-supplied type can't be persisted.
 */
export const VALID_ENQUIRY_TYPES = [
  'contact',
  'vehicle',
  'finance',
  'test_drive',
  'service',
  'parts',
  'accessories',
  'sell_car',
  'fleet',
  'special_offer',
  'special-offer-test-drive',
] as const;

export type EnquiryType = typeof VALID_ENQUIRY_TYPES[number];

export function isValidEnquiryType(type: unknown): type is EnquiryType {
  return typeof type === 'string' && (VALID_ENQUIRY_TYPES as readonly string[]).includes(type);
}

/** Return the type if valid, otherwise the safe catch-all 'contact'. */
export function normalizeEnquiryType(type: unknown): EnquiryType {
  return isValidEnquiryType(type) ? type : 'contact';
}
