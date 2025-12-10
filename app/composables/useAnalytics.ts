/**
 * Analytics composable for tracking events via Google Analytics 4 (gtag)
 * Uses the nuxt-gtag module
 */

interface VehicleData {
  stockid?: string | number;
  identifier?: string;
  make?: string;
  model?: string;
  badge?: string;
  year?: string | number;
  price?: number;
  condition?: string;
}

interface EnquiryEventData {
  vehicle?: VehicleData;
  source: 'stock_param' | 'card_click' | 'detail_page' | 'gallery';
  page_url?: string;
}

interface FormSubmissionData {
  vehicle?: VehicleData;
  form_type: 'enquiry' | 'test_drive' | 'finance' | 'trade_in';
  has_trade_in?: boolean;
  interested_in_finance?: boolean;
  wants_test_drive?: boolean;
}

export const useAnalytics = () => {
  const { gtag } = useGtag();

  /**
   * Track when enquiry modal is opened
   */
  const trackEnquiryModalOpen = (data: EnquiryEventData) => {
    const vehicle = data.vehicle;
    
    gtag('event', 'enquiry_modal_open', {
      event_category: 'engagement',
      event_label: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'unknown',
      source: data.source,
      stock_id: vehicle?.stockid || vehicle?.identifier || 'unknown',
      vehicle_make: vehicle?.make || 'unknown',
      vehicle_model: vehicle?.model || 'unknown',
      vehicle_year: vehicle?.year || 'unknown',
      vehicle_price: vehicle?.price || 0,
      vehicle_condition: vehicle?.condition || 'unknown',
      page_url: data.page_url || window.location.href,
    });

    // Also track as a conversion event for Google Ads
    gtag('event', 'conversion', {
      send_to: 'enquiry_start',
      value: vehicle?.price || 0,
      currency: 'AUD',
    });
  };

  /**
   * Track when enquiry form is submitted
   */
  const trackEnquirySubmit = (data: FormSubmissionData) => {
    const vehicle = data.vehicle;
    
    gtag('event', 'generate_lead', {
      event_category: 'conversion',
      event_label: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'general_enquiry',
      form_type: data.form_type,
      stock_id: vehicle?.stockid || vehicle?.identifier || 'unknown',
      vehicle_make: vehicle?.make || 'unknown',
      vehicle_model: vehicle?.model || 'unknown',
      vehicle_year: vehicle?.year || 'unknown',
      vehicle_price: vehicle?.price || 0,
      vehicle_condition: vehicle?.condition || 'unknown',
      has_trade_in: data.has_trade_in || false,
      interested_in_finance: data.interested_in_finance || false,
      wants_test_drive: data.wants_test_drive || false,
      currency: 'AUD',
      value: vehicle?.price || 0,
    });
  };

  /**
   * Track when user views a vehicle detail page
   */
  const trackVehicleView = (vehicle: VehicleData) => {
    gtag('event', 'view_item', {
      event_category: 'ecommerce',
      currency: 'AUD',
      value: vehicle.price || 0,
      items: [{
        item_id: vehicle.stockid || vehicle.identifier,
        item_name: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.badge || ''}`.trim(),
        item_brand: vehicle.make,
        item_category: vehicle.condition || 'used',
        price: vehicle.price || 0,
      }],
    });
  };

  /**
   * Track vehicle search/filter actions
   */
  const trackVehicleSearch = (filters: Record<string, any>, resultsCount: number) => {
    gtag('event', 'search', {
      event_category: 'engagement',
      search_term: Object.entries(filters)
        .filter(([_, v]) => v && (Array.isArray(v) ? v.length > 0 : true))
        .map(([k, v]) => `${k}:${Array.isArray(v) ? v.join(',') : v}`)
        .join(' | '),
      results_count: resultsCount,
    });
  };

  /**
   * Track phone call clicks
   */
  const trackPhoneClick = (phoneNumber: string, source: string) => {
    gtag('event', 'click_to_call', {
      event_category: 'contact',
      event_label: phoneNumber,
      source: source,
    });
  };

  /**
   * Track share actions
   */
  const trackShare = (vehicle: VehicleData, method: string) => {
    gtag('event', 'share', {
      event_category: 'engagement',
      method: method,
      content_type: 'vehicle',
      item_id: vehicle.stockid || vehicle.identifier,
    });
  };

  return {
    trackEnquiryModalOpen,
    trackEnquirySubmit,
    trackVehicleView,
    trackVehicleSearch,
    trackPhoneClick,
    trackShare,
  };
};

