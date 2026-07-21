import { db } from '../utils/db';
import { dealers, enquiries, enquiryActivityLog } from '../database/schema';
import { eq } from 'drizzle-orm';
import { sendFormNotifications } from '../utils/email';
import { ENQUIRY_STATUSES } from '~~/shared/constants/salesFunnel';
import { normalizeEnquiryType } from '~~/shared/constants/enquiryTypes';
import { sanitizeIpAddress } from '../utils/intakeValidation';
import { isHoneypotTripped, checkRateLimit, isDuplicateEnquiry } from '../utils/intakeAbuse';
import { inferLeadAttribution } from '../utils/metrics/attribution';
import { emitEnquiryCreatedRealtimeEvent } from '../utils/realtime/events';
import { LIVE_TEST_EMAIL_SECRET_HEADER, resolveLiveTestEmailOverride } from '../utils/liveTestEmail';
import { queueDealerStudioExport } from '../utils/dealerStudio/delivery';
import { validateRequiredCustomerPhone } from '~~/shared/utils/customerPhone';

/**
 * Internal Enquiry Submission Endpoint
 * 
 * For submissions from the dealer's own website (no API key required).
 * Uses runtime config to identify the dealer.
 */

interface EnquirySubmission {
  type: 'contact' | 'finance' | 'vehicle' | 'sell_car' | 'test_drive' | 'parts' | 'service' | 'fleet' | 'accessories' | 'special_offer';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postcode?: string;
  suburb?: string;
  state?: string;
  message?: string;
  source?: string;
  
  vehicleInfo?: {
    // Identifiers
    stockId?: string;
    vin?: string;

    // Basic Info
    condition?: string;
    make?: string;
    model?: string;
    variant?: string;
    year?: number;

    // Specifications
    kms?: number | string;
    transmission?: string;
    fuel?: string;
    drivetrain?: string;
    body?: string;
    colour?: string;
    seats?: number;
    engine?: string;
    registration?: string;

    // Pricing
    price?: number;
    priceDisplay?: string;

    // Media (lightweight - for emails/CRM display)
    thumbnail?: string;
    vehicleUrl?: string;
  };
  
  tradeIn?: {
    make?: string;
    model?: string;
    year?: number;
    registration?: string;
    kilometres?: number;
    condition?: string;
  };
  
  serviceInfo?: {
    serviceType?: string;
    preferredDate?: string;
    preferredTime?: string;
    registration?: string;
    odometer?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: string;
  };

  financeInfo?: {
    vehiclePrice?: number;
    deposit?: number;
    tradeInValue?: number;
    loanAmount?: number;
    loanTermMonths?: number;
    loanTermYears?: number;
    interestRate?: number;
    comparisonRate?: number;
    weeklyPayment?: number;
    fortnightlyPayment?: number;
    monthlyPayment?: number;
    paymentFrequency?: 'weekly' | 'fortnightly' | 'monthly';
    selectedPayment?: string;
  };

  accessoriesCart?: {
    model?: string | null;
    items: {
      id: string;
      name: string;
      partNumber?: string;
      price: number;
      quantity: number;
      type: 'accessory' | 'pack';
      subtotal: number;
      image?: string | null;
      thumbnail?: string | null;
    }[];
    itemCount: number;
    total: number;
  };

  // Applied offers from vehicle builder
  appliedOffers?: {
    offerId: string;
    title: string;
    type?: string;
    formattedValue?: string;
  }[];

  // Detailed vehicle configuration from calculator/builder
  vehicleConfiguration?: {
    model?: string;
    variant?: string;
    variantId?: string;
    colour?: string;
    colourPrice?: number;
    trim?: string;
    trimPrice?: number;
    optionPack?: string;
    optionPackPrice?: number;
    prepaidService?: string;
    prepaidServicePrice?: number;
    basePrice?: number;
    totalPrice?: number;
    thumbnail?: string;
  };

