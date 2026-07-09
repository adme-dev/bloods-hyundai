/**
 * Analytics composable for tracking events via Google Analytics 4 (gtag) and Facebook Pixel
 * Uses the nuxt-gtag module and custom Facebook Pixel integration
 *
 * Data Layer Events:
 * - Form submissions (all types)
 * - Vehicle interactions
 * - Conversion tracking for Google Ads and Facebook Ads
 */
import { buildAccessoryCommerceEvent } from '~/utils/accessoriesCommerceTracking';

interface VehicleData {
  stockid?: string | number;
  identifier?: string;
  make?: string;
  model?: string;
  badge?: string;
  variant?: string;
  year?: string | number;
  price?: number;
  condition?: string;
  colour?: string;
}

interface EnquiryEventData {
  vehicle?: VehicleData;
  source: 'stock_param' | 'card_click' | 'detail_page' | 'gallery' | 'calculator' | 'homepage' | 'special_offer_page';
  page_url?: string;
}

interface FormSubmissionData {
  vehicle?: VehicleData;
  form_type: 'enquiry' | 'test_drive' | 'finance' | 'trade_in';
  has_trade_in?: boolean;
  interested_in_finance?: boolean;
  wants_test_drive?: boolean;
  enquiry_id?: string;
}

// Extended form types for all dealership forms
type FormType =
  | 'vehicle_enquiry'
  | 'test_drive'
  | 'contact'
  | 'service'
  | 'parts'
  | 'finance'
  | 'fleet'
  | 'accessories'
  | 'sell_my_car'
  | 'calculator_enquiry'
  | 'special_offer';

interface BaseFormData {
  form_type: FormType;
  form_location?: string;
  enquiry_id?: string;
  page_url?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  msclkid?: string;
  landing_page?: string;
  referrer?: string;
}

interface VehicleEnquiryData extends BaseFormData {
  form_type: 'vehicle_enquiry' | 'calculator_enquiry';
  vehicle?: VehicleData;
  has_trade_in?: boolean;
  trade_in_vehicle?: {
    make?: string;
    model?: string;
    year?: string | number;
  };
  interested_in_finance?: boolean;
  finance_interest?: boolean;
  wants_test_drive?: boolean;
  has_applied_offers?: boolean;
  applied_offers_count?: number;
  has_accessories?: boolean;
  accessories_count?: number;
  accessories_value?: number;
  has_message?: boolean;
  configuration?: {
    has_option_pack?: boolean;
    has_colour_upgrade?: boolean;
    has_prepaid_service?: boolean;
    total_configured_price?: number;
  };
}

interface TestDriveData extends BaseFormData {
  form_type: 'test_drive';
  vehicle?: VehicleData;
  preferred_date?: string;
  preferred_time?: string;
}

interface ContactFormData extends BaseFormData {
  form_type: 'contact';
  department?: string;
  has_message?: boolean;
}

interface ServiceFormData extends BaseFormData {
  form_type: 'service';
  service_type?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  preferred_date?: string;
  preferred_time?: string;
}

interface PartsFormData extends BaseFormData {
  form_type: 'parts';
  has_registration?: boolean;
  has_message?: boolean;
}

interface FinanceFormData extends BaseFormData {
  form_type: 'finance';
  vehicle?: VehicleData;
  loan_amount?: number;
  deposit_amount?: number;
  loan_term_months?: number;
}

interface FleetFormData extends BaseFormData {
  form_type: 'fleet';
  company_name?: string;
  fleet_size?: string;
  vehicles_interested?: string[];
}

interface AccessoriesFormData extends BaseFormData {
  form_type: 'accessories';
  vehicle_model?: string;
  items_count: number;
  total_value: number;
  has_packs?: boolean;
  accessories?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    type: string;
  }>;
}

interface SellMyCarData extends BaseFormData {
  form_type: 'sell_my_car';
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  odometer?: number;
  condition?: string;
  has_photos?: boolean;
  photos_count?: number;
}

