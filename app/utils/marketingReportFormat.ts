const DEALER_TIME_ZONE = 'Australia/Melbourne';
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function defaultMarketingDateRange(today: string): { from: string; to: string } {
  const from = new Date(`${today}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - 29);
  return { from: from.toISOString().slice(0, 10), to: today };
}

export function formatReportDate(value: string): string {
  const { year, month, day } = parseDateOnly(value);
  return `${day} ${SHORT_MONTHS[month - 1]} ${year}`;
}

export function formatReportShortDate(value: string): string {
  const { month, day } = parseDateOnly(value);
  return `${day} ${SHORT_MONTHS[month - 1]}`;
}

export function formatReportTimestamp(value: string): string {
  const parts = zonedNumericParts(new Date(value));
  return `${parts.day} ${SHORT_MONTHS[parts.month - 1]} ${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

export function reportDateInTimeZone(date = new Date()): string {
  const parts = zonedNumericParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid report date: ${value}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function zonedNumericParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DEALER_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value || 0);
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute') };
}
