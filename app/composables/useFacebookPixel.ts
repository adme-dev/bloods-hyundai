/**
 * Facebook Pixel Composable
 * Provides type-safe methods for tracking Facebook Pixel events
 *
 * Standard Events:
 * - PageView: Page load (auto-tracked by plugin)
 * - Lead: Form submission
 * - Contact: Contact form
 * - Schedule: Appointment booking
 * - ViewContent: Product/vehicle view
 * - AddToCart: Add to wishlist/enquiry initiated
 * - InitiateCheckout: High-intent action
 * - Purchase: Completed transaction
 * - Search: Search query
 * - CompleteRegistration: Account creation
 *
 * Custom Events:
 * - VehicleEnquiry, TestDriveBooking, ServiceBooking, PartsEnquiry,
 *   FinanceApplication, FleetEnquiry, AccessoriesEnquiry, SellMyCar
 */

// Vehicle data for Facebook Pixel
interface FBVehicleData {
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}

// Lead data for form submissions
interface FBLeadData {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}

// Content view data
interface FBContentViewData {
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}

// Search data
interface FBSearchData {
  search_string?: string;
  content_category?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
}

// User data for advanced matching
interface FBUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  postcode?: string;
}

export const useFacebookPixel = () => {
  const { $fbq } = useNuxtApp();

  /**
   * Helper to hash user data for advanced matching (Facebook requires SHA-256 hashing)
   * Note: For proper implementation, hashing should be done server-side
   * This is a simplified client-side approach
   */
  const hashUserData = async (value: string): Promise<string> => {
    if (!value) return '';
    const normalized = value.toLowerCase().trim();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  /**
   * Track Lead event (standard event for form submissions)
   */
  const trackLead = (data?: FBLeadData) => {
    $fbq?.track('Lead', {
      content_name: data?.content_name || 'Form Submission',
      content_category: data?.content_category || 'Enquiry',
      value: data?.value || 0,
      currency: data?.currency || 'AUD',
    });
  };

  /**
   * Track Contact event
   */
  const trackContact = (data?: { content_name?: string }) => {
    $fbq?.track('Contact', {
      content_name: data?.content_name || 'Contact Form',
    });
  };

  /**
   * Track Schedule event (appointments, test drives, service bookings)
   */
  const trackSchedule = (data?: { content_name?: string; value?: number }) => {
    $fbq?.track('Schedule', {
      content_name: data?.content_name || 'Appointment',
      value: data?.value || 0,
      currency: 'AUD',
    });
  };

  /**
   * Track ViewContent event (vehicle detail page views)
   */
  const trackViewContent = (data: FBContentViewData) => {
    $fbq?.track('ViewContent', {
      content_ids: data.content_ids,
      content_name: data.content_name,
      content_type: data.content_type || 'vehicle',
      content_category: data.content_category,
      value: data.value || 0,
      currency: data.currency || 'AUD',
    });
  };

  /**
   * Track AddToCart event (vehicle enquiry initiated)
   */
  const trackAddToCart = (data: FBVehicleData) => {
    $fbq?.track('AddToCart', {
      content_ids: data.content_ids,
      content_name: data.content_name,
      content_type: data.content_type || 'vehicle',
      content_category: data.content_category,
      value: data.value || 0,
      currency: data.currency || 'AUD',
    });
  };

  /**
   * Track InitiateCheckout event (high-intent actions like test drive booking)
   */
  const trackInitiateCheckout = (data: FBVehicleData) => {
    $fbq?.track('InitiateCheckout', {
      content_ids: data.content_ids,
      content_name: data.content_name,
      content_type: data.content_type || 'vehicle',
      value: data.value || 0,
      currency: data.currency || 'AUD',
      num_items: 1,
    });
  };

  /**
   * Track Purchase event (completed transaction - vehicle deposit, accessories, etc.)
   */
  const trackPurchase = (data: { value: number; content_ids?: string[]; content_name?: string; content_type?: string }) => {
    $fbq?.track('Purchase', {
      content_ids: data.content_ids,
      content_name: data.content_name,
      content_type: data.content_type || 'vehicle',
      value: data.value,
      currency: 'AUD',
      num_items: 1,
    });
  };

  /**
   * Track Search event
   */
  const trackSearch = (data: FBSearchData) => {
    $fbq?.track('Search', {
      search_string: data.search_string,
      content_category: data.content_category || 'vehicles',
      content_ids: data.content_ids,
      value: data.value,
      currency: data.currency || 'AUD',
    });
  };

  // ============================================
  // CUSTOM EVENTS (mapped to business actions)
  // ============================================

  /**
   * Track Vehicle Enquiry (custom event + standard Lead)
   */
  const trackVehicleEnquiry = (data: {
    vehicleId?: string;
    vehicleName?: string;
    vehicleCategory?: 'new' | 'used' | 'demo';
    price?: number;
    hasTradeIn?: boolean;
    hasFinanceInterest?: boolean;
  }) => {
    // Standard Lead event
    trackLead({
      content_name: data.vehicleName || 'Vehicle Enquiry',
      content_category: data.vehicleCategory || 'vehicle',
      value: data.price ? data.price * 0.01 : 500, // 1% of vehicle price or $500 default
    });

    // Custom event with more detail
    $fbq?.trackCustom('VehicleEnquiry', {
      content_ids: data.vehicleId ? [data.vehicleId] : undefined,
      content_name: data.vehicleName,
      content_category: data.vehicleCategory,
      value: data.price,
      currency: 'AUD',
      has_trade_in: data.hasTradeIn,
      has_finance_interest: data.hasFinanceInterest,
    });
  };

  /**
   * Track Test Drive Booking (custom event + standard Schedule + InitiateCheckout)
   */
  const trackTestDriveBooking = (data: {
    vehicleId?: string;
    vehicleName?: string;
    vehicleCategory?: string;
    price?: number;
  }) => {
    // Standard Schedule event
    trackSchedule({
      content_name: `Test Drive - ${data.vehicleName || 'Vehicle'}`,
      value: 1000, // High intent value
    });

    // InitiateCheckout for high-intent signal
    trackInitiateCheckout({
      content_ids: data.vehicleId ? [data.vehicleId] : undefined,
      content_name: data.vehicleName,
      content_category: data.vehicleCategory,
      value: data.price || 0,
    });

    // Custom event
    $fbq?.trackCustom('TestDriveBooking', {
      content_ids: data.vehicleId ? [data.vehicleId] : undefined,
      content_name: data.vehicleName,
      content_category: data.vehicleCategory,
      value: data.price || 0,
      currency: 'AUD',
    });
  };

  /**
   * Track Service Booking
   */
  const trackServiceBooking = (data: {
    serviceType?: string;
    vehicleMake?: string;
    vehicleModel?: string;
  }) => {
    trackSchedule({
      content_name: `Service Booking - ${data.serviceType || 'Service'}`,
      value: 200,
    });

    $fbq?.trackCustom('ServiceBooking', {
      content_name: data.serviceType,
      vehicle_make: data.vehicleMake,
      vehicle_model: data.vehicleModel,
      value: 200,
      currency: 'AUD',
    });
  };

  /**
   * Track Parts Enquiry
   */
  const trackPartsEnquiry = () => {
    trackLead({
      content_name: 'Parts Enquiry',
      content_category: 'parts',
      value: 150,
    });

    $fbq?.trackCustom('PartsEnquiry', {
      content_category: 'parts',
      value: 150,
      currency: 'AUD',
    });
  };

  /**
   * Track Finance Application/Enquiry
   */
  const trackFinanceEnquiry = (data: {
    loanAmount?: number;
    vehiclePrice?: number;
    vehicleName?: string;
  }) => {
    trackLead({
      content_name: 'Finance Application',
      content_category: 'finance',
      value: 800,
    });

    $fbq?.trackCustom('FinanceApplication', {
      content_name: data.vehicleName,
      loan_amount: data.loanAmount,
      vehicle_price: data.vehiclePrice,
      value: 800,
      currency: 'AUD',
    });
  };

  /**
   * Track Fleet Enquiry (B2B lead)
   */
  const trackFleetEnquiry = (data: {
    companyName?: string;
    fleetSize?: string;
    vehiclesCount?: number;
  }) => {
    trackLead({
      content_name: 'Fleet Enquiry',
      content_category: 'fleet',
      value: 2000, // High value B2B lead
    });

    $fbq?.trackCustom('FleetEnquiry', {
      content_category: 'fleet',
      fleet_size: data.fleetSize,
      vehicles_count: data.vehiclesCount,
      value: 2000,
      currency: 'AUD',
    });
  };

  /**
   * Track Accessories Enquiry
   */
  const trackAccessoriesEnquiry = (data: {
    totalValue: number;
    itemsCount: number;
    vehicleModel?: string;
  }) => {
    // Use AddToCart for accessories
    trackAddToCart({
      content_name: `Accessories - ${data.vehicleModel || 'Vehicle'}`,
      content_category: 'accessories',
      value: data.totalValue,
    });

    $fbq?.trackCustom('AccessoriesEnquiry', {
      content_category: 'accessories',
      vehicle_model: data.vehicleModel,
      items_count: data.itemsCount,
      value: data.totalValue,
      currency: 'AUD',
    });
  };

  /**
   * Track Sell My Car submission
   */
  const trackSellMyCar = (data: {
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: string;
  }) => {
    trackLead({
      content_name: 'Sell My Car',
      content_category: 'trade_in',
      value: 400,
    });

    $fbq?.trackCustom('SellMyCar', {
      content_category: 'trade_in',
      vehicle_make: data.vehicleMake,
      vehicle_model: data.vehicleModel,
      vehicle_year: data.vehicleYear,
      value: 400,
      currency: 'AUD',
    });
  };

  /**
   * Track Contact Form submission
   */
  const trackContactForm = (data?: { department?: string }) => {
    trackContact({
      content_name: data?.department ? `Contact - ${data.department}` : 'Contact Form',
    });

    trackLead({
      content_name: 'Contact Form',
      content_category: 'contact',
      value: 100,
    });
  };

  /**
   * Track Calculator Enquiry (configured vehicle)
   */
  const trackCalculatorEnquiry = (data: {
    vehicleName?: string;
    configuredPrice?: number;
    hasOptionPack?: boolean;
    hasAccessories?: boolean;
    accessoriesValue?: number;
  }) => {
    trackLead({
      content_name: `Calculator - ${data.vehicleName || 'Vehicle'}`,
      content_category: 'calculator',
      value: data.configuredPrice ? data.configuredPrice * 0.01 : 750,
    });

    $fbq?.trackCustom('CalculatorEnquiry', {
      content_name: data.vehicleName,
      configured_price: data.configuredPrice,
      has_option_pack: data.hasOptionPack,
      has_accessories: data.hasAccessories,
      accessories_value: data.accessoriesValue,
      value: data.configuredPrice,
      currency: 'AUD',
    });
  };

  /**
   * Set user data for advanced matching (call after form submission)
   */
  const setUserData = async (userData: FBUserData) => {
    const hashedData: Record<string, string> = {};

    if (userData.email) {
      hashedData.em = await hashUserData(userData.email);
    }
    if (userData.phone) {
      // Remove non-numeric characters and hash
      const cleanPhone = userData.phone.replace(/\D/g, '');
      hashedData.ph = await hashUserData(cleanPhone);
    }
    if (userData.firstName) {
      hashedData.fn = await hashUserData(userData.firstName);
    }
    if (userData.lastName) {
      hashedData.ln = await hashUserData(userData.lastName);
    }
    if (userData.city) {
      hashedData.ct = await hashUserData(userData.city);
    }
    if (userData.state) {
      hashedData.st = await hashUserData(userData.state);
    }
    if (userData.postcode) {
      hashedData.zp = await hashUserData(userData.postcode);
    }

    $fbq?.setUserData(hashedData);
  };

  return {
    // Standard events
    trackLead,
    trackContact,
    trackSchedule,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    trackSearch,

    // Custom business events
    trackVehicleEnquiry,
    trackTestDriveBooking,
    trackServiceBooking,
    trackPartsEnquiry,
    trackFinanceEnquiry,
    trackFleetEnquiry,
    trackAccessoriesEnquiry,
    trackSellMyCar,
    trackContactForm,
    trackCalculatorEnquiry,

    // User data
    setUserData,

    // Raw access
    track: (event: string, params?: Record<string, any>) => $fbq?.track(event, params),
    trackCustom: (event: string, params?: Record<string, any>) => $fbq?.trackCustom(event, params),
  };
};
