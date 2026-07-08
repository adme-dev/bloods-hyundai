# CRM Remediation — Wave 1 (P0 Foundations + Credential Leak) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the cross-cutting foundations (broken user identity, split enquiry-status data) and the critical customer credential leak, so the rest of the remediation (P1–P4) builds on a correct base.

**Architecture:** Extract small pure helpers (`toContextUser`, `normalizeEnquiryStatus`, `logEnquiryActivity`, `pickSafeCustomer`/`redactActivityValue`) that are independently unit-tested with `node:test`, then wire them into the middleware and endpoints. Endpoint/DB wiring and the data migration are verified by `nuxt typecheck` plus a live drive against a throwaway Neon branch.

**Tech Stack:** Nuxt 3 / Nitro, Drizzle ORM (`drizzle-orm/neon-serverless`), Neon Postgres, `node:test` + `node:assert` run via `tsx`.

## Global Constraints

- Tenancy is enforced by explicit `dealer_id` WHERE clauses on every admin query — never rely on `withTenantContext` for isolation (it is a no-op; `server/utils/db.ts:31-39`).
- Canonical enquiry statuses are the 13 values in `shared/constants/salesFunnel.ts` (`VALID_ENQUIRY_STATUSES`). No code may write a value outside this set.
- `enquiry_activity_log.dealer_id` is `NOT NULL` — every activity-log insert must supply it.
- The JWT payload has `userId`, not `id` (`server/utils/jwt.ts:26-33`). Never read `event.context.user.id` without the alias from Task 1.
- Tests: `node:test`/`node:assert`, run with `npx tsx --test test/<file>.test.ts`. There is no vitest.
- Data migration is applied as a standalone SQL script via the Neon MCP `run_sql` (data-only; decoupled from the drizzle-kit schema-migration chain to avoid journal/snapshot fragility). Same script promotes to production later.
- Commit after every task. Branch: `fix/crm-remediation`.

---

### Task 1: Fix user identity — `toContextUser` alias + middleware wiring + standardize read sites

**Files:**
- Create: `server/utils/authContext.ts`
- Create: `test/crm-authcontext.test.ts`
- Modify: `server/middleware/auth.ts:28-30, 68-77`
- Modify (standardize `user.id` → `user.userId`): `server/api/admin/enquiries/[id]/{status.patch,notes.post,archive.post,restore.post,snooze.post,unsnooze.post,crm.post}.ts`, `server/api/admin/notifications/index.get.ts:85`, `server/api/admin/notifications/read.post.ts:36`, `server/api/admin/auth/me.get.ts:14`

**Interfaces:**
- Produces: `interface ContextUser extends JWTPayload { id: string }` and `toContextUser(payload: JWTPayload): ContextUser` — later tasks and all handlers read `event.context.user.userId` (canonical) and may also rely on `.id` being present.

- [ ] **Step 1: Write the failing test**

```ts
// test/crm-authcontext.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toContextUser } from '../server/utils/authContext.ts';

describe('toContextUser', () => {
  it('aliases userId to id and preserves the payload', () => {
    const u = toContextUser({
      userId: 'u-1', dealerId: 'd-1', email: 'a@b.com',
      role: 'sales', firstName: 'A', lastName: 'B',
    });
    assert.equal(u.id, 'u-1');
    assert.equal(u.userId, 'u-1');
    assert.equal(u.dealerId, 'd-1');
    assert.equal(u.role, 'sales');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test test/crm-authcontext.test.ts`
Expected: FAIL — cannot find module `../server/utils/authContext.ts`.

- [ ] **Step 3: Create the helper**

```ts
// server/utils/authContext.ts
import type { JWTPayload } from './jwt';

export interface ContextUser extends JWTPayload {
  /** Alias of userId. The JWT payload has no `id`; many handlers historically read `user.id`. */
  id: string;
}

export function toContextUser(payload: JWTPayload): ContextUser {
  return { ...payload, id: payload.userId };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test test/crm-authcontext.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Wire the helper into the middleware**

In `server/middleware/auth.ts`, import it and route both context assignments through it.

Access-token branch — replace lines 28-30:
```ts
      event.context.user = toContextUser(payload);
      event.context.userId = payload.userId;
      event.context.dealerId = payload.dealerId;