  testDrive?: boolean;
  financeInterest?: boolean;
  
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
  chatSource?: string;
  chatIntent?: string;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  
  try {
    // 1. Get dealer ID from runtime config or environment
    const dealerApiKey = String(config.dealerApiKey || process.env.DEALER_API_KEY || '');
    
    let dealer;
    
    if (dealerApiKey) {
      // Find dealer by API key from config
      const [foundDealer] = await db
        .select()
        .from(dealers)
        .where(eq(dealers.apiKey, dealerApiKey))
        .limit(1);
      dealer = foundDealer;
    }
    
    // If no dealer found by API key, get the first active dealer (for single-tenant sites)
    if (!dealer) {
      const [defaultDealer] = await db
        .select()
        .from(dealers)
        .where(eq(dealers.isActive, true))
        .limit(1);
      dealer = defaultDealer;
    }
    
    if (!dealer) {
      console.error('[Submit Enquiry] No dealer found');
      throw createError({
        statusCode: 500,
        message: 'Dealer not configured. Please contact support.',
      });
    }
    
    // 2. Parse and validate request body
    const body = await readBody<EnquirySubmission>(event);
    
    if (!body.type || !body.firstName || !body.email) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: type, firstName, email',
      });
    }

    const liveTestResult = resolveLiveTestEmailOverride({
      configuredSecret: config.enquiryLiveTestSecret || process.env.ENQUIRY_LIVE_TEST_SECRET,
      configuredRecipient: config.enquiryLiveTestRecipient || process.env.ENQUIRY_LIVE_TEST_RECIPIENT,
      providedSecret: getHeader(event, LIVE_TEST_EMAIL_SECRET_HEADER),
    });

    if (!liveTestResult.ok) {
      throw createError({ statusCode: 403, message: liveTestResult.message });
    }

    const liveTestOverride = liveTestResult.override;
    if (liveTestOverride) {
      console.log(`[Submit Enquiry] Live test email override enabled for enquiry type ${body.type}`);
    }
    const liveTestArchivedAt = liveTestOverride ? new Date() : undefined;
    
    // If lastName is not provided, use a placeholder
    const lastName = body.lastName || 'Not Provided';
    
    // 3. Get request metadata
    const ipAddress = getRequestIP(event, { xForwardedFor: true });
    const userAgent = getHeader(event, 'user-agent');
    const referer = getHeader(event, 'referer');
    const attribution = inferLeadAttribution({
      source: body.source || referer || 'website',
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      gclid: body.gclid,
      gbraid: body.gbraid,
      wbraid: body.wbraid,
      fbclid: body.fbclid,
      msclkid: body.msclkid,
      landingPage: body.landingPage,
      referrer: body.referrer || referer,
      chatSource: body.chatSource,
      chatIntent: body.chatIntent,
    });
    
    // 4. Build enhanced vehicle info with configuration and offers
    const enhancedVehicleInfo = body.vehicleInfo ? {
      ...body.vehicleInfo,
      // Include detailed configuration from vehicle builder
      configuration: body.vehicleConfiguration,
      // Include applied offers
      appliedOffers: body.appliedOffers,
    } : body.vehicleConfiguration ? {
      // If no vehicleInfo but we have configuration, use configuration
      make: 'Hyundai',
      model: body.vehicleConfiguration.model,
      variant: body.vehicleConfiguration.variant,
      colour: body.vehicleConfiguration.colour,
      price: body.vehicleConfiguration.totalPrice,
      thumbnail: body.vehicleConfiguration.thumbnail,
      condition: 'new',
      configuration: body.vehicleConfiguration,
      appliedOffers: body.appliedOffers,
    } : undefined;

    // 4b. Abuse controls (honeypot → rate limit → duplicate)
    if (isHoneypotTripped(body)) {
      return { success: true }; // silently accept; do not persist bot submissions
    }
    const phoneValidation = validateRequiredCustomerPhone(body.phone);
    if (!phoneValidation.ok) {
      throw createError({ statusCode: 400, message: phoneValidation.error });
    }
    const rateKey = `${dealer.id}:${sanitizeIpAddress(ipAddress) ?? 'noip'}`;
    if (!checkRateLimit(rateKey, Date.now())) {
      throw createError({ statusCode: 429, message: 'Too many submissions. Please try again shortly.' });
    }
    if (await isDuplicateEnquiry(dealer.id, body.email)) {
      return { success: true, duplicate: true };
    }

    // 5. Insert enquiry into database
    const [enquiry] = await db
      .insert(enquiries)
      .values({
        dealerId: dealer.id,
        type: normalizeEnquiryType(body.type),
        source: liveTestOverride ? 'live-smoke-test' : body.source || referer || 'website',
        firstName: body.firstName,
        lastName: lastName,
        email: body.email,
        phone: phoneValidation.phone,
        postcode: body.postcode,
        suburb: body.suburb,
        state: body.state,
        message: body.message,
        vehicleStockId: body.vehicleInfo?.stockId,
        vehicleInfo: enhancedVehicleInfo,
        tradeInInfo: body.tradeIn || undefined,
        financeDetails: body.financeInfo || undefined,
        accessoriesCart: body.accessoriesCart || undefined,
        testDrive: body.testDrive || false,
        financeInterest: body.financeInterest || false,
        status: ENQUIRY_STATUSES.NEW_LEAD,
        priority: 'normal',
        archivedAt: liveTestArchivedAt,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        utmTerm: body.utmTerm,
        utmContent: body.utmContent,
        gclid: body.gclid,
        gbraid: body.gbraid,
        wbraid: body.wbraid,
        fbclid: body.fbclid,
        msclkid: body.msclkid,
        landingPage: body.landingPage,
        referrer: body.referrer || referer || undefined,
        chatSource: body.chatSource,
        chatIntent: body.chatIntent,
        attributedPlatform: attribution.platform,
        attributedCampaignId: attribution.campaignId,
        attributedCampaignName: attribution.campaignName || body.utmCampaign,
        attributionConfidence: attribution.confidence,
        attributionMethod: attribution.method,
        attributionMatchedAt: attribution.platform ? new Date() : undefined,
        attributionMeta: attribution.evidence,
        ipAddress: sanitizeIpAddress(ipAddress) || undefined,
        userAgent: userAgent || undefined,
      })
      .returning();

    if (!enquiry) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create enquiry',
      });
    }
    
    console.log(`✅ [Submit Enquiry] Created enquiry ${enquiry.id} for ${body.firstName} ${body.lastName}`);
    
    // 5. Log activity
    await db.insert(enquiryActivityLog).values({
      dealerId: dealer.id,
      enquiryId: enquiry.id,
      action: 'created',
      entityType: 'enquiry',
      newValue: {
        type: enquiry.type,
        status: enquiry.status,
        customer: `${enquiry.firstName} ${enquiry.lastName}`,
        liveTest: Boolean(liveTestOverride),
      },
    });

    try {
      await queueDealerStudioExport(enquiry, dealer);
    } catch (exportError) {
      console.error('[Submit Enquiry] Could not queue Dealer Studio export', exportError);
    }

    if (!liveTestOverride) {
      try {
        await emitEnquiryCreatedRealtimeEvent(enquiry, { source: 'submit-enquiry' });
      } catch (realtimeError) {
        console.error('[Submit Enquiry] Realtime event failed:', realtimeError);
      }
    }
    
    // 6. Send notifications based on form configuration
    try {
      await sendFormNotifications(enquiry, dealer, { liveTestOverride });
    } catch (emailError) {
      console.error('[Submit Enquiry] Email notification failed:', emailError);
    }
    
    // 7. Return success
    return {
      success: true,
      enquiry: {
        id: enquiry.id,
      },
      message: 'Enquiry submitted successfully',
    };
    
  } catch (error: any) {
    console.error('[Submit Enquiry] Error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Failed to submit enquiry. Please try again.',
    });
  }
});


