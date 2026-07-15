import { and, asc, eq, inArray, isNull, lte, or } from 'drizzle-orm';
import {
  dealers,
  enquiries,
  enquiryActivityLog,
  leadExportDeliveries,
} from '../../database/schema';
import { db } from '../db';
import { createDealerStudioLead } from './client';
import { deliveryFailureUpdate, planDealerStudioQueue } from './deliveryPolicy';
import { buildDealerStudioLeadPayload } from './mapping';
import { readDealerStudioSettings } from './settings';

const PROVIDER = 'dealer_studio';

export async function queueDealerStudioExport(enquiry: Record<string, any>, dealer: Record<string, any>) {
  const settings = readDealerStudioSettings(dealer.settings);
  const plan = planDealerStudioQueue(enquiry, settings);
  if (plan.status === 'skipped') return { queued: false, status: 'skipped' as const };

  const [delivery] = await db.insert(leadExportDeliveries).values({
    dealerId: dealer.id,
    enquiryId: enquiry.id,
    provider: PROVIDER,
    status: plan.status,
    lastError: plan.error,
  }).onConflictDoNothing().returning({
    id: leadExportDeliveries.id,
    status: leadExportDeliveries.status,
  });

  return {
    queued: Boolean(delivery),
    status: delivery?.status || 'already_queued',
  };
}

export async function processDueDealerStudioExports(options: {
  dealerId?: string;
  enquiryId?: string;
  limit?: number;
  now?: Date;
} = {}) {
  const now = options.now || new Date();
  const conditions = [
    eq(leadExportDeliveries.provider, PROVIDER),
    or(
      eq(leadExportDeliveries.status, 'pending'),
      and(
        eq(leadExportDeliveries.status, 'failed_retryable'),
        or(isNull(leadExportDeliveries.nextAttemptAt), lte(leadExportDeliveries.nextAttemptAt, now)),
      ),
    )!,
  ];
  if (options.dealerId) conditions.push(eq(leadExportDeliveries.dealerId, options.dealerId));
  if (options.enquiryId) conditions.push(eq(leadExportDeliveries.enquiryId, options.enquiryId));

  const due = await db.select({ id: leadExportDeliveries.id })
    .from(leadExportDeliveries)
    .where(and(...conditions))
    .orderBy(asc(leadExportDeliveries.createdAt))
    .limit(Math.min(Math.max(options.limit || 25, 1), 100));

  const results = [];
  for (const row of due) results.push(await processDealerStudioDelivery(row.id));
  return results;
}

export async function processDealerStudioDelivery(deliveryId: string) {
  const now = new Date();
  const [claimed] = await db.update(leadExportDeliveries)
    .set({ status: 'sending', lastAttemptAt: now, updatedAt: now })
    .where(and(
      eq(leadExportDeliveries.id, deliveryId),
      inArray(leadExportDeliveries.status, ['pending', 'failed_retryable']),
    ))
    .returning();

  if (!claimed) return { id: deliveryId, status: 'not_claimed' as const };

  const [record] = await db.select({
    delivery: leadExportDeliveries,
    enquiry: enquiries,
    dealer: dealers,
  })
    .from(leadExportDeliveries)
    .innerJoin(enquiries, eq(enquiries.id, leadExportDeliveries.enquiryId))
    .innerJoin(dealers, eq(dealers.id, leadExportDeliveries.dealerId))
    .where(eq(leadExportDeliveries.id, deliveryId))
    .limit(1);

  if (!record) return { id: deliveryId, status: 'missing' as const };
  const settings = readDealerStudioSettings(record.dealer.settings);
  const mapped = buildDealerStudioLeadPayload(record.enquiry as any, settings);
  const attempts = claimed.attempts + 1;

  if (!settings.enabled) {
    const error = 'Dealer Studio export is disabled';
    const status = 'failed_permanent';
    await db.update(leadExportDeliveries).set({
      status,
      attempts,
      lastError: error,
      nextAttemptAt: null,
      updatedAt: new Date(),
    }).where(eq(leadExportDeliveries.id, deliveryId));
    return { id: deliveryId, status, error };
  }

  if (!mapped.ok) {
    const error = mapped.errors.join('; ');
    const status = 'failed_validation';
    await db.update(leadExportDeliveries).set({
      status,
      attempts,
      lastError: error,
      nextAttemptAt: null,
      updatedAt: new Date(),
    }).where(eq(leadExportDeliveries.id, deliveryId));
    return { id: deliveryId, status, error };
  }

  const result = await createDealerStudioLead(process.env.DEALER_STUDIO_API_KEY || '', mapped.payload);
  if (!result.ok) {
    const failure = deliveryFailureUpdate(result, attempts, now);
    await db.update(leadExportDeliveries).set({
      ...failure,
      attempts,
      updatedAt: new Date(),
    }).where(eq(leadExportDeliveries.id, deliveryId));
    return { id: deliveryId, status: failure.status, error: failure.lastError };
  }

  await db.transaction(async (tx) => {
    await tx.update(leadExportDeliveries).set({
      status: 'synced',
      attempts,
      providerLeadId: String(result.leadId),
      providerClusterId: String(result.leadClusterId),
      lastHttpStatus: 201,
      lastError: null,
      nextAttemptAt: null,
      syncedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(leadExportDeliveries.id, deliveryId));

    await tx.update(enquiries).set({
      syncedToCrm: true,
      crmRef: String(result.leadId),
      updatedAt: new Date(),
    }).where(and(
      eq(enquiries.id, record.enquiry.id),
      eq(enquiries.dealerId, record.dealer.id),
    ));

    await tx.insert(enquiryActivityLog).values({
      dealerId: record.dealer.id,
      enquiryId: record.enquiry.id,
      action: 'Synced to Dealer Studio',
      entityType: 'crm',
      newValue: {
        provider: PROVIDER,
        leadId: result.leadId,
        leadClusterId: result.leadClusterId,
      },
    });
  });

  return {
    id: deliveryId,
    status: 'synced' as const,
    leadId: result.leadId,
    leadClusterId: result.leadClusterId,
  };
}

export async function resetDealerStudioDeliveryForRetry(dealerId: string, enquiryId: string) {
  const [delivery] = await db.update(leadExportDeliveries).set({
    status: 'pending',
    nextAttemptAt: null,
    lastError: null,
    updatedAt: new Date(),
  }).where(and(
    eq(leadExportDeliveries.provider, PROVIDER),
    eq(leadExportDeliveries.dealerId, dealerId),
    eq(leadExportDeliveries.enquiryId, enquiryId),
    inArray(leadExportDeliveries.status, ['failed_validation', 'failed_retryable', 'failed_permanent']),
  )).returning({ id: leadExportDeliveries.id });
  return delivery || null;
}
