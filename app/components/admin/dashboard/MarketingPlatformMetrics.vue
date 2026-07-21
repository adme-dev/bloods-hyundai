<!-- app/components/admin/dashboard/MarketingPlatformMetrics.vue -->
<template>
  <Card class="overflow-hidden shadow-sm">
    <CardHeader class="space-y-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <CardTitle class="flex items-center gap-2 text-2xl">
              <BarChart3 class="h-5 w-5 text-sky-600" />
              Platform Performance
            </CardTitle>
            <span v-if="lastSyncLabel" class="rounded-full border bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Live · synced {{ lastSyncLabel }}
            </span>
          </div>
          <CardDescription class="mt-1">
            Paid media, GA4 website signals and admin CRM lead matching for {{ rangeLabel }}
          </CardDescription>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" as-child>
            <NuxtLink to="/admin/marketing-report">
              <FileBarChart2 class="h-3.5 w-3.5" />
              Detailed report
            </NuxtLink>
          </Button>
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

      <div class="flex flex-col gap-3 rounded-md border bg-slate-50 p-3 dark:bg-slate-950/30 xl:flex-row xl:items-end xl:justify-between">
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

        <Button
          variant="outline"
          class="w-full justify-start md:hidden"
          @click="dateSheetOpen = true"
        >
          <CalendarDays class="h-4 w-4" />
          <span class="min-w-0 truncate">{{ compactRangeLabel }}</span>
        </Button>

        <div class="hidden gap-3 md:grid md:grid-cols-[minmax(0,160px)_minmax(0,160px)]">
          <div class="space-y-1 text-xs font-medium text-muted-foreground">
            <span>From</span>
            <AdminDatePicker v-model="from" label="From date" :max="to" />
          </div>
          <div class="space-y-1 text-xs font-medium text-muted-foreground">
            <span>To</span>
            <AdminDatePicker v-model="to" label="To date" :min="from" :max="today" />
          </div>
        </div>
      </div>
    </CardHeader>

    <Sheet v-model:open="dateSheetOpen">
      <SheetContent
        side="bottom"
        class="max-h-[88dvh] overflow-y-auto rounded-t-2xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5"
      >
        <SheetHeader class="pr-8 text-left">
          <SheetTitle>Choose reporting dates</SheetTitle>
          <SheetDescription>Select the start and end date for platform performance.</SheetDescription>
        </SheetHeader>

        <div class="mt-5 space-y-4">
          <div class="grid grid-cols-2 rounded-lg bg-muted p-1" role="tablist" aria-label="Date boundary">
            <Button
              v-for="boundary in dateBoundaries"
              :key="boundary.id"
              type="button"
              size="sm"
              :variant="activeDateBoundary === boundary.id ? 'secondary' : 'ghost'"
              role="tab"
              :aria-selected="activeDateBoundary === boundary.id"
              @click="activeDateBoundary = boundary.id"
            >
              <span class="flex min-w-0 flex-col items-start leading-tight">
                <span class="text-[11px] text-muted-foreground">{{ boundary.label }}</span>
                <span class="truncate text-xs font-semibold">{{ displayDate(boundary.id === 'from' ? from : to) }}</span>
              </span>
            </Button>
          </div>

          <div class="w-full rounded-xl border bg-background shadow-sm">
            <Calendar
              fluid
              :model-value="activeCalendarValue"
              :is-date-disabled="isMobileDateDisabled"
              initial-focus
              @update:model-value="selectMobileDate"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" @click="dateSheetOpen = false">Cancel</Button>
            <Button type="button" @click="dateSheetOpen = false">Apply dates</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <CardContent>
      <div v-if="pending" class="py-8 text-center text-sm text-muted-foreground">Loading platform metrics...</div>

      <template v-else-if="data">
        <div class="dashboard-compact-kpis mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div v-for="kpi in executiveKpis" :key="kpi.label" class="rounded-md border bg-background p-4">
            <div class="mb-2 flex items-center justify-between gap-2">
              <span class="text-xs font-medium uppercase text-muted-foreground">{{ kpi.label }}</span>
              <component :is="kpi.icon" class="h-4 w-4" :class="kpi.iconClass" />
            </div>
            <div class="text-2xl font-semibold leading-tight text-slate-950 dark:text-slate-50">{{ kpi.value }}</div>
            <div v-if="kpi.caption" class="mt-1 text-xs text-muted-foreground">{{ kpi.caption }}</div>
          </div>
        </div>

        <div class="dashboard-compact-kpis mb-6 grid grid-cols-2 gap-3 xl:grid-cols-5">
          <div v-for="kpi in paidKpis" :key="kpi.label" class="rounded-md border bg-muted/20 p-4">
            <div class="mb-2 flex items-center justify-between gap-2">
              <span class="text-xs font-medium uppercase tracking-normal text-muted-foreground">{{ kpi.label }}</span>
              <component :is="kpi.icon" class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-xl font-semibold leading-tight">{{ kpi.value }}</div>
            <div v-if="kpi.caption" class="mt-1 text-xs text-muted-foreground">{{ kpi.caption }}</div>
          </div>
        </div>

        <div class="mb-6 grid gap-3 lg:grid-cols-3">
          <div v-for="platform in platformCards" :key="platform.id" class="rounded-md border bg-background p-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <component :is="platform.icon" class="h-4 w-4" :class="platform.iconClass" />
                <span class="text-sm font-semibold">{{ platform.label }}</span>
              </div>
              <Badge :variant="platform.badgeVariant">{{ platform.badge }}</Badge>
            </div>
            <template v-if="platform.connected">
              <div class="grid gap-2 text-center" :class="platform.id === 'ga4' ? 'grid-cols-3' : 'grid-cols-2'">
                <div v-for="metric in platform.metrics" :key="metric.label" class="rounded-md bg-muted/30 p-2">
                  <div class="text-lg font-bold">{{ metric.value }}</div>
                  <div class="text-[10px] text-muted-foreground">{{ metric.label }}</div>
                </div>
              </div>
              <p v-if="platform.helper" class="mt-3 text-xs text-muted-foreground">{{ platform.helper }}</p>
            </template>
            <p v-else class="text-xs text-muted-foreground">{{ platform.notConnectedText }}</p>
          </div>
        </div>

        <div v-if="data.campaigns.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-muted/20 text-left text-xs text-muted-foreground">
                <th class="min-w-[260px] py-2 pr-3 font-medium">Campaign</th>
                <th class="py-2 pr-3 text-right font-medium">Spend</th>
                <th class="hidden py-2 pr-3 text-right font-medium md:table-cell">Impressions</th>
                <th class="py-2 pr-3 text-right font-medium">Clicks</th>
                <th class="hidden py-2 pr-3 text-right font-medium lg:table-cell">CTR</th>
                <th class="py-2 pr-3 text-right font-medium">Platform leads</th>
                <th class="py-2 pr-3 text-right font-medium">Admin CRM leads</th>
                <th class="hidden py-2 pr-3 font-medium xl:table-cell">Match</th>
                <th class="py-2 text-right font-medium">CPL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="campaign in data.campaigns" :key="`${campaign.platform}:${campaign.campaignId}`" class="border-b transition-colors hover:bg-muted/20 last:border-0">
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
                <td class="hidden py-2 pr-3 xl:table-cell">
                  <span class="rounded px-1.5 py-0.5 text-[10px] font-medium" :class="campaignMatchClass(campaign)">
                    {{ campaignMatchLabel(campaign) }}
                  </span>
                </td>
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
  Activity,
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileBarChart2,
  MousePointerClick,
  RefreshCw,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-vue-next';
