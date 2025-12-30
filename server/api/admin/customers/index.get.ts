import { db } from '../../../utils/db';
import { customers, customerRetentionProfiles, customerVehicles } from '../../../database/schema';
import { eq, desc, and, like, or, sql, isNull, isNotNull, lte, gte } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const dealerId = event.context.dealerId;
  const query = getQuery(event);

  // Build where conditions
  const conditions = [eq(customers.dealerId, dealerId), eq(customers.isActive, true)];

  // View-based filtering
  const view = query.view as string || 'all';

  // Search filter
  if (query.search) {
    const searchTerm = `%${query.search}%`;
    conditions.push(
      or(
        like(customers.firstName, searchTerm),
        like(customers.lastName, searchTerm),
        like(customers.email, searchTerm),
        like(customers.phone, searchTerm),
      )!
    );
  }

  // Pagination with security limit to prevent DoS
  const MAX_LIMIT = 100;
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit as string) || 20));
  const offset = (page - 1) * limit;

  // Get customers with retention profiles and vehicles
  const results = await db.query.customers.findMany({
    where: and(...conditions),
    with: {
      vehicles: {
        where: eq(customerVehicles.isActive, true),
        orderBy: [desc(customerVehicles.createdAt)],
        limit: 3,
      },
    },
    orderBy: [desc(customers.createdAt)],
    limit,
    offset,
  });

  // Get retention profiles separately to join
  const customerIds = results.map(c => c.id);
  let retentionProfiles: any[] = [];

  if (customerIds.length > 0) {
    retentionProfiles = await db.query.customerRetentionProfiles.findMany({
      where: and(
        eq(customerRetentionProfiles.dealerId, dealerId),
        sql`${customerRetentionProfiles.customerId} IN (${sql.join(customerIds.map(id => sql`${id}`), sql`, `)})`
      ),
    });
  }

  // Merge retention profiles with customers
  const customersWithProfiles = results.map(customer => {
    const profile = retentionProfiles.find(p => p.customerId === customer.id);
    return {
      ...customer,
      retentionProfile: profile || null,
    };
  });

  // Apply view-based and lifecycle/risk filters post-fetch
  let filteredCustomers = customersWithProfiles;

  // Filter by lifecycle stage
  if (query.lifecycleStage) {
    filteredCustomers = filteredCustomers.filter(c =>
      c.retentionProfile?.lifecycleStage === query.lifecycleStage
    );
  }

  // Filter by risk level
  if (query.riskLevel) {
    filteredCustomers = filteredCustomers.filter(c =>
      c.retentionProfile?.riskLevel === query.riskLevel
    );
  }

  // Filter by last contact
  if (query.lastContact) {
    const now = new Date();
    filteredCustomers = filteredCustomers.filter(c => {
      const lastContact = c.retentionProfile?.lastContactDate;
      if (!lastContact) return query.lastContact === 'overdue';

      const contactDate = new Date(lastContact);
      const daysSinceContact = Math.floor((now.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (query.lastContact) {
        case '7d': return daysSinceContact <= 7;
        case '30d': return daysSinceContact <= 30;
        case '90d': return daysSinceContact <= 90;
        case 'overdue': return daysSinceContact > 30;
        default: return true;
      }
    });
  }

  // Filter by vehicle ownership
  if (query.hasVehicle) {
    filteredCustomers = filteredCustomers.filter(c => {
      const hasVehicle = c.vehicles && c.vehicles.length > 0;
      return query.hasVehicle === 'yes' ? hasVehicle : !hasVehicle;
    });
  }

  // View-based filtering
  if (view === 'at_risk') {
    filteredCustomers = filteredCustomers.filter(c =>
      c.retentionProfile?.riskLevel === 'high' || c.retentionProfile?.riskLevel === 'critical'
    );
  } else if (view === 'due_followup') {
    const now = new Date();
    filteredCustomers = filteredCustomers.filter(c => {
      const lastContact = c.retentionProfile?.lastContactDate;
      if (!lastContact) return true;
      const daysSinceContact = Math.floor((now.getTime() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceContact > 30;
    });
  }

  // Get total counts for stats
  const [{ totalCount }] = await db
    .select({ totalCount: sql<number>`count(*)` })
    .from(customers)
    .where(and(eq(customers.dealerId, dealerId), eq(customers.isActive, true)));

  // Calculate stats
  const atRiskCount = customersWithProfiles.filter(c =>
    c.retentionProfile?.riskLevel === 'high' || c.retentionProfile?.riskLevel === 'critical'
  ).length;

  const dueFollowupsCount = customersWithProfiles.filter(c => {
    const lastContact = c.retentionProfile?.lastContactDate;
    if (!lastContact) return true;
    const daysSinceContact = Math.floor((Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceContact > 30;
  }).length;

  // New this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ newThisMonth }] = await db
    .select({ newThisMonth: sql<number>`count(*)` })
    .from(customers)
    .where(and(
      eq(customers.dealerId, dealerId),
      eq(customers.isActive, true),
      gte(customers.createdAt, startOfMonth)
    ));

  return {
    customers: filteredCustomers,
    pagination: {
      page,
      limit,
      total: filteredCustomers.length,
      totalPages: Math.ceil(filteredCustomers.length / limit),
    },
    stats: {
      total: Number(totalCount),
      atRisk: atRiskCount,
      dueFollowups: dueFollowupsCount,
      newThisMonth: Number(newThisMonth),
    },
  };
});
