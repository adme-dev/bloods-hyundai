/**
 * Composable for handling enquiry form submissions
 * Connects frontend forms to the Neon database API
 */

interface EnquiryFormData {
  // Contact details
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  postcode?: string;
  suburb?: string;
  state?: string;
  
  // Message
  message?: string;
  
  // Vehicle info (for vehicle enquiries)
  vehicleInfo?: {
    condition?: string; // 'new' | 'used' | 'demo'
    make?: string;
    model?: string;
    variant?: string;
    year?: number;
    price?: number;
    stockId?: string;
    vin?: string;
    colour?: string;
    registration?: string;
  };
  
  // Trade-in info
  tradeIn?: {
    make?: string;
    model?: string;
    year?: number;
    registration?: string;
    kilometres?: number;
    condition?: string;
  };
  
  // Service booking info
  serviceInfo?: {
    serviceType?: string;
    preferredDate?: string;
    preferredTime?: string;
    registration?: string;
    odometer?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: string;
    comments?: string;
  };
  
  // Flags
  testDrive?: boolean;
  financeInterest?: boolean;
  
  // Form metadata
  type: 'contact' | 'vehicle' | 'finance' | 'service' | 'sell_car' | 'parts' | 'accessories' | 'test_drive';
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  msclkid?: string;
  landingPage?: string;
  referrer?: string;
}

interface SubmitResult {
  success: boolean;
  enquiryId?: string;
  error?: string;
}

export function useEnquiryForm() {
  const config = useRuntimeConfig();
  const route = useRoute();
  const { getUtmParams } = useUtmParams();

  const isSubmitting = ref(false);
  const isSubmitted = ref(false);
  const submitError = ref<string | null>(null);
  const enquiryId = ref<string | null>(null);
  
  /**
   * Submit enquiry to the new Neon database API
   */
  const submitEnquiry = async (data: EnquiryFormData): Promise<SubmitResult> => {
    isSubmitting.value = true;
    submitError.value = null;
    
    try {
      const utmParams = getUtmParams();

      // Build the payload for the API
      const payload = {
        type: data.type,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || undefined,
        postcode: data.postcode || undefined,
        suburb: data.suburb || undefined,
        state: data.state || undefined,
        message: data.message || undefined,
        vehicleInfo: data.vehicleInfo || undefined,
        tradeIn: data.tradeIn || undefined,
        serviceInfo: data.serviceInfo || undefined,
        testDrive: data.testDrive || false,
        financeInterest: data.financeInterest || false,
        source: data.source || route.path,
        // Use UTM params composable (gets from URL or sessionStorage)
        ...utmParams,
        // Allow explicit UTM overrides
        ...(data.utmSource && { utmSource: data.utmSource }),
        ...(data.utmMedium && { utmMedium: data.utmMedium }),
        ...(data.utmCampaign && { utmCampaign: data.utmCampaign }),
        ...(data.utmTerm && { utmTerm: data.utmTerm }),
        ...(data.utmContent && { utmContent: data.utmContent }),
        ...(data.gclid && { gclid: data.gclid }),
        ...(data.gbraid && { gbraid: data.gbraid }),
        ...(data.wbraid && { wbraid: data.wbraid }),
        ...(data.fbclid && { fbclid: data.fbclid }),
        ...(data.msclkid && { msclkid: data.msclkid }),
        ...(data.landingPage && { landingPage: data.landingPage }),
        ...(data.referrer && { referrer: data.referrer }),
      };
      
      // Submit to the new API
      const response = await $fetch<{ enquiry: { id: string } }>('/api/submit-enquiry', {
        method: 'POST',
        body: payload,
      });
      
      enquiryId.value = response.enquiry.id;
      isSubmitted.value = true;
      
      // Track in GTM/dataLayer
      if (process.client && (window as any).dataLayer) {
        const trackingPayload = {
          formType: data.type,
          formLocation: data.source || route.path,
          formStatus: 'submitted',
          enquiryId: response.enquiry.id,
          source: data.source || route.path,
          utmSource: data.utmSource || utmParams.utmSource,
          utmMedium: data.utmMedium || utmParams.utmMedium,
          utmCampaign: data.utmCampaign || utmParams.utmCampaign,
          utmTerm: data.utmTerm || utmParams.utmTerm,
          utmContent: data.utmContent || utmParams.utmContent,
          gclid: data.gclid || utmParams.gclid,
          gbraid: data.gbraid || utmParams.gbraid,
          wbraid: data.wbraid || utmParams.wbraid,
          fbclid: data.fbclid || utmParams.fbclid,
          msclkid: data.msclkid || utmParams.msclkid,
          landingPage: data.landingPage || utmParams.landingPage,
          referrer: data.referrer || utmParams.referrer,
          vehicleStockId: data.vehicleInfo?.stockId,
          vehicleMake: data.vehicleInfo?.make,
          vehicleModel: data.vehicleInfo?.model,
          vehicleCondition: data.vehicleInfo?.condition,
          wantsTestDrive: data.testDrive || false,
          interestedInFinance: data.financeInterest || false,
        };

        (window as any).dataLayer.push({ event: 'formSubmission', ...trackingPayload });
        (window as any).dataLayer.push({ event: 'FormSubmission', ...trackingPayload });
      }
      
      return {
        success: true,
        enquiryId: response.enquiry.id,
      };
    } catch (error: any) {
      console.error('Enquiry submission error:', error);
      submitError.value = error?.data?.message || error?.message || 'Something went wrong. Please try again.';
      
      return {
        success: false,
        error: submitError.value || undefined,
      };
    } finally {
      isSubmitting.value = false;
    }
  };
  
  /**
   * Reset the form state
   */
  const resetState = () => {
    isSubmitting.value = false;
    isSubmitted.value = false;
    submitError.value = null;
    enquiryId.value = null;
  };
  
  return {
    // State
    isSubmitting,
    isSubmitted,
    submitError,
    enquiryId,
    
    // Methods
    submitEnquiry,
    resetState,
  };
}







