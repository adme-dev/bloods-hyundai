# Dealer Lead Email Router

Cloudflare Email Routing Worker for dealer lead ingestion.

The Worker receives inbound mail from a Cloudflare Email Routing rule, converts the message metadata and raw MIME body into JSON, and posts it to the Nuxt admin CRM endpoint:

`POST /api/inbound-leads/email`

For the full multi-tenant address pattern and dealer-prefix rules, see
`docs/ops/inbound-lead-email-routing.md`.

## Required bindings

- `INBOUND_LEAD_WEBHOOK_URL`: Full webhook URL, for example `https://bloodhyundai.com.au/api/inbound-leads/email`.
- `INBOUND_LEAD_WEBHOOK_SECRET`: Secret header shared with the Nuxt runtime config.

## Optional bindings

- `FALLBACK_FORWARD_TO`: Verified Cloudflare Email Routing destination address for failed 4xx deliveries.

## Cloudflare setup

1. Configure a dedicated inbound subdomain, for example `crm-leads.driveagent.io`, with Cloudflare Email Routing MX records.
2. Route the subdomain/catch-all to this Worker.
3. Set the Nuxt site env var `INBOUND_LEAD_EMAIL_DOMAIN` to the same subdomain.
4. Set the same secret value in Cloudflare as `INBOUND_LEAD_WEBHOOK_SECRET` and in Nuxt as `INBOUND_LEAD_WEBHOOK_SECRET`.

## Multi-tenant note

`crm-leads.driveagent.io` is intended to be a shared inbound domain. Use dealer-prefixed
local parts, for example `bloods-hyundai-carsales@crm-leads.driveagent.io`, so the CRM
can match the incoming recipient to the correct dealer and source.

The current Worker posts to one `INBOUND_LEAD_WEBHOOK_URL`. That is suitable when the
receiving app is the shared multi-tenant CRM. If different dealers use separate CRMs or
separate databases, route through a central ingestion endpoint or add Worker routing by
dealer prefix to different webhook URLs and secrets.
