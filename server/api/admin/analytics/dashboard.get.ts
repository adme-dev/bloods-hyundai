import { db } from '../../../utils/db';
import { enquiries, users, dealers, customerRetentionProfiles, customerTasks, customers } from '../../../database/schema';
import { eq, and, gte, lte, sql, desc, isNull, isNotNull, count, or } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const dealerId = user.dealerId;
  const now = new Date();

  // Fetch vehicle catalog data in parallel with DB queries
  const catalogPromise = fetchVehicleCatalog();
  const offersPromise = fetchCurrentOffers();

  // Time boundaries
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const monthStart = new Date(todayStart);
  monthStart.setDate(1);

  const lastMonthStart = new Date(monthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

  // ============================================================================
  // FETCH DEALER SETTINGS FOR CONFIGURABLE TARGETS
  // ============================================================================

  const [dealerSettings] = await db
    .select({
      settings: dealers.settings,
    })
    .from(dealers)
    .where(eq(dealers.id, dealerId))
    .limit(1);

  const settings = (dealerSettings?.settings as Record<string, any>) || {};
  const salesTargets = settings.salesTargets || {
    monthlyLeads: 50,
    monthlyConversions: 15,
    conversionRateTarget: 30,
    accessoriesRevenueTarget: 10000,
    responseTimeHours: 1,
    criticalResponseHours: 24,
    monthlyTestDrives: 25,
    testDriveConversionTarget: 50,
  };

  // ============================================================================
  // OVERALL STATS
  // ============================================================================

  const [totalStats] = await db
    .select({
      total: sql<number>`count(*)`,
      // Per-canonical-status counts for the pipeline card.
      newLead: sql<number>`count(*) filter (where ${enquiries.status} = 'new_lead')`,
      qualified: sql<number>`count(*) filter (where ${enquiries.status} = 'qualified')`,
      attemptedContact: sql<number>`count(*) filter (where ${enquiries.status} = 'attempted_contact')`,
      appointmentSet: sql<number>`count(*) filter (where ${enquiries.status} = 'appointment_set')`,
      showed: sql<number>`count(*) filter (where ${enquiries.status} = 'showed')`,
      testDrive: sql<number>`count(*) filter (where ${enquiries.status} = 'test_drive')`,
      negotiating: sql<number>`count(*) filter (where ${enquiries.status} = 'negotiating')`,
      pendingFinance: sql<number>`count(*) filter (where ${enquiries.status} in ('pending_finance', 'pending_trade'))`,
      depositTaken: sql<number>`count(*) filter (where ${enquiries.status} = 'deposit_taken')`,
      sold: sql<number>`count(*) filter (where ${enquiries.status} = 'sold')`,
      lost: sql<number>`count(*) filter (where ${enquiries.status} in ('lost', 'dead'))`,
      unassignedCount: sql<number>`count(*) filter (where ${enquiries.assignedTo} is null and ${enquiries.status} not in ('sold', 'lost', 'dead'))`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      isNull(enquiries.archivedAt)
    ));

  if (!totalStats) {
    throw createError({ statusCode: 500, message: 'Failed to compute dashboard stats' });
  }

  // Today's count
  const [todayStats] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, todayStart)
    ));

  // Yesterday's count for comparison
  const [yesterdayStats] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, yesterdayStart),
      lte(enquiries.createdAt, todayStart)
    ));

  // This week vs last week
  const [thisWeekStats] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, weekStart)
    ));

  const [lastWeekStats] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, lastWeekStart),
      lte(enquiries.createdAt, weekStart)
    ));

  // ============================================================================
  // DEPARTMENT BREAKDOWN (by enquiry type)
  // ============================================================================

  const departmentStats = await db
    .select({
      type: enquiries.type,
      total: sql<number>`count(*)`,
      newCount: sql<number>`count(*) filter (where ${enquiries.status} = 'new_lead')`,
      thisWeek: sql<number>`count(*) filter (where ${enquiries.createdAt} >= ${weekStart})`,
      lastWeek: sql<number>`count(*) filter (where ${enquiries.createdAt} >= ${lastWeekStart} and ${enquiries.createdAt} < ${weekStart})`,
      avgResponseHours: sql<number>`
        extract(epoch from avg(
          case when ${enquiries.contactedAt} is not null
          then ${enquiries.contactedAt} - ${enquiries.createdAt}
          end
        )) / 3600
      `,
      conversionRate: sql<number>`
        round(
          count(*) filter (where ${enquiries.status} = 'sold')::numeric /
          nullif(count(*), 0) * 100,
          1
        )
      `,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      isNull(enquiries.archivedAt)
    ))
    .groupBy(enquiries.type);

  // ============================================================================
  // DAILY TREND (Last 14 days)
  // ============================================================================

  const twoWeeksAgo = new Date(todayStart);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const dailyTrend = await db
    .select({
      date: sql<string>`date_trunc('day', ${enquiries.createdAt})::date`,
      count: sql<number>`count(*)`,
      vehicle: sql<number>`count(*) filter (where ${enquiries.type} = 'vehicle')`,
      service: sql<number>`count(*) filter (where ${enquiries.type} = 'service')`,
      parts: sql<number>`count(*) filter (where ${enquiries.type} = 'parts')`,
      finance: sql<number>`count(*) filter (where ${enquiries.type} = 'finance')`,
      contact: sql<number>`count(*) filter (where ${enquiries.type} = 'contact')`,
      testDrive: sql<number>`count(*) filter (where ${enquiries.type} = 'test_drive')`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, twoWeeksAgo)
    ))
    .groupBy(sql`date_trunc('day', ${enquiries.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${enquiries.createdAt})::date`);

  // ============================================================================
  // RESPONSE TIME METRICS
  // ============================================================================

  const [responseMetrics] = await db
    .select({
      avgResponseHours: sql<number>`
        extract(epoch from avg(
          case when ${enquiries.contactedAt} is not null
          then ${enquiries.contactedAt} - ${enquiries.createdAt}
          end
        )) / 3600
      `,
      medianResponseHours: sql<number>`
        extract(epoch from percentile_cont(0.5) within group (
          order by case when ${enquiries.contactedAt} is not null
          then ${enquiries.contactedAt} - ${enquiries.createdAt}
          end
        )) / 3600
      `,
      respondedWithin1h: sql<number>`
        count(*) filter (where ${enquiries.contactedAt} is not null
          and ${enquiries.contactedAt} - ${enquiries.createdAt} <= interval '1 hour')
      `,
      respondedWithin24h: sql<number>`
        count(*) filter (where ${enquiries.contactedAt} is not null
          and ${enquiries.contactedAt} - ${enquiries.createdAt} <= interval '24 hours')
      `,
      totalContacted: sql<number>`count(*) filter (where ${enquiries.contactedAt} is not null)`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, monthStart)
    ));

  // ============================================================================
  // STAFF PERFORMANCE
  // ============================================================================

  const staffPerformance = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      assigned: sql<number>`count(${enquiries.id})`,
      closed: sql<number>`count(*) filter (where ${enquiries.status} = 'sold')`,
      avgResponseHours: sql<number>`
        extract(epoch from avg(
          case when ${enquiries.contactedAt} is not null
          then ${enquiries.contactedAt} - ${enquiries.createdAt}
          end
        )) / 3600
      `,
    })
    .from(users)
    .leftJoin(enquiries, and(
      eq(enquiries.assignedTo, users.id),
      gte(enquiries.createdAt, monthStart)
    ))
    .where(and(
      eq(users.dealerId, dealerId),
      eq(users.isActive, true)
    ))
    .groupBy(users.id, users.firstName, users.lastName);

  // ============================================================================
  // STAFF WORKLOAD DISTRIBUTION (Current open assignments)
  // ============================================================================

  const staffWorkload = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      openEnquiries: sql<number>`count(*) filter (where ${enquiries.status} not in ('sold', 'lost', 'dead') and ${enquiries.archivedAt} is null)`,
      newEnquiries: sql<number>`count(*) filter (where ${enquiries.status} = 'new_lead')`,
      inProgressEnquiries: sql<number>`count(*) filter (where ${enquiries.status} = 'appointment_set')`,
      contactedEnquiries: sql<number>`count(*) filter (where ${enquiries.status} = 'attempted_contact')`,
      highPriorityCount: sql<number>`count(*) filter (where ${enquiries.priority} in ('high', 'urgent') and ${enquiries.status} not in ('sold', 'lost', 'dead'))`,
      oldestEnquiryHours: sql<number>`
        extract(epoch from (now() - min(
          case when ${enquiries.status} not in ('sold', 'lost', 'dead') and ${enquiries.archivedAt} is null
          then ${enquiries.createdAt}
          end
        ))) / 3600
      `,
    })
    .from(users)
    .leftJoin(enquiries, eq(enquiries.assignedTo, users.id))
    .where(and(
      eq(users.dealerId, dealerId),
      eq(users.isActive, true)
    ))
    .groupBy(users.id, users.firstName, users.lastName);

  // ============================================================================
  // RECENT ACTIVITY (Last 10 enquiries)
  // ============================================================================

  const recentEnquiries = await db
    .select({
      id: enquiries.id,
      type: enquiries.type,
      firstName: enquiries.firstName,
      lastName: enquiries.lastName,
      email: enquiries.email,
      status: enquiries.status,
      createdAt: enquiries.createdAt,
      vehicleInfo: enquiries.vehicleInfo,
    })
    .from(enquiries)
    .where(eq(enquiries.dealerId, dealerId))
    .orderBy(desc(enquiries.createdAt))
    .limit(10);

  // ============================================================================
  // SOURCE BREAKDOWN (UTM tracking)
  // ============================================================================

  const sourceBreakdown = await db
    .select({
      source: sql<string>`coalesce(${enquiries.utmSource}, 'direct')`,
      count: sql<number>`count(*)`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, monthStart)
    ))
    .groupBy(sql`coalesce(${enquiries.utmSource}, 'direct')`)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  // ============================================================================
  // MARKETING CHANNEL PERFORMANCE (Enhanced UTM Analytics)
  // ============================================================================

  const marketingPerformance = await db
    .select({
      source: sql<string>`coalesce(${enquiries.utmSource}, 'direct')`,
      medium: sql<string>`coalesce(${enquiries.utmMedium}, 'none')`,
      total: sql<number>`count(*)`,
      converted: sql<number>`count(*) filter (where ${enquiries.status} = 'sold')`,
      conversionRate: sql<number>`round(count(*) filter (where ${enquiries.status} = 'sold')::numeric / nullif(count(*), 0) * 100, 1)`,
      avgResponseHours: sql<number>`extract(epoch from avg(case when ${enquiries.contactedAt} is not null then ${enquiries.contactedAt} - ${enquiries.createdAt} end)) / 3600`,
      withTestDrive: sql<number>`count(*) filter (where ${enquiries.testDrive} = true)`,
      withFinance: sql<number>`count(*) filter (where ${enquiries.financeInterest} = true)`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, monthStart)
    ))
    .groupBy(sql`1, 2`)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // Top performing campaigns
  const topCampaigns = await db
    .select({
      campaign: sql<string>`coalesce(${enquiries.utmCampaign}, 'none')`,
      source: sql<string>`coalesce(${enquiries.utmSource}, 'direct')`,
      medium: sql<string>`coalesce(${enquiries.utmMedium}, 'none')`,
      total: sql<number>`count(*)`,
      converted: sql<number>`count(*) filter (where ${enquiries.status} = 'sold')`,
      conversionRate: sql<number>`round(count(*) filter (where ${enquiries.status} = 'sold')::numeric / nullif(count(*), 0) * 100, 1)`,
      withTestDrive: sql<number>`count(*) filter (where ${enquiries.testDrive} = true)`,
      withFinance: sql<number>`count(*) filter (where ${enquiries.financeInterest} = true)`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, monthStart),
      isNotNull(enquiries.utmCampaign)
    ))
    .groupBy(sql`1, 2, 3`)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  // Channel summary (grouped by channel type)
  const [channelSummary] = await db
    .select({
      // Organic (google organic, bing organic, etc.)
      organicTotal: sql<number>`count(*) filter (where ${enquiries.utmMedium} = 'organic')`,
      organicConverted: sql<number>`count(*) filter (where ${enquiries.utmMedium} = 'organic' and ${enquiries.status} = 'sold')`,
      // Paid (cpc, ppc, paid, etc.)
      paidTotal: sql<number>`count(*) filter (where ${enquiries.utmMedium} in ('cpc', 'ppc', 'paid', 'paidsearch', 'paid_social', 'display'))`,
      paidConverted: sql<number>`count(*) filter (where ${enquiries.utmMedium} in ('cpc', 'ppc', 'paid', 'paidsearch', 'paid_social', 'display') and ${enquiries.status} = 'sold')`,
      // Direct (no UTM or direct)
      directTotal: sql<number>`count(*) filter (where ${enquiries.utmSource} is null or ${enquiries.utmSource} = 'direct')`,
      directConverted: sql<number>`count(*) filter (where (${enquiries.utmSource} is null or ${enquiries.utmSource} = 'direct') and ${enquiries.status} = 'sold')`,
      // Referral (referral medium or social sources)
      referralTotal: sql<number>`count(*) filter (where ${enquiries.utmMedium} in ('referral', 'social') or ${enquiries.utmSource} in ('facebook', 'instagram', 'linkedin', 'twitter'))`,
      referralConverted: sql<number>`count(*) filter (where (${enquiries.utmMedium} in ('referral', 'social') or ${enquiries.utmSource} in ('facebook', 'instagram', 'linkedin', 'twitter')) and ${enquiries.status} = 'sold')`,
      // Email
      emailTotal: sql<number>`count(*) filter (where ${enquiries.utmMedium} = 'email' or ${enquiries.utmSource} = 'email')`,
      emailConverted: sql<number>`count(*) filter (where (${enquiries.utmMedium} = 'email' or ${enquiries.utmSource} = 'email') and ${enquiries.status} = 'sold')`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, monthStart)
    ));

  // ============================================================================
  // PRIORITY BREAKDOWN
  // ============================================================================

  const priorityBreakdown = await db
    .select({
      priority: enquiries.priority,
      count: sql<number>`count(*)`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      isNull(enquiries.archivedAt),
      sql`${enquiries.status} not in ('sold', 'lost', 'dead')`
    ))
    .groupBy(enquiries.priority);

  // ============================================================================
  // SALES TARGETS & PERFORMANCE (Monthly)
  // ============================================================================

  // Calculate monthly sales metrics
  const [monthlySalesMetrics] = await db
    .select({
      totalVehicleEnquiries: sql<number>`count(*) filter (where ${enquiries.type} in ('vehicle', 'test_drive'))`,
      convertedSales: sql<number>`count(*) filter (where ${enquiries.type} in ('vehicle', 'test_drive') and ${enquiries.status} = 'sold')`,
      withFinanceInterest: sql<number>`count(*) filter (where ${enquiries.financeInterest} = true)`,
      withTestDrive: sql<number>`count(*) filter (where ${enquiries.testDrive} = true)`,
      withAccessories: sql<number>`count(*) filter (where ${enquiries.accessoriesCart} is not null)`,
      totalAccessoriesValue: sql<number>`sum((${enquiries.accessoriesCart}->>'total')::numeric)`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, monthStart)
    ));

  // Last month for comparison
  const [lastMonthSalesMetrics] = await db
    .select({
      totalVehicleEnquiries: sql<number>`count(*) filter (where ${enquiries.type} in ('vehicle', 'test_drive'))`,
      convertedSales: sql<number>`count(*) filter (where ${enquiries.type} in ('vehicle', 'test_drive') and ${enquiries.status} = 'sold')`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, lastMonthStart),
      lte(enquiries.createdAt, monthStart)
    ));

  // ============================================================================
  // HOT LEADS - High priority, recent, with buying signals
  // ============================================================================

  const hotLeads = await db
    .select({
      id: enquiries.id,
      firstName: enquiries.firstName,
      lastName: enquiries.lastName,
      email: enquiries.email,
      phone: enquiries.phone,
      type: enquiries.type,
      status: enquiries.status,
      priority: enquiries.priority,
      createdAt: enquiries.createdAt,
      vehicleInfo: enquiries.vehicleInfo,
      testDrive: enquiries.testDrive,
      financeInterest: enquiries.financeInterest,
      accessoriesCart: enquiries.accessoriesCart,
      assignedTo: enquiries.assignedTo,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      isNull(enquiries.archivedAt),
      sql`${enquiries.status} not in ('sold', 'lost', 'dead')`,
      sql`(
        ${enquiries.priority} in ('high', 'urgent')
        OR ${enquiries.financeInterest} = true
        OR ${enquiries.testDrive} = true
        OR ${enquiries.accessoriesCart} is not null
        OR ${enquiries.type} in ('vehicle', 'test_drive', 'finance')
      )`
    ))
    .orderBy(
      sql`case ${enquiries.priority} when 'urgent' then 1 when 'high' then 2 when 'medium' then 3 else 4 end`,
      desc(enquiries.createdAt)
    )
    .limit(10);

  // ============================================================================
  // FOLLOW-UP ALERTS - Overdue responses and stale leads
  // ============================================================================

  const twentyFourHoursAgo = new Date(now);
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const fortyEightHoursAgo = new Date(now);
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  const [followUpAlerts] = await db
    .select({
      overdueCount: sql<number>`count(*) filter (
        where ${enquiries.status} = 'new_lead'
        and ${enquiries.createdAt} < ${twentyFourHoursAgo}
      )`,
      criticalOverdueCount: sql<number>`count(*) filter (
        where ${enquiries.status} = 'new_lead'
        and ${enquiries.createdAt} < ${fortyEightHoursAgo}
      )`,
      stalePendingCount: sql<number>`count(*) filter (
        where ${enquiries.status} = 'appointment_set'
        and ${enquiries.updatedAt} < ${fortyEightHoursAgo}
      )`,
      noFollowUpCount: sql<number>`count(*) filter (
        where ${enquiries.status} = 'attempted_contact'
        and ${enquiries.contactedAt} < ${fortyEightHoursAgo}
        and ${enquiries.updatedAt} < ${twentyFourHoursAgo}
      )`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      isNull(enquiries.archivedAt)
    ));

  // Get actual overdue enquiries for the alert list
  const overdueEnquiries = await db
    .select({
      id: enquiries.id,
      firstName: enquiries.firstName,
      lastName: enquiries.lastName,
      email: enquiries.email,
      type: enquiries.type,
      status: enquiries.status,
      createdAt: enquiries.createdAt,
      vehicleInfo: enquiries.vehicleInfo,
      hoursWaiting: sql<number>`extract(epoch from (now() - ${enquiries.createdAt})) / 3600`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      eq(enquiries.status, 'new_lead'),
      lte(enquiries.createdAt, twentyFourHoursAgo),
      isNull(enquiries.archivedAt)
    ))
    .orderBy(enquiries.createdAt)
    .limit(5);

  // ============================================================================
  // CONVERSION FUNNEL
  // ============================================================================

  const [conversionFunnel] = await db
    .select({
      totalLeads: sql<number>`count(*)`,
      contacted: sql<number>`count(*) filter (where ${enquiries.contactedAt} is not null)`,
      qualified: sql<number>`count(*) filter (where ${enquiries.status} not in ('new_lead'))`,
      testDriveBooked: sql<number>`count(*) filter (where ${enquiries.testDrive} = true)`,
      financeApplied: sql<number>`count(*) filter (where ${enquiries.financeInterest} = true)`,
      converted: sql<number>`count(*) filter (where ${enquiries.status} = 'sold')`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      sql`${enquiries.type} in ('vehicle', 'test_drive', 'finance')`,
      gte(enquiries.createdAt, monthStart)
    ));

  // ============================================================================
  // VEHICLE MODEL INTEREST (from enquiries)
  // ============================================================================

  const vehicleInterest = await db
    .select({
      model: sql<string>`${enquiries.vehicleInfo}->>'model'`,
      count: sql<number>`count(*)`,
      testDrives: sql<number>`count(*) filter (where ${enquiries.testDrive} = true)`,
      withFinance: sql<number>`count(*) filter (where ${enquiries.financeInterest} = true)`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, monthStart),
      sql`${enquiries.vehicleInfo}->>'model' is not null`
    ))
    .groupBy(sql`${enquiries.vehicleInfo}->>'model'`)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // ============================================================================
  // ACCESSORIES ANALYTICS (from enquiries with accessoriesCart)
  // ============================================================================

  const accessoriesStats = await db
    .select({
      totalWithAccessories: sql<number>`count(*) filter (where ${enquiries.accessoriesCart} is not null)`,
      avgCartValue: sql<number>`avg((${enquiries.accessoriesCart}->>'total')::numeric)`,
      avgItemCount: sql<number>`avg((${enquiries.accessoriesCart}->>'itemCount')::numeric)`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      gte(enquiries.createdAt, monthStart)
    ));

  // ============================================================================
  // TEST DRIVE SCHEDULING
  // ============================================================================

  const testDriveStats = await db
    .select({
      total: sql<number>`count(*)`,
      thisWeek: sql<number>`count(*) filter (where ${enquiries.createdAt} >= ${weekStart})`,
      pending: sql<number>`count(*) filter (where ${enquiries.status} = 'new_lead')`,
      confirmed: sql<number>`count(*) filter (where ${enquiries.status} = 'attempted_contact')`,
      completed: sql<number>`count(*) filter (where ${enquiries.status} = 'sold')`,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      eq(enquiries.testDrive, true),
      gte(enquiries.createdAt, monthStart)
    ));

  // Recent test drive requests with vehicle info
  const upcomingTestDrives = await db
    .select({
      id: enquiries.id,
      firstName: enquiries.firstName,
      lastName: enquiries.lastName,
      email: enquiries.email,
      phone: enquiries.phone,
      status: enquiries.status,
      createdAt: enquiries.createdAt,
      vehicleInfo: enquiries.vehicleInfo,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.dealerId, dealerId),
      eq(enquiries.testDrive, true),
      sql`${enquiries.status} not in ('sold', 'lost', 'dead')`,
      isNull(enquiries.archivedAt)
    ))
    .orderBy(desc(enquiries.createdAt))
    .limit(5);

  // ============================================================================
  // CUSTOMER RETENTION STATS
  // ============================================================================

  // Total customers count
  const [customerStats] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${customers.isActive} = true)`,
      newThisMonth: sql<number>`count(*) filter (where ${customers.createdAt} >= ${monthStart})`,
    })
    .from(customers)
    .where(eq(customers.dealerId, dealerId));

  // At-risk customers (risk level = high or critical)
  const [atRiskStats] = await db
    .select({
      atRisk: sql<number>`count(*) filter (where ${customerRetentionProfiles.riskLevel} in ('high', 'critical'))`,
      critical: sql<number>`count(*) filter (where ${customerRetentionProfiles.riskLevel} = 'critical')`,
    })
    .from(customerRetentionProfiles)
    .where(and(
      eq(customerRetentionProfiles.dealerId, dealerId),
      eq(customerRetentionProfiles.isActive, true)
    ));

  // Due follow-ups (tasks due today or overdue)
  const [taskStats] = await db
    .select({
      overdue: sql<number>`count(*) filter (where ${customerTasks.dueDate} < ${todayStart} and ${customerTasks.status} not in ('completed', 'cancelled'))`,
      dueToday: sql<number>`count(*) filter (where ${customerTasks.dueDate} >= ${todayStart} and ${customerTasks.dueDate} < ${new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)} and ${customerTasks.status} not in ('completed', 'cancelled'))`,
      pending: sql<number>`count(*) filter (where ${customerTasks.status} = 'pending')`,
    })
    .from(customerTasks)
    .where(eq(customerTasks.dealerId, dealerId));

  // Lifecycle stage distribution
  const lifecycleDistribution = await db
    .select({
      stage: customerRetentionProfiles.lifecycleStage,
      count: sql<number>`count(*)`,
    })
    .from(customerRetentionProfiles)
    .where(and(
      eq(customerRetentionProfiles.dealerId, dealerId),
      eq(customerRetentionProfiles.isActive, true)
    ))
    .groupBy(customerRetentionProfiles.lifecycleStage);

  // Customers needing attention (no contact in 30+ days)
  const thirtyDaysAgo = new Date(todayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [noContactStats] = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(customerRetentionProfiles)
    .where(and(
      eq(customerRetentionProfiles.dealerId, dealerId),
      eq(customerRetentionProfiles.isActive, true),
      or(
        lte(customerRetentionProfiles.lastContactDate, thirtyDaysAgo),
        isNull(customerRetentionProfiles.lastContactDate)
      )
    ));

  // ============================================================================
  // ENHANCED RETENTION ANALYTICS
  // ============================================================================

  // At-risk segmentation with reasons
  const sixtyDaysAgo = new Date(todayStart);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const ninetyDaysAgo = new Date(todayStart);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [riskSegmentation] = await db
    .select({
      // Contact gap segments
      noContact90Plus: sql<number>`count(*) filter (where ${customerRetentionProfiles.lastContactDate} < ${ninetyDaysAgo} or ${customerRetentionProfiles.lastContactDate} is null)`,
      noContact60to90: sql<number>`count(*) filter (where ${customerRetentionProfiles.lastContactDate} >= ${ninetyDaysAgo} and ${customerRetentionProfiles.lastContactDate} < ${sixtyDaysAgo})`,
      noContact30to60: sql<number>`count(*) filter (where ${customerRetentionProfiles.lastContactDate} >= ${sixtyDaysAgo} and ${customerRetentionProfiles.lastContactDate} < ${thirtyDaysAgo})`,
      // Risk level breakdown
      lowRisk: sql<number>`count(*) filter (where ${customerRetentionProfiles.riskLevel} = 'low')`,
      mediumRisk: sql<number>`count(*) filter (where ${customerRetentionProfiles.riskLevel} = 'medium')`,
      highRisk: sql<number>`count(*) filter (where ${customerRetentionProfiles.riskLevel} = 'high')`,
      criticalRisk: sql<number>`count(*) filter (where ${customerRetentionProfiles.riskLevel} = 'critical')`,
      // Engagement score brackets
      highEngagement: sql<number>`count(*) filter (where cast(${customerRetentionProfiles.engagementScore} as integer) >= 70)`,
      mediumEngagement: sql<number>`count(*) filter (where cast(${customerRetentionProfiles.engagementScore} as integer) >= 40 and cast(${customerRetentionProfiles.engagementScore} as integer) < 70)`,
      lowEngagement: sql<number>`count(*) filter (where cast(${customerRetentionProfiles.engagementScore} as integer) < 40)`,
      // Average scores
      avgEngagementScore: sql<number>`avg(cast(${customerRetentionProfiles.engagementScore} as integer))`,
      avgRiskScore: sql<number>`avg(cast(${customerRetentionProfiles.riskScore} as integer))`,
    })
    .from(customerRetentionProfiles)
    .where(and(
      eq(customerRetentionProfiles.dealerId, dealerId),
      eq(customerRetentionProfiles.isActive, true)
    ));

  // Task breakdown by type
  const taskTypeBreakdown = await db
    .select({
      taskType: customerTasks.taskType,
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${customerTasks.status} = 'pending')`,
      inProgress: sql<number>`count(*) filter (where ${customerTasks.status} = 'in_progress')`,
      completed: sql<number>`count(*) filter (where ${customerTasks.status} = 'completed')`,
      overdue: sql<number>`count(*) filter (where ${customerTasks.dueDate} < ${todayStart} and ${customerTasks.status} not in ('completed', 'cancelled'))`,
    })
    .from(customerTasks)
    .where(eq(customerTasks.dealerId, dealerId))
    .groupBy(customerTasks.taskType);

  // Task priority breakdown
  const [taskPriorityStats] = await db
    .select({
      urgent: sql<number>`count(*) filter (where ${customerTasks.priority} = 'urgent' and ${customerTasks.status} not in ('completed', 'cancelled'))`,
      high: sql<number>`count(*) filter (where ${customerTasks.priority} = 'high' and ${customerTasks.status} not in ('completed', 'cancelled'))`,
      medium: sql<number>`count(*) filter (where ${customerTasks.priority} = 'medium' and ${customerTasks.status} not in ('completed', 'cancelled'))`,
      low: sql<number>`count(*) filter (where ${customerTasks.priority} = 'low' and ${customerTasks.status} not in ('completed', 'cancelled'))`,
    })
    .from(customerTasks)
    .where(eq(customerTasks.dealerId, dealerId));

  // Retention strategy distribution
  const retentionStrategyStats = await db
    .select({
      strategy: customerRetentionProfiles.retentionStrategy,
      count: sql<number>`count(*)`,
    })
    .from(customerRetentionProfiles)
    .where(and(
      eq(customerRetentionProfiles.dealerId, dealerId),
      eq(customerRetentionProfiles.isActive, true),
      isNotNull(customerRetentionProfiles.retentionStrategy)
    ))
    .groupBy(customerRetentionProfiles.retentionStrategy);

  // Vehicle interests aggregation
  const vehicleInterestStats = await db
    .select({
      interests: customerRetentionProfiles.vehicleInterests,
    })
    .from(customerRetentionProfiles)
    .where(and(
      eq(customerRetentionProfiles.dealerId, dealerId),
      eq(customerRetentionProfiles.isActive, true),
      isNotNull(customerRetentionProfiles.vehicleInterests)
    ));

  // Aggregate vehicle interests
  const vehicleInterestCounts: Record<string, number> = {};
  for (const row of vehicleInterestStats) {
    if (Array.isArray(row.interests)) {
      for (const interest of row.interests as string[]) {
        vehicleInterestCounts[interest] = (vehicleInterestCounts[interest] || 0) + 1;
      }
    }
  }
  const topVehicleInterests = Object.entries(vehicleInterestCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([model, count]) => ({ model, count }));

  // Recent high-priority at-risk customers (for quick action list)
  const atRiskCustomersList = await db
    .select({
      customerId: customerRetentionProfiles.customerId,
      riskLevel: customerRetentionProfiles.riskLevel,
      riskScore: customerRetentionProfiles.riskScore,
      lastContactDate: customerRetentionProfiles.lastContactDate,
      lifecycleStage: customerRetentionProfiles.lifecycleStage,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
    })
    .from(customerRetentionProfiles)
    .innerJoin(customers, eq(customerRetentionProfiles.customerId, customers.id))
    .where(and(
      eq(customerRetentionProfiles.dealerId, dealerId),
      eq(customerRetentionProfiles.isActive, true),
      sql`${customerRetentionProfiles.riskLevel} in ('high', 'critical')`
    ))
    .orderBy(
      sql`case ${customerRetentionProfiles.riskLevel} when 'critical' then 1 when 'high' then 2 else 3 end`,
      desc(sql`cast(${customerRetentionProfiles.riskScore} as integer)`)
    )
    .limit(5);

  // Wait for catalog data
  const [catalogData, offersData] = await Promise.all([catalogPromise, offersPromise]);

  // Calculate week-over-week change
  const weeklyChange = lastWeekStats.count > 0
    ? Math.round(((Number(thisWeekStats.count) - Number(lastWeekStats.count)) / Number(lastWeekStats.count)) * 100)
    : 0;

  const dailyChange = yesterdayStats.count > 0
    ? Math.round(((Number(todayStats.count) - Number(yesterdayStats.count)) / Number(yesterdayStats.count)) * 100)
    : 0;

  return {
    overview: {
      total: Number(totalStats.total),
      newToday: Number(todayStats.count),
      dailyChange,
      thisWeek: Number(thisWeekStats.count),
      weeklyChange,
      pipeline: {
        // Canonical funnel keys consumed by the dashboard pipeline card.
        newLead: Number(totalStats.newLead),
        qualified: Number(totalStats.qualified),
        attemptedContact: Number(totalStats.attemptedContact),
        appointmentSet: Number(totalStats.appointmentSet),
        showed: Number(totalStats.showed),
        testDrive: Number(totalStats.testDrive),
        negotiating: Number(totalStats.negotiating),
        pendingFinance: Number(totalStats.pendingFinance),
        depositTaken: Number(totalStats.depositTaken),
        sold: Number(totalStats.sold),
        lost: Number(totalStats.lost),
        unassigned: Number(totalStats.unassignedCount),
        // Back-compat alias for the "new leads" quick-action badge.
        new: Number(totalStats.newLead),
      },
    },
    departments: departmentStats.map(d => ({
      type: d.type,
      label: getDepartmentLabel(d.type),
      icon: getDepartmentIcon(d.type),
      color: getDepartmentColor(d.type),
      total: Number(d.total),
      new: Number(d.newCount),
      thisWeek: Number(d.thisWeek),
      lastWeek: Number(d.lastWeek),
      weeklyChange: d.lastWeek > 0
        ? Math.round(((Number(d.thisWeek) - Number(d.lastWeek)) / Number(d.lastWeek)) * 100)
        : 0,
      avgResponseHours: d.avgResponseHours ? Math.round(Number(d.avgResponseHours) * 10) / 10 : null,
      conversionRate: Number(d.conversionRate) || 0,
    })),
    dailyTrend: dailyTrend.map(d => ({
      date: d.date,
      total: Number(d.count),
      vehicle: Number(d.vehicle),
      service: Number(d.service),
      parts: Number(d.parts),
      finance: Number(d.finance),
      contact: Number(d.contact),
      testDrive: Number(d.testDrive),
    })),
    responseMetrics: {
      avgHours: responseMetrics.avgResponseHours ? Math.round(Number(responseMetrics.avgResponseHours) * 10) / 10 : null,
      medianHours: responseMetrics.medianResponseHours ? Math.round(Number(responseMetrics.medianResponseHours) * 10) / 10 : null,
      within1hRate: responseMetrics.totalContacted > 0
        ? Math.round((Number(responseMetrics.respondedWithin1h) / Number(responseMetrics.totalContacted)) * 100)
        : 0,
      within24hRate: responseMetrics.totalContacted > 0
        ? Math.round((Number(responseMetrics.respondedWithin24h) / Number(responseMetrics.totalContacted)) * 100)
        : 0,
    },
    staffPerformance: staffPerformance
      .filter(s => s.assigned > 0)
      .map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        assigned: Number(s.assigned),
        closed: Number(s.closed),
        closureRate: s.assigned > 0 ? Math.round((Number(s.closed) / Number(s.assigned)) * 100) : 0,
        avgResponseHours: s.avgResponseHours ? Math.round(Number(s.avgResponseHours) * 10) / 10 : null,
      }))
      .sort((a, b) => b.assigned - a.assigned)
      .slice(0, 5),
    // ========== STAFF WORKLOAD DISTRIBUTION ==========
    staffWorkload: staffWorkload
      .map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        openEnquiries: Number(s.openEnquiries) || 0,
        breakdown: {
          new: Number(s.newEnquiries) || 0,
          inProgress: Number(s.inProgressEnquiries) || 0,
          contacted: Number(s.contactedEnquiries) || 0,
        },
        highPriority: Number(s.highPriorityCount) || 0,
        oldestEnquiryHours: s.oldestEnquiryHours ? Math.round(Number(s.oldestEnquiryHours)) : null,
        workloadLevel: calculateWorkloadLevel(Number(s.openEnquiries) || 0),
      }))
      .filter(s => s.openEnquiries > 0)
      .sort((a, b) => b.openEnquiries - a.openEnquiries),
    recentEnquiries: recentEnquiries.map(e => ({
      id: e.id,
      type: e.type,
      typeLabel: getDepartmentLabel(e.type),
      customer: `${e.firstName} ${e.lastName}`,
      email: e.email,
      status: e.status,
      createdAt: e.createdAt,
      vehicle: e.vehicleInfo ? (e.vehicleInfo as any).model || (e.vehicleInfo as any).make : null,
    })),
    sources: sourceBreakdown.map(s => ({
      source: s.source,
      count: Number(s.count),
    })),
    // ========== MARKETING PERFORMANCE ==========
    marketingPerformance: {
      channels: marketingPerformance.map(m => ({
        source: m.source,
        medium: m.medium,
        total: Number(m.total),
        converted: Number(m.converted),
        conversionRate: Number(m.conversionRate) || 0,
        avgResponseHours: m.avgResponseHours ? Math.round(Number(m.avgResponseHours) * 10) / 10 : null,
        withTestDrive: Number(m.withTestDrive),
        withFinance: Number(m.withFinance),
        qualityScore: Math.round(((Number(m.withTestDrive) + Number(m.withFinance)) / Math.max(Number(m.total), 1)) * 100),
      })),
      topCampaigns: topCampaigns.map(c => ({
        campaign: c.campaign,
        source: c.source,
        medium: c.medium,
        total: Number(c.total),
        converted: Number(c.converted),
        conversionRate: Number(c.conversionRate) || 0,
        withTestDrive: Number(c.withTestDrive),
        withFinance: Number(c.withFinance),
      })),
      channelSummary: {
        organic: {
          total: Number(channelSummary?.organicTotal || 0),
          converted: Number(channelSummary?.organicConverted || 0),
          rate: channelSummary?.organicTotal > 0
            ? Math.round((Number(channelSummary.organicConverted) / Number(channelSummary.organicTotal)) * 100)
            : 0,
        },
        paid: {
          total: Number(channelSummary?.paidTotal || 0),
          converted: Number(channelSummary?.paidConverted || 0),
          rate: channelSummary?.paidTotal > 0
            ? Math.round((Number(channelSummary.paidConverted) / Number(channelSummary.paidTotal)) * 100)
            : 0,
        },
        direct: {
          total: Number(channelSummary?.directTotal || 0),
          converted: Number(channelSummary?.directConverted || 0),
          rate: channelSummary?.directTotal > 0
            ? Math.round((Number(channelSummary.directConverted) / Number(channelSummary.directTotal)) * 100)
            : 0,
        },
        referral: {
          total: Number(channelSummary?.referralTotal || 0),
          converted: Number(channelSummary?.referralConverted || 0),
          rate: channelSummary?.referralTotal > 0
            ? Math.round((Number(channelSummary.referralConverted) / Number(channelSummary.referralTotal)) * 100)
            : 0,
        },
        email: {
          total: Number(channelSummary?.emailTotal || 0),
          converted: Number(channelSummary?.emailConverted || 0),
          rate: channelSummary?.emailTotal > 0
            ? Math.round((Number(channelSummary.emailConverted) / Number(channelSummary.emailTotal)) * 100)
            : 0,
        },
      },
    },
    priorities: priorityBreakdown.map(p => ({
      priority: p.priority,
      count: Number(p.count),
    })),
    // ========== SALES PERFORMANCE ==========
    salesPerformance: {
      thisMonth: {
        leads: Number(monthlySalesMetrics?.totalVehicleEnquiries || 0),
        conversions: Number(monthlySalesMetrics?.convertedSales || 0),
        conversionRate: monthlySalesMetrics?.totalVehicleEnquiries > 0
          ? Math.round((Number(monthlySalesMetrics.convertedSales) / Number(monthlySalesMetrics.totalVehicleEnquiries)) * 100)
          : 0,
        withFinance: Number(monthlySalesMetrics?.withFinanceInterest || 0),
        withTestDrive: Number(monthlySalesMetrics?.withTestDrive || 0),
        withAccessories: Number(monthlySalesMetrics?.withAccessories || 0),
        accessoriesValue: Math.round(Number(monthlySalesMetrics?.totalAccessoriesValue || 0)),
      },
      lastMonth: {
        leads: Number(lastMonthSalesMetrics?.totalVehicleEnquiries || 0),
        conversions: Number(lastMonthSalesMetrics?.convertedSales || 0),
      },
      monthOverMonthChange: lastMonthSalesMetrics?.totalVehicleEnquiries > 0
        ? Math.round(((Number(monthlySalesMetrics?.totalVehicleEnquiries || 0) - Number(lastMonthSalesMetrics.totalVehicleEnquiries)) / Number(lastMonthSalesMetrics.totalVehicleEnquiries)) * 100)
        : 0,
      // Configurable targets from dealer settings
      targets: {
        monthlyLeads: salesTargets.monthlyLeads,
        monthlyConversions: salesTargets.monthlyConversions,
        conversionRateTarget: salesTargets.conversionRateTarget,
        accessoriesRevenueTarget: salesTargets.accessoriesRevenueTarget,
        responseTimeHours: salesTargets.responseTimeHours,
        criticalResponseHours: salesTargets.criticalResponseHours,
        monthlyTestDrives: salesTargets.monthlyTestDrives,
        testDriveConversionTarget: salesTargets.testDriveConversionTarget,
      },
    },
    // ========== HOT LEADS ==========
    hotLeads: hotLeads.map(lead => ({
      id: lead.id,
      customer: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phone,
      type: lead.type,
      typeLabel: getDepartmentLabel(lead.type),
      status: lead.status,
      priority: lead.priority,
      createdAt: lead.createdAt,
      vehicle: lead.vehicleInfo ? (lead.vehicleInfo as any).model || (lead.vehicleInfo as any).make : null,
      variant: lead.vehicleInfo ? (lead.vehicleInfo as any).variant : null,
      signals: {
        testDrive: lead.testDrive || false,
        financeInterest: lead.financeInterest || false,
        hasAccessories: !!lead.accessoriesCart,
        accessoriesValue: lead.accessoriesCart ? (lead.accessoriesCart as any).total || 0 : 0,
      },
      isAssigned: !!lead.assignedTo,
      score: calculateLeadScore(lead),
    })),
    // ========== FOLLOW-UP ALERTS ==========
    followUpAlerts: {
      overdue: Number(followUpAlerts?.overdueCount || 0),
      criticalOverdue: Number(followUpAlerts?.criticalOverdueCount || 0),
      stalePending: Number(followUpAlerts?.stalePendingCount || 0),
      needsFollowUp: Number(followUpAlerts?.noFollowUpCount || 0),
      totalAlerts: Number(followUpAlerts?.overdueCount || 0) + Number(followUpAlerts?.stalePendingCount || 0) + Number(followUpAlerts?.noFollowUpCount || 0),
      overdueEnquiries: overdueEnquiries.map(e => ({
        id: e.id,
        customer: `${e.firstName} ${e.lastName}`,
        email: e.email,
        type: e.type,
        typeLabel: getDepartmentLabel(e.type),
        createdAt: e.createdAt,
        hoursWaiting: Math.round(Number(e.hoursWaiting)),
        vehicle: e.vehicleInfo ? (e.vehicleInfo as any).model : null,
      })),
    },
    // ========== CONVERSION FUNNEL ==========
    conversionFunnel: {
      totalLeads: Number(conversionFunnel?.totalLeads || 0),
      contacted: Number(conversionFunnel?.contacted || 0),
      contactedRate: conversionFunnel?.totalLeads > 0
        ? Math.round((Number(conversionFunnel.contacted) / Number(conversionFunnel.totalLeads)) * 100)
        : 0,
      qualified: Number(conversionFunnel?.qualified || 0),
      qualifiedRate: conversionFunnel?.totalLeads > 0
        ? Math.round((Number(conversionFunnel.qualified) / Number(conversionFunnel.totalLeads)) * 100)
        : 0,
      testDriveBooked: Number(conversionFunnel?.testDriveBooked || 0),
      testDriveRate: conversionFunnel?.totalLeads > 0
        ? Math.round((Number(conversionFunnel.testDriveBooked) / Number(conversionFunnel.totalLeads)) * 100)
        : 0,
      financeApplied: Number(conversionFunnel?.financeApplied || 0),
      financeRate: conversionFunnel?.totalLeads > 0
        ? Math.round((Number(conversionFunnel.financeApplied) / Number(conversionFunnel.totalLeads)) * 100)
        : 0,
      converted: Number(conversionFunnel?.converted || 0),
      conversionRate: conversionFunnel?.totalLeads > 0
        ? Math.round((Number(conversionFunnel.converted) / Number(conversionFunnel.totalLeads)) * 100)
        : 0,
    },
    // Vehicle Catalog Data
    vehicleCatalog: catalogData,
    currentOffers: offersData,
    // Vehicle Interest from Enquiries
    vehicleInterest: vehicleInterest
      .filter(v => v.model)
      .map(v => ({
        model: v.model,
        enquiries: Number(v.count),
        testDrives: Number(v.testDrives),
        withFinance: Number(v.withFinance),
      })),
    // Accessories Stats
    accessoriesAnalytics: {
      enquiriesWithAccessories: Number(accessoriesStats[0]?.totalWithAccessories || 0),
      avgCartValue: accessoriesStats[0]?.avgCartValue
        ? Math.round(Number(accessoriesStats[0].avgCartValue) * 100) / 100
        : 0,
      avgItemCount: accessoriesStats[0]?.avgItemCount
        ? Math.round(Number(accessoriesStats[0].avgItemCount) * 10) / 10
        : 0,
    },
    // Test Drive Stats
    testDrives: {
      total: Number(testDriveStats[0]?.total || 0),
      thisWeek: Number(testDriveStats[0]?.thisWeek || 0),
      pending: Number(testDriveStats[0]?.pending || 0),
      confirmed: Number(testDriveStats[0]?.confirmed || 0),
      completed: Number(testDriveStats[0]?.completed || 0),
      upcoming: upcomingTestDrives.map(td => ({
        id: td.id,
        customer: `${td.firstName} ${td.lastName}`,
        email: td.email,
        phone: td.phone,
        status: td.status,
        createdAt: td.createdAt,
        vehicle: td.vehicleInfo ? (td.vehicleInfo as any).model || (td.vehicleInfo as any).make : null,
        variant: td.vehicleInfo ? (td.vehicleInfo as any).variant : null,
      })),
    },
    // ========== CUSTOMER RETENTION ==========
    customerRetention: {
      totalCustomers: Number(customerStats?.total || 0),
      activeCustomers: Number(customerStats?.active || 0),
      newThisMonth: Number(customerStats?.newThisMonth || 0),
      atRisk: Number(atRiskStats?.atRisk || 0),
      critical: Number(atRiskStats?.critical || 0),
      overdueTasks: Number(taskStats?.overdue || 0),
      tasksDueToday: Number(taskStats?.dueToday || 0),
      pendingTasks: Number(taskStats?.pending || 0),
      noContactIn30Days: Number(noContactStats?.count || 0),
      lifecycleDistribution: lifecycleDistribution.map(l => ({
        stage: l.stage,
        count: Number(l.count),
      })),
      // Enhanced analytics
      riskSegmentation: {
        byContactGap: {
          noContact90Plus: Number(riskSegmentation?.noContact90Plus || 0),
          noContact60to90: Number(riskSegmentation?.noContact60to90 || 0),
          noContact30to60: Number(riskSegmentation?.noContact30to60 || 0),
        },
        byRiskLevel: {
          low: Number(riskSegmentation?.lowRisk || 0),
          medium: Number(riskSegmentation?.mediumRisk || 0),
          high: Number(riskSegmentation?.highRisk || 0),
          critical: Number(riskSegmentation?.criticalRisk || 0),
        },
        byEngagement: {
          high: Number(riskSegmentation?.highEngagement || 0),
          medium: Number(riskSegmentation?.mediumEngagement || 0),
          low: Number(riskSegmentation?.lowEngagement || 0),
        },
        averages: {
          engagementScore: Math.round(Number(riskSegmentation?.avgEngagementScore || 0)),
          riskScore: Math.round(Number(riskSegmentation?.avgRiskScore || 0)),
        },
      },
      taskBreakdown: {
        byType: taskTypeBreakdown.map(t => ({
          type: t.taskType,
          label: getTaskTypeLabel(t.taskType),
          total: Number(t.total),
          pending: Number(t.pending),
          inProgress: Number(t.inProgress),
          completed: Number(t.completed),
          overdue: Number(t.overdue),
        })),
        byPriority: {
          urgent: Number(taskPriorityStats?.urgent || 0),
          high: Number(taskPriorityStats?.high || 0),
          medium: Number(taskPriorityStats?.medium || 0),
          low: Number(taskPriorityStats?.low || 0),
        },
      },
      retentionStrategies: retentionStrategyStats.map(s => ({
        strategy: s.strategy,
        label: getRetentionStrategyLabel(s.strategy),
        count: Number(s.count),
      })),
      topVehicleInterests,
      atRiskCustomers: atRiskCustomersList.map(c => ({
        id: c.customerId,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.phone,
        riskLevel: c.riskLevel,
        riskScore: Number(c.riskScore || 0),
        lastContactDate: c.lastContactDate,
        lifecycleStage: c.lifecycleStage,
        daysSinceContact: c.lastContactDate
          ? Math.floor((now.getTime() - new Date(c.lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      })),
    },
  };
});

