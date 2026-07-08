import { db } from '../../../utils/db';
import { customers, customerRetentionProfiles, customerVehicles } from '../../../database/schema';
import {
  eq, desc, and, or, sql, isNull, lt, gte, ilike, inArray, exists, notExists, getTableColumns,
} from 'drizzle-orm';
import { pickSafeCustomer } from '../../../utils/customerSafe';

export default defineEventHandler(async (event) => {
  const dealerId = event.context.dealerId;
  const query = getQuery(event);

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  // Join predicate for the retention profile (one per customer, dealer-scoped).
  const rpJoin = and(
    eq(customerRetentionProfiles.customerId, customers.id),
    eq(customerRetentionProfiles.dealerId, dealerId),
  );

  // Base scope + all secondary filters run in SQL so pagination and counts are
  // correct across the whole result set (not just the current page).
  const conditions = [eq(customers.dealerId, dealerId), eq(customers.isActive, true)];

  if (query.search) {
    const searchTerm = `%${query.search}%`;
    conditions.push(
      or(
        ilike(customers.firstName, searchTerm),
        ilike(customers.lastName, searchTerm),
        ilike(customers.email, searchTerm),
        ilike(customers.phone, searchTerm),
      )!,
    );
  }

  if (query.lifecycleStage) {
    conditions.push(eq(customerRetentionProfiles.lifecycleStage, query.lifecycleStage as string));
  }

  if (query.riskLevel) {
    conditions.push(eq(customerRetentionProfiles.riskLevel, query.riskLevel as string));
  }

  if (query.lastContact === '7d') {
    conditions.push(gte(customerRetentionProfiles.lastContactDate, daysAgo(7)));
  } else if (query.lastContact === '30d') {
    conditions.push(gte(customerRetentionProfiles.lastContactDate, daysAgo(30)));
  } else if (query.lastContact === '90d') {
    conditions.push(gte(customerRetentionProfiles.lastContactDate, daysAgo(90)));
  } else if (query.lastContact === 'overdue') {
    conditions.push(or(isNull(customerRetentionProfiles.lastContactDate), lt(customerRetentionProfiles.lastContactDate, daysAgo(30)))!);
  }

  if (query.hasVehicle) {
    const vehicleExists = exists(
      db.select({ one: sql`1` }).from(customerVehicles).where(
        and(eq(customerVehicles.customerId, customers.id), eq(customerVehicles.isActive, true)),
      ),
    );
    const vehicleNotExists = notExists(
      db.select({ one: sql`1` }).from(customerVehicles).where(
        and(eq(customerVehicles.customerId, customers.id), eq(customerVehicles.isActive, true)),
      ),
    );
    conditions.push(query.hasVehicle === 'yes' ? vehicleExists : vehicleNotExists);
  }

  const view = (query.view as string) || 'all';
  if (view === 'at_risk') {
    conditions.push(inArray(customerRetentionProfiles.riskLevel, ['high', 'critical']));
  } else if (view === 'due_followup') {
    conditions.push(or(isNull(customerRetentionProfiles.lastContactDate), lt(customerRetentionProfiles.lastContactDate, daysAgo(30)))!);
  }

  // Pagination with security limit to prevent DoS
  const MAX_LIMIT = 100;
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit as string) || 20));
  const offset = (page - 1) * limit;

  // Page of customers + their retention profile (left join so profile-less
  // customers still appear when no profile filter is active).
  const rows = await db
    .select({
      customer: getTableColumns(customers),
      retentionProfile: getTableColumns(customerRetentionProfiles),
    })
    .from(customers)
    .leftJoin(customerRetentionProfiles, rpJoin)
    .where(and(...conditions))
    .orderBy(desc(customers.createdAt))
    .limit(limit)
    .offset(offset);

  // Attach up to 3 active vehicles per customer on this page.
  const pageIds = rows.map((r) => r.customer.id);
  let vehiclesByCustomer = new Map<string, any[]>();
  if (pageIds.length > 0) {
    const vehicles = await db.query.customerVehicles.findMany({
      where: and(
        eq(customerVehicles.dealerId, dealerId),
        eq(customerVehicles.isActive, true),
        inArray(customerVehicles.customerId, pageIds),
      ),
      orderBy: [desc(customerVehicles.createdAt)],
    });
    for (const v of vehicles) {
      if (!v.customerId) continue;
      const list = vehiclesByCustomer.get(v.customerId) ?? [];
      if (list.length < 3) list.push(v);
      vehiclesByCustomer.set(v.customerId, list);
    }
  }

  const customersOut = rows.map((r) => ({
    ...pickSafeCustomer(r.customer),
    retentionProfile: r.retentionProfile?.id ? r.retentionProfile : null,
    vehicles: vehiclesByCustomer.get(r.customer.id) ?? [],
  }));

  // Total for the current filter set (same joins/conditions, count only).
  const [totalRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .leftJoin(customerRetentionProfiles, rpJoin)
    .where(and(...conditions));
  const total = Number(totalRow?.count ?? 0);

  // Stats computed over ALL active dealer customers (not the page).
  const dealerActive = and(eq(customers.dealerId, dealerId), eq(customers.isActive, true));

  const [totalStat] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .where(dealerActive);

  const [atRiskStat] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .leftJoin(customerRetentionProfiles, rpJoin)
    .where(and(dealerActive, inArray(customerRetentionProfiles.riskLevel, ['high', 'critical'])));

  const [dueStat] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .leftJoin(customerRetentionProfiles, rpJoin)
    .where(and(dealerActive, or(isNull(customerRetentionProfiles.lastContactDate), lt(customerRetentionProfiles.lastContactDate, daysAgo(30)))!));

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const [newStat] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .where(and(dealerActive, gte(customers.createdAt, startOfMonth)));

  return {
    customers: customersOut,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
    stats: {
      total: Number(totalStat?.count ?? 0),
      atRisk: Number(atRiskStat?.count ?? 0),
      dueFollowups: Number(dueStat?.count ?? 0),
      newThisMonth: Number(newStat?.count ?? 0),
    },
  };
});
