# Inbound Lead Email Routing

This runbook documents how external lead provider emails are routed into the admin CRM.

## Shared inbound domain

Use `crm-leads.driveagent.io` as the shared inbound email domain for dealer lead ingestion.
This domain can be reused across dealers as long as each dealer receives unique local parts
before the `@`.

## Address format

Use this format:

```text
<dealer-slug>-<lead-source>@crm-leads.driveagent.io
```

Examples:

```text
bloods-hyundai-carsales@crm-leads.driveagent.io
bloods-hyundai-autotrader@crm-leads.driveagent.io
bloods-hyundai-hyundai-oem@crm-leads.driveagent.io
bloods-hyundai-meta-lead-ads@crm-leads.driveagent.io
```

For another dealer, keep the same domain and change only the dealer prefix:

```text
another-dealer-carsales@crm-leads.driveagent.io
another-dealer-meta-lead-ads@crm-leads.driveagent.io
```

The dealer prefix is required. It keeps each provider inbox globally unique and lets the
CRM identify which dealer should own the incoming enquiry.

## Current routing flow

1. Cloudflare Email Routing receives mail for `@crm-leads.driveagent.io`.
2. The `dealer-lead-email-router` Worker converts the raw email into JSON.
3. The Worker posts to `POST /api/inbound-leads/email` with `x-inbound-lead-secret`.
4. The webhook extracts the email recipient.
5. The webhook scans active dealers and compares the recipient against each dealer's
   registered inbound lead addresses in `dealers.settings.marketing.inboundLeadEmail`.
6. On a match, the webhook creates a normal admin CRM enquiry for the matched dealer.
7. The source is stored as the matching provider source, such as `carsales`,
   `autotrader`, `hyundai_oem`, `meta_lead_ads`, or `other`.

## Blood Hyundai setup

Blood Hyundai currently uses these source addresses:

```text
bloods-hyundai-carsales@crm-leads.driveagent.io
bloods-hyundai-autotrader@crm-leads.driveagent.io
bloods-hyundai-hyundai-oem@crm-leads.driveagent.io
bloods-hyundai-meta-lead-ads@crm-leads.driveagent.io
bloods-hyundai-other@crm-leads.driveagent.io
```

Admins can manage these from:

```text
/admin/settings/lead-sources
```

## Multi-tenant guidance

For dealers hosted in the same admin CRM database, the shared domain is enough. Register
the dealer-prefixed addresses against the correct dealer, and the webhook will match by
recipient address.

For dealers on a separate website, CRM, or database, do not point all mail blindly at a
single tenant-specific webhook. Use one of these patterns instead:

1. Preferred: route all inbound lead email through a central multi-tenant ingestion
   service that can identify the dealer by recipient address.
2. Alternative: teach the Cloudflare Worker to route by dealer prefix to different
   webhook URLs and secrets.

The current Worker binding uses one `INBOUND_LEAD_WEBHOOK_URL`. That is fine for a shared
multi-tenant CRM endpoint, but separate CRMs need central routing or per-prefix routing.

## Operational rules

- Always create the address in the admin before giving it to Carsales, Autotrader, OEM,
  Meta, or another provider.
- Keep the `INBOUND_LEAD_EMAIL_DOMAIN` runtime variable set to `crm-leads.driveagent.io`
  for sites using this shared domain.
- Keep `INBOUND_LEAD_WEBHOOK_SECRET` aligned between the Worker and the receiving app.
- Do not reuse the same local part for two dealers.
- Do not send test leads to dealer staff unless explicitly requested; use an internal
  test destination or controlled webhook test where possible.