function getDepartmentLabel(type: string): string {
  const labels: Record<string, string> = {
    vehicle: 'Sales Enquiries',
    contact: 'General Contact',
    finance: 'Finance',
    service: 'Service Bookings',
    parts: 'Parts Requests',
    test_drive: 'Test Drives',
    sell_car: 'Trade-Ins',
    accessories: 'Accessories',
    fleet: 'Fleet',
  };
  return labels[type] || type;
}

function getDepartmentIcon(type: string): string {
  const icons: Record<string, string> = {
    vehicle: 'Car',
    contact: 'MessageSquare',
    finance: 'DollarSign',
    service: 'Wrench',
    parts: 'Package',
    test_drive: 'CalendarCheck',
    sell_car: 'ArrowLeftRight',
    accessories: 'Sparkles',
    fleet: 'Truck',
  };
  return icons[type] || 'Mail';
}

function getDepartmentColor(type: string): string {
  const colors: Record<string, string> = {
    vehicle: 'blue',
    contact: 'gray',
    finance: 'green',
    service: 'orange',
    parts: 'purple',
    test_drive: 'cyan',
    sell_car: 'yellow',
    accessories: 'pink',
    fleet: 'indigo',
  };
  return colors[type] || 'gray';
}

// ============================================================================
// VEHICLE CATALOG FETCHERS
// ============================================================================

