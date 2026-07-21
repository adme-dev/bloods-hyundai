import { DateTime } from 'luxon';

export const MARKETING_REPORT_TIME_ZONE = 'Australia/Melbourne';
export const SYNTHETIC_MARKETING_LEAD_SOURCES = ['live-smoke-test'] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

export function resolveMarketingReportRange(
  query: Record<string, unknown>,
  now = new Date(),
) {
  const today = DateTime.fromJSDate(now, { zone: MARKETING_REPORT_TIME_ZONE }).toISODate();
  if (!today) throw new Error('Unable to resolve the current report date');

  const defaultFrom = `${today.slice(0, 8)}01`;
  const from = parseDateQuery(query.from, defaultFrom, 'from');
  const to = parseDateQuery(query.to, today, 'to');
  const fromLocal = toMelbourneDate(from);
  const toLocal = toMelbourneDate(to);

  if (fromLocal > toLocal) {
    throw new Error('from must be on or before to');
  }
  if (toLocal > fromLocal.plus({ days: MAX_RANGE_DAYS - 1 })) {
    throw new Error(`Date range cannot exceed ${MAX_RANGE_DAYS} days`);
  }

  return {
    from,
    to,
    fromDate: fromLocal.toUTC().toJSDate(),
    dayAfterTo: toLocal.plus({ days: 1 }).toUTC().toJSDate(),
  };
}

export function marketingReportDateForInstant(date: Date) {
  const reportDate = DateTime.fromJSDate(date, { zone: MARKETING_REPORT_TIME_ZONE }).toISODate();
  if (!reportDate) throw new Error('Unable to resolve marketing report date');
  return reportDate;
}

function parseDateQuery(value: unknown, fallback: string, name: string) {
  if (value == null || value === '') return fallback;
  if (Array.isArray(value)) {
    throw new Error(`${name} must be a single YYYY-MM-DD date`);
  }

  const date = String(value);
  const parsed = DateTime.fromISO(date, { zone: MARKETING_REPORT_TIME_ZONE });
  if (!DATE_RE.test(date) || !parsed.isValid || parsed.toISODate() !== date) {
    throw new Error(`${name} must be a valid YYYY-MM-DD date`);
  }
  return date;
}

function toMelbourneDate(value: string) {
  return DateTime.fromISO(value, { zone: MARKETING_REPORT_TIME_ZONE }).startOf('day');
}
