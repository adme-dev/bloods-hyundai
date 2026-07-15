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
- `server/database/schema.ts` — durable delivery rows and provider identifiers.
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
- Never: put the Dealer Studio key in `dealers.settings`, browser payloads or logs.
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
