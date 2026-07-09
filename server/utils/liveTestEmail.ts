import { timingSafeEqual } from 'node:crypto';

export const LIVE_TEST_EMAIL_SECRET_HEADER = 'x-enquiry-live-test-secret';

export interface LiveTestEmailOverride {
  recipient: string;
  requestedAt: string;
}

export type LiveTestEmailOverrideResult =
  | { ok: true; override: LiveTestEmailOverride | null }
  | { ok: false; message: string };

interface ResolveLiveTestEmailOverrideInput {
  configuredSecret?: string | null;
  configuredRecipient?: string | null;
  providedSecret?: string | null;
  requestedAt?: string;
}

export function resolveLiveTestEmailOverride(input: ResolveLiveTestEmailOverrideInput): LiveTestEmailOverrideResult {
  const providedSecret = input.providedSecret?.trim() || '';
  if (!providedSecret) return { ok: true, override: null };

  const configuredSecret = input.configuredSecret?.trim() || '';
  const recipient = normalizeEmail(input.configuredRecipient);

  if (!configuredSecret || !recipient) {
    return { ok: false, message: 'Live test email override is not configured' };
  }

  if (!constantTimeStringEqual(providedSecret, configuredSecret)) {
    return { ok: false, message: 'Invalid live test secret' };
  }

  return {
    ok: true,
    override: {
      recipient,
      requestedAt: input.requestedAt || new Date().toISOString(),
    },
  };
}

function normalizeEmail(value?: string | null): string | null {
  const email = value?.trim().toLowerCase() || '';
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function constantTimeStringEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
