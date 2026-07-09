import { eq } from 'drizzle-orm';
import { dealers, enquiries, enquiryActivityLog } from '../../database/schema';
import { db } from '../../utils/db';
import {
  extractEmailAddresses,
  findInboundLeadAddress,
  parseInboundLeadEmail,
} from '../../utils/leadIngestion/emailAddresses';
import { sanitizeIpAddress } from '../../utils/intakeValidation';
import { isDuplicateEnquiry } from '../../utils/intakeAbuse';
import { inferLeadAttribution } from '../../utils/metrics/attribution';
import { sendFormNotifications } from '../../utils/email';
import { ENQUIRY_STATUSES } from '~~/shared/constants/salesFunnel';
import { normalizeEnquiryType } from '~~/shared/constants/enquiryTypes';
import { emitEnquiryCreatedRealtimeEvent } from '../../utils/realtime/events';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const secret = config.inboundLeadWebhookSecret || process.env.INBOUND_LEAD_WEBHOOK_SECRET;
  if (!secret) {
    throw createError({ statusCode: 503, message: 'Inbound lead email webhook is not configured' });
  }

  const provided = getHeader(event, 'x-inbound-lead-secret') || getQuery(event).secret;
  if (provided !== secret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody<Record<string, any>>(event);
  const recipients = [
    ...extractEmailAddresses(body.to || body.recipient || body.envelope?.to),
    ...extractEmailAddresses(body.cc),
  ];
  if (!recipients.length) {
    throw createError({ statusCode: 422, message: 'Inbound email recipient is required' });
  }

  const activeDealers = await db
    .select()
    .from(dealers)
    .where(eq(dealers.isActive, true));

  const matched = activeDealers
    .map(dealer => ({
      dealer,
      address: findInboundLeadAddress(
        (dealer.settings as Record<string, any>) || {},
        recipients,
        config.inboundLeadEmailDomain || null,
      ),
    }))
    .find(row => row.address);

  if (!matched?.address) {
    throw createError({ statusCode: 404, message: 'Inbound lead address is not registered' });
  }

  const parsed = parseInboundLeadEmail(body);
  if (!parsed.customerEmail) {
    throw createError({ statusCode: 422, message: 'Inbound email did not include a customer email address' });
  }

  const messageId = String(body.messageId || body['Message-Id'] || body.headers?.['message-id'] || '').trim();
  const externalRef = messageId || `${matched.address.source}:${parsed.customerEmail}:${parsed.subject}`;

  const existing = await db.query.enquiries.findFirst({
    where: (table, { and, eq }) => and(eq(table.dealerId, matched.dealer.id), eq(table.externalRef, externalRef)),
    columns: { id: true },
  });
  if (existing) {
    return { success: true, duplicate: true, enquiryId: existing.id };
  }

  if (await isDuplicateEnquiry(matched.dealer.id, parsed.customerEmail)) {
    return { success: true, duplicate: true };
  }

  const source = matched.address.source;
  const attribution = inferLeadAttribution({
    source,
    utmSource: source,
    utmMedium: 'email',
    utmCampaign: `inbound_${source}`,
  });

  const [enquiry] = await db.insert(enquiries).values({
    dealerId: matched.dealer.id,
    type: normalizeEnquiryType(matched.address.enquiryType as any),
    source,
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    email: parsed.customerEmail,
    phone: parsed.phone || undefined,
    message: parsed.message,
    status: ENQUIRY_STATUSES.NEW_LEAD,
    priority: 'normal',
    externalRef,
    utmSource: source,
    utmMedium: 'email',
    utmCampaign: `inbound_${source}`,
    attributedPlatform: attribution.platform,
    attributedCampaignId: attribution.campaignId,
    attributedCampaignName: attribution.campaignName || `inbound_${source}`,
    attributionConfidence: attribution.confidence,
    attributionMethod: attribution.method,
    attributionMatchedAt: attribution.platform ? new Date() : undefined,
    attributionMeta: {
      ...(attribution.evidence || {}),
      inboundEmail: {
        source,
        label: matched.address.label,
        recipients,
        fromEmail: parsed.fromEmail,
        subject: parsed.subject,
      },
    },
    ipAddress: sanitizeIpAddress(getRequestIP(event, { xForwardedFor: true })) || undefined,
    userAgent: getHeader(event, 'user-agent') || undefined,
  }).returning();

  if (!enquiry) {
    throw createError({
      statusCode: 500,
      message: 'Failed to create inbound lead enquiry',
    });
  }

  await db.insert(enquiryActivityLog).values({
    dealerId: matched.dealer.id,
    enquiryId: enquiry.id,
    action: 'created',
    entityType: 'inbound_lead_email',
    newValue: {
      source,
      label: matched.address.label,
      customer: `${enquiry.firstName} ${enquiry.lastName}`,
      externalRef,
    },
  });

  try {
    await emitEnquiryCreatedRealtimeEvent(enquiry, { source: 'inbound-leads-email' });
  } catch (err) {
    console.error('[Inbound Lead Email] Realtime event failed:', err);
  }

  try {
    await sendFormNotifications(enquiry, matched.dealer);
  } catch (err) {
    console.error('[Inbound Lead Email] Notification failed:', err);
  }

  return { success: true, enquiryId: enquiry.id };
});