```
Refresh branch — replace the `event.context.user = { ... }` object (lines 68-75) with:
```ts
        event.context.user = toContextUser({
          userId: user.id,
          dealerId: user.dealerId,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        });
```
Add at top: `import { toContextUser } from '../utils/authContext';`

- [ ] **Step 6: Standardize the read sites to `user.userId`**

In each listed handler, replace `user.id` with `user.userId` (and `event.context.user.id`→`event.context.userId` where used). Example — `server/api/admin/enquiries/[id]/archive.post.ts:39`:
```ts
    userId: user.userId,
```
Do the same for `status.patch.ts:42`, `notes.post.ts:33,42`, `restore.post.ts:39`, `snooze.post.ts:72`, `unsnooze.post.ts:39`, `crm.post.ts:86`, `notifications/index.get.ts:85` (`eq(enquiries.assignedTo, user.userId)`), `notifications/read.post.ts:36` (`eq(users.id, user.userId)`), `auth/me.get.ts:14` (`id: user.userId`).
(The `.id` alias from Step 5 keeps any missed site correct; this step removes the fragile pattern.)

- [ ] **Step 7: Typecheck**

Run: `npx nuxt typecheck 2>&1 | grep -E "authContext|auth\.ts|archive|status\.patch|notes\.post|me\.get" || echo "no errors in touched files"`
Expected: no errors in the touched files.

- [ ] **Step 8: Commit**

```bash
git add server/utils/authContext.ts test/crm-authcontext.test.ts server/middleware/auth.ts server/api/admin/enquiries server/api/admin/notifications server/api/admin/auth/me.get.ts
git commit -m "fix(crm): correct user identity in request context (userId alias)"
```

---

### Task 2: Status normalization helper

**Files:**
- Modify: `shared/constants/salesFunnel.ts` (append after `LOST_REASON_LABELS`)
- Create: `test/crm-status-normalize.test.ts`

**Interfaces:**
- Produces: `LEGACY_STATUS_MAP: Record<string, EnquiryStatus>` and `normalizeEnquiryStatus(status: string): EnquiryStatus` — used by the migration script (Task 5) and by intake writers in P3.

- [ ] **Step 1: Write the failing test**

```ts
// test/crm-status-normalize.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeEnquiryStatus } from '../shared/constants/salesFunnel.ts';

