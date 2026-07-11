<template>
  <div class="marketing-hub">
    <header class="marketing-hub__header">
      <div class="marketing-hub__header-row">
        <div>
          <p class="marketing-hub__eyebrow">Bloods Hyundai · Admin</p>
          <h1>Marketing Hub</h1>
          <p class="marketing-hub__subtitle">Spend, website, attribution and CRM capture — one commercial view.</p>
        </div>

        <div class="marketing-hub__range-wrap">
          <div class="marketing-hub__daterange" aria-label="Report date range">
            <button
              v-for="preset in presets"
              :key="preset.id"
              type="button"
              :class="{ on: activePreset === preset.id }"
              :aria-pressed="activePreset === preset.id"
              @click="applyPreset(preset.id)"
            >
              {{ preset.label }}
            </button>
            <button
              type="button"
              :class="{ on: activePreset === null }"
              :aria-expanded="customRangeOpen"
              @click="customRangeOpen = !customRangeOpen"
            >
              {{ compactRangeLabel }} <ChevronDown aria-hidden="true" />
            </button>
          </div>
          <div v-if="customRangeOpen" class="marketing-hub__custom-range">
            <label>From <input v-model="from" type="date" :max="to"></label>
            <label>To <input v-model="to" type="date" :min="from" :max="today"></label>
          </div>
          <p class="marketing-hub__synced">
            <span class="marketing-hub__live" />
            {{ syncStatusText }}
            <button type="button" :disabled="pending" aria-label="Refresh report" @click="refresh()">
              <RefreshCw :class="{ spinning: pending }" aria-hidden="true" />
            </button>
          </p>
        </div>
      </div>

      <div v-if="data && attributionNeedsAttention" class="marketing-hub__insight" role="status">
        <div class="marketing-hub__insight-icon"><TriangleAlert aria-hidden="true" /></div>
        <div>
          <h2>Attribution isn’t connected yet — the report is running on empty</h2>
          <p>
            {{ money(data.insights.executive.totalSpend) }} spent this period, but
            <strong>{{ pct(data.summary.campaignCoverage) }} of leads carry a campaign tag</strong> and
            <strong>{{ n(data.summary.paidCrmLeads) }} CRM leads are matched to paid media</strong>.
            Every panel below is built and working; tagging the ad URLs lights up this entire hub.
          </p>
        </div>
        <NuxtLink class="marketing-hub__action ui-button" to="/admin/settings">Fix ad tracking <ArrowRight aria-hidden="true" /></NuxtLink>
      </div>
    </header>

    <div v-if="pending" class="marketing-hub__state" aria-live="polite">
      <RefreshCw class="spinning" aria-hidden="true" />
      Loading marketing report…
    </div>

    <div v-else-if="error || !data" class="marketing-hub__state marketing-hub__state--error" role="alert">
      <TriangleAlert aria-hidden="true" />
      <span>Could not load the marketing report.</span>
      <button type="button" class="marketing-hub__action ui-button" @click="refresh()">Try again</button>
    </div>

    <template v-else>
      <section aria-label="Headline metrics">
        <div class="marketing-hub__kpis num">
          <article
            v-for="item in summaryCards"
            :key="item.label"
            class="marketing-hub__kpi"
            :class="{ alert: item.alert }"
          >
            <div class="marketing-hub__kpi-label">
              {{ item.label }}
              <component :is="item.icon" aria-hidden="true" />
            </div>
            <div class="marketing-hub__kpi-value">{{ item.value }}</div>
            <p>{{ item.caption }}</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="executive-title">
        <article class="marketing-hub__card">
          <header class="marketing-hub__panel-head">
            <h2 id="executive-title">
              <ChartNoAxesCombined aria-hidden="true" />
              Executive Readout
              <span class="marketing-hub__quality" :class="qualityClass(data.insights.executive.dataQualityScore)">
                {{ data.insights.executive.dataQualityScore }}% data quality
              </span>
            </h2>
            <p>Commercial view of spend, lead quality, attribution and CRM capture.</p>
          </header>
          <div class="marketing-hub__pad">
            <div class="marketing-hub__funnel num">
              <article v-for="step in data.insights.funnel" :key="step.key" class="marketing-hub__funnel-stage">
                <p>{{ step.label }}</p>
                <strong>{{ n(step.value) }}</strong>
                <span class="marketing-hub__track">
                  <i :style="{ width: `${barPercent(step.value, maxInsightFunnelValue)}%` }" />
                </span>
              </article>
            </div>

            <div class="marketing-hub__split2 marketing-hub__executive-detail">
              <div class="marketing-hub__health">
                <p class="marketing-hub__eyebrow">Data health</p>
                <div v-for="check in data.insights.dataQuality" :key="check.key" class="marketing-hub__health-row">
                  <div>
                    <strong>{{ check.label }}</strong>
                    <span :class="check.status">{{ pct(check.value) }}</span>
                  </div>
                  <div class="marketing-hub__track">
                    <i :class="check.status" :style="{ width: `${Math.min(100, check.value)}%` }" />
                    <b :style="{ left: `${Math.min(100, check.target)}%` }" />
                  </div>
                  <small>Target {{ pct(check.target) }}</small>
                </div>
              </div>

              <div>
                <p class="marketing-hub__eyebrow">Campaign opportunities</p>
                <div v-if="data.insights.campaignDiagnostics.opportunities.length" class="marketing-hub__opportunities">
                  <article
                    v-for="item in data.insights.campaignDiagnostics.opportunities.slice(0, 3)"
                    :key="`${item.platform}:${item.campaignName}`"
                  >
                    <h3>{{ item.campaignName }}</h3>
                    <p class="num">{{ platformLabel(item.platform) }} · {{ money(item.spend) }} · {{ n(item.clicks) }} clicks · {{ n(item.crmLeads) }} CRM leads</p>
                    <span>{{ item.issue }}</span>
                  </article>
                </div>
                <p v-else class="marketing-hub__empty">No high-spend campaign issues detected for this period.</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section aria-label="Connections and lead mix">
        <div class="marketing-hub__split3">
          <article class="marketing-hub__card">
            <header class="marketing-hub__panel-head"><h2>Connections</h2><p>Platform ingestion &amp; sync state.</p></header>
            <div class="marketing-hub__pad">
              <div v-for="connection in connections" :key="connection.label" class="marketing-hub__connection">
                {{ connection.label }}
                <span :class="{ disconnected: !connection.connected }">{{ connection.connected ? 'Connected' : 'Not connected' }}</span>
              </div>
              <div class="marketing-hub__inset">
                <small>External feeds (marketplace / email)</small>
                <strong class="num">{{ n(data.summary.externalMarketplaceLeads) }} leads</strong>
              </div>
            </div>
          </article>

          <article class="marketing-hub__card">
            <header class="marketing-hub__panel-head"><h2>Lead Types</h2><p>CRM enquiry mix for the period.</p></header>
            <div class="marketing-hub__pad marketing-hub__bar-list">
              <BarRow
                v-for="row in data.crm.typeBreakdown.slice(0, 6)"
                :key="row.key"
                :label="formatLabel(row.key)"
                :value="row.total"
                :max="maxTypeTotal"
              />
              <p v-if="!data.crm.typeBreakdown.length" class="marketing-hub__empty">No leads in this range.</p>
            </div>
          </article>

          <article class="marketing-hub__card">
            <header class="marketing-hub__panel-head"><h2>Lead Status</h2><p>Pipeline state of period leads.</p></header>
            <div class="marketing-hub__pad marketing-hub__bar-list">
              <BarRow
                v-for="row in data.crm.statusBreakdown.slice(0, 6)"
                :key="row.key"
                :label="formatLabel(row.key)"
                :value="row.total"
                :max="maxStatusTotal"
              />
              <p v-if="!data.crm.statusBreakdown.length" class="marketing-hub__empty">No lead statuses in this range.</p>
            </div>
          </article>
        </div>
      </section>

      <section aria-labelledby="campaign-title">
        <div class="marketing-hub__section-head">
          <h2 id="campaign-title">Campaign CPL Reconciliation</h2>
          <span />
          <p>Ad rows matched to CRM leads by UTM campaign, ID or name</p>
        </div>
        <article class="marketing-hub__card marketing-hub__table-wrap">
          <table class="num">
            <thead>
              <tr><th>Campaign</th><th>Platform</th><th>Spend</th><th>Impr.</th><th>Clicks</th><th>CTR</th><th>CPC</th><th>Plat. leads</th><th>Lead rate</th><th>CRM leads</th><th>CPL</th></tr>
            </thead>
            <tbody>
              <tr v-for="campaign in data.campaigns" :key="`${campaign.platform}:${campaign.campaignId}`">
                <td><span class="marketing-hub__campaign-name">{{ campaign.campaignName || campaign.campaignId }}</span></td>
                <td><span class="marketing-hub__platform-pill" :class="campaign.platform">{{ platformLabel(campaign.platform) }}</span></td>
                <td>{{ money(campaign.spend) }}</td>
                <td>{{ n(campaign.impressions) }}</td>
                <td>{{ n(campaign.clicks) }}</td>
                <td>{{ pctOrDash(campaign.ctr) }}</td>
                <td>{{ campaign.clicks ? money(campaign.spend / campaign.clicks) : '—' }}</td>
                <td>{{ n(campaign.platformLeads) }}</td>
                <td>{{ pctOrDash(campaign.platformLeadRate) }}</td>
                <td :class="{ zero: campaign.crmLeads === 0 }">{{ n(campaign.crmLeads) }}</td>
                <td :class="{ muted: campaign.cpl == null }">{{ moneyOrDash(campaign.cpl) }}</td>
              </tr>
              <tr v-if="!data.campaigns.length"><td colspan="11" class="marketing-hub__empty-cell">No campaign data in this range.</td></tr>
            </tbody>
          </table>
        </article>
      </section>

      <section aria-label="Platform depth">
        <div class="marketing-hub__split3">
          <MetricPanel title="GA4 Website" description="Engagement quality for the period." :items="ga4Metrics" />
          <MetricPanel title="Paid Media Efficiency" description="Meta &amp; Google blended delivery." :items="paidMediaMetrics" />
          <MetricPanel title="Google Ads Depth" description="Campaign-level metrics from API sync." :items="googleAdsMetrics" />
        </div>
        <p v-if="!avgSaleValueSet && data.professionalMetrics.paidMedia.roas == null" class="marketing-hub__roas-note">
          <NuxtLink to="/admin/settings">Set an average sale value</NuxtLink> to see modeled ROAS.
        </p>
      </section>

      <section aria-labelledby="website-title">
        <div class="marketing-hub__section-head">
          <h2 id="website-title">Website Analytics</h2><span />
          <p class="marketing-hub__status-pill" :class="{ disconnected: data.websiteAnalytics.status !== 'connected' }">{{ websiteAnalyticsStatusLabel }}</p>
        </div>

        <div v-if="data.websiteAnalytics.status === 'connected'" class="marketing-hub__website">
          <div class="marketing-hub__split">
            <article class="marketing-hub__card">
              <header class="marketing-hub__panel-head"><h2>Website performance trend</h2><p>Sessions, key events &amp; CRM leads, indexed to peak.</p></header>
              <div class="marketing-hub__pad">
                <div class="marketing-hub__legend"><span><i class="sessions" />Sessions</span><span><i class="events" />Key events</span><span><i class="leads" />CRM leads</span></div>
                <div v-if="trendHasData" class="marketing-hub__chart">
                  <svg viewBox="0 0 656 190" preserveAspectRatio="none" role="img" aria-label="Website performance trend">
                    <line v-for="y in chartGridLines" :key="y" x1="36" :y1="y" x2="620" :y2="y" />
                    <polyline :points="trendLinePoints('sessions')" class="sessions" />
                    <polyline :points="trendLinePoints('keyEvents')" class="events" />
                    <polyline :points="trendLinePoints('crmLeads')" class="leads" />
                    <circle v-for="point in trendEndPoints" :key="point.key" :cx="point.x" :cy="point.y" r="4" :class="point.key" />
                  </svg>
                  <div><span>{{ chartStartLabel }}</span><span>{{ chartEndLabel }}</span></div>
                </div>
                <p v-else class="marketing-hub__empty">No daily website activity in this range.</p>
              </div>
            </article>

            <article class="marketing-hub__card">
              <header class="marketing-hub__panel-head"><h2>Website → lead funnel</h2><p>Path from visits to CRM.</p></header>
              <div class="marketing-hub__pad marketing-hub__website-funnel num">
                <div v-for="row in websiteFunnelRows" :key="row.label">
                  <p><strong>{{ row.label }}</strong><span>{{ n(row.value) }}</span></p>
                  <span class="marketing-hub__track"><i :style="{ width: `${row.width}%` }" /></span>
                  <small>{{ row.caption }}</small>
                </div>
              </div>
            </article>
          </div>

          <div class="marketing-hub__split marketing-hub__website-detail">
            <article class="marketing-hub__card">
              <header class="marketing-hub__panel-head"><h2>Top landing pages</h2><p>Pages that started sessions.</p></header>
              <div class="marketing-hub__table-wrap">
                <table class="num">
                  <thead><tr><th>Landing page</th><th>Sessions</th><th>Users</th><th>Engaged</th><th>Key events</th></tr></thead>
                  <tbody>
                    <tr v-for="row in data.websiteAnalytics.topLandingPages.slice(0, 8)" :key="dimension(row, 'landingPagePlusQueryString')">
                      <td>{{ cleanLandingPage(dimension(row, 'landingPagePlusQueryString')) }}</td>
                      <td>{{ n(metric(row, 'sessions')) }}</td>
                      <td>{{ n(metric(row, 'activeUsers')) }}</td>
                      <td>{{ fractionPct(metric(row, 'engagementRate')) }}</td>
                      <td>{{ n(metric(row, 'keyEvents')) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>
            <div class="marketing-hub__stack">
              <BreakdownPanel title="Traffic channels" :rows="data.websiteAnalytics.trafficChannels" dimension-key="sessionDefaultChannelGroup" :max="maxChannelSessions" />
              <BreakdownPanel title="Devices" :rows="data.websiteAnalytics.deviceCategories" dimension-key="deviceCategory" :max="maxDeviceSessions" />
            </div>
          </div>
        </div>
        <article v-else class="marketing-hub__card marketing-hub__state">{{ websiteAnalyticsUnavailableMessage }}</article>
      </section>

      <section aria-label="Sources and audit">
        <div class="marketing-hub__split">
          <article class="marketing-hub__card">
            <header class="marketing-hub__panel-head"><h2>Source / medium</h2><p>Where website sessions came from.</p></header>
            <div class="marketing-hub__table-wrap">
              <table class="num">
                <thead><tr><th>Source / medium</th><th>Sessions</th><th>Users</th><th>Key events</th></tr></thead>
                <tbody>
                  <tr v-for="row in data.websiteAnalytics.sourceMedium.slice(0, 8)" :key="dimension(row, 'sessionSourceMedium')">
                    <td>{{ dimension(row, 'sessionSourceMedium') || '(not set)' }}</td>
                    <td>{{ n(metric(row, 'sessions')) }}</td>
                    <td>{{ n(metric(row, 'activeUsers')) }}</td>
                    <td>{{ n(metric(row, 'keyEvents')) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article class="marketing-hub__card">
            <header class="marketing-hub__panel-head">
              <h2><Code2 aria-hidden="true" />Data Layer Audit <span class="marketing-hub__quality mid">{{ dataLayerLabel }}</span></h2>
              <p>Lead-tracking contract &amp; CRM field coverage.</p>
            </header>
            <div class="marketing-hub__pad">
              <div class="marketing-hub__coverage num">
                <article v-for="item in coverageMetrics" :key="item.label" :class="{ ok: item.ok, bad: !item.ok }">
                  <small>{{ item.label }}</small><strong>{{ pct(item.value) }}</strong>
                </article>
              </div>
              <p class="marketing-hub__audit-note">{{ dataLayerHelpText }}</p>
            </div>
          </article>
        </div>
      </section>

      <section aria-labelledby="lead-source-title">
        <article class="marketing-hub__card">
          <header class="marketing-hub__panel-head">
            <h2 id="lead-source-title"><ListFilter aria-hidden="true" />Lead Source Setup <span class="marketing-hub__status-pill">{{ inboundEmailData?.configured ? 'Email domain active' : 'Domain not configured' }}</span></h2>
            <p>External lead inboxes used for attribution &amp; lead-quality checks.</p>
          </header>
          <div class="marketing-hub__pad">
            <div class="marketing-hub__split3">
              <div class="marketing-hub__inset"><small>Configured sources</small><strong class="num">{{ n(inboundEmailData?.addresses?.length || 0) }}</strong></div>
              <div class="marketing-hub__inset"><small>Active sources</small><strong class="num">{{ n(activeInboundLeadSourceCount) }}</strong></div>
              <div class="marketing-hub__inset"><small>Inbound domain</small><strong class="marketing-hub__domain">{{ inboundEmailData?.domain || 'Not configured' }}</strong></div>
            </div>
            <p class="marketing-hub__source-note">
              {{ inboundSourceLabels || 'No inbound sources configured' }} — currently
              <strong>{{ n(data.summary.externalMarketplaceLeads) }} leads</strong> ingested this period.
            </p>
          </div>
        </article>
      </section>

      <section aria-labelledby="breakdowns-title">
        <div class="marketing-hub__section-head"><h2 id="breakdowns-title">Audience &amp; delivery breakdowns</h2><b>Phase 2 · new</b><span /></div>
        <p class="marketing-hub__preview-note">Not in the report yet. Meta &amp; Google expose age, gender, area and device per campaign — we’ll ingest these into a breakdown table so ad <strong>spend</strong> can be sliced the way GA4 traffic already is. Figures below are illustrative until the first breakdown sync runs.</p>
        <div class="marketing-hub__split3">
          <PreviewBars title="Spend by age" :rows="previewAge" />
          <PreviewBars title="Spend by device" :rows="previewDevices" />
          <PreviewBars title="Spend by area" :rows="previewAreas" />
        </div>
      </section>

      <section aria-labelledby="creative-title">
        <div class="marketing-hub__section-head"><h2 id="creative-title">Ad creative</h2><b>Phase 2 · new</b><span /></div>
        <p class="marketing-hub__preview-note">The actual ad images/video pulled from Meta &amp; Google, shown beside their spend and CTR — so you see <strong>what</strong> ran, not just the numbers.</p>
        <div class="marketing-hub__creatives">
          <article v-for="creative in previewCreatives" :key="creative.title" class="marketing-hub__creative">
            <div class="marketing-hub__creative-art" :class="creative.class"><span>{{ creative.platform }}</span><strong>{{ creative.art }}</strong></div>
            <div><h3>{{ creative.title }}</h3><p>Spend <strong class="num">{{ creative.spend }}</strong><span>CTR <strong class="num">{{ creative.ctr }}</strong></span></p></div>
          </article>
        </div>
      </section>

      <section aria-labelledby="builder-title">
        <div class="marketing-hub__section-head"><h2 id="builder-title">Report builder</h2><b class="p3">Phase 3 · new</b><span /><p>Slice any metric by any dimension</p></div>
        <article class="marketing-hub__card marketing-hub__pivot">
          <aside>
            <p class="marketing-hub__eyebrow">Dimensions</p>
            <div><span class="on">Campaign</span><span class="on">Platform</span><span>Age</span><span>Area</span><span>Device</span><span>Time of day</span><span>Landing page</span><span>Source / medium</span></div>
            <p class="marketing-hub__eyebrow">Metrics</p>
            <div><span class="on">Spend</span><span class="on">CRM leads</span><span class="on">CPL</span><span>Clicks</span><span>CTR</span><span>ROAS</span><span>Impr.</span><span>Sessions</span></div>
          </aside>
          <div class="marketing-hub__pivot-main">
            <div class="marketing-hub__wells">
              <div><p class="marketing-hub__eyebrow">Rows</p><span>Platform ×</span><span>Campaign ×</span></div>
              <div><p class="marketing-hub__eyebrow">Values</p><span>Spend ×</span><span>CRM leads ×</span><span>CPL ×</span></div>
            </div>
            <div class="marketing-hub__table-wrap">
              <table class="num"><thead><tr><th>Platform · Campaign</th><th>Spend</th><th>CRM leads</th><th>CPL</th></tr></thead>
                <tbody>
                  <tr v-for="row in previewPivot" :key="row.campaign"><td>{{ row.campaign }}</td><td>{{ row.spend }}</td><td>{{ row.leads }}</td><td>{{ row.cpl }}</td></tr>
                </tbody>
              </table>
            </div>
            <p class="marketing-hub__example">Example output — CRM leads/CPL shown as they’ll read once attribution is live.</p>
          </div>
        </article>
      </section>

      <footer class="marketing-hub__footer">
        <strong>About this report.</strong> Sections above use live data for {{ rangeLabel }}. Sections tagged
        <strong>Phase 2 / Phase 3 · new</strong> are previews and their figures are illustrative. Attribution remains honest:
        unavailable ratios render as “—”, never as a fabricated result.
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue';
import {
  ArrowRight,
  ChartNoAxesCombined,
  ChevronDown,
  Code2,
  Database,
  ListFilter,
  RefreshCw,
  TriangleAlert,
  UserCheck,
  WalletCards,
} from 'lucide-vue-next';
import { formatCurrency } from '~/utils';

definePageMeta({ layout: 'admin', middleware: 'auth' });

type PresetId = 'mtd' | '7d' | '30d' | '90d';
type BreakdownRow = { dimensions: Record<string, string>; metrics: Record<string, number> };
type TrendRow = { date: string; sessions: number; keyEvents: number; crmLeads: number };
type TrendKey = 'sessions' | 'keyEvents' | 'crmLeads';
type MetricItem = { label: string; value: string };

interface ReportResponse {
  period: { from: string; to: string };
  connected: Record<'ga4' | 'meta_ads' | 'google_ads', boolean>;
  avgSaleValue: number | null;
  summary: Record<'totalCrmLeads' | 'paidCrmLeads' | 'externalMarketplaceLeads' | 'utmCoverage' | 'campaignCoverage' | 'paidAttributionCoverage' | 'sourceCoverage' | 'clickIdCoverage' | 'backfilledAttributionCoverage', number>;
  platformMetrics: { ga4: { sessions: number; conversions: number } };
  professionalMetrics: {
    ga4Website: { sessions: number; users: number; engagementRate: number | null; averageSessionDuration: number | null; screenPageViews: number; eventCount: number; eventsPerSession: number | null; conversionRate: number | null; keyEvents: number };
    paidMedia: AdMetrics;
    googleAds: AdMetrics;
  };
  insights: {
    executive: { totalSpend: number; dataQualityScore: number };
    funnel: Array<{ key: string; label: string; value: number }>;
    dataQuality: Array<{ key: string; label: string; value: number; target: number; status: 'good' | 'watch' | 'poor' }>;
    campaignDiagnostics: { opportunities: Array<{ platform: string; campaignName: string; spend: number; clicks: number; crmLeads: number; issue: string }> };
  };
  campaigns: Array<{ platform: string; campaignId: string; campaignName: string | null; spend: number; impressions: number; clicks: number; platformLeads: number; crmLeads: number; cpl: number | null; ctr: number | null; platformLeadRate: number | null }>;
  websiteAnalytics: { status: 'connected' | 'not_configured' | 'error'; error: string | null; dailyTrend: TrendRow[]; topLandingPages: BreakdownRow[]; trafficChannels: BreakdownRow[]; sourceMedium: BreakdownRow[]; deviceCategories: BreakdownRow[]; formEvents: BreakdownRow[]; topEvents: BreakdownRow[] };
  crm: { typeBreakdown: Array<{ key: string; total: number }>; statusBreakdown: Array<{ key: string; total: number }> };
  dataLayer: { status: string };
  syncRuns: Array<{ platform: string; status: string; startedAt: string }>;
}

interface AdMetrics {
  spend: number; impressions: number; clicks: number; ctr: number | null; averageCpc: number | null; cpm: number | null;
  platformLeads: number; platformLeadRate?: number | null; conversionRate?: number | null; costPerConversion?: number | null;
  cpl: number | null; conversionsValue?: number | null; allConversions?: number | null; interactions?: number | null;
  interactionRate?: number | null; searchImpressionShare?: number | null; roas: number | null;
}

interface InboundResponse {
  configured: boolean;
  domain: string | null;
  addresses: Array<{ id: string; label: string; enabled: boolean }>;
}

const today = isoDate(new Date());
const from = ref(`${today.slice(0, 8)}01`);
const to = ref(today);
const customRangeOpen = ref(false);
const query = computed(() => ({ from: from.value, to: to.value }));
const { data, pending, error, refresh } = await useFetch<ReportResponse>('/api/admin/analytics/marketing-report', { query });
const { data: inboundEmailData } = await useFetch<InboundResponse>('/api/admin/lead-ingestion/email-addresses');

const presets: Array<{ id: PresetId; label: string }> = [
  { id: 'mtd', label: 'Month to date' }, { id: '7d', label: '7 days' }, { id: '30d', label: '30 days' }, { id: '90d', label: '90 days' },
];
const activePreset = computed<PresetId | null>(() => {
  if (to.value !== today) return null;
  if (from.value === `${today.slice(0, 8)}01`) return 'mtd';
  if (from.value === daysAgo(6)) return '7d';
  if (from.value === daysAgo(29)) return '30d';
  if (from.value === daysAgo(89)) return '90d';
  return null;
});
const rangeLabel = computed(() => data.value ? `${displayDate(data.value.period.from)} to ${displayDate(data.value.period.to)}` : '');
const compactRangeLabel = computed(() => `${displayShortDate(from.value)} – ${displayShortDate(to.value)}`);
const latestSuccessfulSync = computed(() => data.value?.syncRuns.find(run => run.status === 'success'));
const syncStatusText = computed(() => latestSuccessfulSync.value ? `Platforms synced · ${shortDateTime(latestSuccessfulSync.value.startedAt)}` : 'Waiting for platform sync');
const attributionNeedsAttention = computed(() => (data.value?.summary.paidAttributionCoverage || 0) < 1);
const avgSaleValueSet = computed(() => data.value?.avgSaleValue != null);
const connections = computed(() => [
  { label: 'GA4 Website', connected: Boolean(data.value?.connected.ga4) },
  { label: 'Meta Ads', connected: Boolean(data.value?.connected.meta_ads) },
  { label: 'Google Ads', connected: Boolean(data.value?.connected.google_ads) },
]);
const summaryCards = computed(() => [
  { label: 'Admin CRM leads', value: n(data.value?.summary.totalCrmLeads || 0), caption: `${n(data.value?.summary.paidCrmLeads || 0)} matched to paid media`, icon: UserCheck, alert: false },
  { label: 'Ad spend', value: money(data.value?.insights.executive.totalSpend || 0), caption: `blended CPL ${moneyOrDash(data.value?.professionalMetrics.paidMedia.cpl)}`, icon: WalletCards, alert: false },
  { label: 'Website activity', value: n(data.value?.platformMetrics.ga4.sessions || 0), caption: `${n(data.value?.platformMetrics.ga4.conversions || 0)} GA4 key events`, icon: Database, alert: false },
  { label: 'UTM coverage', value: pct(data.value?.summary.utmCoverage || 0), caption: `${pct(data.value?.summary.campaignCoverage || 0)} campaign tagged`, icon: Code2, alert: (data.value?.summary.utmCoverage || 0) < 50 },
]);
const maxInsightFunnelValue = computed(() => Math.max(...(data.value?.insights.funnel.map(row => row.value) || [1]), 1));
const maxTypeTotal = computed(() => Math.max(...(data.value?.crm.typeBreakdown.map(row => row.total) || [1]), 1));
const maxStatusTotal = computed(() => Math.max(...(data.value?.crm.statusBreakdown.map(row => row.total) || [1]), 1));
const activeInboundLeadSourceCount = computed(() => inboundEmailData.value?.addresses.filter(row => row.enabled).length || 0);
const inboundSourceLabels = computed(() => inboundEmailData.value?.addresses.filter(row => row.enabled).map(row => row.label).join(' · ') || '');

const ga4Metrics = computed<MetricItem[]>(() => {
  const m = data.value?.professionalMetrics.ga4Website;
  return m ? [
    { label: 'Sessions', value: n(m.sessions) }, { label: 'Users', value: n(m.users) },
    { label: 'Engagement', value: fractionPct(m.engagementRate) }, { label: 'Avg session', value: duration(m.averageSessionDuration) },
    { label: 'Page views', value: n(m.screenPageViews) }, { label: 'Events', value: n(m.eventCount) },
    { label: 'Events / session', value: decimal(m.eventsPerSession) }, { label: 'Key event rate', value: pctOrDash(m.conversionRate) },
  ] : [];
});
const paidMediaMetrics = computed<MetricItem[]>(() => {
  const m = data.value?.professionalMetrics.paidMedia;
  return m ? [
    { label: 'Spend', value: money(m.spend) }, { label: 'CPM', value: moneyOrDash(m.cpm) },
    { label: 'Impressions', value: n(m.impressions) }, { label: 'CTR', value: pctOrDash(m.ctr) },
    { label: 'Clicks', value: n(m.clicks) }, { label: 'Avg CPC', value: moneyOrDash(m.averageCpc) },
    { label: 'Platform lead rate', value: pctOrDash(m.platformLeadRate) }, { label: 'CRM CPL', value: moneyOrDash(m.cpl) },
    ...(m.roas != null ? [{ label: 'ROAS', value: roas(m.roas) }] : []),
  ] : [];
});
const googleAdsMetrics = computed<MetricItem[]>(() => {
  const m = data.value?.professionalMetrics.googleAds;
  return m ? [
    { label: 'Conversions', value: n(m.platformLeads) }, { label: 'Conv. rate', value: pctOrDash(m.conversionRate) },
    { label: 'Cost / conv.', value: moneyOrDash(m.costPerConversion) }, { label: 'Conv. value', value: moneyOrDash(m.conversionsValue) },
    { label: 'Interactions', value: m.interactions == null ? '—' : n(m.interactions) }, { label: 'Interaction rate', value: pctOrDash(m.interactionRate) },
    { label: 'Search impr. share', value: fractionPct(m.searchImpressionShare) }, { label: 'All conversions', value: decimal(m.allConversions) },
    ...(m.roas != null ? [{ label: 'ROAS', value: roas(m.roas) }] : []),
  ] : [];
});

const maxChannelSessions = computed(() => maxBreakdown(data.value?.websiteAnalytics.trafficChannels));
const maxDeviceSessions = computed(() => maxBreakdown(data.value?.websiteAnalytics.deviceCategories));
const websiteTrendRows = computed(() => data.value?.websiteAnalytics.dailyTrend || []);
const trendHasData = computed(() => websiteTrendRows.value.some(row => row.sessions || row.keyEvents || row.crmLeads));
const chartGridLines = [57.5, 95, 132.5];
const chartStartLabel = computed(() => websiteTrendRows.value[0]?.date ? displayShortDate(websiteTrendRows.value[0].date) : '');
const chartEndLabel = computed(() => websiteTrendRows.value.at(-1)?.date ? displayShortDate(websiteTrendRows.value.at(-1)!.date) : '');
const trendEndPoints = computed(() => (['sessions', 'keyEvents', 'crmLeads'] as TrendKey[]).map(key => ({ key, ...trendPoint(key, Math.max(0, websiteTrendRows.value.length - 1)) })));
const totalFormEventCount = computed(() => (data.value?.websiteAnalytics.formEvents || []).reduce((sum, row) => sum + metric(row, 'eventCount'), 0));
const websiteFunnelRows = computed(() => {
  const sessions = data.value?.professionalMetrics.ga4Website.sessions || 0;
  const keyEvents = data.value?.professionalMetrics.ga4Website.keyEvents || 0;
  const leads = data.value?.summary.totalCrmLeads || 0;
  const max = Math.max(sessions, totalFormEventCount.value, keyEvents, leads, 1);
  return [
    { label: 'Sessions', value: sessions, caption: 'Website visits (GA4)', width: barPercent(sessions, max) },
    { label: 'Form events', value: totalFormEventCount.value, caption: 'GA4 form activity', width: barPercent(totalFormEventCount.value, max) },
    { label: 'Key events', value: keyEvents, caption: 'GA4 conversions', width: barPercent(keyEvents, max) },
    { label: 'CRM leads', value: leads, caption: 'Stored enquiries', width: barPercent(leads, max) },
  ];
});
const websiteAnalyticsStatusLabel = computed(() => data.value?.websiteAnalytics.status === 'connected' ? 'GA4 connected' : data.value?.websiteAnalytics.status === 'error' ? 'GA4 error' : 'Not connected');
const websiteAnalyticsUnavailableMessage = computed(() => data.value?.websiteAnalytics.status === 'error' ? `GA4 website analytics could not be loaded: ${data.value.websiteAnalytics.error || 'Unknown error'}` : 'GA4 website analytics is not connected for this dealer.');
const coverageMetrics = computed(() => {
  const s = data.value?.summary;
  return s ? [
    { label: 'UTM coverage', value: s.utmCoverage, ok: s.utmCoverage >= 80 }, { label: 'Source coverage', value: s.sourceCoverage, ok: s.sourceCoverage >= 95 },
    { label: 'Campaign coverage', value: s.campaignCoverage, ok: s.campaignCoverage >= 80 }, { label: 'Paid attribution', value: s.paidAttributionCoverage, ok: s.paidAttributionCoverage >= 80 },
    { label: 'Click-ID coverage', value: s.clickIdCoverage, ok: s.clickIdCoverage >= 80 }, { label: 'Backfilled', value: s.backfilledAttributionCoverage, ok: s.backfilledAttributionCoverage >= 80 },
  ] : [];
});
const dataLayerLabel = computed(() => formatLabel(data.value?.dataLayer.status || 'No leads'));
const dataLayerHelpText = computed(() => {
  const total = data.value?.summary.totalCrmLeads || 0;
  if (!total) return 'No admin CRM leads were captured in this range, so field coverage cannot be assessed yet.';
  if (total < 5) return `Only ${n(total)} CRM leads are in range, so percentages can look severe from a small sample.`;
  return 'Coverage compares captured CRM attribution fields with the report targets above.';
});

const previewAge = [{ label: '25–34', value: '$164', width: 100 }, { label: '35–44', value: '$118', width: 72 }, { label: '45–54', value: '$82', width: 50 }, { label: '18–24', value: '$49', width: 30 }, { label: '55+', value: '$30', width: 18 }];
const previewDevices = [{ label: 'Mobile', value: '71%', width: 100 }, { label: 'Desktop', value: '24%', width: 34 }, { label: 'Tablet', value: '5%', width: 7 }];
const previewAreas = [{ label: 'Werribee', value: '$142', width: 100 }, { label: 'Point Cook', value: '$94', width: 66 }, { label: 'Hoppers Cr.', value: '$66', width: 46 }, { label: 'Tarneit', value: '$47', width: 33 }];
const previewCreatives = [
  { title: 'Search — IONIQ 9', platform: 'Google', art: 'IONIQ 9', spend: '$266', ctr: '21.2%', class: 'ioniq' },
  { title: 'PMax — New & Demo', platform: 'Google', art: 'PMAX', spend: '$167', ctr: '1.1%', class: 'pmax' },
  { title: 'Meta Traffic — Offers', platform: 'Meta', art: '▶', spend: '$10', ctr: '1.1%', class: 'meta' },
  { title: 'Service & Trade-in', platform: 'Google', art: 'SERVICE', spend: '—', ctr: '—', class: 'service' },
];
const previewPivot = [
  { campaign: 'Google · Search — IONIQ 9', spend: '$266.32', leads: 13, cpl: '$20.49' },
  { campaign: 'Google · PMax — New & Demo', spend: '$166.80', leads: 6, cpl: '$27.80' },
  { campaign: 'Meta · Traffic — Offers', spend: '$9.83', leads: 2, cpl: '$4.92' },
];

function applyPreset(id: PresetId) {
  to.value = today;
  from.value = id === 'mtd' ? `${today.slice(0, 8)}01` : daysAgo(id === '7d' ? 6 : id === '30d' ? 29 : 89);
  customRangeOpen.value = false;
}
function qualityClass(score: number) { return score >= 80 ? 'ok' : score >= 60 ? 'mid' : 'bad'; }
function platformLabel(value: string) { return value === 'meta_ads' ? 'Meta' : value === 'google_ads' ? 'Google Ads' : value === 'ga4' ? 'GA4' : value; }
function formatLabel(value: string) { return value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase()); }
function cleanLandingPage(value: string) { return !value || value === '(not set)' ? '/' : value; }
function dimension(row: BreakdownRow, key: string) { return row.dimensions[key] || ''; }
function metric(row: BreakdownRow, key: string): number {
  const value = row.metrics[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
function maxBreakdown(rows?: BreakdownRow[]) { return Math.max(...(rows?.map(row => metric(row, 'sessions')) || [1]), 1); }
function barPercent(value: number, max: number) { return max ? Math.max(value > 0 ? 3 : 0, Math.min(100, (value / max) * 100)) : 0; }
function trendLinePoints(key: TrendKey) { return websiteTrendRows.value.map((_, index) => { const p = trendPoint(key, index); return `${p.x},${p.y}`; }).join(' '); }
function trendPoint(key: TrendKey, index: number) {
  const rows = websiteTrendRows.value; const max = Math.max(...rows.map(row => row[key]), 1); const value = rows[index]?.[key] || 0;
  return { x: rows.length <= 1 ? 36 : Math.round((36 + (index / (rows.length - 1)) * 584) * 10) / 10, y: Math.round((170 - (value / max) * 150) * 10) / 10 };
}
function daysAgo(days: number) { const date = new Date(`${today}T00:00:00Z`); date.setUTCDate(date.getUTCDate() - days); return isoDate(date); }
function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function displayDate(value: string) { return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00Z`)); }
function displayShortDate(value: string) { return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(new Date(`${value}T00:00:00Z`)); }
function shortDateTime(value: string) { return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
function duration(value: number | null | undefined) { if (value == null) return '—'; return `${Math.floor(value / 60)}:${Math.round(value % 60).toString().padStart(2, '0')}`; }
const n = (value: number) => new Intl.NumberFormat('en-AU').format(value || 0);
const pct = (value: number) => `${new Intl.NumberFormat('en-AU', { maximumFractionDigits: 1 }).format(value || 0)}%`;
const money = (value: number) => formatCurrency(value || 0, true);
const moneyOrDash = (value?: number | null) => value == null ? '—' : money(value);
const pctOrDash = (value?: number | null) => value == null ? '—' : pct(value);
const fractionPct = (value?: number | null) => value == null ? '—' : pct(value * 100);
const decimal = (value?: number | null) => value == null ? '—' : new Intl.NumberFormat('en-AU', { maximumFractionDigits: 1 }).format(value);
const roas = (value: number) => `${new Intl.NumberFormat('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}×`;

const BarRow = defineComponent({
  props: { label: { type: String, required: true }, value: { type: Number, required: true }, max: { type: Number, required: true } },
  setup: props => () => h('div', { class: 'marketing-hub__bar-row num' }, [
    h('p', [h('span', props.label), h('strong', n(props.value))]),
    h('span', { class: 'marketing-hub__track' }, [h('i', { style: { width: `${barPercent(props.value, props.max)}%` } })]),
  ]),
});
const MetricPanel = defineComponent({
  props: { title: { type: String, required: true }, description: { type: String, required: true }, items: { type: Array as () => MetricItem[], required: true } },
  setup: props => () => h('article', { class: 'marketing-hub__card' }, [
    h('header', { class: 'marketing-hub__panel-head' }, [h('h2', props.title), h('p', props.description)]),
    h('div', { class: 'marketing-hub__metrics num' }, props.items.map(item => h('div', [h('small', item.label), h('strong', item.value)]))),
  ]),
});
const BreakdownPanel = defineComponent({
  props: { title: { type: String, required: true }, rows: { type: Array as () => BreakdownRow[], required: true }, dimensionKey: { type: String, required: true }, max: { type: Number, required: true } },
  setup: props => () => h('article', { class: 'marketing-hub__card' }, [
    h('header', { class: 'marketing-hub__panel-head' }, [h('h2', props.title)]),
    h('div', { class: 'marketing-hub__pad marketing-hub__bar-list' }, props.rows.slice(0, 6).map(row => h(BarRow, { key: dimension(row, props.dimensionKey), label: dimension(row, props.dimensionKey) || '(not set)', value: metric(row, 'sessions'), max: props.max ?? 1 }))),
  ]),
});
const PreviewBars = defineComponent({
  props: { title: { type: String, required: true }, rows: { type: Array as () => Array<{ label: string; value: string; width: number }>, required: true } },
  setup: props => () => h('article', { class: 'marketing-hub__card marketing-hub__preview-bars' }, [
    h('h3', props.title),
    ...props.rows.map(row => h('div', { key: row.label, class: 'marketing-hub__bar-row num' }, [h('p', [h('span', row.label), h('strong', row.value)]), h('span', { class: 'marketing-hub__track' }, [h('i', { style: { width: `${row.width}%` } })])])),
  ]),
});
</script>

<style scoped>
.marketing-hub {
  --ground: #eaeef3; --surface: #ffffff; --surface-2: #f5f8fb; --surface-3: #eef3f8;
  --ink: #0b1a2b; --ink-2: #39506a; --muted: #6b7d90; --line: #dfe6ee; --line-2: #eaf0f6;
  --brand: #001e50; --brand-ink: #ffffff; --accent: #0091b8; --accent-soft: rgba(0,145,184,.1);
  --good: #1a9e5c; --good-soft: rgba(26,158,92,.12); --warn: #c47d1f; --warn-soft: rgba(196,125,31,.13);
  --crit: #d13b22; --crit-soft: rgba(209,59,34,.11); --meta: #1877f2; --google: #188038; --ga4: #e8710a; --series3: #7c5cff;
  --radius: 14px; --shadow: 0 1px 2px rgba(11,26,43,.05), 0 8px 24px -14px rgba(11,26,43,.18);
  color: var(--ink); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px; line-height: 1.5; font-variant-numeric: tabular-nums;
  width: 100vw; margin-top: -2rem; margin-bottom: -2rem; margin-left: calc(50% - 50vw);
  padding: 24px 22px 64px; min-height: calc(100vh - 64px); overflow-x: clip; background: var(--ground);
}
:global(.dark) .marketing-hub, :global(:root[data-theme="dark"]) .marketing-hub {
  --ground: #080f18; --surface: #101b28; --surface-2: #152232; --surface-3: #1b2a3b;
  --ink: #e7eef6; --ink-2: #aebdce; --muted: #7c8ea0; --line: #213042; --line-2: #1a2836;
  --brand: #4d88cc; --brand-ink: #07101b; --accent: #37c4e6; --accent-soft: rgba(55,196,230,.13);
  --good: #39c682; --good-soft: rgba(57,198,130,.15); --warn: #eab255; --warn-soft: rgba(234,178,85,.15);
  --crit: #f4674c; --crit-soft: rgba(244,103,76,.15); --meta: #4a9bff; --google: #4dbf72; --ga4: #f5924a; --series3: #a58cff;
  --shadow: 0 1px 2px rgba(0,0,0,.3), 0 10px 30px -16px rgba(0,0,0,.6);
}
@media (prefers-color-scheme: dark) {
  :global(:root:not([data-theme="light"])) .marketing-hub {
    --ground: #080f18; --surface: #101b28; --surface-2: #152232; --surface-3: #1b2a3b;
    --ink: #e7eef6; --ink-2: #aebdce; --muted: #7c8ea0; --line: #213042; --line-2: #1a2836;
    --brand: #4d88cc; --brand-ink: #07101b; --accent: #37c4e6; --accent-soft: rgba(55,196,230,.13);
    --good: #39c682; --good-soft: rgba(57,198,130,.15); --warn: #eab255; --warn-soft: rgba(234,178,85,.15);
    --crit: #f4674c; --crit-soft: rgba(244,103,76,.15); --meta: #4a9bff; --google: #4dbf72; --ga4: #f5924a; --series3: #a58cff;
  }
}
.marketing-hub > * { max-width: 1200px; margin-left: auto; margin-right: auto; }
.marketing-hub section { margin-top: 26px; }
.marketing-hub h1, .marketing-hub h2, .marketing-hub h3, .marketing-hub p { margin-top: 0; }
.marketing-hub__header { padding-bottom: 6px; }
.marketing-hub__header-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.marketing-hub__eyebrow { margin-bottom: 6px; color: var(--muted); font-size: 11px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
.marketing-hub h1 { margin-bottom: 4px; font-size: 29px; font-weight: 750; letter-spacing: -.02em; line-height: 1.05; }
.marketing-hub__subtitle { margin-bottom: 0; color: var(--ink-2); }
.marketing-hub__range-wrap { position: relative; }
.marketing-hub__daterange { display: inline-flex; gap: 2px; padding: 4px; border: 1px solid var(--line); border-radius: 11px; background: var(--surface); box-shadow: var(--shadow); }
.marketing-hub__daterange button { display: inline-flex; align-items: center; gap: 4px; border: 0; border-radius: 8px; padding: 7px 13px; background: transparent; color: var(--ink-2); font-size: 12.5px; font-weight: 600; cursor: pointer; }
.marketing-hub__daterange button svg { width: 13px; }
.marketing-hub__daterange button.on { background: var(--brand); color: var(--brand-ink); }
.marketing-hub__custom-range { position: absolute; z-index: 5; top: 47px; right: 0; display: flex; gap: 12px; padding: 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); box-shadow: var(--shadow); }
.marketing-hub__custom-range label { color: var(--muted); font-size: 11px; font-weight: 700; }
.marketing-hub__custom-range input { display: block; margin-top: 4px; border: 1px solid var(--line); border-radius: 7px; padding: 6px; background: var(--surface-2); color: var(--ink); }
.marketing-hub__synced { display: flex; align-items: center; justify-content: flex-end; gap: 7px; margin: 9px 0 0; color: var(--muted); font-size: 12px; }
.marketing-hub__synced button { display: inline-grid; place-items: center; border: 0; background: none; color: var(--muted); cursor: pointer; }
.marketing-hub__synced svg { width: 14px; }
.marketing-hub__live { width: 7px; height: 7px; border-radius: 50%; background: var(--good); box-shadow: 0 0 0 3px var(--good-soft); }
.spinning { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.marketing-hub__insight { display: flex; align-items: flex-start; gap: 14px; margin-top: 18px; padding: 15px 18px; border: 1px solid var(--line); border-left: 3px solid var(--crit); border-radius: 12px; background: var(--surface); box-shadow: var(--shadow); }
.marketing-hub__insight-icon { flex: 0 0 auto; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 9px; background: var(--crit-soft); color: var(--crit); }
.marketing-hub__insight-icon svg { width: 18px; }
.marketing-hub__insight h2 { margin-bottom: 3px; font-size: 14.5px; }
.marketing-hub__insight p { max-width: 80ch; margin-bottom: 0; color: var(--ink-2); font-size: 13.5px; }
.marketing-hub__action { display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; margin-left: auto; border: 1px solid var(--line); border-radius: 9px; padding: 8px 13px; background: var(--surface-2); color: var(--ink); font-size: 12.5px; font-weight: 600; text-decoration: none; white-space: nowrap; cursor: pointer; }
.marketing-hub__action svg { width: 14px; }
.marketing-hub__state { display: flex; align-items: center; justify-content: center; gap: 9px; min-height: 180px; margin-top: 26px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); color: var(--muted); }
.marketing-hub__state svg { width: 18px; }.marketing-hub__state--error { color: var(--crit); }
.marketing-hub__kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.marketing-hub__kpi, .marketing-hub__card { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow); }
.marketing-hub__kpi { padding: 15px; }
.marketing-hub__kpi-label { display: flex; justify-content: space-between; color: var(--muted); font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.marketing-hub__kpi-label svg { width: 15px; opacity: .7; }
.marketing-hub__kpi-value { margin-top: 9px; font-size: 26px; font-weight: 750; letter-spacing: -.02em; line-height: 1; }
.marketing-hub__kpi.alert .marketing-hub__kpi-value { color: var(--crit); }
.marketing-hub__kpi p { margin: 7px 0 0; color: var(--muted); font-size: 11.5px; }
.marketing-hub :deep(.marketing-hub__panel-head) { padding: 15px 16px 0; }
.marketing-hub :deep(.marketing-hub__panel-head h2) { display: flex; align-items: center; gap: 8px; margin-bottom: 0; font-size: 14px; letter-spacing: -.01em; }
.marketing-hub :deep(.marketing-hub__panel-head h2 > svg) { width: 16px; color: var(--accent); }
.marketing-hub :deep(.marketing-hub__panel-head p) { margin: 3px 0 0; color: var(--muted); font-size: 12px; }
.marketing-hub :deep(.marketing-hub__pad) { padding: 16px; }
.marketing-hub__quality { margin-left: auto; border-radius: 999px; padding: 3px 9px; font-size: 11px; font-weight: 700; }
.marketing-hub__quality.bad { color: var(--crit); background: var(--crit-soft); }.marketing-hub__quality.mid { color: var(--warn); background: var(--warn-soft); }.marketing-hub__quality.ok { color: var(--good); background: var(--good-soft); }
.marketing-hub__funnel { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
.marketing-hub__funnel-stage { padding: 12px; border: 1px solid var(--line); border-radius: 11px; background: var(--surface-2); }
.marketing-hub__funnel-stage p { margin-bottom: 5px; color: var(--muted); font-size: 11px; font-weight: 600; }
.marketing-hub__funnel-stage strong { display: block; margin-bottom: 8px; font-size: 22px; }
.marketing-hub :deep(.marketing-hub__track) { position: relative; display: block; height: 7px; overflow: hidden; border-radius: 5px; background: var(--surface-3); }
.marketing-hub :deep(.marketing-hub__track i) { display: block; height: 100%; border-radius: inherit; background: var(--accent); }
.marketing-hub :deep(.marketing-hub__track i.poor) { background: var(--crit); }.marketing-hub :deep(.marketing-hub__track i.watch) { background: var(--warn); }.marketing-hub :deep(.marketing-hub__track i.good) { background: var(--good); }
.marketing-hub :deep(.marketing-hub__track b) { position: absolute; top: -2px; width: 2px; height: 11px; background: var(--ink-2); opacity: .45; }
.marketing-hub__split, .marketing-hub__split2, .marketing-hub__split3 { display: grid; gap: 14px; }
.marketing-hub__split { grid-template-columns: 1.45fr 1fr; }.marketing-hub__split2 { grid-template-columns: 1fr 1fr; }.marketing-hub__split3 { grid-template-columns: repeat(3, 1fr); }
.marketing-hub__executive-detail > div > .marketing-hub__eyebrow { margin-bottom: 12px; }
.marketing-hub__health-row { margin-bottom: 13px; }.marketing-hub__health-row > div:first-child { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 12.5px; }
.marketing-hub__health-row > div:first-child span { border-radius: 999px; padding: 2px 8px; font-size: 11px; }.marketing-hub__health-row span.good { color: var(--good); background: var(--good-soft); }.marketing-hub__health-row span.poor { color: var(--crit); background: var(--crit-soft); }.marketing-hub__health-row span.watch { color: var(--warn); background: var(--warn-soft); }
.marketing-hub__health-row small { color: var(--muted); font-size: 11px; }
.marketing-hub__opportunities article { margin-bottom: 10px; padding: 12px; border: 1px solid var(--line); border-radius: 11px; background: var(--surface-2); }
.marketing-hub__opportunities h3 { margin-bottom: 3px; font-size: 13px; }.marketing-hub__opportunities p { margin-bottom: 8px; color: var(--muted); font-size: 11.5px; }.marketing-hub__opportunities span { display: inline-block; padding: 4px 9px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink-2); font-size: 11px; }
.marketing-hub__connection { display: flex; justify-content: space-between; align-items: center; margin-bottom: 9px; padding: 11px 13px; border: 1px solid var(--line); border-radius: 10px; font-weight: 600; }
.marketing-hub__connection span, .marketing-hub__status-pill { border-radius: 999px; padding: 4px 11px; background: var(--brand); color: var(--brand-ink); font-size: 11px; font-weight: 700; }.marketing-hub__connection span.disconnected, .marketing-hub__status-pill.disconnected { background: var(--crit-soft); color: var(--crit); }
.marketing-hub__inset { padding: 11px 13px; border: 1px dashed var(--line); border-radius: 10px; background: var(--surface-2); min-width: 0; }
.marketing-hub__inset small { display: block; color: var(--muted); font-weight: 600; }.marketing-hub__inset strong { display: block; margin-top: 2px; font-size: 17px; overflow-wrap: anywhere; }
.marketing-hub :deep(.marketing-hub__bar-row) { margin-bottom: 11px; }.marketing-hub :deep(.marketing-hub__bar-row:last-child) { margin-bottom: 0; }.marketing-hub :deep(.marketing-hub__bar-row p) { display: flex; justify-content: space-between; margin-bottom: 7px; font-size: 13px; }.marketing-hub :deep(.marketing-hub__bar-row p span) { color: var(--ink-2); font-weight: 600; }
.marketing-hub__empty { margin: 12px 0 0; color: var(--muted); font-size: 12px; }
.marketing-hub__section-head { display: flex; align-items: center; gap: 11px; margin-bottom: 13px; }.marketing-hub__section-head h2 { margin-bottom: 0; font-size: 15px; }.marketing-hub__section-head > span { flex: 1; height: 1px; background: var(--line); }.marketing-hub__section-head p { margin-bottom: 0; color: var(--muted); font-size: 12px; }.marketing-hub__section-head b { padding: 3px 8px; border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); border-radius: 999px; background: var(--accent-soft); color: var(--accent); font-size: 10.5px; letter-spacing: .05em; text-transform: uppercase; }.marketing-hub__section-head b.p3 { color: var(--series3); background: color-mix(in srgb, var(--series3) 12%, transparent); border-color: color-mix(in srgb, var(--series3) 30%, transparent); }
.marketing-hub__table-wrap { overflow-x: auto; }.marketing-hub table { width: 100%; border-collapse: collapse; font-size: 12.5px; }.marketing-hub th { padding: 12px 13px; border-bottom: 1px solid var(--line); background: var(--surface-2); color: var(--muted); font-size: 10.5px; letter-spacing: .03em; text-align: right; text-transform: uppercase; white-space: nowrap; }.marketing-hub th:first-child, .marketing-hub td:first-child { text-align: left; }.marketing-hub td { padding: 12px 13px; border-bottom: 1px solid var(--line-2); text-align: right; white-space: nowrap; }.marketing-hub tbody tr:last-child td { border-bottom: 0; }
.marketing-hub__campaign-name { display: block; max-width: 300px; overflow: hidden; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; font-weight: 600; text-overflow: ellipsis; }.marketing-hub__platform-pill { display: inline-block; padding: 3px 9px; border: 1px solid var(--line); border-radius: 999px; color: var(--ink-2); font-size: 11px; font-weight: 650; }.marketing-hub__platform-pill.meta_ads { border-color: var(--meta); }.marketing-hub__platform-pill.google_ads { border-color: var(--google); }.marketing-hub td.zero { color: var(--crit); font-weight: 700; }.marketing-hub td.muted { color: var(--muted); }.marketing-hub__empty-cell { padding: 28px !important; color: var(--muted); text-align: center !important; }
.marketing-hub :deep(.marketing-hub__metrics) { display: grid; grid-template-columns: 1fr 1fr; gap: 11px 18px; padding: 12px 16px 16px; }.marketing-hub :deep(.marketing-hub__metrics small) { display: block; color: var(--muted); font-size: 11px; font-weight: 600; }.marketing-hub :deep(.marketing-hub__metrics strong) { display: block; margin-top: 2px; font-size: 17px; }.marketing-hub__roas-note { margin: 10px 0 0; color: var(--muted); font-size: 12px; }.marketing-hub a { color: var(--accent); }
.marketing-hub__legend { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 10px; color: var(--ink-2); font-size: 11.5px; font-weight: 600; }.marketing-hub__legend span { display: flex; align-items: center; gap: 6px; }.marketing-hub__legend i { width: 10px; height: 3px; border-radius: 2px; }.marketing-hub__legend .sessions { background: var(--accent); }.marketing-hub__legend .events { background: var(--ga4); }.marketing-hub__legend .leads { background: var(--series3); }
.marketing-hub__chart svg { display: block; width: 100%; height: 190px; }.marketing-hub__chart line { stroke: var(--line); }.marketing-hub__chart polyline { fill: none; stroke-width: 2.5; }.marketing-hub__chart polyline.sessions { stroke: var(--accent); }.marketing-hub__chart polyline.events { stroke: var(--ga4); }.marketing-hub__chart polyline.leads { stroke: var(--series3); }.marketing-hub__chart circle.sessions { fill: var(--accent); }.marketing-hub__chart circle.keyEvents { fill: var(--ga4); }.marketing-hub__chart circle.crmLeads { fill: var(--series3); }.marketing-hub__chart > div { display: flex; justify-content: space-between; color: var(--muted); font-size: 10px; }
.marketing-hub__website-funnel > div { margin-bottom: 14px; }.marketing-hub__website-funnel p { display: flex; justify-content: space-between; margin-bottom: 6px; }.marketing-hub__website-funnel small { color: var(--muted); font-size: 11px; }.marketing-hub__website-detail { margin-top: 14px; }.marketing-hub__stack { display: grid; gap: 14px; }
.marketing-hub__coverage { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }.marketing-hub__coverage article { padding: 11px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface-2); }.marketing-hub__coverage small { display: block; color: var(--muted); font-size: 11px; font-weight: 600; }.marketing-hub__coverage strong { display: block; margin-top: 3px; font-size: 20px; }.marketing-hub__coverage .bad strong { color: var(--crit); }.marketing-hub__coverage .ok strong { color: var(--good); }.marketing-hub__audit-note, .marketing-hub__source-note { margin: 12px 0 0; color: var(--muted); font-size: 12px; }.marketing-hub__domain { font-family: ui-monospace, Menlo, monospace; font-size: 13px !important; }
.marketing-hub__preview-note { margin-bottom: 13px; padding: 10px 13px; border: 1px dashed var(--line); border-radius: 10px; background: var(--surface-2); color: var(--muted); font-size: 12px; }.marketing-hub__preview-bars { padding: 15px; }.marketing-hub :deep(.marketing-hub__preview-bars h3) { margin-bottom: 13px; font-size: 12.5px; }
.marketing-hub__creatives { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }.marketing-hub__creative { overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow); }.marketing-hub__creative-art { position: relative; display: grid; place-items: center; aspect-ratio: 1.5 / 1; color: white; }.marketing-hub__creative-art > span { position: absolute; top: 9px; left: 9px; padding: 3px 8px; border-radius: 999px; background: rgba(0,0,0,.35); font-size: 10.5px; }.marketing-hub__creative-art.ioniq { background: linear-gradient(135deg,#8a4b00,#e8710a); }.marketing-hub__creative-art.pmax { background: linear-gradient(135deg,#334155,#64748b); }.marketing-hub__creative-art.meta { background: linear-gradient(135deg,#0b3d91,#1877f2); }.marketing-hub__creative-art.service { background: linear-gradient(135deg,#0f5a2e,#188038); }.marketing-hub__creative > div:last-child { padding: 11px 13px; }.marketing-hub__creative h3 { overflow: hidden; margin-bottom: 7px; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }.marketing-hub__creative p { display: flex; justify-content: space-between; margin-bottom: 0; color: var(--muted); font-size: 11.5px; }.marketing-hub__creative p span { margin-left: auto; }
.marketing-hub__pivot { display: grid; grid-template-columns: 230px 1fr; overflow: hidden; }.marketing-hub__pivot aside { padding: 15px; border-right: 1px solid var(--line); background: var(--surface-2); }.marketing-hub__pivot aside .marketing-hub__eyebrow:not(:first-child) { margin-top: 15px; }.marketing-hub__pivot aside div { display: flex; flex-wrap: wrap; gap: 7px; }.marketing-hub__pivot aside span, .marketing-hub__wells span { padding: 5px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink-2); font-size: 12px; font-weight: 600; }.marketing-hub__pivot aside span.on { border-color: color-mix(in srgb, var(--accent) 40%, transparent); background: var(--accent-soft); color: var(--ink); }.marketing-hub__pivot-main { min-width: 0; padding: 15px; }.marketing-hub__wells { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 13px; }.marketing-hub__wells > div { padding: 9px 11px; border: 1px dashed var(--line); border-radius: 10px; background: var(--surface-2); }.marketing-hub__wells span { display: inline-block; }.marketing-hub__example { margin: 10px 0 0; color: var(--muted); font-size: 11.5px; }
.marketing-hub__footer { margin-top: 34px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; line-height: 1.65; }.marketing-hub__footer strong { color: var(--ink-2); }
@media (max-width: 960px) {
  .marketing-hub__kpis { grid-template-columns: repeat(2, 1fr); }
  .marketing-hub__split, .marketing-hub__split2, .marketing-hub__split3 { grid-template-columns: 1fr; }
  .marketing-hub__creatives { grid-template-columns: repeat(2, 1fr); }
  .marketing-hub__funnel { grid-template-columns: repeat(2, 1fr); }
  .marketing-hub__pivot { grid-template-columns: 1fr; }.marketing-hub__pivot aside { border-right: 0; border-bottom: 1px solid var(--line); }
}
@media (max-width: 700px) {
  .marketing-hub { padding: 20px 16px 48px; }
  .marketing-hub__range-wrap, .marketing-hub__daterange { width: 100%; }.marketing-hub__daterange { overflow-x: auto; }.marketing-hub__daterange button { flex: 0 0 auto; }
  .marketing-hub__insight { flex-wrap: wrap; }.marketing-hub__action { margin-left: 48px; }
  .marketing-hub__section-head { flex-wrap: wrap; }.marketing-hub__section-head > span { min-width: 30px; }
}
@media (max-width: 430px) {
  .marketing-hub__kpis, .marketing-hub__creatives, .marketing-hub__funnel, .marketing-hub__coverage, .marketing-hub__wells { grid-template-columns: 1fr; }
  .marketing-hub__action { margin-left: 0; }.marketing-hub__custom-range { left: 0; right: auto; flex-direction: column; }
}
@media (prefers-reduced-motion: no-preference) {
  .marketing-hub :deep(.marketing-hub__track i) { transition: width .6s cubic-bezier(.2,.7,.2,1); }
}
@media (prefers-reduced-motion: reduce) { .spinning { animation: none; } }
</style>
