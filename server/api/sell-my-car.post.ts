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
import { ENQUIRY_STATUSES } from '~~/shared/constants/salesFunnel';
import { sanitizeIpAddress } from '../utils/intakeValidation';
import { isHoneypotTripped, checkRateLimit, isDuplicateEnquiry } from '../utils/intakeAbuse';
import { inferLeadAttribution } from '../utils/metrics/attribution';
import { LIVE_TEST_EMAIL_SECRET_HEADER, resolveLiveTestEmailOverride } from '../utils/liveTestEmail';
import { queueDealerStudioExport } from '../utils/dealerStudio/delivery';
import { validateRequiredCustomerPhone } from '~~/shared/utils/customerPhone';

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

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    // 1. Resolve dealer from header first, then server-side config.
    const apiKey = getHeader(event, 'x-dealer-key') ||
      process.env.DEALER_API_KEY ||
      process.env.NUXT_PUBLIC_DEALER_API_KEY;

    let dealer;

    if (apiKey) {
      const [foundDealer] = await db
        .select()
        .from(dealers)
        .where(eq(dealers.apiKey, apiKey))
        .limit(1);

      dealer = foundDealer;
    }

    // Single-tenant fallback: keep public forms working even when the key is not exposed client-side.
    if (!dealer) {
      const [defaultDealer] = await db
        .select()
        .from(dealers)
        .where(eq(dealers.isActive, true))
        .limit(1);

      dealer = defaultDealer;
    }

    if (!dealer) {
      console.error('[Sell My Car API] No active dealer found');
      throw createError({
        statusCode: 500,
        message: 'Dealer not configured. Please contact support.',
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
      console.log('[Sell My Car API] Live test email override enabled');
    }
    const liveTestArchivedAt = liveTestOverride ? new Date() : undefined;

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
    const referer = getHeader(event, 'referer');
    const attribution = inferLeadAttribution({
      source: '/sell-my-car',
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
        source: liveTestOverride ? 'live-smoke-test' : '/sell-my-car',
        department: 'used-cars',
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: phoneValidation.phone,
        message: message,
        sellCarDetails: sellCarDetails,
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
        liveTest: Boolean(liveTestOverride),
      },
    });

    try {
      await queueDealerStudioExport(enquiry, dealer);
    } catch (exportError) {
      console.error('[Sell My Car] Could not queue Dealer Studio export', exportError);
    }

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
