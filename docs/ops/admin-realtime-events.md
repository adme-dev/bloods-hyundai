# Admin Realtime Events

This document tracks the Cloudflare-backed realtime update plan for admin enquiries and dashboard metrics.

## Goal

Replace high-frequency admin polling with dealer-scoped live events while keeping Neon as the CRM source of truth.

## Architecture

```text
Nuxt enquiry write
  -> Neon enquiry row
  -> realtime_event_outbox row
  -> signed POST to Cloudflare Worker /publish
  -> Cloudflare Queue
  -> Durable Object room keyed by dealerId
  -> admin WebSocket clients
```

## Progress Checklist

- [x] Define `DealerRealtimeEvent` contract.
- [x] Add `realtime_event_outbox` table and Drizzle schema.
- [x] Add Nuxt realtime helper with HMAC-signed publish requests.
- [x] Emit `enquiry.created` from website, API-key, and inbound email lead paths.
- [x] Add Cloudflare Worker skeleton with `/publish`, Queue consumer, and dealer Durable Object rooms.
- [x] Add authenticated Nuxt admin token endpoint.
- [x] Mount one admin realtime connection in the admin layout.
- [x] Update notification bell and dashboard refresh from realtime events.
- [x] Add Nuxt publish timeout so lead creation is not blocked by realtime delivery.
- [x] Add Worker publish payload cap and signed-request boundary tests.
- [x] Add pure event contract and HMAC signing tests.
- [ ] Deploy Cloudflare Worker and queue.
- [ ] Apply database migration to production Neon.
- [ ] Add production secrets and URLs.
- [ ] Enable `REALTIME_EVENTS_ENABLED=true` for Blood Hyundai.
- [ ] Verify live enquiry notification in production.
- [ ] Reduce fallback notification polling after live events are proven.

## Required Cloudflare Secrets

Set these on `dealer-realtime-events`:

- `REALTIME_PUBLISH_SECRET`
- `REALTIME_INTERNAL_SECRET`
- `ADMIN_REALTIME_CLIENT_SECRET`

Use different values for each secret in production.

## Required Nuxt Environment

Set these in the site environment:

- `REALTIME_EVENTS_ENABLED=false` initially, then `true` after verification.
- `REALTIME_PUBLISH_URL=https://<dealer-realtime-events-worker-domain>/publish`
- `REALTIME_PUBLISH_SECRET=<Cloudflare REALTIME_PUBLISH_SECRET>`
- `REALTIME_CLIENT_SECRET=<Cloudflare ADMIN_REALTIME_CLIENT_SECRET>`
- `NUXT_PUBLIC_ADMIN_REALTIME_URL=wss://<dealer-realtime-events-worker-domain>/ws`

## Verification

1. Deploy Worker.
2. Check `GET /health` returns `{ "ok": true }`.
3. Enable the Nuxt env vars with `REALTIME_EVENTS_ENABLED=false`.
4. Apply `drizzle/0005_realtime_event_outbox.sql`.
5. Submit a website enquiry and confirm an outbox row is written with `status='skipped'`.
6. Enable `REALTIME_EVENTS_ENABLED=true`.
7. Open admin dashboard in two browser tabs.
8. Submit another enquiry.
9. Confirm both tabs receive a notification without manual refresh.

## Local Verification Run

- `node --test test/realtime-event-contract.test.ts test/dealer-realtime-worker.test.ts`
- `npm run typecheck`
- `npm run build`
- `npm audit --audit-level=high`

The full `node --test test/*.test.ts` command currently fails on existing module-resolution issues in unrelated tests that import extensionless local TypeScript modules directly under Node.

## Rollback

Set `REALTIME_EVENTS_ENABLED=false`.

Existing polling stays in place, so disabling realtime publishing reverts admin updates to the previous polling behaviour.