import { parseDate, type DateValue } from '@internationalized/date';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Calendar } from '~/components/ui/calendar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { formatAdminDate } from '~/utils/dashboardFormat';
import { defaultMarketingDateRange, reportDateInTimeZone } from '~/utils/marketingReportFormat';

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
type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';
type DateBoundary = 'from' | 'to';

const today = reportDateInTimeZone();
const defaultDateRange = defaultMarketingDateRange(today);
const from = ref(defaultDateRange.from);
const to = ref(defaultDateRange.to);
const dateSheetOpen = ref(false);
const activeDateBoundary = ref<DateBoundary>('from');
const dateBoundaries: { id: DateBoundary; label: string }[] = [
  { id: 'from', label: 'From' },
  { id: 'to', label: 'To' },
];

const compactRangeLabel = computed(() => `${displayDate(from.value)} – ${displayDate(to.value)}`);
const activeCalendarValue = computed<DateValue>(() => parseDate(activeDateBoundary.value === 'from' ? from.value : to.value));

function isMobileDateDisabled(date: DateValue) {
  const value = date.toString();
  if (value > today) return true;
  if (activeDateBoundary.value === 'from') return value > to.value;
  return value < from.value;
}

function selectMobileDate(value: DateValue | undefined) {
  if (!value) return;
  if (activeDateBoundary.value === 'from') {
    from.value = value.toString();
    activeDateBoundary.value = 'to';
    return;
  }
  to.value = value.toString();
}

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

