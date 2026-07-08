import { enquiries } from '../database/schema';
import { and, eq, gt } from 'drizzle-orm';

/**
 * Lightweight, dependency-free abuse controls for the public intake endpoints.
 * A CAPTCHA can be layered on later; these stop scripted floods and double
 * submits without any third-party dependency.
 */

// --- Honeypot ------------------------------------------------------------

/**
 * True when a hidden honeypot field was filled — a real user never sees it,
 * but naive bots auto-fill common field names. Forms should render a visually
 * hidden `website` (or `_hp`) input; the seam works even before they do.
 */
export function isHoneypotTripped(body: any): boolean {
  const hp = body?.website ?? body?._hp;
  return typeof hp === 'string' && hp.trim().length > 0;
}

// --- Rate limiting (in-memory sliding window) ----------------------------

const RATE_LIMIT = 8; // max submissions per key per window
const RATE_WINDOW_MS = 10 * 60_000; // 10 minutes
const hits = new Map<string, number[]>();

/**
 * Returns false when `key` has exceeded RATE_LIMIT within the window.
 * Best-effort in serverless (per-instance memory); pass `now` for testability.
 */
export function checkRateLimit(key: string, now: number): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

// --- Duplicate detection (DB, robust across instances) -------------------

const DEDUP_WINDOW_MS = 2 * 60_000; // 2 minutes

/**
 * True when the same dealer/email produced an enquiry within the dedup window
 * — catches double-clicks and identical spam bursts across serverless instances.
 */
export async function isDuplicateEnquiry(dealerId: string, email: string): Promise<boolean> {
  if (!email) return false;
  const { db } = await import('./db');
  const since = new Date(Date.now() - DEDUP_WINDOW_MS);
  const recent = await db.query.enquiries.findFirst({
    where: and(
      eq(enquiries.dealerId, dealerId),
      eq(enquiries.email, email),
      gt(enquiries.createdAt, since),
    ),
    columns: { id: true },
  });
  return Boolean(recent);
}
