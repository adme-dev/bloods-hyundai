import type { DealerStudioLeadPayload, DealerStudioSettings } from './types';
import { normalizeAustralianPhone } from '../../../shared/utils/customerPhone';

type EnquiryLike = Record<string, any> & {
  id: string;
  type: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
};

type MappingResult =
  | { ok: true; payload: DealerStudioLeadPayload }
  | { ok: false; errors: string[] };

export function dealerStudioCategoryForEnquiry(enquiry: Pick<EnquiryLike, 'type'> & { vehicleInfo?: any }): string {
  switch (enquiry.type) {
    case 'vehicle':
      return String(enquiry.vehicleInfo?.condition || '').toLowerCase() === 'used'
        ? 'Used Vehicle Enquiry'
        : 'New Vehicle Enquiry';
    case 'finance': return 'Finance Enquiry';
    case 'test_drive':
    case 'special-offer-test-drive': return 'Test Drive Booking';
    case 'service': return 'Service Enquiry';
    case 'parts':
    case 'accessories': return 'Parts Enquiry';
    case 'sell_car': return 'Sell My Car Enquiry';
    case 'fleet': return 'Fleet Enquiry';
    case 'special_offer': return 'Special Offer Enquiry';
    default: return 'General Enquiry';
  }
}

export function dealerStudioSourceForEnquiry(source: unknown): string {
  const normalized = String(source || '').toLowerCase();
  if (normalized.includes('carsales')) return 'Carsales';
  if (normalized.includes('autotrader')) return 'Autotrader';
  if (normalized.includes('facebook') || normalized.includes('meta_lead')) return 'Facebook';
  return 'Website';
}

export function buildDealerStudioLeadPayload(
  enquiry: EnquiryLike,
  settings: DealerStudioSettings,
): MappingResult {
  const email = cleanString(enquiry.email);
  const rawPhone = cleanString(enquiry.phone);
  const phone = normalizeAustralianPhone(rawPhone);
  const errors: string[] = [];
  if (!email) errors.push('Customer email is required by Dealer Studio');
  if (!rawPhone) errors.push('Customer phone is required by Dealer Studio');
  else if (!phone) errors.push('Customer phone must be a valid Australian phone number');
  if (!settings.dealershipId) errors.push('Dealer Studio dealership is not configured');
  if (!settings.locationId) errors.push('Dealer Studio location is not configured');
  if (errors.length) return { ok: false, errors };

  const firstName = cleanString(enquiry.firstName);
  const lastName = cleanString(enquiry.lastName);
  const linkedQueryParams = compactObject({
    gclid: enquiry.gclid,
    gbraid: enquiry.gbraid,
    wbraid: enquiry.wbraid,
    fbclid: enquiry.fbclid,
    msclkid: enquiry.msclkid,
    utm_source: enquiry.utmSource,
    utm_medium: enquiry.utmMedium,
    utm_campaign: enquiry.utmCampaign,
    utm_term: enquiry.utmTerm,
    utm_content: enquiry.utmContent,
  });
  const fields = compactObject({
    local_enquiry_id: enquiry.id,
    landing_page: enquiry.landingPage,
    referrer: enquiry.referrer,
    vehicle_details: enquiry.vehicleInfo,
    trade_in_details: enquiry.tradeInInfo,
    finance_details: enquiry.financeDetails,
    sell_car_details: enquiry.sellCarDetails,
    accessories_cart: enquiry.accessoriesCart,
  });

  const lead = compactObject({
    name: [firstName, lastName].filter(Boolean).join(' '),
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    postcode: enquiry.postcode,
    message: enquiry.message,
    dealership_id: settings.dealershipId,
    category: dealerStudioCategoryForEnquiry(enquiry),
    source: dealerStudioSourceForEnquiry(enquiry.source),
    location_id: settings.locationId,
    stocknum: enquiry.vehicleStockId,
    provider: 'Bloods Hyundai Admin',
    provider_id: enquiry.id,
    user_email: settings.defaultUserEmail,
    send_customer_email: false,
    linked_query_params: Object.keys(linkedQueryParams).length ? linkedQueryParams : undefined,
    visited_pages: cleanString(enquiry.landingPage) ? [cleanString(enquiry.landingPage)] : undefined,
    user_agent: enquiry.userAgent,
    fields,
  });

  return { ok: true, payload: { lead } };
}

function compactObject(input: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === null || typeof value === 'undefined') return false;
      return typeof value !== 'string' || value.trim().length > 0;
    }),
  );
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