const crmMatchRate = computed(() => ratioPercent(paidTotals.value.crmLeads, paidTotals.value.platformLeads));
const websiteKeyEventRate = computed(() => ratioPercent(data.value?.platforms.ga4.conversions || 0, data.value?.platforms.ga4.sessions || 0));

const executiveKpis = computed(() => [
  {
    label: 'Paid media',
    value: formatCurrency(paidTotals.value.spend),
    caption: `${n(paidTotals.value.clicks)} clicks · ${pct(paidTotals.value.ctr)} CTR`,
    icon: WalletCards,
    iconClass: 'text-sky-600',
  },
  {
    label: 'Admin CRM match',
    value: n(paidTotals.value.crmLeads),
    caption: `${pct(crmMatchRate.value)} of platform leads matched into this admin CRM`,
    icon: Target,
    iconClass: 'text-violet-600',
  },
  {
    label: 'Website signal',
    value: n(data.value?.platforms.ga4.conversions || 0),
    caption: `${n(data.value?.platforms.ga4.sessions || 0)} sessions · ${pct(websiteKeyEventRate.value)} key event rate`,
    icon: Activity,
    iconClass: 'text-emerald-600',
  },
  {
    label: 'Data freshness',
    value: lastSyncLabel.value || 'No sync',
    caption: connectionCaption.value,
    icon: TrendingUp,
    iconClass: 'text-slate-600',
  },
]);

const connectionCaption = computed(() => {
  if (!data.value) return 'Waiting for platform status';
  const connected = [
    data.value.platforms.ga4.connected,
    data.value.platforms.meta_ads.connected,
    data.value.platforms.google_ads.connected,
  ].filter(Boolean).length;
  return `${connected} of 3 integrations connected`;
});

