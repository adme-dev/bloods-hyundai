# Live Lead Smoke Tests

Use this flow to test production lead capture, CRM insertion, realtime admin notifications and SendGrid delivery without emailing dealership inboxes.

## Environment

Set these Netlify production function environment variables:

- `ENQUIRY_LIVE_TEST_SECRET`: high-entropy shared secret used only for smoke tests.
- `ENQUIRY_LIVE_TEST_RECIPIENT`: internal recipient for redirected test emails, for example `paul@adme.net.au`.

## Request Header

Add this header to a live test submission:

```text
x-enquiry-live-test-secret: <ENQUIRY_LIVE_TEST_SECRET>
```

When the header is valid, all staff and customer emails for that submission are redirected to `ENQUIRY_LIVE_TEST_RECIPIENT`. Original `to`, `cc` and `bcc` recipients are suppressed and recorded in the email log metadata for audit.

If the header is missing, normal production delivery is unchanged. If the header is present but invalid or the environment is not configured, the endpoint returns `403` instead of falling back to dealer delivery.

## Suggested Payload Markers

Use a unique customer email alias and clear source/message values:

- `source`: `live-smoke-test`
- `utm_source`: `smoke_test`
- `utm_campaign`: `production-live-lead-smoke-test`
- `message`: `LIVE SMOKE TEST - safe to archive`

The CRM enquiry remains visible in admin so realtime and dashboard updates can be verified.
