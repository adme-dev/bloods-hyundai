# Dealer Realtime Events Worker

Cloudflare Worker for dealer-scoped admin live updates.

## Responsibilities

- Accept signed server-to-server events from the Nuxt app at `POST /publish`.
- Queue accepted events through Cloudflare Queues.
- Broadcast queued events to one Durable Object room per dealer.
- Hold admin dashboard WebSocket connections with Durable Object hibernation.

## Required Secrets

Set these in Cloudflare, not in source control:

- `REALTIME_PUBLISH_SECRET`: shared HMAC secret used by Nuxt server publishes.
- `REALTIME_INTERNAL_SECRET`: optional separate internal Worker-to-Durable-Object secret.
- `ADMIN_REALTIME_CLIENT_SECRET`: HMAC secret used for admin WebSocket client tokens.

## Nuxt Environment

Nuxt should be configured with:

- `REALTIME_EVENTS_ENABLED=true`
- `REALTIME_PUBLISH_URL=https://<worker-domain>/publish`
- `REALTIME_PUBLISH_SECRET=<same as Cloudflare REALTIME_PUBLISH_SECRET>`
- `NUXT_PUBLIC_ADMIN_REALTIME_URL=wss://<worker-domain>/ws`

Keep `REALTIME_EVENTS_ENABLED=false` until the Worker is deployed and health checked.
