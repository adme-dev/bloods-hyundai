export type CustomerPhoneValidation =
  | { ok: true; phone: string }
  | { ok: false; error: string };

const AUSTRALIAN_PHONE = /^0[23478]\d{8}$/;
const ALLOWED_PHONE_CHARACTERS = /^[\d+().\s-]+$/;

/**
 * Returns a compact Australian mobile or landline number for storage and CRM
 * delivery. International +61/0061 forms are converted to their local form.
 */
export function normalizeAustralianPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (!input || !ALLOWED_PHONE_CHARACTERS.test(input)) return null;

  let compact = input.replace(/[().\s-]/g, '');
  if (compact.startsWith('0061')) compact = `+61${compact.slice(4)}`;
  if (/^61\d{9}$/.test(compact)) compact = `+${compact}`;
  if (compact.startsWith('+61')) compact = `0${compact.slice(3)}`;

  return AUSTRALIAN_PHONE.test(compact) ? compact : null;
}

export function validateRequiredCustomerPhone(value: unknown): CustomerPhoneValidation {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return { ok: false, error: 'Phone number is required' };

  const phone = normalizeAustralianPhone(raw);
  if (!phone) return { ok: false, error: 'Enter a valid Australian phone number' };
  return { ok: true, phone };
}
