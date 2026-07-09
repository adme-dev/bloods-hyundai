import { eq } from 'drizzle-orm';
import { db } from '../db';
import { realtimeEventOutbox } from '../../database/schema';
import {
  buildEnquiryCreatedRealtimeEvent,
  signRealtimePayload,
  type BuildEnquiryRealtimeOptions,
  type EnquiryRealtimeInput,
} from './contract';
import type { DealerRealtimeEvent } from '~~/shared/realtime/events';

const REALTIME_PUBLISH_TIMEOUT_MS = 3000;

export async function emitEnquiryCreatedRealtimeEvent(enquiry: EnquiryRealtimeInput, options: BuildEnquiryRealtimeOptions = {}) {
  const event = buildEnquiryCreatedRealtimeEvent(enquiry, options);
  return recordAndPublishRealtimeEvent(event);
}

type PublishResult =
  | { ok: true }
  | { ok: false; skipped?: boolean; error: string };

export async function recordAndPublishRealtimeEvent(event: DealerRealtimeEvent) {
  const [outboxRow] = await db.insert(realtimeEventOutbox).values({
    dealerId: event.dealerId,
    eventType: event.type,
    aggregateType: event.entity.type,
    aggregateId: event.entity.id,
    payload: event,
  }).returning({ id: realtimeEventOutbox.id });

  const outboxId = outboxRow?.id;
  const publishResult = await publishRealtimeEvent(event);

  if (!outboxId) return publishResult;

  if (publishResult.ok) {
    await db.update(realtimeEventOutbox)
      .set({
        status: 'published',
        attempts: 1,
        lastError: null,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(realtimeEventOutbox.id, outboxId));
    return publishResult;
  }

  if (publishResult.skipped) {
    await db.update(realtimeEventOutbox)
      .set({
        status: 'skipped',
        attempts: 0,
        lastError: publishResult.error.slice(0, 2000),
        updatedAt: new Date(),
      })
      .where(eq(realtimeEventOutbox.id, outboxId));
    return publishResult;
  }

  await db.update(realtimeEventOutbox)
    .set({
      status: 'failed',
      attempts: 1,
      lastError: publishResult.error?.slice(0, 2000) || 'Unknown publish failure',
      updatedAt: new Date(),
    })
    .where(eq(realtimeEventOutbox.id, outboxId));

  return publishResult;
}

async function publishRealtimeEvent(event: DealerRealtimeEvent): Promise<PublishResult> {
  const config = useRuntimeConfig();
  const enabled = String(config.realtimeEventsEnabled || process.env.REALTIME_EVENTS_ENABLED || '').toLowerCase() === 'true';
  const publishUrl = config.realtimePublishUrl || process.env.REALTIME_PUBLISH_URL || '';
  const publishSecret = config.realtimePublishSecret || process.env.REALTIME_PUBLISH_SECRET || '';

  if (!enabled) return { ok: false, skipped: true, error: 'Realtime publishing disabled' };
  if (!publishUrl || !publishSecret) return { ok: false, skipped: true, error: 'Realtime publish URL or secret not configured' };

  const body = JSON.stringify(event);
  const timestamp = String(Date.now());
  const signature = signRealtimePayload(publishSecret, timestamp, body);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REALTIME_PUBLISH_TIMEOUT_MS);

  try {
    const response = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-dealer-realtime-timestamp': timestamp,
        'x-dealer-realtime-signature': signature,
      },
      signal: controller.signal,
      body,
    });

    if (response.ok) return { ok: true };

    const detail = await response.text().catch(() => '');
    return { ok: false, error: `Realtime publish failed ${response.status}: ${detail.slice(0, 500)}` };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return { ok: false, error: `Realtime publish timed out after ${REALTIME_PUBLISH_TIMEOUT_MS}ms` };
    }
    return { ok: false, error: error?.message || 'Realtime publish request failed' };
  } finally {
    clearTimeout(timeout);
  }
}
