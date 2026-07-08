<!-- app/components/admin/dashboard/MarketingPlatformMetrics.vue -->
<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="flex items-center gap-2">
            <BarChart3 class="h-5 w-5 text-indigo-500" />
            Platform Performance
          </CardTitle>
          <CardDescription>
            GA4, Meta Ads and Google Ads — month to date
            <span v-if="lastSyncLabel" class="ml-1 text-xs">· last synced {{ lastSyncLabel }}</span>
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" :disabled="syncing" @click="refreshNow">
          <RefreshCw class="mr-1 h-3 w-3" :class="syncing ? 'animate-spin' : ''" />
          {{ syncing ? 'Syncing…' : 'Refresh' }}
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="pending" class="py-8 text-center text-sm text-muted-foreground">Loading platform metrics…</div>
      <template v-else-if="data">
        <!-- Platform cards -->
        <div class="grid gap-3 sm:grid-cols-3 mb-6">
          <!-- GA4 -->
          <div class="rounded-lg border p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold">GA4 Website</span>
              <span v-if="data.platforms.ga4.lastError" class="text-[10px] rounded bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">sync failed</span>
            </div>
            <template v-if="data.platforms.ga4.connected">
              <div class="grid grid-cols-3 gap-2 text-center">
                <div><div class="text-lg font-bold">{{ n(data.platforms.ga4.sessions) }}</div><div class="text-[10px] text-muted-foreground">Sessions</div></div>
                <div><div class="text-lg font-bold">{{ n(data.platforms.ga4.users) }}</div><div class="text-[10px] text-muted-foreground">Users</div></div>
                <div><div class="text-lg font-bold">{{ n(data.platforms.ga4.conversions) }}</div><div class="text-[10px] text-muted-foreground">Key events</div></div>
              </div>
            </template>
            <p v-else class="text-xs text-muted-foreground">Not connected — set the GA4 property ID and service-account key (see marketing metrics runbook).</p>
          </div>
          <!-- Meta Ads -->
          <div class="rounded-lg border p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold">Meta Ads</span>
              <span v-if="data.platforms.meta_ads.lastError" class="text-[10px] rounded bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">sync failed</span>
            </div>
            <template v-if="data.platforms.meta_ads.connected">
              <div class="grid grid-cols-2 gap-2 text-center">
                <div><div class="text-lg font-bold">{{ formatCurrency(data.platforms.meta_ads.spend) }}</div><div class="text-[10px] text-muted-foreground">Spend</div></div>
                <div><div class="text-lg font-bold">{{ n(data.platforms.meta_ads.clicks) }}</div><div class="text-[10px] text-muted-foreground">Clicks</div></div>
                <div><div class="text-lg font-bold">{{ n(data.platforms.meta_ads.crmLeads) }}<span class="text-xs text-muted-foreground font-normal"> / {{ n(data.platforms.meta_ads.platformLeads) }}</span></div><div class="text-[10px] text-muted-foreground">CRM / platform leads</div></div>
                <div><div class="text-lg font-bold">{{ cpl(data.platforms.meta_ads.cpl) }}</div><div class="text-[10px] text-muted-foreground">CPL</div></div>
              </div>
            </template>
            <p v-else class="text-xs text-muted-foreground">Not connected — set the Meta ad account ID and system-user token.</p>
          </div>
          <!-- Google Ads -->
          <div class="rounded-lg border p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold">Google Ads</span>
              <span v-if="data.platforms.google_ads.lastError" class="text-[10px] rounded bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">sync failed</span>
            </div>
            <template v-if="data.platforms.google_ads.connected">
              <div class="grid grid-cols-2 gap-2 text-center">
                <div><div class="text-lg font-bold">{{ formatCurrency(data.platforms.google_ads.spend) }}</div><div class="text-[10px] text-muted-foreground">Spend</div></div>
                <div><div class="text-lg font-bold">{{ n(data.platforms.google_ads.clicks) }}</div><div class="text-[10px] text-muted-foreground">Clicks</div></div>
                <div><div class="text-lg font-bold">{{ n(data.platforms.google_ads.crmLeads) }}<span class="text-xs text-muted-foreground font-normal"> / {{ n(data.platforms.google_ads.platformLeads) }}</span></div><div class="text-[10px] text-muted-foreground">CRM / platform leads</div></div>
                <div><div class="text-lg font-bold">{{ cpl(data.platforms.google_ads.cpl) }}</div><div class="text-[10px] text-muted-foreground">CPL</div></div>
              </div>
            </template>
            <p v-else class="text-xs text-muted-foreground">Not connected — set the Google Ads customer ID and API tokens.</p>
          </div>
        </div>

        <!-- Campaign table -->
        <div v-if="data.campaigns.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-xs text-muted-foreground">
                <th class="py-2 pr-2 font-medium">Campaign</th>
                <th class="py-2 pr-2 font-medium text-right">Spend</th>
                <th class="py-2 pr-2 font-medium text-right">Clicks</th>
                <th class="py-2 pr-2 font-medium text-right">Platform leads</th>
                <th class="py-2 pr-2 font-medium text-right">CRM leads</th>
                <th class="py-2 font-medium text-right">CPL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in data.campaigns" :key="`${c.platform}:${c.campaignId}`" class="border-b last:border-0">
                <td class="py-2 pr-2">
                  <span class="mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
                        :class="c.platform === 'meta_ads' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : c.platform === 'google_ads' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'">
                    {{ c.platform === 'meta_ads' ? 'Meta' : c.platform === 'google_ads' ? 'Google' : 'CRM' }}
                  </span>
                  {{ c.campaignName || c.campaignId }}
                </td>
                <td class="py-2 pr-2 text-right">{{ c.spend ? formatCurrency(c.spend) : '—' }}</td>
                <td class="py-2 pr-2 text-right">{{ c.clicks ? n(c.clicks) : '—' }}</td>
                <td class="py-2 pr-2 text-right">{{ n(c.platformLeads) }}</td>
                <td class="py-2 pr-2 text-right font-medium">{{ n(c.crmLeads) }}</td>
                <td class="py-2 text-right font-medium">{{ cpl(c.cpl) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-xs text-muted-foreground">No campaign data yet — connect a platform and run a sync.</p>
      </template>
      <p v-else class="py-8 text-center text-sm text-muted-foreground">
        Couldn't load platform metrics — try refreshing.
      </p>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { BarChart3, RefreshCw } from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';

const { data, pending, refresh } = useFetch('/api/admin/analytics/marketing-metrics', { lazy: true });

const syncing = ref(false);
async function refreshNow() {
  syncing.value = true;
  try {
    try {
      await $fetch('/api/admin/metrics/sync', { method: 'POST' });
    } catch {
      // Swallow — refresh() below still runs so the sync-failed badge
      // (driven by lastError from the read endpoint) shows the failure
      // instead of leaving an unhandled rejection.
    }
    await refresh();
  } finally {
    syncing.value = false;
  }
}

const lastSyncLabel = computed(() => {
  const stamps = data.value
    ? [data.value.platforms.ga4.lastSync, data.value.platforms.meta_ads.lastSync, data.value.platforms.google_ads.lastSync].filter(Boolean) as string[]
    : [];
  if (!stamps.length) return null;
  const latest = new Date(stamps.sort().at(-1)!);
  const mins = Math.round((Date.now() - latest.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
});

const n = (v: number) => new Intl.NumberFormat('en-AU').format(v || 0);
const cpl = (v: number | null) => (v == null ? '—' : formatCurrency(v, true));
</script>