async function fetchVehicleCatalog() {
  try {
    const response = await fetch('https://www.hyundai.com/content/api/au/hyundai/pcm1/v1/modeladditional');
    if (!response.ok) return null;

    const data = await response.json();
    // API returns an array directly, filter out hidden items
    if (!Array.isArray(data)) return null;

    const variants = data.filter((item: any) => !item.hideInListing);

    // Group by category
    const categories: Record<string, any[]> = {};
    const categoryOrder = ['Electric', 'Hybrid', 'SUVs and People Movers', 'Performance', 'Hatch and Sedans'];

    for (const variant of variants) {
      // Category is nested object with .name property
      const category = variant.primaryCategory?.name || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      // Model name is nested in .model.model
      const modelName = variant.model?.model || variant.model || 'Unknown';
      categories[category].push({
        id: variant.id || variant.modelId,
        name: modelName,
        slug: modelName?.toLowerCase().replace(/\s+/g, '-'),
        image: variant.desktopImageUrl || variant.mobileImageUrl,
        lowPrice: variant.lowPrice,
        highPrice: variant.highPrice,
        fuelType: category === 'Electric' ? 'Electric' : category === 'Hybrid' ? 'Hybrid' : 'Petrol',
        isNew: modelName?.includes('2025') || modelName?.includes('INSTER'),
        isNPerformance: variant.isNPerformance,
        hasOffer: false, // Not available in this API response
      });
    }

    // Sort categories by order
    const sortedCategories = categoryOrder
      .filter(cat => categories[cat])
      .map(cat => ({
        name: cat,
        models: categories[cat].sort((a, b) => (a.lowPrice || 0) - (b.lowPrice || 0)),
      }));

    // Add any remaining categories
    Object.keys(categories)
      .filter(cat => !categoryOrder.includes(cat))
      .forEach(cat => {
        sortedCategories.push({
          name: cat,
          models: categories[cat],
        });
      });

    return {
      totalModels: variants.length,
      categories: sortedCategories,
      highlights: {
        electric: categories['Electric']?.length || 0,
        hybrid: categories['Hybrid']?.length || 0,
        suv: categories['SUVs and People Movers']?.length || 0,
        performance: categories['Performance']?.length || 0,
      },
      newModels: variants.filter((v: any) => {
        const name = v.model?.model || v.model || '';
        return name.includes('2025') || name.includes('INSTER');
      }).length,
      withOffers: 0, // Offers not available in this API response
    };
  } catch (error) {
    console.error('Failed to fetch vehicle catalog:', error);
    return null;
  }
}

