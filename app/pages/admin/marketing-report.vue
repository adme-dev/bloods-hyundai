<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p class="text-sm text-muted-foreground">Admin CRM attribution, platform ingestion, and data-layer coverage</p>
        <h1 class="text-3xl font-semibold tracking-tight">Marketing Report</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" as-child>
          <NuxtLink to="/admin?tab=marketing">
            <ArrowLeft class="h-4 w-4" />
            Dashboard
          </NuxtLink>
        </Button>
        <Button variant="outline" size="sm" :disabled="pending" @click="refresh">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': pending }" />
          Refresh
        </Button>
        <Button variant="outline" size="sm" :disabled="backfillPending" @click="runAttributionBackfill">
          <GitBranch class="h-4 w-4" :class="{ 'animate-spin': backfillPending }" />
          Backfill attribution
        </Button>
      </div>
    </div>

    <div class="flex flex-col gap-3 rounded-md border bg-background p-3 xl:flex-row xl:items-end xl:justify-between">
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

    <div v-if="pending" class="rounded-md border bg-background py-12 text-center text-sm text-muted-foreground">
      Loading marketing report...
    </div>

    <template v-else-if="data">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card v-for="item in summaryCards" :key="item.label">
          <CardContent class="p-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <span class="text-xs font-medium uppercase text-muted-foreground">{{ item.label }}</span>
              <component :is="item.icon" class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-2xl font-semibold leading-tight">{{ item.value }}</div>
            <p class="mt-1 text-xs text-muted-foreground">{{ item.caption }}</p>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardHeader class="gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle class="flex items-center gap-2 text-xl">
                <Gauge class="h-5 w-5 text-sky-600" />
                Executive Readout
              </CardTitle>
              <CardDescription>Commercial view of spend, lead quality, attribution and admin CRM capture.</CardDescription>
            </div>
            <Badge :variant="data.insights.executive.dataQualityScore >= 80 ? 'default' : data.insights.executive.dataQualityScore >= 60 ? 'secondary' : 'destructive'">
              {{ data.insights.executive.dataQualityScore }}% data quality
            </Badge>
          </CardHeader>
          <CardContent class="space-y-5">
            <div class="rounded-md border bg-muted/30 p-4">
              <div class="text-sm font-semibold">{{ data.insights.executive.primaryRecommendation }}</div>
              <div class="mt-2 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <MetricCell label="Blended CPL" :value="moneyOrDash(data.insights.executive.blendedCpl)" />
                <MetricCell label="Paid lead share" :value="pctOrDash(data.insights.executive.paidShareOfLeads)" />
                <MetricCell label="Top lead source" :value="data.insights.executive.topLeadSource || '-'" />
                <MetricCell label="Best campaign" :value="data.insights.executive.bestCampaign || '-'" />
              </div>
            </div>

            <div>
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold">Marketing funnel</div>
                  <div class="text-xs text-muted-foreground">Website, paid media, GA4 key events and admin CRM leads in one flow.</div>
                </div>
              </div>
              <div class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
                <div v-for="step in data.insights.funnel" :key="step.key" class="rounded-md border p-3">
                  <div class="text-xs font-medium uppercase text-muted-foreground">{{ step.label }}</div>
                  <div class="mt-2 text-xl font-semibold">{{ n(step.value) }}</div>
                  <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div class="h-full rounded-full bg-sky-600" :style="{ width: `${barPercent(step.value, maxInsightFunnelValue)}%` }" />
                  </div>
                  <div class="mt-2 text-xs text-muted-foreground">
                    {{ step.rateFromPrevious == null ? step.caption : `${pct(step.rateFromPrevious)} from previous signal` }}
                  </div>
                </div>
              </div>
            </div>

            <div class="grid gap-3 lg:grid-cols-2">
              <div class="rounded-md border p-4">
                <div class="mb-3 text-sm font-semibold">Data health</div>
                <div class="space-y-3">
                  <div v-for="check in data.insights.dataQuality" :key="check.key" class="space-y-1.5">
                    <div class="flex items-center justify-between gap-3 text-sm">
                      <span class="font-medium">{{ check.label }}</span>
                      <Badge :variant="qualityBadgeVariant(check.status)">{{ pct(check.value) }}</Badge>
                    </div>
                    <div class="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div class="h-full rounded-full" :class="qualityBarClass(check.status)" :style="{ width: `${Math.min(100, check.value)}%` }" />
                    </div>
                    <div class="text-xs text-muted-foreground">Target {{ pct(check.target) }}</div>
                  </div>
                </div>
              </div>

              <div class="rounded-md border p-4">
                <div class="mb-3 text-sm font-semibold">Campaign opportunities</div>
                <div v-if="data.insights.campaignDiagnostics.opportunities.length" class="space-y-3">
                  <div v-for="item in data.insights.campaignDiagnostics.opportunities" :key="`${item.platform}:${item.campaignName}`" class="rounded-md bg-muted/40 p-3">
                    <div class="truncate text-sm font-medium">{{ item.campaignName }}</div>
                    <div class="mt-1 text-xs text-muted-foreground">{{ platformLabel(item.platform) }} · {{ money(item.spend) }} · {{ n(item.clicks) }} clicks · {{ n(item.crmLeads) }} admin CRM leads</div>
                    <Badge variant="outline" class="mt-2">{{ item.issue }}</Badge>
                  </div>
                </div>
                <div v-else class="rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">
                  No high-spend campaign issues detected for this period.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-xl">
              <Target class="h-5 w-5 text-emerald-600" />
              Priority Actions
            </CardTitle>
            <CardDescription>Ordered actions for campaign optimisation and reporting confidence.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div v-for="item in data.insights.recommendations" :key="`${item.priority}:${item.title}`" class="rounded-md border p-3">
              <div class="mb-2 flex items-start justify-between gap-3">
                <div class="text-sm font-semibold">{{ item.title }}</div>
                <Badge :variant="priorityBadgeVariant(item.priority)" class="capitalize">{{ item.priority }}</Badge>
              </div>
              <p class="text-sm text-muted-foreground">{{ item.detail }}</p>
              <p class="mt-2 text-sm font-medium">{{ item.action }}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-xl">
            <Database class="h-5 w-5 text-blue-600" />
            Dealer Lead Diagnostics
          </CardTitle>
          <CardDescription>Source mix, campaign tagging and admin CRM lead capture by channel.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Category</TableHead>
                <TableHead class="text-right">Leads</TableHead>
                <TableHead class="text-right">Share</TableHead>
                <TableHead v-if="data.insights.externalCrmSyncEnabled" class="text-right">External sync</TableHead>
                <TableHead class="text-right">Campaign tagged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="source in data.insights.sourceDiagnostics" :key="source.key">
                <TableCell class="font-medium">{{ source.label }}</TableCell>
                <TableCell><Badge variant="outline" class="capitalize">{{ source.category.replaceAll('_', ' ') }}</Badge></TableCell>
                <TableCell class="text-right">{{ n(source.total) }}</TableCell>
                <TableCell class="text-right">{{ pct(source.share) }}</TableCell>
                <TableCell v-if="data.insights.externalCrmSyncEnabled" class="text-right">{{ pct(source.crmSyncCoverage) }}</TableCell>
                <TableCell class="text-right">{{ pct(source.campaignCoverage) }}</TableCell>
              </TableRow>
              <TableRow v-if="!data.insights.sourceDiagnostics.length">
                <TableCell :colspan="data.insights.externalCrmSyncEnabled ? 6 : 5" class="py-8 text-center text-muted-foreground">No lead source diagnostics for this range.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle class="flex items-center gap-2 text-xl">
              <Route class="h-5 w-5 text-sky-600" />
              Lead Source Setup
            </CardTitle>
            <CardDescription>External lead inboxes are configured in Settings. This report uses those sources for attribution and lead quality checks.</CardDescription>
          </div>
          <Badge :variant="inboundEmailData?.configured ? 'default' : 'secondary'">
            {{ inboundEmailData?.configured ? 'Email domain active' : 'Domain not configured' }}
          </Badge>
        </CardHeader>
        <CardContent>
          <div class="grid gap-3 sm:grid-cols-3">
            <MetricCell label="Configured sources" :value="String(inboundEmailData?.addresses?.length || 0)" />
            <MetricCell label="Active sources" :value="String(activeInboundLeadSourceCount)" />
            <MetricCell label="Inbound domain" :value="inboundEmailData?.domain || '-'" />
          </div>
          <div class="mt-4 flex flex-col gap-3 rounded-md border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div class="text-sm font-medium">Manage provider addresses and source mapping</div>
              <div class="text-xs text-muted-foreground">Carsales, Autotrader, Hyundai OEM, Meta Lead Ads and other inbound sources.</div>
            </div>
            <Button size="sm" as-child>
              <NuxtLink to="/admin/settings/lead-sources">
                <Route class="h-4 w-4" />
                Open lead sources
              </NuxtLink>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-xl">
              <Activity class="h-5 w-5 text-sky-600" />
              GA4 Website
            </CardTitle>
            <CardDescription>Engagement quality for the selected period.</CardDescription>
          </CardHeader>
          <CardContent class="grid grid-cols-2 gap-3">
            <MetricCell label="Sessions" :value="n(data.professionalMetrics.ga4Website.sessions)" />
            <MetricCell label="Users" :value="n(data.professionalMetrics.ga4Website.users)" />
            <MetricCell label="Engagement rate" :value="fractionPct(data.professionalMetrics.ga4Website.engagementRate)" />
            <MetricCell label="Avg session" :value="duration(data.professionalMetrics.ga4Website.averageSessionDuration)" />
            <MetricCell label="Page views" :value="n(data.professionalMetrics.ga4Website.screenPageViews)" />
            <MetricCell label="Events" :value="n(data.professionalMetrics.ga4Website.eventCount)" />
            <MetricCell label="Events/session" :value="decimal(data.professionalMetrics.ga4Website.eventsPerSession)" />
            <MetricCell label="Key event rate" :value="pctOrDash(data.professionalMetrics.ga4Website.conversionRate)" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-xl">
              <Gauge class="h-5 w-5 text-emerald-600" />
              Paid Media Efficiency
            </CardTitle>
            <CardDescription>Meta and Google Ads blended delivery.</CardDescription>
          </CardHeader>
          <CardContent class="grid grid-cols-2 gap-3">
            <MetricCell label="Spend" :value="money(data.professionalMetrics.paidMedia.spend)" />
            <MetricCell label="CPM" :value="moneyOrDash(data.professionalMetrics.paidMedia.cpm)" />
            <MetricCell label="Impressions" :value="n(data.professionalMetrics.paidMedia.impressions)" />
            <MetricCell label="CTR" :value="pctOrDash(data.professionalMetrics.paidMedia.ctr)" />
            <MetricCell label="Clicks" :value="n(data.professionalMetrics.paidMedia.clicks)" />
            <MetricCell label="Avg CPC" :value="moneyOrDash(data.professionalMetrics.paidMedia.averageCpc)" />
            <MetricCell label="Platform lead rate" :value="pctOrDash(data.professionalMetrics.paidMedia.platformLeadRate)" />
            <MetricCell label="Admin CRM CPL" :value="moneyOrDash(data.professionalMetrics.paidMedia.cpl)" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-xl">
              <MousePointerClick class="h-5 w-5 text-blue-600" />
              Google Ads Depth
            </CardTitle>
            <CardDescription>Campaign-level metrics from Google Ads API sync.</CardDescription>
          </CardHeader>
          <CardContent class="grid grid-cols-2 gap-3">
            <MetricCell label="Conversions" :value="n(data.professionalMetrics.googleAds.platformLeads)" />
            <MetricCell label="Conv. rate" :value="pctOrDash(data.professionalMetrics.googleAds.conversionRate)" />
            <MetricCell label="Cost / conv." :value="moneyOrDash(data.professionalMetrics.googleAds.costPerConversion)" />
            <MetricCell label="All conversions" :value="decimal(data.professionalMetrics.googleAds.allConversions)" />
            <MetricCell label="Conv. value" :value="moneyOrDash(data.professionalMetrics.googleAds.conversionsValue)" />
            <MetricCell label="Interactions" :value="data.professionalMetrics.googleAds.interactions == null ? '-' : n(data.professionalMetrics.googleAds.interactions)" />
            <MetricCell label="Interaction rate" :value="pctOrDash(data.professionalMetrics.googleAds.interactionRate)" />
            <MetricCell label="Search impr. share" :value="fractionPct(data.professionalMetrics.googleAds.searchImpressionShare)" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader class="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle class="flex items-center gap-2 text-xl">
              <Globe2 class="h-5 w-5 text-sky-600" />
              Website Analytics
            </CardTitle>
            <CardDescription>GA4 traffic, landing page and behaviour breakdown for {{ rangeLabel }}.</CardDescription>
          </div>
          <Badge :variant="websiteAnalyticsBadgeVariant">{{ websiteAnalyticsStatusLabel }}</Badge>
        </CardHeader>
        <CardContent v-if="data.websiteAnalytics.status === 'connected'" class="space-y-6">
          <div class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div class="rounded-md border p-4">
              <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div class="text-sm font-semibold">Website performance trend</div>
                  <div class="text-xs text-muted-foreground">Sessions, key events and admin CRM leads indexed to their selected-period peak.</div>
                </div>
                <div class="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-sky-600" />Sessions</span>
                  <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-amber-500" />Key events</span>
                  <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-emerald-600" />Admin CRM leads</span>
                </div>
              </div>
              <div v-if="trendHasData" class="overflow-hidden">
                <svg viewBox="0 0 640 210" role="img" aria-label="Website analytics trend chart" class="h-[240px] w-full">
                  <line x1="36" y1="20" x2="36" y2="170" class="stroke-muted" stroke-width="1" />
                  <line x1="36" y1="170" x2="620" y2="170" class="stroke-muted" stroke-width="1" />
                  <line v-for="y in chartGridLines" :key="y" x1="36" :y1="y" x2="620" :y2="y" class="stroke-muted/70" stroke-width="1" />
                  <polyline :points="trendLinePoints('sessions')" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-sky-600" />
                  <polyline :points="trendLinePoints('keyEvents')" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500" />
                  <polyline :points="trendLinePoints('crmLeads')" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600" />
                  <circle
                    v-for="point in trendEndPoints"
                    :key="point.key"
                    :cx="point.x"
                    :cy="point.y"
                    r="4"
                    :class="point.class"
                    fill="currentColor"
                  />
                  <text x="36" y="198" class="fill-muted-foreground text-[11px]">{{ chartStartLabel }}</text>
                  <text x="620" y="198" text-anchor="end" class="fill-muted-foreground text-[11px]">{{ chartEndLabel }}</text>
                </svg>
              </div>
              <div v-else class="rounded-md bg-muted/30 py-10 text-center text-sm text-muted-foreground">
                No daily website trend data for this period.
              </div>
            </div>

            <div class="rounded-md border p-4">
              <div class="mb-4 flex items-center gap-2">
                <TrendingUp class="h-4 w-4 text-sky-600" />
                <div>
                  <div class="text-sm font-semibold">Website to lead funnel</div>
                  <div class="text-xs text-muted-foreground">High-level path from visits to this admin CRM.</div>
                </div>
              </div>
              <div class="space-y-4">
                <div v-for="step in websiteFunnelRows" :key="step.label" class="space-y-1.5">
                  <div class="flex items-center justify-between gap-3 text-sm">
                    <span class="font-medium">{{ step.label }}</span>
                    <span class="text-muted-foreground">{{ n(step.value) }}</span>
                  </div>
                  <div class="h-3 overflow-hidden rounded-full bg-muted">
                    <div class="h-full rounded-full" :class="step.class" :style="{ width: `${step.width}%` }" />
                  </div>
                  <div class="text-xs text-muted-foreground">{{ step.caption }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <div class="rounded-md border">
              <div class="flex items-center justify-between gap-3 border-b px-4 py-3">
                <div>
                  <div class="text-sm font-semibold">Top landing pages</div>
                  <div class="text-xs text-muted-foreground">Pages that started website sessions.</div>
                </div>
                <Badge variant="outline">{{ n(totalWebsiteSessions) }} sessions</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Landing page</TableHead>
                    <TableHead class="text-right">Sessions</TableHead>
                    <TableHead class="text-right">Users</TableHead>
                    <TableHead class="text-right">Engaged</TableHead>
                    <TableHead class="text-right">Key events</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="row in data.websiteAnalytics.topLandingPages" :key="dimension(row, 'landingPagePlusQueryString')">
                    <TableCell class="max-w-[420px]">
                      <div class="truncate font-medium">{{ cleanLandingPage(dimension(row, 'landingPagePlusQueryString')) }}</div>
                      <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div class="h-full rounded-full bg-sky-600" :style="{ width: `${barPercent(metric(row, 'sessions'), maxLandingPageSessions)}%` }" />
                      </div>
                    </TableCell>
                    <TableCell class="text-right font-medium">{{ n(metric(row, 'sessions')) }}</TableCell>
                    <TableCell class="text-right">{{ n(metric(row, 'totalUsers')) }}</TableCell>
                    <TableCell class="text-right">{{ fractionPct(metric(row, 'engagementRate')) }}</TableCell>
                    <TableCell class="text-right">{{ n(metric(row, 'keyEvents')) }}</TableCell>
                  </TableRow>
                  <TableRow v-if="!data.websiteAnalytics.topLandingPages.length">
                    <TableCell colspan="5" class="py-8 text-center text-muted-foreground">No landing page rows returned by GA4.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div class="space-y-4">
              <div class="rounded-md border p-4">
                <div class="mb-3 flex items-center gap-2">
                  <Route class="h-4 w-4 text-emerald-600" />
                  <div class="text-sm font-semibold">Traffic channels</div>
                </div>
                <div class="space-y-3">
                  <BreakdownRow
                    v-for="row in data.websiteAnalytics.trafficChannels"
                    :key="dimension(row, 'sessionDefaultChannelGroup')"
                    :label="dimension(row, 'sessionDefaultChannelGroup') || 'Unassigned'"
                    :value="metric(row, 'sessions')"
                    :max="maxChannelSessions"
                  />
                </div>
              </div>

              <div class="rounded-md border p-4">
                <div class="mb-3 flex items-center gap-2">
                  <MonitorSmartphone class="h-4 w-4 text-blue-600" />
                  <div class="text-sm font-semibold">Devices</div>
                </div>
                <div class="space-y-3">
                  <BreakdownRow
                    v-for="row in data.websiteAnalytics.deviceCategories"
                    :key="dimension(row, 'deviceCategory')"
                    :label="formatLabel(dimension(row, 'deviceCategory') || 'unknown')"
                    :value="metric(row, 'sessions')"
                    :max="maxDeviceSessions"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-6 xl:grid-cols-2">
            <div class="rounded-md border">
              <div class="border-b px-4 py-3">
                <div class="text-sm font-semibold">Source / medium</div>
                <div class="text-xs text-muted-foreground">Where website sessions came from.</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source / medium</TableHead>
                    <TableHead class="text-right">Sessions</TableHead>
                    <TableHead class="text-right">Users</TableHead>
                    <TableHead class="text-right">Key events</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="row in data.websiteAnalytics.sourceMedium" :key="dimension(row, 'sessionSourceMedium')">
                    <TableCell class="font-medium">{{ dimension(row, 'sessionSourceMedium') || 'Unassigned' }}</TableCell>
                    <TableCell class="text-right">{{ n(metric(row, 'sessions')) }}</TableCell>
                    <TableCell class="text-right">{{ n(metric(row, 'totalUsers')) }}</TableCell>
                    <TableCell class="text-right">{{ n(metric(row, 'keyEvents')) }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div class="rounded-md border">
              <div class="border-b px-4 py-3">
                <div class="text-sm font-semibold">Form and key events</div>
                <div class="text-xs text-muted-foreground">Lead-related GA4 events and conversion signals.</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead class="text-right">Count</TableHead>
                    <TableHead class="text-right">Users</TableHead>
                    <TableHead class="text-right">Key events</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="row in websiteEventRows" :key="dimension(row, 'eventName')">
                    <TableCell class="font-medium">{{ formatEventName(dimension(row, 'eventName')) }}</TableCell>
                    <TableCell class="text-right">{{ n(metric(row, 'eventCount')) }}</TableCell>
                    <TableCell class="text-right">{{ n(metric(row, 'totalUsers')) }}</TableCell>
                    <TableCell class="text-right">{{ n(metric(row, 'keyEvents')) }}</TableCell>
                  </TableRow>
                  <TableRow v-if="!websiteEventRows.length">
                    <TableCell colspan="4" class="py-8 text-center text-muted-foreground">No lead or form GA4 events returned for this range.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <div class="rounded-md border">
            <div class="border-b px-4 py-3">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold">Chatbot activity</div>
                  <div class="text-xs text-muted-foreground">Public assistant events tracked in GA4.</div>
                </div>
                <Badge variant="outline">{{ n(totalChatEventCount) }} events</Badge>
              </div>
            </div>
            <div class="grid gap-3 p-4 md:grid-cols-3">
              <MetricCell label="Chat opened" :value="n(chatMetricCount('chat_opened'))" />
              <MetricCell label="Messages sent" :value="n(chatMetricCount('chat_message_sent'))" />
              <MetricCell label="Lead handoffs" :value="n(chatMetricCount('chat_lead_handoff', 'chat_human_handoff'))" />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead class="text-right">Count</TableHead>
                  <TableHead class="text-right">Users</TableHead>
                  <TableHead class="text-right">Key events</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="row in chatEventRows" :key="dimension(row, 'eventName')">
                  <TableCell class="font-medium">{{ formatEventName(dimension(row, 'eventName')) }}</TableCell>
                  <TableCell class="text-right">{{ n(metric(row, 'eventCount')) }}</TableCell>
                  <TableCell class="text-right">{{ n(metric(row, 'totalUsers')) }}</TableCell>
                  <TableCell class="text-right">{{ n(metric(row, 'keyEvents')) }}</TableCell>
                </TableRow>
                <TableRow v-if="!chatEventRows.length">
                  <TableCell colspan="4" class="py-8 text-center text-muted-foreground">No chatbot GA4 events returned for this range.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardContent v-else>
          <div class="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            {{ websiteAnalyticsUnavailableMessage }}
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-xl">
              <Database class="h-5 w-5 text-sky-600" />
              Admin CRM Lead Sources
            </CardTitle>
            <CardDescription>{{ rangeLabel }}. Includes website forms and external marketplace/email leads stored in this admin CRM.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead class="text-right">Leads</TableHead>
                  <TableHead v-if="data.insights.externalCrmSyncEnabled" class="text-right">External sync</TableHead>
                  <TableHead class="text-right">Campaign tagged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="source in data.crm.leadSources" :key="source.key">
                  <TableCell class="font-medium">{{ source.label }}</TableCell>
                  <TableCell>
                    <Badge variant="outline" class="capitalize">{{ source.category.replaceAll('_', ' ') }}</Badge>
                  </TableCell>
                  <TableCell class="text-right">{{ n(source.total) }}</TableCell>
                  <TableCell v-if="data.insights.externalCrmSyncEnabled" class="text-right">{{ n(source.crmSynced) }}</TableCell>
                  <TableCell class="text-right">{{ n(source.withCampaign) }}</TableCell>
                </TableRow>
                <TableRow v-if="!data.crm.leadSources.length">
                  <TableCell :colspan="data.insights.externalCrmSyncEnabled ? 5 : 4" class="py-8 text-center text-muted-foreground">No admin CRM leads in this range.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-xl">
              <Code2 class="h-5 w-5 text-emerald-600" />
              Data Layer Audit
            </CardTitle>
            <CardDescription>Lead tracking contract and admin CRM field coverage.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="rounded-md border p-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-medium">Coverage status</span>
                <Badge :variant="dataLayerVariant">{{ dataLayerLabel }}</Badge>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
                <MetricCell label="UTM coverage" :value="pct(data.summary.utmCoverage)" />
                <MetricCell label="Source coverage" :value="pct(data.summary.sourceCoverage)" />
                <MetricCell v-if="typeof data.summary.chatCoverage === 'number'" label="Chat coverage" :value="pct(data.summary.chatCoverage)" />
                <MetricCell label="Campaign coverage" :value="pct(data.summary.campaignCoverage)" />
                <MetricCell label="Paid attribution" :value="pct(data.summary.paidAttributionCoverage)" />
                <MetricCell label="Click ID coverage" :value="pct(data.summary.clickIdCoverage)" />
                <MetricCell label="Backfilled" :value="pct(data.summary.backfilledAttributionCoverage)" />
              </div>
              <p class="mt-3 text-xs leading-5 text-muted-foreground">{{ dataLayerHelpText }}</p>
            </div>
            <div class="space-y-2">
              <div v-for="event in data.dataLayer.expectedEvents" :key="event.event" class="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                <div>
                  <div class="font-mono text-xs font-semibold">{{ event.event }}</div>
                  <div class="text-xs text-muted-foreground">{{ event.destination }}</div>
                </div>
                <Badge variant="outline">{{ event.status }}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle class="text-xl">Connections</CardTitle>
            <CardDescription>Configured platform ingestion and outbound sync state.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div v-for="connection in connections" :key="connection.label" class="flex items-center justify-between rounded-md border px-3 py-2">
              <span class="text-sm font-medium">{{ connection.label }}</span>
              <Badge :variant="connection.connected ? 'default' : 'outline'">{{ connection.connected ? 'Connected' : 'Not connected' }}</Badge>
            </div>
            <div class="grid gap-3 pt-2" :class="data.insights.externalCrmSyncEnabled ? 'grid-cols-2' : 'grid-cols-1'">
              <MetricCell v-if="data.insights.externalCrmSyncEnabled" label="External CRM synced" :value="`${n(data.summary.syncedToCrm)} leads`" />
              <MetricCell label="External feeds" :value="`${n(data.summary.externalMarketplaceLeads)} leads`" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-xl">Lead Types</CardTitle>
            <CardDescription>Admin CRM enquiry mix for the selected period.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-2">
            <BreakdownRow v-for="row in data.crm.typeBreakdown.slice(0, 8)" :key="row.key" :label="formatLabel(row.key)" :value="row.total" :max="maxTypeTotal" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-xl">Lead Status</CardTitle>
            <CardDescription>Pipeline state of report-period admin CRM leads.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-2">
            <BreakdownRow v-for="row in data.crm.statusBreakdown.slice(0, 8)" :key="row.key" :label="formatLabel(row.key)" :value="row.total" :max="maxStatusTotal" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-xl">
            <Target class="h-5 w-5 text-violet-600" />
            Campaign CPL Reconciliation
          </CardTitle>
          <CardDescription>Ad-platform rows matched to admin CRM leads by UTM campaign, campaign ID, or campaign name.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead class="text-right">Spend</TableHead>
                <TableHead class="text-right">Impr.</TableHead>
                <TableHead class="text-right">Clicks</TableHead>
                <TableHead class="text-right">CTR</TableHead>
                <TableHead class="text-right">CPC</TableHead>
                <TableHead class="text-right">Platform leads</TableHead>
                <TableHead class="text-right">Lead rate</TableHead>
                <TableHead class="text-right">Admin CRM leads</TableHead>
                <TableHead class="text-right">CPL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="campaign in data.campaigns" :key="`${campaign.platform}:${campaign.campaignId}`">
                <TableCell class="min-w-[260px] font-medium">{{ campaign.campaignName || campaign.campaignId }}</TableCell>
                <TableCell><Badge variant="outline">{{ platformLabel(campaign.platform) }}</Badge></TableCell>
                <TableCell class="text-right">{{ campaign.spend ? formatCurrency(campaign.spend, true) : '-' }}</TableCell>
                <TableCell class="text-right">{{ n(campaign.impressions) }}</TableCell>
                <TableCell class="text-right">{{ n(campaign.clicks) }}</TableCell>
                <TableCell class="text-right">{{ pctOrDash(campaign.ctr) }}</TableCell>
                <TableCell class="text-right">{{ campaign.clicks ? money(campaign.spend / campaign.clicks) : '-' }}</TableCell>
                <TableCell class="text-right">{{ n(campaign.platformLeads) }}</TableCell>
                <TableCell class="text-right">{{ pctOrDash(campaign.platformLeadRate) }}</TableCell>
                <TableCell class="text-right font-medium">{{ n(campaign.crmLeads) }}</TableCell>
                <TableCell class="text-right font-medium">{{ campaign.cpl == null ? '-' : formatCurrency(campaign.cpl, true) }}</TableCell>
              </TableRow>
              <TableRow v-if="!data.campaigns.length">
                <TableCell colspan="11" class="py-8 text-center text-muted-foreground">No campaign rows in this range.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle class="text-xl">Recent Admin CRM Leads</CardTitle>
            <CardDescription>Latest leads with source, UTM and attribution indicators.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead class="text-right">Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="lead in data.crm.recentLeads" :key="lead.id">
                  <TableCell class="whitespace-nowrap">{{ shortDateTime(lead.createdAt) }}</TableCell>
                  <TableCell>
                    <NuxtLink :to="`/admin/enquiries/${lead.id}`" class="font-medium text-primary hover:underline">
                      {{ formatLabel(lead.type) }}
                    </NuxtLink>
                    <div class="text-xs text-muted-foreground">{{ formatLabel(lead.status) }}</div>
                  </TableCell>
                  <TableCell>
                    <div class="font-medium">{{ lead.sourceBucket.label }}</div>
                    <div class="max-w-[260px] truncate text-xs text-muted-foreground">{{ lead.source || '-' }}</div>
                  </TableCell>
                  <TableCell>
                    <div class="max-w-[240px] truncate">{{ lead.utmCampaign || '-' }}</div>
                    <div class="text-xs text-muted-foreground">{{ [lead.utmSource, lead.utmMedium].filter(Boolean).join(' / ') || '-' }}</div>
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex flex-wrap justify-end gap-1">
                      <Badge v-if="data.insights.externalCrmSyncEnabled && lead.syncedToCrm" variant="outline">External CRM</Badge>
                      <Badge v-if="lead.hasExternalRef" variant="outline">External</Badge>
                      <Badge v-if="lead.attributedPlatform" variant="outline">{{ platformLabel(lead.attributedPlatform) }}</Badge>
                      <Badge v-if="lead.testDrive" variant="outline">Test drive</Badge>
                      <Badge v-if="lead.financeInterest" variant="outline">Finance</Badge>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-xl">Sync History</CardTitle>
            <CardDescription>Current ingestion health and recent platform runs.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <div
                v-for="run in latestSyncRuns"
                :key="`latest:${run.platform}`"
                class="rounded-md border bg-background px-3 py-2.5"
                :class="syncRunFrameClass(run)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <component :is="syncRunIcon(run)" class="size-4 shrink-0" :class="syncRunIconClass(run)" />
                      <span class="truncate text-sm font-semibold">{{ platformLabel(run.platform) }}</span>
                    </div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      Current · {{ shortDateTime(run.startedAt) }} · {{ run.rowsUpserted ?? 0 }} rows
                    </div>
                  </div>
                  <Badge :variant="syncRunBadgeVariant(run)">{{ syncRunBadgeLabel(run) }}</Badge>
                </div>
                <p v-if="run.error && !isResolvedSyncRun(run)" class="mt-2 text-xs text-destructive">{{ run.error }}</p>
              </div>
            </div>

            <details v-if="recentSyncRuns.length" class="group rounded-md border">
              <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5">
                <div class="min-w-0">
                  <div class="text-sm font-semibold">Recent runs</div>
                  <div class="truncate text-xs text-muted-foreground">Older sync history and resolved failures.</div>
                </div>
                <div class="flex items-center gap-2">
                  <Badge variant="outline">{{ recentSyncRuns.length }}</Badge>
                  <ChevronDown class="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </div>
              </summary>

              <div class="max-h-[320px] space-y-2 overflow-auto border-t p-3">
                <div
                  v-for="run in recentSyncRuns"
                  :key="`${run.platform}:${run.startedAt}`"
                  class="rounded-md border px-3 py-2"
                  :class="syncHistoryRowClass(run)"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <div class="truncate text-sm font-medium">{{ platformLabel(run.platform) }}</div>
                      <div class="text-xs text-muted-foreground">{{ shortDateTime(run.startedAt) }} · {{ run.rowsUpserted ?? 0 }} rows</div>
                    </div>
                    <Badge :variant="syncRunBadgeVariant(run)">{{ syncRunBadgeLabel(run) }}</Badge>
                  </div>
                  <p v-if="run.error" class="mt-2 text-xs" :class="isResolvedSyncRun(run) ? 'text-muted-foreground' : 'text-destructive'">
                    {{ isResolvedSyncRun(run) ? 'Resolved by a later successful sync. ' : '' }}{{ run.error }}
                  </p>
                </div>
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    </template>

    <div v-else class="rounded-md border bg-background py-12 text-center text-sm text-muted-foreground">
      Could not load the marketing report.
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AlertCircle,
  Activity,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Code2,
  Database,
  Gauge,
  GitBranch,
  Globe2,
  History,
  MonitorSmartphone,
  MousePointerClick,
  RefreshCw,
  Route,
  Target,
  TrendingUp,
  UserCheck,
  WalletCards,
} from 'lucide-vue-next';
import { defineComponent, h } from 'vue';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { formatCurrency } from '~/utils';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

type PresetId = 'mtd' | '7d' | '30d' | '90d';
type InboundLeadSource = 'carsales' | 'autotrader' | 'hyundai_oem' | 'meta_lead_ads' | 'other';

interface ReportResponse {
  period: { from: string; to: string };
  connected: Record<'ga4' | 'meta_ads' | 'google_ads', boolean>;
  summary: {
    totalCrmLeads: number;
    paidCrmLeads: number;
    syncedToCrm: number;
    externalMarketplaceLeads: number;
    crmSyncCoverage: number;
    utmCoverage: number;
    campaignCoverage: number;
    paidAttributionCoverage: number;
    sourceCoverage: number;
    chatCoverage?: number;
    clickIdCoverage: number;
    backfilledAttributionCoverage: number;
    vehicleCoverage: number;
  };
  platformMetrics: {
    ga4: { sessions: number; users: number; conversions: number };
    meta_ads: { spend: number; impressions: number; clicks: number; platformLeads: number; crmLeads: number; cpl: number | null; ctr: number | null; platformLeadRate: number | null };
    google_ads: { spend: number; impressions: number; clicks: number; platformLeads: number; crmLeads: number; cpl: number | null; ctr: number | null; platformLeadRate: number | null };
  };
  professionalMetrics: {
    ga4Website: {
      sessions: number;
      users: number;
      keyEvents: number;
      engagementRate: number | null;
      averageSessionDuration: number | null;
      screenPageViews: number;
      eventCount: number;
      eventsPerSession: number | null;
      conversionRate: number | null;
    };
    paidMedia: ProfessionalAdMetrics;
    googleAds: ProfessionalAdMetrics;
    metaAds: ProfessionalAdMetrics;
  };
  insights: {
    externalCrmSyncEnabled: boolean;
    executive: {
      totalSpend: number;
      totalCrmLeads: number;
      blendedCpl: number | null;
      paidShareOfLeads: number | null;
      topLeadSource: string | null;
      bestCampaign: string | null;
      dataQualityScore: number;
      primaryRecommendation: string;
    };
    funnel: Array<{
      key: string;
      label: string;
      value: number;
      rateFromPrevious: number | null;
      caption: string;
    }>;
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      title: string;
      detail: string;
      action: string;
    }>;
    sourceDiagnostics: Array<{
      key: string;
      label: string;
      category: string;
      total: number;
      crmSynced: number;
      withCampaign: number;
      share: number;
      crmSyncCoverage: number;
      campaignCoverage: number;
    }>;
    campaignDiagnostics: {
      bestByCpl: ReportCampaign | null;
      highestSpendNoCrmLead: ReportCampaign | null;
      opportunities: Array<{
        campaignName: string;
        platform: string;
        spend: number;
        clicks: number;
        crmLeads: number;
        issue: string;
      }>;
    };
    dataQuality: Array<{
      key: string;
      label: string;
      value: number;
      target: number;
      status: 'good' | 'watch' | 'poor';
    }>;
  };
  websiteAnalytics: {
    status: 'connected' | 'not_configured' | 'error';
    error: string | null;
    dailyTrend: WebsiteTrendRow[];
    topLandingPages: Ga4BreakdownRow[];
    trafficChannels: Ga4BreakdownRow[];
    sourceMedium: Ga4BreakdownRow[];
    deviceCategories: Ga4BreakdownRow[];
    topEvents: Ga4BreakdownRow[];
    formEvents: Ga4BreakdownRow[];
  };
  campaigns: ReportCampaign[];
  crm: {
    leadSources: Array<{ key: string; label: string; category: string; total: number; crmSynced: number; withCampaign: number }>;
    typeBreakdown: Array<{ key: string; total: number }>;
    statusBreakdown: Array<{ key: string; total: number }>;
    recentLeads: Array<{
      id: string;
      createdAt: string;
      type: string;
      status: string;
      source: string | null;
      utmSource: string | null;
      utmMedium: string | null;
      utmCampaign: string | null;
      attributedPlatform: string | null;
      attributedCampaignId: string | null;
      attributionMethod: string | null;
      attributionConfidence: number | null;
      testDrive: boolean;
      financeInterest: boolean;
      syncedToCrm: boolean;
      hasExternalRef: boolean;
      sourceBucket: { label: string };
    }>;
  };
  dataLayer: {
    status: 'healthy' | 'needs_attention' | 'limited_sample' | 'low_attribution_signal' | 'field_mapping_gap' | 'no_leads' | 'poor_coverage';
    expectedEvents: Array<{ event: string; destination: string; status: string }>;
  };
  syncRuns: SyncRun[];
}

