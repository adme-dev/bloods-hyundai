/**
 * The /api/admin/analytics/dashboard response. The legacy page accessed it
 * untyped (`data?.…`); this alias keeps that behavior while giving all
 * dashboard components a single prop type to strengthen later.
 */
export type DashboardData = any;
