import { buildDealerStudioLeadPayload } from './mapping';
import type {
  DealerStudioCreateResult,
  DealerStudioDeliveryStatus,
  DealerStudioSettings,
} from './types';

const MAX_AUTOMATIC_ATTEMPTS = 5;

export function planDealerStudioQueue(
  enquiry: Record<string, any>,
  settings: DealerStudioSettings,
): { status: 'pending' | 'failed_validation' | 'skipped'; error: string | null } {
  if (!settings.enabled || enquiry.archivedAt) return { status: 'skipped', error: null };
  const mapped = buildDealerStudioLeadPayload(enquiry as any, settings);
  if (!mapped.ok) return { status: 'failed_validation', error: mapped.errors.join('; ') };
  return { status: 'pending', error: null };
}

export function deliveryFailureUpdate(
  result: Exclude<DealerStudioCreateResult, { ok: true }>,
  attempts: number,
  now = new Date(),
): {
  status: DealerStudioDeliveryStatus;
  lastHttpStatus: number | null;
  lastError: string;
  nextAttemptAt: Date | null;
} {
  if (result.kind === 'retryable' && attempts < MAX_AUTOMATIC_ATTEMPTS) {
    const delayMs = (2 ** attempts) * 60_000;
    return {
      status: 'failed_retryable',
      lastHttpStatus: result.status,
      lastError: result.error,
      nextAttemptAt: new Date(now.getTime() + delayMs),
    };
  }

  const needsManualReview = result.kind === 'ambiguous';
  return {
    status: result.kind === 'validation' ? 'failed_validation' : 'failed_permanent',
    lastHttpStatus: result.status,
    lastError: needsManualReview
      ? `${result.error}. Manual review is required before retrying to avoid a duplicate lead.`
      : result.error,
    nextAttemptAt: null,
  };
}