type SyncRun = {
  platform: string;
  status: string;
  rowsUpserted: number | null;
  error: string | null;
  startedAt: string;
  finishedAt?: string | null;
};

type InboundLeadEmailAddress = {
  id: string;
  source: InboundLeadSource;
  label: string;
  localPart: string;
  email: string | null;
  enabled: boolean;
  enquiryType: string;
  createdAt: string;
};

type InboundLeadEmailResponse = {
  configured: boolean;
  domain: string | null;
  addresses: InboundLeadEmailAddress[];
};

type Ga4BreakdownRow = {
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
};

type WebsiteTrendRow = {
  date: string;
  sessions: number;
  users: number;
  keyEvents: number;
  crmLeads: number;
  paidSpend: number;
};

type TrendMetricKey = 'sessions' | 'keyEvents' | 'crmLeads';

type ReportCampaign = {
  platform: string;
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
};

type ProfessionalAdMetrics = {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  averageCpc: number | null;
  cpm: number | null;
  platformLeads: number;
  platformLeadRate?: number | null;
  conversionRate?: number | null;
  costPerConversion?: number | null;
  crmLeads: number;
  cpl: number | null;
  conversionsValue?: number | null;
  allConversions?: number | null;
  interactions?: number | null;
  interactionRate?: number | null;
  searchImpressionShare?: number | null;
};