describe('normalizeEnquiryStatus', () => {
  it('maps legacy values to canonical', () => {
    assert.equal(normalizeEnquiryStatus('new'), 'new_lead');
    assert.equal(normalizeEnquiryStatus('in_progress'), 'appointment_set');
    assert.equal(normalizeEnquiryStatus('contacted'), 'appointment_set');
    assert.equal(normalizeEnquiryStatus('closed'), 'sold');
  });
  it('passes canonical values through unchanged', () => {
    assert.equal(normalizeEnquiryStatus('negotiating'), 'negotiating');
    assert.equal(normalizeEnquiryStatus('sold'), 'sold');
  });
  it('falls back to new_lead for unknown values', () => {
    assert.equal(normalizeEnquiryStatus('garbage'), 'new_lead');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test test/crm-status-normalize.test.ts`
Expected: FAIL — `normalizeEnquiryStatus` is not exported.

- [ ] **Step 3: Append the helper to `shared/constants/salesFunnel.ts`**

```ts
// ============================================================================
// LEGACY STATUS NORMALIZATION (transitional — see Wave 1 migration)
// ============================================================================

export const LEGACY_STATUS_MAP: Record<string, EnquiryStatus> = {
  new: ENQUIRY_STATUSES.NEW_LEAD,
  in_progress: ENQUIRY_STATUSES.APPOINTMENT_SET,
  contacted: ENQUIRY_STATUSES.APPOINTMENT_SET,
  closed: ENQUIRY_STATUSES.SOLD,
};

export function normalizeEnquiryStatus(status: string): EnquiryStatus {
  if (VALID_ENQUIRY_STATUSES.includes(status as EnquiryStatus)) {
    return status as EnquiryStatus;
  }
  return LEGACY_STATUS_MAP[status] ?? ENQUIRY_STATUSES.NEW_LEAD;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test test/crm-status-normalize.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/constants/salesFunnel.ts test/crm-status-normalize.test.ts
git commit -m "feat(crm): add enquiry status normalization helper"
```

---

### Task 3: Shared enquiry activity-log helper (enforces dealerId + author)

**Files:**
- Create: `server/utils/enquiryActivity.ts`
- Create: `test/crm-enquiry-activity.test.ts`

**Interfaces:**
- Produces: `logEnquiryActivity(input: EnquiryActivityInput, tx?): Promise<void>` where `EnquiryActivityInput = { dealerId: string; enquiryId: string; userId: string | null; action: string; entityType?: string; oldValue?: unknown; newValue?: unknown }`. `dealerId` is required by the type, so no caller can omit it. Used by Task 4.

- [ ] **Step 1: Write the failing test** (verifies the row shape a caller must pass, via a fake insert client)

```ts
// test/crm-enquiry-activity.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildEnquiryActivityRow } from '../server/utils/enquiryActivity.ts';

describe('buildEnquiryActivityRow', () => {
  it('always includes dealerId and normalizes optional fields to null', () => {
    const row = buildEnquiryActivityRow({
      dealerId: 'd-1', enquiryId: 'e-1', userId: null, action: 'archived',
    });
    assert.equal(row.dealerId, 'd-1');
    assert.equal(row.enquiryId, 'e-1');
    assert.equal(row.userId, null);
    assert.equal(row.entityType, null);
    assert.equal(row.oldValue, null);
    assert.equal(row.newValue, null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test test/crm-enquiry-activity.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the helper** (pure row-builder + thin insert wrapper)

```ts
// server/utils/enquiryActivity.ts
import { db } from './db';
import { enquiryActivityLog } from '../database/schema';

export interface EnquiryActivityInput {
  dealerId: string;
  enquiryId: string;
  userId: string | null;
  action: string;
  entityType?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export function buildEnquiryActivityRow(input: EnquiryActivityInput) {
  return {
    dealerId: input.dealerId,
    enquiryId: input.enquiryId,
    userId: input.userId ?? null,
    action: input.action,
    entityType: input.entityType ?? null,
    oldValue: (input.oldValue ?? null) as any,
    newValue: (input.newValue ?? null) as any,
  };
}

export async function logEnquiryActivity(input: EnquiryActivityInput, tx: typeof db = db) {
  await tx.insert(enquiryActivityLog).values(buildEnquiryActivityRow(input));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test test/crm-enquiry-activity.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add server/utils/enquiryActivity.ts test/crm-enquiry-activity.test.ts
git commit -m "feat(crm): shared enquiry activity-log helper enforcing dealerId"
```

---

### Task 4: Fix `status.patch` and `notes.post` — atomic, dealer-scoped, correct log shape

**Files:**
- Modify: `server/api/admin/enquiries/[id]/status.patch.ts`
- Modify: `server/api/admin/enquiries/[id]/notes.post.ts`

**Interfaces:**
- Consumes: `logEnquiryActivity` (Task 3), `user.userId` (Task 1), `VALID_ENQUIRY_STATUSES` (existing).

- [ ] **Step 1: Rewrite `status.patch.ts` body** (transaction + dealerId scope on UPDATE + IDOR + lostReason persist + correct oldValue/newValue)

Replace the handler body (from `try {` through the end of the `withTenantContext` block) with:
```ts
  const current = await db.query.enquiries.findFirst({
    where: and(eq(enquiries.id, enquiryId!), eq(enquiries.dealerId, dealerId)),
    columns: { id: true, status: true },
  });
  if (!current) {
    throw createError({ statusCode: 404, message: 'Enquiry not found' });
  }

  try {
    await db.transaction(async (tx) => {
      const patch: Record<string, any> = { status, updatedAt: new Date() };
      if (status === 'lost') {
        patch.lostReason = lostReason ?? null;
        if (typeof body.lostNotes === 'string') patch.lostNotes = body.lostNotes;
      }
      await tx.update(enquiries).set(patch)
        .where(and(eq(enquiries.id, enquiryId!), eq(enquiries.dealerId, dealerId)));

      await logEnquiryActivity({
        dealerId, enquiryId: enquiryId!, userId: user.userId,
        action: `Status changed to ${status}`, entityType: 'status',
        oldValue: { status: current.status }, newValue: { status },
      }, tx);
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating enquiry status:', error);
    throw createError({ statusCode: 500, message: 'Failed to update enquiry status' });
  }
```
Update imports: add `and` to the drizzle import and `import { logEnquiryActivity } from '../../../../utils/enquiryActivity';`. Add `const dealerId = event.context.dealerId;` near the top (it already reads `user`). Remove the now-unused `withTenantContext` import if present.

- [ ] **Step 2: Rewrite `notes.post.ts`** (verify ownership + dealerId on log + correct author)

Replace the `withTenantContext` block with an ownership check + transaction:
```ts
  const dealerId = event.context.dealerId;
  const owning = await db.query.enquiries.findFirst({
    where: and(eq(enquiries.id, enquiryId!), eq(enquiries.dealerId, dealerId)),
    columns: { id: true },
  });
  if (!owning) {
    throw createError({ statusCode: 404, message: 'Enquiry not found' });
  }

  try {
    let newNote: any;
    await db.transaction(async (tx) => {
      const [note] = await tx.insert(enquiryNotes).values({
        enquiryId: enquiryId!, userId: user.userId, content: content.trim(),
      }).returning();
      newNote = note;
      await logEnquiryActivity({
        dealerId, enquiryId: enquiryId!, userId: user.userId, action: 'Added a note',
      }, tx);
    });
    return { success: true, note: newNote };
  } catch (error) {
    console.error('Error adding note:', error);
    throw createError({ statusCode: 500, message: 'Failed to add note' });
  }
```
Update imports: add `import { enquiries } from '../../../../database/schema';` (join the existing import), `import { and, eq } from 'drizzle-orm';`, `import { logEnquiryActivity } from '../../../../utils/enquiryActivity';`, and `import { db } from '../../../../utils/db';` (drop `withTenantContext`).

- [ ] **Step 3: Typecheck the two files**

Run: `npx nuxt typecheck 2>&1 | grep -E "status\.patch|notes\.post" || echo "clean"`
Expected: `clean`.

- [ ] **Step 4: Commit**

```bash
git add server/api/admin/enquiries/[id]/status.patch.ts server/api/admin/enquiries/[id]/notes.post.ts
git commit -m "fix(crm): atomic, dealer-scoped enquiry status/notes with correct audit log"
```

---

### Task 5: Enquiry-status data migration script (Neon branch, then prod)

**Files:**
- Create: `scripts/migrations/2026-07-08-normalize-enquiry-status.sql`

**Interfaces:**
- Consumes: mapping from Task 2 (`new→new_lead`, `in_progress→appointment_set`, `contacted→appointment_set`, `closed→sold`).

- [ ] **Step 1: Write the migration SQL** (pre-image snapshot into the audit log, then idempotent UPDATEs)

```sql
-- scripts/migrations/2026-07-08-normalize-enquiry-status.sql
-- Data-only migration. Idempotent: re-running matches no rows after the first pass.
-- Snapshots the pre-image into enquiry_activity_log for reversibility.

INSERT INTO "enquiry_activity_log" ("dealer_id", "enquiry_id", "action", "entity_type", "old_value", "new_value")
SELECT "dealer_id", "id", 'status_migrated', 'status',
       jsonb_build_object('status', "status"),
       jsonb_build_object('status', CASE "status"
         WHEN 'new' THEN 'new_lead'
         WHEN 'in_progress' THEN 'appointment_set'
         WHEN 'contacted' THEN 'appointment_set'
         WHEN 'closed' THEN 'sold'
       END)
FROM "enquiries"
WHERE "status" IN ('new', 'in_progress', 'contacted', 'closed');

UPDATE "enquiries" SET "status" = 'new_lead'        WHERE "status" = 'new';
UPDATE "enquiries" SET "status" = 'appointment_set' WHERE "status" = 'in_progress';
UPDATE "enquiries" SET "status" = 'appointment_set' WHERE "status" = 'contacted';
UPDATE "enquiries" SET "status" = 'sold'            WHERE "status" = 'closed';
```

- [ ] **Step 2: Provision a Neon branch and confirm reachability**

Use the Neon MCP: `list_projects` → `create_branch` (name `crm-remediation-verify`) → `get_connection_string`. If the MCP is unavailable, STOP and report that live-drive can't run; typecheck+unit still stand.

- [ ] **Step 3: Seed a legacy row and run the migration on the branch**

Via Neon MCP `run_sql` against the branch: insert one enquiry per legacy status (`new`,`in_progress`,`contacted`,`closed`) for a known dealer, then execute the script from Step 1.

- [ ] **Step 4: Verify**

Via `run_sql`:
```sql
SELECT status, count(*) FROM enquiries GROUP BY status;
SELECT count(*) FROM enquiry_activity_log WHERE action = 'status_migrated';
```
Expected: no rows remain in `('new','in_progress','contacted','closed')`; `status_migrated` count equals the number of seeded legacy rows.

- [ ] **Step 5: Commit**

```bash
git add scripts/migrations/2026-07-08-normalize-enquiry-status.sql
git commit -m "chore(crm): data migration normalizing legacy enquiry statuses"
```

---

### Task 6: Fix the customer credential leak (write-side diff + read-side sanitize)

**Files:**
- Create: `server/utils/customerSafe.ts`
- Create: `test/crm-customer-safe.test.ts`
- Modify: `server/api/admin/customers/[id].patch.ts:104-115`
- Modify: `server/api/admin/customers/[id].get.ts` (customer response + activities mapping)

**Interfaces:**
- Produces: `pickSafeCustomer(c)` (strips `passwordHash`,`resetToken`,`resetTokenExpiry`,`verificationToken`) and `redactActivityValue(v)` (same strip on a jsonb value). Used by both customer endpoints.

- [ ] **Step 1: Write the failing test**

```ts
// test/crm-customer-safe.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pickSafeCustomer, redactActivityValue } from '../server/utils/customerSafe.ts';

const SECRET = {
  id: 'c1', firstName: 'A', email: 'a@b.com',
  passwordHash: 'HASH', resetToken: 'RT', resetTokenExpiry: 'X', verificationToken: 'VT',
};

describe('customerSafe', () => {
  it('pickSafeCustomer strips all sensitive columns', () => {
    const s = pickSafeCustomer(SECRET) as Record<string, unknown>;
    assert.equal(s.firstName, 'A');
    for (const k of ['passwordHash','resetToken','resetTokenExpiry','verificationToken']) {
      assert.equal(k in s, false);
    }
  });
  it('redactActivityValue strips secrets from a jsonb object and passes through non-objects', () => {
    const r = redactActivityValue(SECRET) as Record<string, unknown>;
    assert.equal('passwordHash' in r, false);
    assert.equal(redactActivityValue(null), null);
    assert.equal(redactActivityValue('note'), 'note');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test test/crm-customer-safe.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the helper**

```ts
// server/utils/customerSafe.ts
const SENSITIVE = ['passwordHash', 'resetToken', 'resetTokenExpiry', 'verificationToken'] as const;

export function pickSafeCustomer<T extends Record<string, any>>(c: T | null | undefined) {
  if (!c) return c;
  const { passwordHash, resetToken, resetTokenExpiry, verificationToken, ...safe } = c;
  return safe;
}

export function redactActivityValue(v: unknown): unknown {
  if (!v || typeof v !== 'object') return v;
  const clone: Record<string, any> = { ...(v as Record<string, any>) };
  for (const k of SENSITIVE) if (k in clone) delete clone[k];
  return clone;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test test/crm-customer-safe.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Fix the write side in `[id].patch.ts`**

Replace the activity insert `oldValue`/`newValue` (lines 111-112) so `oldValue` is only the previous values of the fields actually being changed (never the full row):
```ts
    oldValue: Object.fromEntries(
      Object.keys(customerUpdates)
        .filter((k) => k !== 'updatedAt')
        .map((k) => [k, (existingCustomer as any)[k]]),
    ),
    newValue: { ...customerUpdates, retentionProfile: body.retentionProfile },
```
(None of the editable fields are sensitive, so the log is inherently clean; the read-side redaction in Step 6 covers any pre-existing rows.)

- [ ] **Step 6: Fix the read side in `[id].get.ts`**

Add `import { pickSafeCustomer, redactActivityValue } from '../../../utils/customerSafe';`. Wrap the fetched customer with `pickSafeCustomer(...)` before it is returned, and map activities so their jsonb values are redacted. In the final `return`, ensure the customer field is `pickSafeCustomer(customer)` and activities are:
```ts
    activities: activities.map((a) => ({
      ...a,
      oldValue: redactActivityValue(a.oldValue),
      newValue: redactActivityValue(a.newValue),
    })),
```

- [ ] **Step 7: Typecheck**

Run: `npx nuxt typecheck 2>&1 | grep -E "customerSafe|customers/\[id\]" || echo "clean"`
Expected: `clean`.

- [ ] **Step 8: Live-drive verification on the Neon branch**

With the app pointed at the Neon branch (`NEON_DATABASE_URL=<branch>`), PATCH a customer then GET it; confirm the response JSON contains no `passwordHash`/`resetToken` anywhere (including `activities[].oldValue`). If live drive is unavailable, rely on the unit tests + typecheck and flag it.

- [ ] **Step 9: Commit**

```bash
git add server/utils/customerSafe.ts test/crm-customer-safe.test.ts "server/api/admin/customers/[id].patch.ts" "server/api/admin/customers/[id].get.ts"
git commit -m "fix(crm): stop leaking customer password hash/reset tokens via activity log and API"
```

---

### Task 7: Wave 1 full verification

- [ ] **Step 1: Run all Wave 1 unit tests**

Run: `npx tsx --test test/crm-*.test.ts`
Expected: all PASS (authcontext, status-normalize, enquiry-activity, customer-safe).

- [ ] **Step 2: Full typecheck**

Run: `npx nuxt typecheck`
Expected: no new errors introduced by Wave 1 files (record any pre-existing unrelated errors).

- [ ] **Step 3: Live smoke on the Neon branch** (if reachable)

Submit a public enquiry → confirm it lands as `new_lead`; change its status via the admin endpoint → confirm it persists and the activity log row has the correct `dealer_id` and non-null `user_id`; load a customer → confirm no secrets in the payload.

- [ ] **Step 4: Clean up the Neon branch**

Neon MCP `delete_branch` for `crm-remediation-verify` once verification is recorded.

---

## Subsequent waves (separate plans, authored when Wave 1 lands)

- **Wave 2 — P1 Enquiries:** status dropdown/badges/`formatStatus`, lost-reason capture, assigned filter, tab badges, `sell_car` filter, `ilike` search, page reset. (`docs/superpowers/plans/…-wave2-enquiries.md`)
- **Wave 3 — P2 Customers:** pagination/filter/stats SQL rewrite, dup-email 409, `purchased` removal + lifecycle validation, activities IDOR, Edit Customer wiring, Add Vehicle endpoint+dialog, bulk actions.
- **Wave 4 — P3 Intake & routing:** canonical status at intake, `routingRules` fix, department routing, abuse controls, email HTML escaping, `inet` validation, type validation.
- **Wave 5 — P4 Tasks/Notifications/Analytics:** mark-one-read, assigned heuristic, overdue/dueToday reconciliation, task IDOR, pipeline-card shape, dashboard canonical queries + archived consistency, tasks list page.

## Self-Review Notes

- **Spec coverage (Wave 1 scope):** identity fix ✓ (T1), status migration ✓ (T2 helper + T5 data), canonical guardrail ✓ (T2 + tests), credential leak ✓ (T6). P1–P4 explicitly deferred to their own plans.
- **Placeholders:** none — every code step contains real code; every run step has a command + expected result.
- **Type consistency:** `toContextUser`/`ContextUser`, `normalizeEnquiryStatus`/`LEGACY_STATUS_MAP`, `logEnquiryActivity`/`buildEnquiryActivityRow`/`EnquiryActivityInput`, `pickSafeCustomer`/`redactActivityValue` used consistently across tasks.
- **Verification honesty:** pure helpers are unit-tested; endpoint/migration wiring is typecheck + live-drive (no fake unit tests around Nitro handlers).
