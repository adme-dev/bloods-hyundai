# CRM Remediation — Design Spec

**Date:** 2026-07-08
**Branch:** `fix/crm-remediation`
**Source:** Full CRM audit (customers, enquiries, intake, tasks/notifications/analytics)
**Goal:** Bring the dealer CRM to enterprise production quality — fix all ~30 audited defects and complete the non-functional UI, verified by typecheck + unit tests + live drive on a throwaway Neon branch.

---

## 1. Context

The CRM is a multi-tenant (per-`dealerId`) Nuxt 3 app. Auth is enforced by `server/middleware/auth.ts` on all `/api/admin/*` routes; tenancy is enforced by explicit `dealer_id` WHERE clauses (no RLS). The audit found the structure complete but surfaced ~30 real defects concentrated in a few root causes:

1. **Split status vocabulary** — enquiry `status` is written three different ways (`'new'` at intake, `'in_progress'`/`'contacted'` in service flows, canonical `salesFunnel.ts` values via admin status changes) and the analytics dashboard queries a fourth, obsolete set (`new`/`in_progress`/`contacted`/`closed`). Breaks lead filtering, the status control, badges, and every conversion metric.
2. **`event.context.user.id` is always `undefined`** — the JWT payload (`server/utils/jwt.ts`) carries `userId`, not `id`; the middleware sets `context.userId` but ~15 handlers read `user.id`. Causes null attribution, 500s, and a dead self-lockout guard.
3. **Skipped tenancy checks** on specific write endpoints — IDOR on enquiry status/notes, task assignment/linking, and customer activities.
4. **Credential leak** — the full customer row (incl. `passwordHash`, `resetToken`) is written to the activity log and returned by the customer-detail API.
5. **Assorted correctness bugs** — customer pagination computed on a post-fetch page slice, notifications "mark one" marking all, routing rules read with the wrong property name, etc.
6. **Dead UI** — Edit Customer, Add Vehicle, bulk actions, and a paginated tasks endpoint with no page.

## 2. Non-goals (explicit scope boundaries)

- **Not** touching `serviceAppointments.status` — it is a separate column with its own valid vocabulary (`pending`/`confirmed`/`in_progress`). Only `enquiries.status` is being unified.
- **Not** introducing a third-party CAPTCHA vendor in this pass (needs account/keys/UX change). A clean seam is left for it.
- **Not** introducing Postgres RLS. Tenancy stays as explicit `dealer_id` WHERE clauses; the audit's concern is that specific endpoints *omit* them, which this fixes.
- **Not** reworking whether service enquiries belong in the sales funnel — out of scope; only vocabulary consistency is addressed.

## 3. Decomposition

