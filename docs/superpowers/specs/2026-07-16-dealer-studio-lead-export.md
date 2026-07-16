# Dealer Studio Lead Export — Implementation Spec

## Objective

Send every new, valid Bloods Hyundai enquiry to Dealer Studio without making
customer form success depend on the external API. Dealer administrators can
verify the connection, select the authorised dealership/location/assignee,
enable or disable export, inspect delivery health, and retry failed deliveries.

Phase one is one-way lead creation. Dealer Studio outcome webhooks and status
reconciliation are explicitly out of scope.

## Tech Stack and Commands

- Nuxt 4 / Nitro server routes, Vue 3 and TypeScript.
- PostgreSQL via Drizzle ORM.
- Tests: `node --import tsx --test test/dealer-studio-*.test.ts`.
- Type check: `npm run typecheck`.
- Build: `npm run build`.
- Full tests: `node --import tsx --test test/*.test.ts`.

## Project Structure

- `server/utils/dealerStudio/` — typed settings, payload mapping and fixed-host API client.
- `server/api/admin/integrations/dealer-studio/` — authenticated setup, test and retry APIs.
- `server/database/schema.ts` — durable delivery rows, encrypted credentials and audit metadata.
- `scripts/migrations/` — production migration applied by the existing build runner.
- `app/pages/admin/settings/dealer-studio.vue` — connection and delivery-health UI.
- `test/dealer-studio-*.test.ts` — mapping, validation, retry and UI contract tests.

## Contract and Code Style

All external responses are treated as untrusted and parsed before use. The API
host is a constant and cannot be supplied by an administrator.

```ts
type DealerStudioDeliveryStatus =
  | 'pending'
  | 'sending'
  | 'synced'
  | 'failed_validation'
  | 'failed_retryable'
  | 'failed_permanent';

interface DealerStudioSettings {
  enabled: boolean;
  dealershipId: number | null;
  dealershipSlug: string | null;
  locationId: number | null;
  defaultUserEmail: string | null;
}
```

Admin APIs never return the API key. Error responses expose actionable provider
status without returning request PII or credentials.

## Testing Strategy

- Pure unit tests for enquiry-category/source mapping and payload creation.
- Client tests with an injected `fetch` implementation for authentication,
  response parsing, timeouts and retry classification.
- Static UI contract tests for settings navigation, connection states and
  enquiry-level delivery visibility.
- Project typecheck/build and real-browser verification of the new admin route.

## Boundaries

- Always: persist the local enquiry first; queue export durably; tenant-scope
  admin APIs; validate settings and provider responses; redact secrets.
- Always: exclude archived live tests and duplicate/spam submissions.
- Ask first: enable historical backfill or two-way status synchronisation.
- Never: put the Dealer Studio key in `dealers.settings`, browser responses or logs.
- Never: invent missing phone/email values or mark a rejected lead as synced.

## Success Criteria

1. A configured dealer can test credentials and select only API-authorised
   dealerships, locations and users.
2. Enabling export queues all newly persisted website, API and inbound-email
   enquiries through one shared export function.
3. Valid leads are created with `POST /api/v1/leads`; lead and cluster IDs are
   recorded and the enquiry reports `syncedToCrm=true`.
4. Missing email/phone produces an actionable validation failure while retaining
   the local enquiry.
5. Recoverable transport/429/5xx failures remain retryable; 401/403/422 failures
   are permanent until configuration/data changes.
6. Admins can see connection state, pending/failed counts, the latest deliveries,
   and retry an eligible failed lead.
7. Customer confirmation remains owned by this app (`send_customer_email=false`).
8. No existing user changes in email settings or SendGrid files are modified.

## Known Provider Constraint

Dealer Studio does not document idempotency or rate limits. `provider_id` is set
to the local enquiry UUID for traceability, but ambiguous timeout retries remain
conservative until Dealer Studio confirms duplicate handling.

## Production Activation Runbook

1. Ask Dealer Studio for a least-privilege API key with `create:lead`, including
   the Bloods Hyundai production dealership and a Dealer Studio-provided test
   dealership for sandbox validation. Restrict each dealership to its required
   locations and intended users. If Dealer Studio IP allowlisting is enabled,
   confirm the production deployment's outbound access before go-live.
2. Add a dedicated, stable `DEALER_CREDENTIALS_ENCRYPTION_KEY` of at least 32
   random characters to the production application environment. This is the
   root used to encrypt admin-managed integration credentials and must be backed
   up and preserved across deploys. Do not rotate it without a credential
   re-encryption plan.
3. Add a separate high-entropy `DEALER_STUDIO_CRON_SECRET` to both the production
   application and Netlify scheduled-function environments. It remains
   hosting-managed because the external scheduler must possess it before calling
   the application. Never place it in dealer settings or browser-visible config.
4. Deploy the application and apply both
   `scripts/migrations/2026-07-16-dealer-studio-lead-export.sql` and
   `scripts/migrations/2026-07-16-dealer-integration-credentials.sql` through the
   existing migration runner.
5. Open `/admin/settings/dealer-studio`, paste the Dealer Studio API key into
   **API credential**, then choose **Save & verify key**. The key is verified for
   `create:lead`, encrypted and never returned to the browser after saving.
   `DEALER_STUDIO_API_KEY` may instead be set in the production environment as a
   deployment-wide fallback, but the tenant-scoped admin credential takes precedence.
6. Choose **Sandbox mode**, run **Test connection**, select the Dealer
   Studio-provided test dealership and location, confirm the destination, and
   save it. Sandbox mode forces automatic real-enquiry delivery off and cannot
   reuse the configured production dealership.
7. Choose **Send synthetic test lead**. Confirm the labelled `SANDBOX
   Integration Test` lead and returned lead ID exist in the test dealership.
   The payload is generated server-side, contains no customer data, and sets
   `send_customer_email=false`.
8. Return to **Production**, select the authorised production dealership and
   default location, optionally select a salesperson, then enable and save
   automatic lead delivery. Confirm scheduled delivery security is **Configured**.
9. Submit one clearly labelled end-to-end test enquiry with a unique email and
   phone. Confirm the same lead exists in the production Dealer Studio account
   and the admin enquiry displays its Dealer Studio lead ID as **Synced**.
10. Review **Needs attention** and recent delivery activity after activation.
   For an interrupted or timed-out delivery, check Dealer Studio for the local
   enquiry UUID/provider reference before using manual retry.
11. Before enabling real customer traffic, obtain the dealership's privacy and
   vendor-management sign-off for sharing lead data with Dealer Studio, including
   the customer notice/consent wording, access controls, retention and deletion.

Rollback is immediate and non-destructive: disable automatic lead delivery on
the settings page. Local enquiry capture continues, while already queued
deliveries remain visible for an operator to resolve. Historical backfill is not
performed automatically and requires a separate approved plan.