interface SpecialOfferFormData extends BaseFormData {
  form_type: 'special_offer';
  vehicle?: VehicleData;
  offer_model?: string;
  offer_variant?: string;
  offer_amount?: string;
  offer_type?: string;
  offer_category?: string;
}

type FormEventData =
  | VehicleEnquiryData
  | TestDriveData
  | ContactFormData
  | ServiceFormData
  | PartsFormData
  | FinanceFormData
  | FleetFormData
  | AccessoriesFormData
  | SellMyCarData
  | SpecialOfferFormData;

export const useAnalytics = () => {
  const { gtag } = useGtag();
  const fbPixel = useFacebookPixel();
  const { getUtmParams } = useUtmParams();

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

    // Facebook Pixel - AddToCart equivalent for modal open
    if (vehicle) {
      fbPixel.trackAddToCart({
        content_ids: [String(vehicle.stockid || vehicle.identifier || 'unknown')],
        content_name: `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim(),
        content_type: 'vehicle',
        content_category: vehicle.condition || 'used',
        value: vehicle.price || 0,
        currency: 'AUD',
      });
    }
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

    // Facebook Pixel - ViewContent
    fbPixel.trackViewContent({
      content_ids: [String(vehicle.stockid || vehicle.identifier || 'unknown')],
      content_name: `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.badge || ''}`.trim(),
      content_type: 'vehicle',
      content_category: vehicle.condition || 'used',
      value: vehicle.price || 0,
      currency: 'AUD',
    });
  };

  /**
   * Track vehicle search/filter actions
   */
  const trackVehicleSearch = (filters: Record<string, any>, resultsCount: number) => {
    const searchTerm = Object.entries(filters)
      .filter(([_, v]) => v && (Array.isArray(v) ? v.length > 0 : true))
      .map(([k, v]) => `${k}:${Array.isArray(v) ? v.join(',') : v}`)
      .join(' | ');

    gtag('event', 'search', {
      event_category: 'engagement',
      search_term: searchTerm,
      results_count: resultsCount,
    });

    // Facebook Pixel - Search
    fbPixel.trackSearch({
      search_string: searchTerm,
      content_category: 'vehicles',
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

  // ============================================
  // COMPREHENSIVE FORM CONVERSION TRACKING
  // ============================================

  /**
   * Helper to get conversion value based on form type
   */
  const getConversionValue = (formType: FormType, data: FormEventData): number => {
    // Assign estimated lead values based on form type
    const baseValues: Record<FormType, number> = {
      vehicle_enquiry: 500,
      calculator_enquiry: 750, // Higher intent - configured vehicle
      special_offer: 600, // High intent - clicked through from offer page
      test_drive: 1000, // Very high intent
      finance: 800,
      contact: 100,
      service: 200,
      parts: 150,
      fleet: 2000, // B2B, higher value
      accessories: 300,
      sell_my_car: 400,
    };

    let value = baseValues[formType] || 100;

    // Add vehicle price context for vehicle-related forms
    if ('vehicle' in data && data.vehicle?.price) {
      // Use 1% of vehicle price as additional value indicator
      value += Math.round(data.vehicle.price * 0.01);
    }

    // Add accessories value for accessories forms
    if (formType === 'accessories' && 'total_value' in data) {
      value += (data as AccessoriesFormData).total_value * 0.1;
    }

    return value;
  };

  /**
   * Push to dataLayer for GTM
   */
  const pushToDataLayer = (eventName: string, data: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: eventName,
        ...data,
      });
    }
  };

  /**
   * Universal form submission tracker
   * Fires both GA4 event and dataLayer push for GTM
   */
  const trackFormSubmission = (data: FormEventData) => {
    const pageUrl = data.page_url || (typeof window !== 'undefined' ? window.location.href : '');
    const conversionValue = getConversionValue(data.form_type, data);
    const attribution = getUtmParams();
    const eventData = {
      ...data,
      utm_source: data.utm_source || attribution.utmSource,
      utm_medium: data.utm_medium || attribution.utmMedium,
      utm_campaign: data.utm_campaign || attribution.utmCampaign,
      utm_term: data.utm_term || attribution.utmTerm,
      utm_content: data.utm_content || attribution.utmContent,
      gclid: data.gclid || attribution.gclid,
      gbraid: data.gbraid || attribution.gbraid,
      wbraid: data.wbraid || attribution.wbraid,
      fbclid: data.fbclid || attribution.fbclid,
      msclkid: data.msclkid || attribution.msclkid,
      landing_page: data.landing_page || attribution.landingPage,
      referrer: data.referrer || attribution.referrer,
    };

    // GA4 generate_lead event (standard conversion event)
    gtag('event', 'generate_lead', {
      event_category: 'conversion',
      event_label: eventData.form_type,
      form_type: eventData.form_type,
      form_location: eventData.form_location || 'unknown',
      enquiry_id: eventData.enquiry_id || undefined,
      currency: 'AUD',
      value: conversionValue,
      page_url: pageUrl,
      utm_source: eventData.utm_source,
      utm_medium: eventData.utm_medium,
      utm_campaign: eventData.utm_campaign,
      gclid: eventData.gclid,
      fbclid: eventData.fbclid,
    });

    // Custom form_submission event with full data
    const { form_type, form_location, enquiry_id, ...restData } = eventData;
    gtag('event', 'form_submission', {
      event_category: 'forms',
      form_type,
      form_location,
      enquiry_id,
      ...restData,
    });

    const dataLayerPayload = {
      ...eventData,
      formType: data.form_type,
      formLocation: data.form_location,
      enquiryId: data.enquiry_id,
      source: data.source || data.form_location || pageUrl,
      utmSource: eventData.utm_source,
      utmMedium: eventData.utm_medium,
      utmCampaign: eventData.utm_campaign,
      utmTerm: eventData.utm_term,
      utmContent: eventData.utm_content,
      gclid: eventData.gclid,
      gbraid: eventData.gbraid,
      wbraid: eventData.wbraid,
      fbclid: eventData.fbclid,
      msclkid: eventData.msclkid,
      landingPage: eventData.landing_page,
      referrer: eventData.referrer,
      conversionValue,
    };

    // Push to dataLayer for GTM triggers. Keep the legacy capitalized event
    // because existing GTM containers may still listen for it.
    pushToDataLayer('formSubmission', dataLayerPayload);
    pushToDataLayer('FormSubmission', dataLayerPayload);

    // Google Ads conversion tracking
    gtag('event', 'conversion', {
      send_to: `form_${data.form_type}`,
      value: conversionValue,
      currency: 'AUD',
    });

    // Facebook Pixel - Lead event for all form submissions
    fbPixel.trackLead({
      content_name: data.form_type,
      content_category: data.form_location || 'website',
      value: conversionValue,
      currency: 'AUD',
    });
  };

  /**
   * Track vehicle enquiry form submission
   */
  const trackVehicleEnquiry = (data: Omit<VehicleEnquiryData, 'form_type'> & { form_type?: 'vehicle_enquiry' | 'calculator_enquiry' }) => {
    const formData: VehicleEnquiryData = {
      form_type: data.form_type || 'vehicle_enquiry',
      ...data,
    };

    const vehicle = data.vehicle;

    // Enhanced ecommerce - add_to_cart equivalent for lead gen
    if (vehicle) {
      gtag('event', 'add_to_cart', {
        currency: 'AUD',
        value: vehicle.price || 0,
        items: [{
          item_id: vehicle.stockid || vehicle.identifier || 'unknown',
          item_name: `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.variant || vehicle.badge || ''}`.trim(),
          item_brand: vehicle.make || 'Hyundai',
          item_category: vehicle.condition || 'new',
          item_variant: vehicle.variant || vehicle.badge,
          price: vehicle.price || 0,
          quantity: 1,
        }],
      });
    }

    trackFormSubmission(formData);

    // Facebook Pixel - Vehicle Enquiry with detailed tracking
    fbPixel.trackVehicleEnquiry({
      vehicleId: vehicle ? String(vehicle.stockid || vehicle.identifier || '') : undefined,
      vehicleName: vehicle ? `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() : undefined,
      vehicleCategory: (vehicle?.condition as 'new' | 'used' | 'demo') || undefined,
      price: vehicle?.price,
      hasTradeIn: data.has_trade_in,
      hasFinanceInterest: data.interested_in_finance || data.finance_interest,
    });

    // Track additional configuration details
    if (data.configuration) {
      gtag('event', 'vehicle_configured', {
        event_category: 'calculator',
        has_option_pack: data.configuration.has_option_pack,
        has_colour_upgrade: data.configuration.has_colour_upgrade,
        has_prepaid_service: data.configuration.has_prepaid_service,
        total_configured_price: data.configuration.total_configured_price,
      });

      // Facebook Pixel - Calculator enquiry custom event
      fbPixel.trackCalculatorEnquiry({
        vehicleName: vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : undefined,
        configuredPrice: data.configuration.total_configured_price,
        hasOptionPack: data.configuration.has_option_pack,
        hasAccessories: data.has_accessories,
        accessoriesValue: data.accessories_value,
      });
    }
  };

  /**
   * Track test drive booking
   */
  const trackTestDriveBooking = (data: Omit<TestDriveData, 'form_type'>) => {
    const formData: TestDriveData = {
      form_type: 'test_drive',
      ...data,
    };

    // Test drives are high-intent - track as begin_checkout equivalent
    if (data.vehicle) {
      gtag('event', 'begin_checkout', {
        currency: 'AUD',
        value: data.vehicle.price || 0,
        items: [{
          item_id: data.vehicle.stockid || data.vehicle.identifier || 'unknown',
          item_name: `${data.vehicle.year || ''} ${data.vehicle.make || ''} ${data.vehicle.model || ''}`.trim(),
          item_brand: data.vehicle.make || 'Hyundai',
          price: data.vehicle.price || 0,
          quantity: 1,
        }],
      });
    }

    trackFormSubmission(formData);

    // Facebook Pixel - Test Drive with high-intent signals
    fbPixel.trackTestDriveBooking({
      vehicleId: data.vehicle ? String(data.vehicle.stockid || data.vehicle.identifier || '') : undefined,
      vehicleName: data.vehicle ? `${data.vehicle.year || ''} ${data.vehicle.make || ''} ${data.vehicle.model || ''}`.trim() : undefined,
      vehicleCategory: data.vehicle?.condition,
      price: data.vehicle?.price,
    });
  };

  /**
   * Track contact form submission
   */
  const trackContactForm = (data: Omit<ContactFormData, 'form_type'>) => {
    trackFormSubmission({
      form_type: 'contact',
      ...data,
    });

    // Facebook Pixel - Contact form
    fbPixel.trackContactForm({
      department: data.department,
    });
  };

  /**
   * Track service booking form
   */
  const trackServiceBooking = (data: Omit<ServiceFormData, 'form_type'>) => {
    trackFormSubmission({
      form_type: 'service',
      ...data,
    });

    // Additional event for service-specific analytics
    gtag('event', 'service_booking', {
      event_category: 'service',
      service_type: data.service_type,
      vehicle_make: data.vehicle_make,
      vehicle_model: data.vehicle_model,
      preferred_date: data.preferred_date,
    });

    // Facebook Pixel - Service booking
    fbPixel.trackServiceBooking({
      serviceType: data.service_type,
      vehicleMake: data.vehicle_make,
      vehicleModel: data.vehicle_model,
    });
  };

  /**
   * Track parts enquiry form
   */
  const trackPartsEnquiry = (data: Omit<PartsFormData, 'form_type'>) => {
    trackFormSubmission({
      form_type: 'parts',
      ...data,
    });

    // Facebook Pixel - Parts enquiry
    fbPixel.trackPartsEnquiry();
  };

  /**
   * Track finance application/enquiry
   */
  const trackFinanceEnquiry = (data: Omit<FinanceFormData, 'form_type'>) => {
    trackFormSubmission({
      form_type: 'finance',
      ...data,
    });

    // Track finance-specific metrics
    if (data.loan_amount) {
      gtag('event', 'finance_application', {
        event_category: 'finance',
        loan_amount: data.loan_amount,
        deposit_amount: data.deposit_amount,
        loan_term_months: data.loan_term_months,
        vehicle_price: data.vehicle?.price,
      });
    }

    // Facebook Pixel - Finance enquiry
    fbPixel.trackFinanceEnquiry({
      loanAmount: data.loan_amount,
      vehiclePrice: data.vehicle?.price,
      vehicleName: data.vehicle ? `${data.vehicle.make || ''} ${data.vehicle.model || ''}`.trim() : undefined,
    });
  };

  /**
   * Track fleet enquiry
   */
  const trackFleetEnquiry = (data: Omit<FleetFormData, 'form_type'>) => {
    trackFormSubmission({
      form_type: 'fleet',
      ...data,
    });

    // B2B specific tracking
    gtag('event', 'b2b_lead', {
      event_category: 'fleet',
      company_name: data.company_name ? 'provided' : 'not_provided', // Don't send actual company name
      fleet_size: data.fleet_size,
      vehicles_interested_count: data.vehicles_interested?.length || 0,
    });

    // Facebook Pixel - Fleet enquiry (B2B high value)
    fbPixel.trackFleetEnquiry({
      companyName: data.company_name,
      fleetSize: data.fleet_size,
      vehiclesCount: data.vehicles_interested?.length,
    });
  };

  /**
   * Track accessories quote request
   */
  const trackAccessoriesEnquiry = (data: Omit<AccessoriesFormData, 'form_type'>) => {
    const formData: AccessoriesFormData = {
      form_type: 'accessories',
      ...data,
    };

    trackFormSubmission(formData);

    // Track as ecommerce event
    gtag('event', 'view_cart', {
      currency: 'AUD',
      value: data.total_value,
      items_count: data.items_count,
    });

    if (data.accessories?.length) {
      const { event, ...payload } = buildAccessoryCommerceEvent('accessories_quote_submit', {
        items: data.accessories.map(item => ({
          accessory: {
            id: item.id,
            name: item.name,
            price: item.price,
          },
          quantity: item.quantity,
          type: item.type === 'pack' ? 'pack' : 'accessory',
        })),
        selectedModel: data.vehicle_model ? { name: data.vehicle_model } : null,
        source: data.form_location || 'accessories_enquiry',
      });

      pushToDataLayer(event, {
        ...payload,
        formType: 'accessories',
        formLocation: data.form_location,
        enquiryId: data.enquiry_id,
      });
    }

    // Facebook Pixel - Accessories enquiry
    fbPixel.trackAccessoriesEnquiry({
      totalValue: data.total_value,
      itemsCount: data.items_count,
      vehicleModel: data.vehicle_model,
    });
  };

  /**
   * Track sell my car form
   */
  const trackSellMyCar = (data: Omit<SellMyCarData, 'form_type'>) => {
    trackFormSubmission({
      form_type: 'sell_my_car',
      ...data,
    });

    // Track trade-in lead separately
    gtag('event', 'trade_in_lead', {
      event_category: 'sell_my_car',
      vehicle_make: data.vehicle_make,
      vehicle_model: data.vehicle_model,
      vehicle_year: data.vehicle_year,
      has_photos: data.has_photos,
      photos_count: data.photos_count,
      condition: data.condition,
    });

    // Facebook Pixel - Sell my car
    fbPixel.trackSellMyCar({
      vehicleMake: data.vehicle_make,
      vehicleModel: data.vehicle_model,
      vehicleYear: data.vehicle_year,
    });
  };

  /**
   * Track special offer enquiry
   */
  const trackSpecialOfferEnquiry = (data: Omit<SpecialOfferFormData, 'form_type'>) => {
    const formData: SpecialOfferFormData = {
      form_type: 'special_offer',
      ...data,
    };

    trackFormSubmission(formData);

    // Track as high-intent conversion (similar to test drive)
    if (data.vehicle) {
      gtag('event', 'begin_checkout', {
        currency: 'AUD',
        value: data.vehicle.price || 0,
        items: [{
          item_id: data.vehicle.stockid || data.vehicle.identifier || 'unknown',
          item_name: `${data.offer_model || ''} ${data.offer_variant || ''}`.trim(),
          item_brand: data.vehicle.make || 'Hyundai',
          item_category: 'special_offer',
          item_variant: data.offer_type,
          price: data.vehicle.price || 0,
          quantity: 1,
        }],
      });
    }

    // Special offer specific event
    gtag('event', 'special_offer_enquiry', {
      event_category: 'special_offers',
      offer_model: data.offer_model,
      offer_variant: data.offer_variant,
      offer_amount: data.offer_amount,
      offer_type: data.offer_type,
      offer_category: data.offer_category,
      vehicle_price: data.vehicle?.price,
    });

    // Facebook Pixel - Track as high-value lead
    fbPixel.trackLead({
      content_name: `Special Offer - ${data.offer_model || ''} ${data.offer_variant || ''}`.trim(),
      content_category: data.offer_category || 'special_offer',
      value: data.vehicle?.price || 600, // Use vehicle price or default high value
      currency: 'AUD',
    });
  };

  /**
   * Track form abandonment (call when user leaves form without submitting)
   */
  const trackFormAbandonment = (formType: FormType, fieldsCompleted: number, totalFields: number) => {
    gtag('event', 'form_abandonment', {
      event_category: 'forms',
      form_type: formType,
      fields_completed: fieldsCompleted,
      total_fields: totalFields,
      completion_percentage: Math.round((fieldsCompleted / totalFields) * 100),
    });

    pushToDataLayer('formAbandonment', {
      formType,
      fieldsCompleted,
      totalFields,
      completionPercentage: Math.round((fieldsCompleted / totalFields) * 100),
    });
  };

  /**
   * Track form field interaction (for funnel analysis)
   */
  const trackFormFieldInteraction = (formType: FormType, fieldName: string, action: 'focus' | 'blur' | 'change') => {
    gtag('event', 'form_field_interaction', {
      event_category: 'forms',
      form_type: formType,
      field_name: fieldName,
      action,
    });
  };

  /**
   * Track form validation error
   */
  const trackFormError = (formType: FormType, fieldName: string, errorType: string) => {
    gtag('event', 'form_error', {
      event_category: 'forms',
      form_type: formType,
      field_name: fieldName,
      error_type: errorType,
    });
  };

  return {
    // Existing functions
    trackEnquiryModalOpen,
    trackEnquirySubmit,
    trackVehicleView,
    trackVehicleSearch,
    trackPhoneClick,
    trackShare,
    // New comprehensive form tracking
    trackFormSubmission,
    trackVehicleEnquiry,
    trackTestDriveBooking,
    trackContactForm,
    trackServiceBooking,
    trackPartsEnquiry,
    trackFinanceEnquiry,
    trackFleetEnquiry,
    trackAccessoriesEnquiry,
    trackSellMyCar,
    trackSpecialOfferEnquiry,
    trackFormAbandonment,
    trackFormFieldInteraction,
    trackFormError,
    // Utility
    pushToDataLayer,
  };
};