Work is decomposed **by subsystem** (each workstream is one coherent pass over one area's files) with a shared foundation first. Execution order: **P0 → P1 → P2 → P3 → P4**. Each workstream is independently typechecked, unit-tested, live-driven, and committed.

### P0 — Foundations (cross-cutting; blocks all others)

- **Identity fix (root cause #2):** In `server/middleware/auth.ts`, set `id` as an alias of `userId` on the context user object in *both* the access-token and refresh-token branches. Additionally standardize the ~15 read sites to `event.context.userId` / `user.userId` for clarity. Belt-and-suspenders: the alias fixes behavior immediately; the standardization removes the fragile pattern. Also add `id` to the `JWTPayload` type or a context-user type so TS reflects reality.
  - Affected read sites (from audit): `enquiries/[id]/{status.patch,notes.post,archive.post,restore.post,snooze.post,unsnooze.post,crm.post}`, `notifications/index.get`, `notifications/read.post`, `settings/password.post`, `staff/index.post`, `staff/[id]/resend-invitation.post`, `media/upload.post`, `upload/logo.post`, `auth/me.get`, and the frontend guard `staff/index.vue` (self-lockout).
- **Status data migration (root cause #1):** A Drizzle migration that `UPDATE`s existing `enquiries` rows:

  | Legacy value | → Canonical | Notes |
  |---|---|---|
  | `new` | `new_lead` | all intake rows |
  | `in_progress` | `appointment_set` | service appt created from enquiry |
  | `contacted` | `appointment_set` | service booking confirmed |
  | `closed` | (none) | no rows exist; safety UPDATE only if found → maps to `sold` with a logged warning |

  Migration is idempotent (guards on the legacy value), and writes the pre-image of each changed row into `enquiry_activity_log` (`action: 'status_migrated'`, `oldValue`/`newValue`) so it is reversible. Applied and verified on a Neon branch before promotion.
- **Canonical guardrail:** Ensure `VALID_ENQUIRY_STATUSES` from `shared/constants/salesFunnel.ts` is the single source of truth. Add a small helper module for any legacy→canonical normalization needed transitionally, and a unit test asserting no writer emits a non-canonical value.

### P1 — Enquiries

- Align writers to canonical values (intake + service handled in P3/P0 migration; here: ensure admin flows are canonical — already are via `status.patch`).
- **Atomicity + `dealerId` (audit A/B):** `status.patch.ts` and `notes.post.ts` — wrap update + activity-log insert in a real transaction; supply the required `dealerId`; replace the non-existent `metadata` column write with `oldValue`/`newValue`.
- **IDOR (audit L/M):** add `eq(enquiries.dealerId, ...)` scoping to the `status.patch` update and verify enquiry ownership before `notes.post` insert.
- **Attribution:** activity-log/notes `userId` uses the P0-fixed id.
- **Status UI (audit D/E/F/H):** replace the 4-value dropdown in `enquiries/[id].vue` with the real 13-status set (grouped via `getSortedStatuses()`/`PIPELINE_STAGES`); fix `formatStatus`/`statusBadgeVariant` on list + detail pages to map canonical values; persist `lostReason`/`lostNotes` when status → `lost` (`status.patch.ts` already destructures `lostReason` but drops it).
- **Filters/UI polish (audit G/I + intake 2c):** wire the "Assigned" filter (read `query.assigned` in `enquiries/index.get.ts`), populate tab-count badges, add `sell_car` to the type filter dropdown, reset `filters.page` on filter change, case-insensitive search (`ilike`).

### P2 — Customers

- **Credential leak (audit 7 — CRITICAL):** stop writing the full row into `customerActivities.oldValue`; log only a whitelisted diff of changed fields. Independently, ensure the customer-detail response never serializes sensitive columns (explicit column selection on customer + on activity `oldValue`/`newValue`).
- **Pagination/filter/stats (audit 1/2/3):** rewrite `customers/index.get.ts` so lifecycle/risk/lastContact/hasVehicle/view filters and the `count(*)` run **in SQL** before limit/offset; stats (`atRisk`, `dueFollowups`) computed with aggregate queries, not over the page slice.
- **Validation:** dup-email PATCH → clean 409 (audit 6); reject `lifecycleStage` not in `VALID_LIFECYCLE_STAGES` (audit 4); remove the invalid `purchased` option from the UI and add the missing valid stages to create/filter dropdowns and `formatLifecycleStage`.
- **Search:** `ilike` (audit 5).
- **IDOR:** `activities.post.ts` verifies the customer belongs to the dealer before insert (audit 8).
- **Net-new UI:**
  - Wire **Edit Customer** — the `PATCH /customers/[id]` endpoint exists but has no caller; `[id].vue` must read `?edit=true`, drive an edit form, and call PATCH.
  - Build **Add Vehicle** — new `POST /api/admin/customers/[id]/vehicles` (writes `customerVehicles`, dealer-scoped) + a dialog mirroring the existing Add-Task dialog pattern.
  - Implement the stub buttons: `logCall`, `addNote`, `bulkAddTask`, `bulkUpdateStage` (wire to existing/added endpoints).

### P3 — Intake & routing

- **Canonical status at intake (audit 1a):** `submit-enquiry.post.ts`, `sell-my-car.post.ts`, `enquiry.post.ts` write `'new_lead'`; `service/appointments/index.post.ts` and `from-enquiry/[id].post.ts` write `'appointment_set'`.
- **Routing rules (audit 1b):** fix `server/utils/routing.ts:65` to read `dealer.routingRules` (Drizzle camelCase); confirm CRUD round-trips.
- **Department routing (audit 2a):** route website (`submit-enquiry`) enquiries through the department table / `evaluateRoutingRules` so service/parts/finance don't all collapse to one inbox.
- **Abuse controls (audit 3a):** honeypot field + per-(IP,email) time-window dedup + simple rate limit (edge-KV or in-memory), dependency-free. Leave a seam for CAPTCHA.
- **Email safety (audit 3c):** HTML-escape all user-supplied values interpolated into notification/confirmation emails in `server/utils/email.ts`.
- **`inet` safety (audit 3b):** validate/normalize `X-Forwarded-For` before insert; store `null` on invalid input rather than throwing and dropping the lead.
- **Type validation (audit 2d):** server-side validate `type` against the allowed set; add `fleet`/`special_offer` handling or document them as source-tagged (audit 2b).

### P4 — Tasks / Notifications / Analytics

- **Notifications:** `read.post.ts` honors the `ids` array (mark specific notifications read) instead of bumping `lastSeenNotificationsAt` globally (audit 5); fix the "assigned to you" heuristic so it doesn't fire on every edit (audit 6).
- **Tasks:** reconcile `overdue`/`dueToday` counting between `tasks/index.get.ts` and the dashboard (single shared definition); IDOR — validate `assignedTo`/`customerId`/`enquiryId` belong to the caller's dealer (audit 8/9).
- **Analytics (audit 1/2/3/4):** rewrite dashboard/overview status queries to canonical values; fix the pipeline-card key mismatch (API `pipeline` keys vs `admin/index.vue` `pipelineStatuses`); apply consistent `archivedAt` filtering across funnel/monthly/daily/source/testDrive queries.
- **Tasks list page:** build the page that consumes the orphan `tasks/index.get.ts` (list + filter + pagination + stats).

## 4. Verification & rollout

- **Per workstream:** `nuxt typecheck` clean; new vitest unit tests for pure logic (status normalization, pagination math, tenancy-guard helper, dedup, email escaping).
- **Live drive:** provision a **Neon branch** via the Neon MCP as a throwaway DB. Confirm reachability first. Run the P0 migration there, then exercise real endpoints (submit a lead → appears with `new_lead`; change status → persists + logs with correct user; load a customer → no secrets in payload; mark one notification read → only that one). If the branch DB is unreachable, fall back to typecheck+unit and explicitly flag what could not be driven live.
- **Migration safety:** idempotent, pre-image logged, applied to the Neon branch first; production promotion is left to the user.
- **Commits:** atomic per fix-group on `fix/crm-remediation`; each workstream verified before the next begins.

## 5. Risks & mitigations

- **Migration mis-maps historical leads** → the two judgment-call mappings both go to `appointment_set`; pre-image logged for reversal; run on Neon branch and eyeball a sample before promotion.
- **Standardizing 15 `user.id` sites introduces regressions** → the middleware alias makes behavior correct even if a site is missed; typecheck + tests catch shape issues.
- **Analytics query rewrite changes reported numbers** → expected (they were wrong/zero before); validated against known seed data on the Neon branch.
- **Dead-UI features expand scope** → they follow existing patterns (Add-Task dialog, existing PATCH endpoint) to minimize new surface; each is independently shippable and can be deferred if time-boxed.

## 6. Execution

Each workstream (P0–P4) becomes a section in the implementation plan produced by the writing-plans skill, with atomic tasks, per-task verification, and review checkpoints. P0 must complete and verify before P1–P4.
