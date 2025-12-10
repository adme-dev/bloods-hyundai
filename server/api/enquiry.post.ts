import { db } from '../utils/db';
import { dealers, enquiries, enquiryActivityLog } from '../database/schema';
import { eq } from 'drizzle-orm';
import { evaluateRoutingRules } from '../utils/routing';
import { sendEnquiryNotification, sendCustomerConfirmation } from '../utils/email';

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
  
  // Optional fields
  source?: string;
  department?: string;
  phone?: string;
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
}

export default defineEventHandler(async (event) => {
  try {
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
    
    // 4. Get request metadata
    const ipAddress = getRequestIP(event, { xForwardedFor: true });
    const userAgent = getHeader(event, 'user-agent');
    
    // 5. Insert enquiry into database
    const [enquiry] = await db
      .insert(enquiries)
      .values({
        dealerId: dealer.id,
        type: body.type,
        source: body.source || event.path,
        department: body.department,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        postcode: body.postcode,
        message: body.message,
        vehicleStockId: body.vehicleInfo?.stockId,
        vehicleInfo: body.vehicleInfo ? body.vehicleInfo : undefined,
        tradeInInfo: body.tradeInInfo ? body.tradeInInfo : undefined,
        financeDetails: body.financeDetails ? body.financeDetails : undefined,
        sellCarDetails: body.sellCarDetails ? body.sellCarDetails : undefined,
        accessoriesCart: body.accessoriesCart ? body.accessoriesCart : undefined,
        status: 'new',
        priority: 'normal',
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      })
      .returning();
    
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
      },
    });
    
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
        });
      }
      
      // Send confirmation to customer
      await sendCustomerConfirmation(enquiry, dealer);
      
      // Auto-assign if specified
      if (routingResult.assign_to) {
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


