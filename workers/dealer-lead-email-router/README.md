# Dealer Lead Email Router

Cloudflare Email Routing Worker for dealer lead ingestion.

The Worker receives inbound mail from a Cloudflare Email Routing rule, converts the message metadata and raw MIME body into JSON, and posts it to the Nuxt admin CRM endpoint:

`POST /api/inbound-leads/email`

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