async function fetchCurrentOffers() {
  try {
    // Use the same parsing logic as /api/hyundai-offers
    const response = await fetch('https://www.hyundai.com/au/en/offers', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-AU,en;q=0.9',
      },
    });
    if (!response.ok) return null;

    const html = await response.text();

    // Extract offers data using same patterns as /api/hyundai-offers
    const patterns = [
      /window\.hyundaiData\s*\[\s*["']offersData["']\s*\]\s*=\s*(\[[\s\S]*?\]);?\s*(?:<\/script>|window\.)/,
      /window\.hyundaiData\["offersData"\]\s*=\s*(\[[\s\S]*?\]);?\s*<\/script>/,
      /hyundaiData\["offersData"\]\s*=\s*(\[[\s\S]*?\]);/,
      /"offersData"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
    ];

    let offersData = null;
    for (const regex of patterns) {
      const match = html.match(regex);
      if (match && match[1]) {
        try {
          offersData = JSON.parse(match[1]);
          break;
        } catch {
          continue;
        }
      }
    }

    if (!offersData) {
      return {
        totalOffers: 0,
        modelsWithOffers: [],
        hasActiveOffers: false,
      };
    }

    const data = Array.isArray(offersData) ? offersData[0] : offersData;
    const variants = data?.variants || [];

    // Count variants with offers
    const variantsWithOffers = variants.filter((v: any) => {
      if (!v.offerPackages || !Array.isArray(v.offerPackages)) return false;
      return v.offerPackages.some((pkg: any) =>
        pkg.offers && Array.isArray(pkg.offers) && pkg.offers.length > 0
      );
    });

    // Extract unique model names with offers
    const modelNames = [...new Set(
      variantsWithOffers.map((v: any) => v.modelGroup || v.modelName || '')
    )].filter(Boolean) as string[];

    return {
      totalOffers: variantsWithOffers.length,
      modelsWithOffers: modelNames,
      hasActiveOffers: variantsWithOffers.length > 0,
    };
  } catch (error) {
    console.error('Failed to fetch offers:', error);
    return {
      totalOffers: 0,
      modelsWithOffers: [],
      hasActiveOffers: false,
    };
  }
}