const paidKpis = computed(() => [
  { label: 'Ad spend', value: formatCurrency(paidTotals.value.spend), caption: 'Meta + Google', icon: WalletCards },
  { label: 'Impressions', value: n(paidTotals.value.impressions), caption: `${pct(paidTotals.value.ctr)} CTR`, icon: Eye },
  { label: 'Clicks', value: n(paidTotals.value.clicks), caption: 'Paid traffic', icon: MousePointerClick },
  { label: 'Admin CRM leads', value: n(paidTotals.value.crmLeads), caption: `${n(paidTotals.value.platformLeads)} platform leads`, icon: Target },
  { label: 'Blended CPL', value: cpl(paidTotals.value.cpl), caption: 'Spend / admin CRM leads', icon: CalendarDays },
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

const platformCards = computed(() => {
  const ga4 = data.value?.platforms.ga4;
  const meta = data.value?.platforms.meta_ads;
  const google = data.value?.platforms.google_ads;
  return [
    {
      id: 'ga4',
      label: 'GA4 Website',
      connected: Boolean(ga4?.connected),
      badge: ga4?.lastError ? 'Sync failed' : ga4?.connected ? 'Connected' : 'Setup needed',
      badgeVariant: (ga4?.lastError ? 'destructive' : ga4?.connected ? 'default' : 'outline') as BadgeVariant,
      icon: ga4?.lastError ? AlertCircle : CheckCircle2,
      iconClass: ga4?.lastError ? 'text-amber-600' : ga4?.connected ? 'text-emerald-600' : 'text-muted-foreground',
      metrics: ga4Cells.value,
      helper: `${pct(websiteKeyEventRate.value)} key event rate across selected sessions`,
      notConnectedText: 'Not connected. GA4 needs the property ID and service account key.',
    },
    {
      id: 'meta_ads',
      label: 'Meta Ads',
      connected: Boolean(meta?.connected),
      badge: meta?.lastError ? 'Sync failed' : meta?.connected ? 'Connected' : 'Setup needed',
      badgeVariant: (meta?.lastError ? 'destructive' : meta?.connected ? 'default' : 'outline') as BadgeVariant,
      icon: meta?.lastError ? AlertCircle : CheckCircle2,
      iconClass: meta?.lastError ? 'text-amber-600' : meta?.connected ? 'text-emerald-600' : 'text-muted-foreground',
      metrics: metaAdsCells.value,
      helper: `${n(meta?.crmLeads || 0)} admin CRM leads from ${n(meta?.platformLeads || 0)} platform leads`,
      notConnectedText: 'Not connected. Meta needs the ad account ID and system-user token.',
    },
    {
      id: 'google_ads',
      label: 'Google Ads',
      connected: Boolean(google?.connected),
      badge: google?.lastError ? 'Sync failed' : google?.connected ? 'Connected' : 'Setup needed',
      badgeVariant: (google?.lastError ? 'destructive' : google?.connected ? 'default' : 'outline') as BadgeVariant,
      icon: google?.lastError ? AlertCircle : CheckCircle2,
      iconClass: google?.lastError ? 'text-amber-600' : google?.connected ? 'text-emerald-600' : 'text-muted-foreground',
      metrics: googleAdsCells.value,
      helper: `${n(google?.crmLeads || 0)} admin CRM leads from ${n(google?.platformLeads || 0)} platform leads`,
      notConnectedText: 'Not connected. Google Ads needs the customer ID and API tokens.',
    },
  ];
});

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
  return 'bg-muted text-muted-foreground';
}

function paidPlatformCells(platform?: PaidPlatformMetrics) {
  if (!platform) return [];
  return [
    { label: 'Spend', value: formatCurrency(platform.spend) },
    { label: 'Impressions', value: n(platform.impressions) },
    { label: 'Clicks', value: n(platform.clicks) },
    { label: 'CTR', value: pct(platform.ctr) },
    { label: 'Admin CRM / platform leads', value: `${n(platform.crmLeads)} / ${n(platform.platformLeads)}` },
    { label: 'CPL', value: cpl(platform.cpl) },
  ];
}

function campaignMatchLabel(campaign: CampaignMetrics) {
  if (campaign.crmLeads > 0 && campaign.platformLeads > 0) return 'Matched';
  if (campaign.crmLeads > 0) return 'CRM only';
  if (campaign.platformLeads > 0) return 'Platform only';
  return 'No leads';
}

function campaignMatchClass(campaign: CampaignMetrics) {
  if (campaign.crmLeads > 0 && campaign.platformLeads > 0) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
  if (campaign.crmLeads > 0) return 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300';
  if (campaign.platformLeads > 0) return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
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
  return formatAdminDate(value);
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
