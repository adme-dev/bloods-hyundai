<!-- app/components/admin/dashboard/MarketingPlatformMetrics.vue -->
<template>
  <Card>
    <CardHeader class="space-y-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle class="flex items-center gap-2">
            <BarChart3 class="h-5 w-5 text-sky-600" />
            Platform Performance
          </CardTitle>
          <CardDescription>
            Meta Ads, Google Ads and GA4 for {{ rangeLabel }}
            <span v-if="lastSyncLabel" class="ml-1 text-xs">· last synced {{ lastSyncLabel }}</span>
          </CardDescription>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" :disabled="!data?.campaigns?.length" @click="downloadCsv">
            <Download class="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button size="sm" variant="outline" :disabled="syncing" @click="refreshNow">
            <RefreshCw class="h-3.5 w-3.5" :class="syncing ? 'animate-spin' : ''" />
            {{ syncing ? 'Syncing...' : 'Refresh' }}
          </Button>
        </div>
      </div>

      <div class="flex flex-col gap-3 rounded-md border bg-muted/20 p-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="preset in presets"
            :key="preset.id"
            size="sm"
            :variant="activePreset === preset.id ? 'default' : 'outline'"
            @click="applyPreset(preset.id)"
          >
            {{ preset.label }}
          </Button>
        </div>

        <div class="grid gap-3 sm:grid-cols-[minmax(0,160px)_minmax(0,160px)]">
          <label class="space-y-1 text-xs font-medium text-muted-foreground">
            From
            <Input v-model="from" type="date" :max="to" class="h-9" />
          </label>
          <label class="space-y-1 text-xs font-medium text-muted-foreground">
            To
            <Input v-model="to" type="date" :min="from" :max="today" class="h-9" />
          </label>
        </div>
      </div>
    </CardHeader>

    <CardContent>
      <div v-if="pending" class="py-8 text-center text-sm text-muted-foreground">Loading platform metrics...</div>

      <template v-else-if="data">
        <div class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div v-for="kpi in paidKpis" :key="kpi.label" class="rounded-md border bg-background p-4">
            <div class="mb-2 flex items-center justify-between gap-2">
              <span class="text-xs font-medium uppercase tracking-normal text-muted-foreground">{{ kpi.label }}</span>
              <component :is="kpi.icon" class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-2xl font-semibold leading-tight">{{ kpi.value }}</div>
            <div v-if="kpi.caption" class="mt-1 text-xs text-muted-foreground">{{ kpi.caption }}</div>
          </div>
        </div>

        <div class="mb-6 grid gap-3 lg:grid-cols-3">
          <div class="rounded-md border p-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <span class="text-sm font-semibold">GA4 Website</span>
              <span v-if="data.platforms.ga4.lastError" class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-900 dark:text-amber-300">sync failed</span>
            </div>
            <template v-if="data.platforms.ga4.connected">
              <div class="grid grid-cols-3 gap-2 text-center">
                <div v-for="metric in ga4Cells" :key="metric.label">
                  <div class="text-lg font-bold">{{ metric.value }}</div>
                  <div class="text-[10px] text-muted-foreground">{{ metric.label }}</div>
                </div>
              </div>
            </template>
            <p v-else class="text-xs text-muted-foreground">Not connected. GA4 needs the property ID and service account key.</p>
          </div>

          <div class="rounded-md border p-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <span class="text-sm font-semibold">Meta Ads</span>
              <span v-if="data.platforms.meta_ads.lastError" class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-900 dark:text-amber-300">sync failed</span>
            </div>
            <template v-if="data.platforms.meta_ads.connected">
              <div class="grid grid-cols-2 gap-2 text-center">
                <div v-for="metric in metaAdsCells" :key="metric.label">
                  <div class="text-lg font-bold">{{ metric.value }}</div>
                  <div class="text-[10px] text-muted-foreground">{{ metric.label }}</div>
                </div>
              </div>
            </template>
            <p v-else class="text-xs text-muted-foreground">Not connected. Meta needs the ad account ID and system-user token.</p>
          </div>

          <div class="rounded-md border p-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <span class="text-sm font-semibold">Google Ads</span>
              <span v-if="data.platforms.google_ads.lastError" class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-900 dark:text-amber-300">sync failed</span>
            </div>
            <template v-if="data.platforms.google_ads.connected">
              <div class="grid grid-cols-2 gap-2 text-center">
                <div v-for="metric in googleAdsCells" :key="metric.label">
                  <div class="text-lg font-bold">{{ metric.value }}</div>
                  <div class="text-[10px] text-muted-foreground">{{ metric.label }}</div>
                </div>
              </div>
            </template>
            <p v-else class="text-xs text-muted-foreground">Not connected. Google Ads needs the customer ID and API tokens.</p>
          </div>
        </div>

        <div v-if="data.campaigns.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-xs text-muted-foreground">
                <th class="min-w-[260px] py-2 pr-3 font-medium">Campaign</th>
                <th class="py-2 pr-3 text-right font-medium">Spend</th>
                <th class="hidden py-2 pr-3 text-right font-medium md:table-cell">Impressions</th>
                <th class="py-2 pr-3 text-right font-medium">Clicks</th>
                <th class="hidden py-2 pr-3 text-right font-medium lg:table-cell">CTR</th>
                <th class="py-2 pr-3 text-right font-medium">Platform leads</th>
                <th class="py-2 pr-3 text-right font-medium">CRM leads</th>
                <th class="py-2 text-right font-medium">CPL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="campaign in data.campaigns" :key="`${campaign.platform}:${campaign.campaignId}`" class="border-b last:border-0">
                <td class="py-2 pr-3">
                  <span
                    class="mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
                    :class="platformBadgeClass(campaign.platform)"
                  >
                    {{ platformLabel(campaign.platform) }}
                  </span>
                  {{ campaign.campaignName || campaign.campaignId }}
                </td>
                <td class="py-2 pr-3 text-right">{{ campaign.spend ? formatCurrency(campaign.spend) : '-' }}</td>
                <td class="hidden py-2 pr-3 text-right md:table-cell">{{ campaign.impressions ? n(campaign.impressions) : '-' }}</td>
                <td class="py-2 pr-3 text-right">{{ campaign.clicks ? n(campaign.clicks) : '-' }}</td>
                <td class="hidden py-2 pr-3 text-right lg:table-cell">{{ pct(campaign.ctr) }}</td>
                <td class="py-2 pr-3 text-right">{{ n(campaign.platformLeads) }}</td>
                <td class="py-2 pr-3 text-right font-medium">{{ n(campaign.crmLeads) }}</td>
                <td class="py-2 text-right font-medium">{{ cpl(campaign.cpl) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-xs text-muted-foreground">No campaign data for this range.</p>
      </template>

      <p v-else class="py-8 text-center text-sm text-muted-foreground">
        Couldn't load platform metrics. Try refreshing.
      </p>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import {
  BarChart3,
  CalendarDays,
  Download,
  Eye,
  MousePointerClick,
  RefreshCw,
  Target,
  WalletCards,
} from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';

type PlatformId = 'ga4' | 'meta_ads' | 'google_ads' | 'crm';

interface PaidPlatformMetrics {
  connected: boolean;
  spend: number;
  impressions: number;
  clicks: number;
  platformLeads: number;
  crmLeads: number;
  cpl: number | null;
  ctr: number | null;
  platformLeadRate: number | null;
  lastSync: string | null;
  lastError: string | null;
}

interface Ga4Metrics {
  connected: boolean;
  sessions: number;
  users: number;
  conversions: number;
  lastSync: string | null;
  lastError: string | null;
}

interface CampaignMetrics {
  platform: PlatformId;
  campaignId: string;
  campaignName: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  platformLeads: number;
  crmLeads: number;
  cpl: number | null;
  ctr: number | null;
  platformLeadRate: number | null;
}

interface MarketingMetricsResponse {
  period: { from: string; to: string };
  platforms: {
    ga4: Ga4Metrics;
    meta_ads: PaidPlatformMetrics;
    google_ads: PaidPlatformMetrics;
  };
  campaigns: CampaignMetrics[];
}

type PresetId = 'mtd' | '7d' | '30d' | '90d';

const today = isoDate(new Date());
const from = ref(`${today.slice(0, 8)}01`);
const to = ref(today);

const rangeQuery = computed(() => ({ from: from.value, to: to.value }));
const { data, pending, refresh } = useFetch<MarketingMetricsResponse>('/api/admin/analytics/marketing-metrics', {
  lazy: true,
  query: rangeQuery,
});

const syncing = ref(false);
const presets: { id: PresetId; label: string }[] = [
  { id: 'mtd', label: 'Month to date' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
];

const activePreset = computed<PresetId | null>(() => {
  const currentTo = to.value;
  if (currentTo !== today) return null;
  if (from.value === `${today.slice(0, 8)}01`) return 'mtd';
  if (from.value === daysAgo(6)) return '7d';
  if (from.value === daysAgo(29)) return '30d';
  if (from.value === daysAgo(89)) return '90d';
  return null;
});

const paidTotals = computed(() => {
  const platforms = data.value
    ? [data.value.platforms.meta_ads, data.value.platforms.google_ads]
    : [];

  const totals = platforms.reduce((acc, platform) => {
    acc.spend += platform.spend || 0;
    acc.impressions += platform.impressions || 0;
    acc.clicks += platform.clicks || 0;
    acc.platformLeads += platform.platformLeads || 0;
    acc.crmLeads += platform.crmLeads || 0;
    return acc;
  }, { spend: 0, impressions: 0, clicks: 0, platformLeads: 0, crmLeads: 0 });

  return {
    ...totals,
    cpl: totals.crmLeads > 0 ? Math.round((totals.spend / totals.crmLeads) * 100) / 100 : null,
    ctr: ratioPercent(totals.clicks, totals.impressions),
  };
});

const paidKpis = computed(() => [
  { label: 'Ad spend', value: formatCurrency(paidTotals.value.spend), caption: 'Meta + Google', icon: WalletCards },
  { label: 'Impressions', value: n(paidTotals.value.impressions), caption: `${pct(paidTotals.value.ctr)} CTR`, icon: Eye },
  { label: 'Clicks', value: n(paidTotals.value.clicks), caption: 'Paid traffic', icon: MousePointerClick },
  { label: 'CRM leads', value: n(paidTotals.value.crmLeads), caption: `${n(paidTotals.value.platformLeads)} platform leads`, icon: Target },
  { label: 'Blended CPL', value: cpl(paidTotals.value.cpl), caption: 'Spend / CRM leads', icon: CalendarDays },
]);

const ga4Cells = computed(() => {
  const ga4 = data.value?.platforms.ga4;
  return ga4
    ? [
        { label: 'Sessions', value: n(ga4.sessions) },
        { label: 'Users', value: n(ga4.users) },
        { label: 'Key events', value: n(ga4.conversions) },
      ]
    : [];
});

const metaAdsCells = computed(() => paidPlatformCells(data.value?.platforms.meta_ads));
const googleAdsCells = computed(() => paidPlatformCells(data.value?.platforms.google_ads));

const rangeLabel = computed(() => {
  if (data.value?.period) return `${displayDate(data.value.period.from)} to ${displayDate(data.value.period.to)}`;
  return `${displayDate(from.value)} to ${displayDate(to.value)}`;
});

const lastSyncLabel = computed(() => {
  const stamps = data.value
    ? [data.value.platforms.ga4.lastSync, data.value.platforms.meta_ads.lastSync, data.value.platforms.google_ads.lastSync].filter(Boolean) as string[]
    : [];
  if (!stamps.length) return null;
  const latest = new Date(stamps.sort().at(-1)!);
  const mins = Math.max(0, Math.round((Date.now() - latest.getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
});

async function refreshNow() {
  syncing.value = true;
  try {
    try {
      await $fetch('/api/admin/metrics/sync', { method: 'POST' });
    } catch {
      // The read endpoint surfaces lastError, so keep the panel refreshable.
    }
    await refresh();
  } finally {
    syncing.value = false;
  }
}

function applyPreset(id: PresetId) {
  to.value = today;
  if (id === 'mtd') from.value = `${today.slice(0, 8)}01`;
  if (id === '7d') from.value = daysAgo(6);
  if (id === '30d') from.value = daysAgo(29);
  if (id === '90d') from.value = daysAgo(89);
}

function downloadCsv() {
  if (!data.value) return;

  const rows = [
    ['type', 'platform', 'campaign', 'spend', 'impressions', 'clicks', 'ctr_percent', 'platform_leads', 'crm_leads', 'cpl'],
    ...(['meta_ads', 'google_ads'] as const).map((platform) => {
      const p = data.value!.platforms[platform];
      return ['platform', platformLabel(platform), '', p.spend, p.impressions, p.clicks, p.ctr ?? '', p.platformLeads, p.crmLeads, p.cpl ?? ''];
    }),
    ...data.value.campaigns.map((campaign) => [
      'campaign',
      platformLabel(campaign.platform),
      campaign.campaignName || campaign.campaignId,
      campaign.spend,
      campaign.impressions,
      campaign.clicks,
      campaign.ctr ?? '',
      campaign.platformLeads,
      campaign.crmLeads,
      campaign.cpl ?? '',
    ]),
  ];

  const csv = rows.map(row => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `marketing-metrics-${data.value.period.from}-to-${data.value.period.to}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function platformLabel(platform: PlatformId) {
  if (platform === 'meta_ads') return 'Meta';
  if (platform === 'google_ads') return 'Google';
  if (platform === 'ga4') return 'GA4';
  return 'CRM';
}

function platformBadgeClass(platform: PlatformId) {
  if (platform === 'meta_ads') return 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300';
  if (platform === 'google_ads') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
}

function paidPlatformCells(platform?: PaidPlatformMetrics) {
  if (!platform) return [];
  return [
    { label: 'Spend', value: formatCurrency(platform.spend) },
    { label: 'Impressions', value: n(platform.impressions) },
    { label: 'Clicks', value: n(platform.clicks) },
    { label: 'CTR', value: pct(platform.ctr) },
    { label: 'CRM / platform leads', value: `${n(platform.crmLeads)} / ${n(platform.platformLeads)}` },
    { label: 'CPL', value: cpl(platform.cpl) },
  ];
}

function daysAgo(days: number) {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return isoDate(date);
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00Z`));
}

function ratioPercent(numerator: number, denominator: number) {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 10000) / 100;
}

function csvCell(value: unknown) {
  const str = String(value ?? '');
  return `"${str.replaceAll('"', '""')}"`;
}

const n = (v: number) => new Intl.NumberFormat('en-AU').format(v || 0);
const pct = (v: number | null) => (v == null ? '-' : `${new Intl.NumberFormat('en-AU', { maximumFractionDigits: 2 }).format(v)}%`);
const cpl = (v: number | null) => (v == null ? '-' : formatCurrency(v, true));
</script>