// ============================================================================
// LEAD SCORING ALGORITHM
// ============================================================================

function calculateLeadScore(lead: {
  priority?: string | null;
  type?: string | null;
  testDrive?: boolean | null;
  financeInterest?: boolean | null;
  accessoriesCart?: any;
  createdAt?: Date | null;
}): number {
  let score = 0;

  // Priority scoring (0-30 points)
  const priorityScores: Record<string, number> = {
    urgent: 30,
    high: 20,
    medium: 10,
    low: 5,
  };
  score += priorityScores[lead.priority || 'low'] || 5;

  // Enquiry type scoring (0-25 points)
  const typeScores: Record<string, number> = {
    vehicle: 25,
    test_drive: 25,
    finance: 20,
    fleet: 20,
    accessories: 15,
    service: 10,
    parts: 10,
    sell_car: 15,
    contact: 5,
  };
  score += typeScores[lead.type || 'contact'] || 5;

  // Buying signals (0-30 points)
  if (lead.testDrive) score += 10;
  if (lead.financeInterest) score += 10;
  if (lead.accessoriesCart) {
    score += 5;
    const cartValue = (lead.accessoriesCart as any)?.total || 0;
    if (cartValue > 1000) score += 5;
  }

  // Recency scoring (0-15 points)
  if (lead.createdAt) {
    const hoursAgo = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 1) score += 15;
    else if (hoursAgo < 4) score += 12;
    else if (hoursAgo < 24) score += 8;
    else if (hoursAgo < 48) score += 4;
  }

  return Math.min(score, 100); // Cap at 100
}

