/**
 * Pure email-template helpers (no SendGrid / DB imports) so they can be
 * unit-tested directly. Consumed by server/utils/email.ts.
 */

export const DEFAULT_DEALER_NAME = 'Hyundai Dealer';

/**
 * Escape user-supplied text before interpolating it into email HTML.
 * Prevents HTML/link injection from public enquiry form fields.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getDealerName(dealer: any): string {
  return dealer?.name || DEFAULT_DEALER_NAME;
}

export function getDealerWebsiteUrl(dealer: any): string {
  return dealer?.websiteUrl || dealer?.siteUrl || process.env.NUXT_PUBLIC_SITE_URL || '';
}

export function getAdminEnquiryUrl(dealer: any, enquiryId: string): string {
  const baseUrl = getDealerWebsiteUrl(dealer).replace(/\/$/, '');
  return `${baseUrl}/admin/enquiries/${enquiryId}`;
}

/**
 * Replace merge tags in text with actual values.
 * Pass { html: true } when the target is an HTML body so user-supplied
 * values are escaped; plain-text subjects/bodies must not be escaped.
 */
export function replaceMergeTags(
  text: string,
  enquiry: any,
  dealer: any,
  opts?: { html?: boolean },
): string {
  const replacements: Record<string, string> = {
    '{customer_name}': `${enquiry.firstName} ${enquiry.lastName}`,
    '{first_name}': enquiry.firstName || '',
    '{last_name}': enquiry.lastName || '',
    '{email}': enquiry.email || '',
    '{phone}': enquiry.phone || '',
    '{form_type}': enquiry.type || '',
    '{vehicle_make}': enquiry.vehicleInfo?.make || '',
    '{vehicle_model}': enquiry.vehicleInfo?.model || '',
    '{vehicle_year}': enquiry.vehicleInfo?.year?.toString() || '',
    '{vehicle_condition}': enquiry.vehicleInfo?.condition || '',
    '{message}': enquiry.message || '',
    '{submission_date}': new Date(enquiry.createdAt).toLocaleString('en-AU'),
    '{enquiry_id}': enquiry.id?.substring(0, 8) || '',
    '{admin_link}': getAdminEnquiryUrl(dealer, enquiry.id),
    '{dealer_name}': getDealerName(dealer),
    '{dealer_phone}': dealer.phone || '',
    '{dealer_email}': dealer.email || '',
    '{dealer_address}': dealer.address || '',
  };

  let result = text;
  for (const [tag, value] of Object.entries(replacements)) {
    const rendered = opts?.html ? escapeHtml(value) : value;
    // Function replacer: value must be inserted literally, never treated
    // as a replacement pattern ($&, $`, ...).
    result = result.replace(new RegExp(tag.replace(/[{}]/g, '\\$&'), 'g'), () => rendered);
  }
  return result;
}
