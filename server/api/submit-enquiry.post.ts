import { db } from '../utils/db';
import { dealers, enquiries, enquiryActivityLog } from '../database/schema';
import { eq } from 'drizzle-orm';
import { sendFormNotifications } from '../utils/email';

/**
 * Internal Enquiry Submission Endpoint
 * 
 * For submissions from the dealer's own website (no API key required).
 * Uses runtime config to identify the dealer.
 */

interface EnquirySubmission {
  type: 'contact' | 'finance' | 'vehicle' | 'sell_car' | 'test_drive' | 'parts' | 'service' | 'fleet' | 'accessories';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  postcode?: string;
  suburb?: string;
  state?: string;
  message?: string;
  source?: string;
  
  vehicleInfo?: {
    make?: string;
    model?: string;
    year?: number;
    variant?: string;
    stockId?: string;
    price?: number;
    condition?: string;
    vin?: string;
    colour?: string;
    registration?: string;
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
  
  testDrive?: boolean;
  financeInterest?: boolean;
  
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  
  try {
    // 1. Get dealer ID from runtime config or environment
    const dealerApiKey = config.dealerApiKey || process.env.DEALER_API_KEY;
    
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
    
    if (!body.type || !body.firstName || !body.lastName || !body.email) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: type, firstName, lastName, email',
      });
    }
    
    // 3. Get request metadata
    const ipAddress = getRequestIP(event, { xForwardedFor: true });
    const userAgent = getHeader(event, 'user-agent');
    const referer = getHeader(event, 'referer');
    
    // 4. Insert enquiry into database
    const [enquiry] = await db
      .insert(enquiries)
      .values({
        dealerId: dealer.id,
        type: body.type,
        source: body.source || referer || 'website',
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        postcode: body.postcode,
        suburb: body.suburb,
        state: body.state,
        message: body.message,
        vehicleStockId: body.vehicleInfo?.stockId,
        vehicleInfo: body.vehicleInfo || undefined,
        tradeInInfo: body.tradeIn || undefined,
        testDrive: body.testDrive || false,
        financeInterest: body.financeInterest || false,
        status: 'new',
        priority: 'normal',
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      })
      .returning();
    
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
      },
    });
    
    // 6. Send notifications based on form configuration
    try {
      await sendFormNotifications(enquiry, dealer);
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

