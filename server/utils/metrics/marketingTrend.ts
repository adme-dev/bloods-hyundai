export interface MarketingTrendRow {
  date: string;
  sessions: number;
  users: number;
  keyEvents: number;
  crmLeads: number;
  paidSpend: number;
  paidClicks: number;
  platformConversions: number;
  paidCrmLeads: number;
  crmCpl: number | null;
}

interface DailyMetricRow {
  platform: string;
  date: string | Date;
  sessions: number | null;
  users: number | null;
  conversions: number | null;
  spend: number | string | null;
  clicks: number | null;
  platformLeads: number | null;
}

interface DailyTotalRow {
  date: string;
  total: number;
}

export function buildMarketingTrend(
  range: { from: string; to: string },
  metricRows: DailyMetricRow[],
  dailyLeadRows: DailyTotalRow[],
  dailyPaidLeadRows: DailyTotalRow[],
): MarketingTrendRow[] {
  const byDate = new Map<string, MarketingTrendRow>();
  for (const date of enumerateDates(range.from, range.to)) {
    byDate.set(date, emptyTrendRow(date));
  }

  for (const row of metricRows) {
    const day = byDate.get(String(row.date));
    if (!day) continue;

    if (row.platform === 'ga4') {
      day.sessions += Number(row.sessions || 0);
      day.users += Number(row.users || 0);
      day.keyEvents += Number(row.conversions || 0);
    }

    if (row.platform === 'google_ads' || row.platform === 'meta_ads') {
      day.paidSpend += Number(row.spend || 0);
      day.paidClicks += Number(row.clicks || 0);
      day.platformConversions += Number(row.platformLeads || 0);
    }
  }

  applyDailyTotals(byDate, dailyLeadRows, 'crmLeads');
  applyDailyTotals(byDate, dailyPaidLeadRows, 'paidCrmLeads');

  return [...byDate.values()].map(row => {
    const paidSpend = roundMoney(row.paidSpend);
    return {
      ...row,
      paidSpend,
      crmCpl: row.paidCrmLeads ? roundMoney(paidSpend / row.paidCrmLeads) : null,
    };
  });
}

function emptyTrendRow(date: string): MarketingTrendRow {
  return {
    date,
    sessions: 0,
    users: 0,
    keyEvents: 0,
    crmLeads: 0,
    paidSpend: 0,
    paidClicks: 0,
    platformConversions: 0,
    paidCrmLeads: 0,
    crmCpl: null,
  };
}

function applyDailyTotals(
  byDate: Map<string, MarketingTrendRow>,
  rows: DailyTotalRow[],
  key: 'crmLeads' | 'paidCrmLeads',
) {
  for (const row of rows) {
    const day = byDate.get(String(row.date));
    if (day) day[key] = Number(row.total || 0);
  }
}

function enumerateDates(from: string, to: string) {
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
