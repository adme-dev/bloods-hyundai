// Tenant context is no longer set in middleware. The previous implementation
// issued `SET LOCAL` against the pool outside a transaction — a no-op that
// added one round-trip per admin request. Tenant isolation is enforced by
// explicit `dealer_id` WHERE clauses in handlers; `event.context.dealerId`
// is populated by the auth middleware. Reintroduce this only if real RLS
// policies are added (see withRlsTenantContext in server/utils/db.ts).
export default defineEventHandler(() => {});
