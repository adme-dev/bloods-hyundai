import { db } from '../utils/db';
import { dealers, enquiries, enquiryActivityLog } from '../database/schema';
import { eq } from 'drizzle-orm';
import { evaluateRoutingRules } from '../utils/routing';
import { sendEnquiryNotification, sendCustomerConfirmation } from '../utils/email';
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
 * Public Enquiry Submission Endpoint
 * 
 * Accepts form submissions from dealer websites with API key authentication.
 * Stores enquiries in the database with proper tenant isolation.
 * 
 * Authentication: X-Dealer-Key header
 */

interface EnquirySubmission {
  // Required fields
  type: 'contact' | 'finance' | 'vehicle' | 'sell_car' | 'test_drive' | 'parts' | 'service' | 'fleet' | 'accessories';
  firstName: string;
  lastName: string;
  email: string;
  
  phone: string;

  // Optional fields
  source?: string;
  department?: string;
  postcode?: string;
  message?: string;
  
  // Type-specific data
  vehicleInfo?: {
    make?: string;
    model?: string;
    year?: string;
    variant?: string;
    stockId?: string;
    price?: number;
    condition?: string;
    imageUrl?: string;
  };
  
  tradeInInfo?: {
    make?: string;
    model?: string;
    year?: string;
    rego?: string;
    odometer?: number;
    condition?: string;
  };
  
  financeDetails?: {
    loanAmount?: number;
    term?: number;
    deposit?: number;
    rate?: number;
    repayment?: number;
  };
  
  sellCarDetails?: {
    year?: string;
    make?: string;
    model?: string;
    grade?: string;
    rego?: string;
    odometer?: number;
    photos?: string[];
  };
  
  accessoriesCart?: {
    items: Array<{
      id: string;
      name: string;
      partNumber: string;
      quantity: number;
      price: number;
    }>;
    itemCount: number;
    total: number;
  };
  
  // UTM tracking
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
  try {
    const config = useRuntimeConfig();
    // 1. Validate API key from header
    const apiKey = getHeader(event, 'x-dealer-key');
    
    if (!apiKey) {
      throw createError({
        statusCode: 401,
        message: 'Missing API key. Please provide X-Dealer-Key header.',
      });
    }
    
    // 2. Find dealer by API key
    const [dealer] = await db
      .select()
      .from(dealers)
      .where(eq(dealers.apiKey, apiKey))
      .limit(1);
    
    if (!dealer) {
      throw createError({
        statusCode: 401,
        message: 'Invalid API key.',
      });
    }
    
    if (!dealer.isActive) {
      throw createError({
        statusCode: 403,
        message: 'Dealer account is inactive.',
      });
    }
    
    // 3. Parse and validate request body
    const body = await readBody<EnquirySubmission>(event);
    
    if (!body.type || !body.firstName || !body.lastName || !body.email) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: type, firstName, lastName, email',
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
      console.log(`[Enquiry API] Live test email override enabled for enquiry type ${body.type}`);
    }
    const liveTestArchivedAt = liveTestOverride ? new Date() : undefined;
    
    // 4. Get request metadata
    const ipAddress = getRequestIP(event, { xForwardedFor: true });
    const userAgent = getHeader(event, 'user-agent');
    const referer = getHeader(event, 'referer');
    const attribution = inferLeadAttribution({
      source: body.source || event.path,
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

    // 4b. Abuse controls (honeypot → rate limit → duplicate)
    if (isHoneypotTripped(body)) {
      return { success: true };
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
        source: liveTestOverride ? 'live-smoke-test' : body.source || event.path,
        department: body.department,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: phoneValidation.phone,
        postcode: body.postcode,
        message: body.message,
        vehicleStockId: body.vehicleInfo?.stockId,
        vehicleInfo: body.vehicleInfo ? body.vehicleInfo : undefined,
        tradeInInfo: body.tradeInInfo ? body.tradeInInfo : undefined,
        financeDetails: body.financeDetails ? body.financeDetails : undefined,
        sellCarDetails: body.sellCarDetails ? body.sellCarDetails : undefined,
        accessoriesCart: body.accessoriesCart ? body.accessoriesCart : undefined,
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
    
    // 6. Log activity
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
      console.error('[Enquiry API] Could not queue Dealer Studio export', exportError);
    }

    if (!liveTestOverride) {
      try {
        await emitEnquiryCreatedRealtimeEvent(enquiry, { source: 'enquiry-api' });
      } catch (realtimeError) {
        console.error('[Enquiry API] Realtime event failed:', realtimeError);
      }
    }
    
    // 7. Evaluate routing rules and send notifications
    try {
      const routingResult = await evaluateRoutingRules(enquiry, dealer);
      
      console.log('📋 Routing Result:', {
        matched_rules: routingResult.matched_rules,
        send_to: routingResult.send_to,
        assign_to: routingResult.assign_to,
        priority: routingResult.priority,
      });
      
      // Send email to staff
      if (routingResult.send_to.length > 0) {
        await sendEnquiryNotification(enquiry, dealer, routingResult.send_to, {
          cc: routingResult.cc,
          bcc: routingResult.bcc,
          priority: routingResult.priority,
          liveTestOverride,
        });
      }
      
      // Send confirmation to customer
      await sendCustomerConfirmation(enquiry, dealer, { liveTestOverride });
      
      // Auto-assign if specified
      if (routingResult.assign_to && !liveTestOverride) {
        await db.update(enquiries)
          .set({ 
            assignedTo: routingResult.assign_to,
            priority: routingResult.priority,
          })
          .where(eq(enquiries.id, enquiry.id));
        
        // Log assignment
        await db.insert(enquiryActivityLog).values({
          dealerId: dealer.id,
          enquiryId: enquiry.id,
          userId: routingResult.assign_to,
          action: 'assigned',
          entityType: 'enquiry',
          newValue: { assignedTo: routingResult.assign_to },
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the enquiry submission
      console.error('Email notification failed:', emailError);
    }
    
    // 8. Return success response
    return {
      success: true,
      enquiryId: enquiry.id,
      dealerName: dealer.name,
      message: 'Enquiry submitted successfully',
    };
    
  } catch (error: any) {
    console.error('[Enquiry API] Error:', error);
    
    // If it's already a createError, rethrow it
    if (error.statusCode) {
      throw error;
    }
    
    // Otherwise, return generic error
    throw createError({
      statusCode: 500,
      message: 'Failed to submit enquiry. Please try again.',
    });
  }
});