// ============================================================================
// WORKLOAD LEVEL CALCULATOR
// ============================================================================

function calculateWorkloadLevel(openEnquiries: number): 'low' | 'moderate' | 'high' | 'overloaded' {
  if (openEnquiries <= 5) return 'low';
  if (openEnquiries <= 10) return 'moderate';
  if (openEnquiries <= 15) return 'high';
  return 'overloaded';
}

// ============================================================================
// TASK TYPE LABELS
// ============================================================================

function getTaskTypeLabel(type: string | null): string {
  const labels: Record<string, string> = {
    follow_up: 'Follow-up',
    call: 'Phone Call',
    email: 'Email',
    sms: 'SMS',
    meeting: 'Meeting',
    service_reminder: 'Service Reminder',
    trade_in_offer: 'Trade-in Offer',
    other: 'Other',
  };
  return labels[type || 'other'] || type || 'Other';
}

// ============================================================================
// RETENTION STRATEGY LABELS
// ============================================================================

function getRetentionStrategyLabel(strategy: string | null): string {
  const labels: Record<string, string> = {
    loyalty: 'Loyalty Program',
    win_back: 'Win-back Campaign',
    service_reminder: 'Service Reminder',
    trade_in: 'Trade-in Offer',
    referral: 'Referral Program',
    vip: 'VIP Treatment',
    standard: 'Standard Follow-up',
  };
  return labels[strategy || 'standard'] || strategy || 'Standard';
}
