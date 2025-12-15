/**
 * Sell My Car Form Submission Endpoint
 * POST /api/sell-my-car
 *
 * Accepts sell-my-car form submissions and stores in CRM.
 * Images should already be uploaded to R2 - this receives the URLs.
 *
 * Authentication: X-Dealer-Key header
 */

import { db } from '../utils/db';
import { dealers, enquiries, enquiryActivityLog } from '../database/schema';
import { eq } from 'drizzle-orm';
import { evaluateRoutingRules } from '../utils/routing';
import { sendEnquiryNotification, sendCustomerConfirmation } from '../utils/email';

interface SellMyCarSubmission {
  // Personal details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Vehicle details
  year: string;
  make: string;
  model: string;
  grade: string;
  vin?: string;
  registration: string;
  odometer: string;
  condition: 'excellent' | 'average' | 'poor';
  tyreCondition: 'excellent' | 'average' | 'poor';
  serviceHistory: 'yes' | 'no';
  oneOwner: 'yes' | 'no';

  // Photos (R2 URLs)
  photos: string[];

  // Additional info
  hasHailDamage: boolean;
  hailDamageDetails?: string;
  hasFinance: boolean;
  financeDetails?: string;
  hasKnownFaults: boolean;
  knownFaultsDetails?: string;
  accessories?: string;
  comments?: string;

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
    const body = await readBody<SellMyCarSubmission>(event);

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'year', 'make', 'model', 'grade', 'registration', 'odometer', 'condition', 'tyreCondition', 'serviceHistory', 'oneOwner'];
    const missingFields = requiredFields.filter(field => !body[field as keyof SellMyCarSubmission]);

    if (missingFields.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Validate at least one photo
    if (!body.photos || body.photos.length === 0 || !body.photos[0]) {
      throw createError({
        statusCode: 400,
        message: 'At least one vehicle photo is required',
      });
    }

    // 4. Get request metadata
    const ipAddress = getRequestIP(event, { xForwardedFor: true });
    const userAgent = getHeader(event, 'user-agent');

    // 5. Build sellCarDetails object
    const sellCarDetails = {
      year: body.year,
      make: body.make,
      model: body.model,
      grade: body.grade,
      vin: body.vin,
      rego: body.registration,
      odometer: parseInt(body.odometer) || 0,
      condition: body.condition,
      tyreCondition: body.tyreCondition,
      serviceHistory: body.serviceHistory === 'yes',
      oneOwner: body.oneOwner === 'yes',
      photos: body.photos.filter(Boolean), // Filter out empty strings
      hasHailDamage: body.hasHailDamage,
      hailDamageDetails: body.hailDamageDetails,
      hasFinance: body.hasFinance,
      financeDetails: body.financeDetails,
      hasKnownFaults: body.hasKnownFaults,
      knownFaultsDetails: body.knownFaultsDetails,
      accessories: body.accessories,
    };

    // 6. Build the message for the enquiry
    const messageParts: string[] = [];

    messageParts.push(`Vehicle: ${body.year} ${body.make} ${body.model} ${body.grade}`);
    messageParts.push(`Registration: ${body.registration}`);
    messageParts.push(`Odometer: ${body.odometer} km`);
    messageParts.push(`Condition: ${body.condition}`);
    messageParts.push(`Tyre Condition: ${body.tyreCondition}`);
    messageParts.push(`Full Service History: ${body.serviceHistory === 'yes' ? 'Yes' : 'No'}`);
    messageParts.push(`One Owner: ${body.oneOwner === 'yes' ? 'Yes' : 'No'}`);

    if (body.vin) {
      messageParts.push(`VIN: ${body.vin}`);
    }

    if (body.hasHailDamage) {
      messageParts.push(`⚠️ Has Hail Damage: ${body.hailDamageDetails || 'Yes'}`);
    }

    if (body.hasFinance) {
      messageParts.push(`⚠️ Finance Owing: ${body.financeDetails || 'Yes'}`);
    }

    if (body.hasKnownFaults) {
      messageParts.push(`⚠️ Known Faults: ${body.knownFaultsDetails || 'Yes'}`);
    }

    if (body.accessories) {
      messageParts.push(`Accessories: ${body.accessories}`);
    }

    if (body.comments) {
      messageParts.push(`Additional Comments: ${body.comments}`);
    }

    messageParts.push(`\nPhotos: ${sellCarDetails.photos.length} uploaded`);

    const message = messageParts.join('\n');

    // 7. Insert enquiry into database
    const [enquiry] = await db
      .insert(enquiries)
      .values({
        dealerId: dealer.id,
        type: 'sell_car',
        source: '/sell-my-car',
        department: 'used-cars',
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        message: message,
        sellCarDetails: sellCarDetails,
        status: 'new',
        priority: 'normal',
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      })
      .returning();

    // 8. Log activity
    await db.insert(enquiryActivityLog).values({
      dealerId: dealer.id,
      enquiryId: enquiry.id,
      action: 'created',
      entityType: 'enquiry',
      newValue: {
        type: 'sell_car',
        status: enquiry.status,
        customer: `${enquiry.firstName} ${enquiry.lastName}`,
        vehicle: `${body.year} ${body.make} ${body.model}`,
        photosCount: sellCarDetails.photos.length,
      },
    });

    // 9. Evaluate routing rules and send notifications
    try {
      const routingResult = await evaluateRoutingRules(enquiry, dealer);

      console.log('📋 [Sell My Car] Routing Result:', {
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
      console.error('[Sell My Car] Email notification failed:', emailError);
    }

    // 10. Return success response
    return {
      success: true,
      enquiryId: enquiry.id,
      dealerName: dealer.name,
      message: 'Your vehicle submission has been received. We will review and contact you within 24-48 hours.',
    };

  } catch (error: any) {
    console.error('[Sell My Car API] Error:', error);

    // If it's already a createError, rethrow it
    if (error.statusCode) {
      throw error;
    }

    // Otherwise, return generic error
    throw createError({
      statusCode: 500,
      message: 'Failed to submit vehicle. Please try again.',
    });
  }
});