const today = isoDate(new Date());
const from = ref(`${today.slice(0, 8)}01`);
const to = ref(today);

const query = computed(() => ({ from: from.value, to: to.value }));
const { data, pending, refresh } = await useFetch<ReportResponse>('/api/admin/analytics/marketing-report', {
  query,
});
const { data: inboundEmailData } = await useFetch<InboundLeadEmailResponse>('/api/admin/lead-ingestion/email-addresses');
const backfillPending = ref(false);

const presets: { id: PresetId; label: string }[] = [
  { id: 'mtd', label: 'Month to date' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
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

const summaryCards = computed(() => {
  const summary = data.value?.summary;
  const platforms = data.value?.platformMetrics;
  return [
    {
      label: 'Admin CRM leads',
      value: n(summary?.totalCrmLeads || 0),
      caption: `${n(summary?.paidCrmLeads || 0)} matched to paid media`,
      icon: UserCheck,
    },
    {
      label: 'Ad spend',
      value: formatCurrency((platforms?.meta_ads.spend || 0) + (platforms?.google_ads.spend || 0), true),
      caption: `Blended CPL ${blendedCpl.value}`,
      icon: WalletCards,
    },
    {
      label: 'Website activity',
      value: n(platforms?.ga4.sessions || 0),
      caption: `${n(platforms?.ga4.conversions || 0)} GA4 key events`,
      icon: Database,
    },
    {
      label: 'UTM coverage',
      value: pct(summary?.utmCoverage || 0),
      caption: `${pct(summary?.campaignCoverage || 0)} campaign tagged`,
      icon: Code2,
    },
  ];
});

const blendedCpl = computed(() => {
  const summary = data.value?.summary;
  const platforms = data.value?.platformMetrics;
  if (!summary || !platforms || !summary.paidCrmLeads) return '-';
  const spend = (platforms.meta_ads.spend || 0) + (platforms.google_ads.spend || 0);
  return formatCurrency(spend / summary.paidCrmLeads, true);
});

const connections = computed(() => [
  { label: 'GA4 Website', connected: Boolean(data.value?.connected.ga4) },
  { label: 'Meta Ads', connected: Boolean(data.value?.connected.meta_ads) },
  { label: 'Google Ads', connected: Boolean(data.value?.connected.google_ads) },
]);

const latestSyncRuns = computed(() => {
  const latestByPlatform = new Map<string, SyncRun>();
  for (const run of data.value?.syncRuns || []) {
    if (!latestByPlatform.has(run.platform)) latestByPlatform.set(run.platform, run);
  }
  return ['google_ads', 'meta_ads', 'ga4']
    .map(platform => latestByPlatform.get(platform))
    .filter(Boolean) as SyncRun[];
});

const recentSyncRuns = computed(() => (data.value?.syncRuns || []).slice(0, 10));

const maxTypeTotal = computed(() => Math.max(...(data.value?.crm.typeBreakdown.map(row => row.total) || [1]), 1));
const maxStatusTotal = computed(() => Math.max(...(data.value?.crm.statusBreakdown.map(row => row.total) || [1]), 1));
const maxInsightFunnelValue = computed(() => Math.max(...(data.value?.insights.funnel.map(step => step.value) || [1]), 1));
const activeInboundLeadSourceCount = computed(() => (inboundEmailData.value?.addresses || []).filter(address => address.enabled).length);
const totalWebsiteSessions = computed(() => data.value?.professionalMetrics.ga4Website.sessions || 0);
const maxChannelSessions = computed(() => Math.max(...(data.value?.websiteAnalytics.trafficChannels.map(row => metric(row, 'sessions')) || [1]), 1));
const maxDeviceSessions = computed(() => Math.max(...(data.value?.websiteAnalytics.deviceCategories.map(row => metric(row, 'sessions')) || [1]), 1));
const maxLandingPageSessions = computed(() => Math.max(...(data.value?.websiteAnalytics.topLandingPages.map(row => metric(row, 'sessions')) || [1]), 1));
const websiteTrendRows = computed(() => data.value?.websiteAnalytics.dailyTrend || []);
const trendHasData = computed(() => websiteTrendRows.value.some(row => row.sessions || row.keyEvents || row.crmLeads));
const chartGridLines = [57.5, 95, 132.5];
const chartStartLabel = computed(() => websiteTrendRows.value[0]?.date ? displayShortDate(websiteTrendRows.value[0].date) : '');
const chartEndLabel = computed(() => {
  const lastRow = websiteTrendRows.value.at(-1);
  return lastRow?.date ? displayShortDate(lastRow.date) : '';
});
const trendEndPoints = computed(() => [
  { key: 'sessions', class: 'text-sky-600', ...trendPoint('sessions', Math.max(websiteTrendRows.value.length - 1, 0)) },
  { key: 'keyEvents', class: 'text-amber-500', ...trendPoint('keyEvents', Math.max(websiteTrendRows.value.length - 1, 0)) },
  { key: 'crmLeads', class: 'text-emerald-600', ...trendPoint('crmLeads', Math.max(websiteTrendRows.value.length - 1, 0)) },
]);
const websiteEventRows = computed(() => {
  const analytics = data.value?.websiteAnalytics;
  if (!analytics) return [];
  return analytics.formEvents.length ? analytics.formEvents : analytics.topEvents.slice(0, 8);
});
const totalFormEventCount = computed(() => websiteEventRows.value.reduce((sum, row) => sum + metric(row, 'eventCount'), 0));
const chatEventRows = computed(() => {
  const analytics = data.value?.websiteAnalytics;
  if (!analytics) return [];
  return analytics.topEvents.filter((row) => /^chat_/i.test(dimension(row, 'eventName')));
});
const totalChatEventCount = computed(() => chatEventRows.value.reduce((sum, row) => sum + metric(row, 'eventCount'), 0));
const websiteFunnelRows = computed(() => {
  const sessions = data.value?.professionalMetrics.ga4Website.sessions || 0;
  const keyEvents = data.value?.professionalMetrics.ga4Website.keyEvents || 0;
  const crmLeads = data.value?.summary.totalCrmLeads || 0;
  const max = Math.max(sessions, totalFormEventCount.value, keyEvents, crmLeads, 1);

  return [
    {
      label: 'Sessions',
      value: sessions,
      caption: 'Website visits tracked by GA4',
      width: barPercent(sessions, max),
      class: 'bg-sky-600',
    },
    {
      label: 'Form events',
      value: totalFormEventCount.value,
      caption: 'GA4 lead/form activity',
      width: barPercent(totalFormEventCount.value, max),
      class: 'bg-blue-500',
    },
    {
      label: 'Key events',
      value: keyEvents,
      caption: 'GA4 conversion events',
      width: barPercent(keyEvents, max),
      class: 'bg-amber-500',
    },
    {
      label: 'Admin CRM leads',
      value: crmLeads,
      caption: 'Enquiries stored in this admin CRM',
      width: barPercent(crmLeads, max),
      class: 'bg-emerald-600',
    },
  ];
});

const websiteAnalyticsStatusLabel = computed(() => {
  if (data.value?.websiteAnalytics.status === 'connected') return 'Connected';
  if (data.value?.websiteAnalytics.status === 'error') return 'GA4 error';
  return 'Not connected';
});

const websiteAnalyticsBadgeVariant = computed(() => {
  if (data.value?.websiteAnalytics.status === 'connected') return 'default';
  if (data.value?.websiteAnalytics.status === 'error') return 'destructive';
  return 'outline';
});

const websiteAnalyticsUnavailableMessage = computed(() => {
  if (data.value?.websiteAnalytics.status === 'error') {
    return `GA4 website analytics could not be loaded: ${data.value.websiteAnalytics.error || 'Unknown GA4 error'}`;
  }
  return 'GA4 website analytics is not connected for this dealer.';
});

const dataLayerLabel = computed(() => {
  const status = data.value?.dataLayer.status;
  if (status === 'healthy') return 'Healthy';
  if (status === 'needs_attention') return 'Needs attention';
  if (status === 'limited_sample') return 'Limited sample';
  if (status === 'low_attribution_signal' || status === 'poor_coverage') return 'Low attribution signal';
  if (status === 'field_mapping_gap') return 'Field mapping gap';
  return 'No CRM leads';
});

const dataLayerVariant = computed(() => data.value?.dataLayer.status === 'field_mapping_gap' ? 'destructive' : data.value?.dataLayer.status === 'healthy' ? 'default' : 'secondary');

const dataLayerHelpText = computed(() => {
  const status = data.value?.dataLayer.status;
  const totalLeads = data.value?.summary.totalCrmLeads || 0;

  if (status === 'healthy') return 'Lead source, campaign and paid attribution fields are being captured at healthy levels for this period.';
  if (status === 'needs_attention') return 'Tracking events are implemented, but some admin CRM attribution fields are below target and should be monitored.';
  if (status === 'limited_sample') return `Only ${n(totalLeads)} admin CRM leads are in this range, so attribution percentages can look severe from a small sample.`;
  if (status === 'low_attribution_signal' || status === 'poor_coverage') return 'Tracking events are implemented, but current admin CRM leads are not carrying enough UTM, campaign or click ID fields.';
  if (status === 'field_mapping_gap') return 'Admin CRM lead records are missing source fields. Check form payloads and inbound source mapping.';
  return 'No admin CRM leads were captured in this range, so field coverage cannot be assessed yet.';
});

function priorityBadgeVariant(priority: 'high' | 'medium' | 'low') {
  if (priority === 'high') return 'destructive';
  if (priority === 'medium') return 'secondary';
  return 'outline';
}

function qualityBadgeVariant(status: 'good' | 'watch' | 'poor') {
  if (status === 'good') return 'default';
  if (status === 'watch') return 'secondary';
  return 'destructive';
}

function qualityBarClass(status: 'good' | 'watch' | 'poor') {
  if (status === 'good') return 'bg-emerald-600';
  if (status === 'watch') return 'bg-amber-500';
  return 'bg-destructive';
}

async function runAttributionBackfill() {
  if (backfillPending.value) return;
  backfillPending.value = true;
  try {
    await $fetch('/api/admin/analytics/attribution-backfill', {
      method: 'POST',
      body: { days: 180 },
    });
    await refresh();
  } finally {
    backfillPending.value = false;
  }
}

function applyPreset(id: PresetId) {
  to.value = today;
  if (id === 'mtd') from.value = `${today.slice(0, 8)}01`;
  if (id === '7d') from.value = daysAgo(6);
  if (id === '30d') from.value = daysAgo(29);
  if (id === '90d') from.value = daysAgo(89);
}

function platformLabel(platform: string) {
  if (platform === 'meta_ads') return 'Meta';
  if (platform === 'google_ads') return 'Google Ads';
  if (platform === 'ga4') return 'GA4';
  if (platform === 'crm') return 'CRM';
  return platform;
}

function isResolvedSyncRun(run: SyncRun) {
  if (run.status === 'success') return false;
  const runStartedAt = new Date(run.startedAt).getTime();
  return Boolean(data.value?.syncRuns.some(candidate =>
    candidate.platform === run.platform &&
    candidate.status === 'success' &&
    new Date(candidate.startedAt).getTime() > runStartedAt,
  ));
}

function syncRunBadgeLabel(run: SyncRun) {
  if (isResolvedSyncRun(run)) return 'resolved';
  return run.status;
}

function syncRunBadgeVariant(run: SyncRun) {
  if (run.status === 'success') return 'default';
  if (isResolvedSyncRun(run)) return 'secondary';
  return 'destructive';
}

function syncRunIcon(run: SyncRun) {
  if (run.status === 'success') return CheckCircle2;
  if (isResolvedSyncRun(run)) return History;
  return AlertCircle;
}

function syncRunIconClass(run: SyncRun) {
  if (run.status === 'success') return 'text-emerald-600';
  if (isResolvedSyncRun(run)) return 'text-muted-foreground';
  return 'text-destructive';
}

function syncRunFrameClass(run: SyncRun) {
  if (run.status === 'success') return 'border-emerald-200 bg-emerald-50/40';
  if (isResolvedSyncRun(run)) return 'border-muted bg-muted/20';
  return 'border-destructive/40 bg-destructive/5';
}

function syncHistoryRowClass(run: SyncRun) {
  if (run.status === 'success') return 'bg-background';
  if (isResolvedSyncRun(run)) return 'border-muted bg-muted/20 opacity-80';
  return 'border-destructive/40 bg-destructive/5';
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatEventName(value: string) {
  return formatLabel(value || 'unknown');
}

function cleanLandingPage(value: string) {
  if (!value || value === '(not set)') return '/';
  return value;
}

function dimension(row: Ga4BreakdownRow, key: string) {
  return row.dimensions[key] || '';
}

function metric(row: Ga4BreakdownRow, key: string) {
  const value = row.metrics[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function chatMetricCount(...eventNames: string[]) {
  const wanted = new Set(eventNames.map(name => name.toLowerCase()));
  return chatEventRows.value
    .filter((row) => wanted.has(dimension(row, 'eventName').toLowerCase()))
    .reduce((sum, row) => sum + metric(row, 'eventCount'), 0);
}

function barPercent(value: number, max: number) {
  if (!max) return 0;
  return Math.max(value > 0 ? 3 : 0, Math.min(100, (value / max) * 100));
}

function trendLinePoints(key: TrendMetricKey) {
  return websiteTrendRows.value
    .map((_, index) => {
      const point = trendPoint(key, index);
      return `${point.x},${point.y}`;
    })
    .join(' ');
}

function trendPoint(key: TrendMetricKey, index: number) {
  const rows = websiteTrendRows.value;
  const max = Math.max(...rows.map(row => row[key]), 1);
  const row = rows[index] || rows[0];
  const value = row?.[key] || 0;
  const x = rows.length <= 1 ? 36 : 36 + (index / (rows.length - 1)) * 584;
  const y = 170 - (value / max) * 150;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
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

function displayShortDate(value: string) {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(new Date(`${value}T00:00:00Z`));
}

function shortDateTime(value: string) {
  return new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

const n = (value: number) => new Intl.NumberFormat('en-AU').format(value || 0);
const pct = (value: number) => `${new Intl.NumberFormat('en-AU', { maximumFractionDigits: 1 }).format(value || 0)}%`;
const money = (value: number) => formatCurrency(value || 0, true);
const moneyOrDash = (value: number | null | undefined) => value == null ? '-' : money(value);
const pctOrDash = (value: number | null | undefined) => value == null ? '-' : pct(value);
const fractionPct = (value: number | null | undefined) => value == null ? '-' : pct(value * 100);
const decimal = (value: number | null | undefined) => value == null ? '-' : new Intl.NumberFormat('en-AU', { maximumFractionDigits: 1 }).format(value);

function duration(value: number | null | undefined) {
  if (value == null) return '-';
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

const MetricCell = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  setup(props) {
    return () => h('div', { class: 'rounded-md bg-muted/40 p-2' }, [
      h('div', { class: 'text-xs text-muted-foreground' }, props.label),
      h('div', { class: 'mt-1 font-semibold' }, props.value),
    ]);
  },
});

const BreakdownRow = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  setup(props) {
    return () => h('div', { class: 'space-y-1' }, [
      h('div', { class: 'flex items-center justify-between gap-3 text-sm' }, [
        h('span', { class: 'truncate font-medium' }, props.label),
        h('span', { class: 'text-muted-foreground' }, n(props.value)),
      ]),
      h('div', { class: 'h-1.5 overflow-hidden rounded-full bg-muted' }, [
        h('div', {
          class: 'h-full rounded-full bg-sky-600',
          style: { width: `${Math.max(4, Math.min(100, (props.value / props.max) * 100))}%` },
        }),
      ]),
    ]);
  },
});
</script>
