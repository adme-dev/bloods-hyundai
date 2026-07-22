<template>
  <div class="mx-auto w-full max-w-[1200px] space-y-6 text-foreground">
    <AdminPageHeader
      title="Marketing Hub"
      description="Spend, website, attribution and CRM capture — one commercial view."
    >
      <template #actions>
        <div class="relative flex w-full flex-col items-stretch gap-2 min-[701px]:w-auto min-[701px]:items-end">
          <div class="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border bg-card p-1 shadow-sm">
            <Button
              v-for="preset in presets"
              :key="preset.id"
              variant="ghost"
              size="sm"
              class="shrink-0"
              :class="activePreset === preset.id ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''"
              :aria-pressed="activePreset === preset.id"
              @click="applyPreset(preset.id)"
            >
              {{ preset.label }}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="shrink-0"
              :class="activePreset === null ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''"
              :aria-expanded="customRangeOpen"
              @click="customRangeOpen = !customRangeOpen"
            >
              {{ compactRangeLabel }} <ChevronDown class="ml-1 h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" class="shrink-0" @click="openExplainer()">
              <CircleHelp class="mr-1.5 h-4 w-4" /> Help
            </Button>
          </div>

          <Card v-if="customRangeOpen" class="absolute right-0 top-12 z-20 w-full min-w-[270px] shadow-xl min-[431px]:w-auto">
            <CardContent class="grid gap-3 p-3 min-[431px]:grid-cols-2">
              <div class="space-y-1.5">
                <Label class="text-xs">From</Label>
                <AdminDatePicker v-model="from" label="Report from date" :max="to" />
              </div>
              <div class="space-y-1.5">
                <Label class="text-xs">To</Label>
                <AdminDatePicker v-model="to" label="Report to date" :min="from" :max="today" />
              </div>
            </CardContent>
          </Card>

          <div
            class="flex items-center justify-end gap-2 text-xs"
            :class="syncError ? 'text-destructive' : 'text-muted-foreground'"
            role="status"
            aria-live="polite"
          >
            <span class="size-2 rounded-full" :class="syncError ? 'bg-destructive' : 'bg-emerald-500'" />
            <span class="max-w-md text-right">{{ syncStatusText }}</span>
            <Button variant="ghost" size="icon" class="h-7 w-7" :disabled="pending || syncing" aria-label="Sync provider data" title="Sync provider data" @click="syncAndRefresh">
              <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': pending || syncing }" />
            </Button>
          </div>
        </div>
      </template>
    </AdminPageHeader>

    <Alert v-if="data && attributionBanner" variant="destructive" class="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-l-[3px] min-[701px]:grid-cols-[auto_minmax(0,1fr)_auto]">
      <div class="grid size-9 place-items-center rounded-lg bg-destructive/10">
        <TriangleAlert class="h-4 w-4" />
      </div>
      <div class="min-w-0">
        <AlertTitle>{{ attributionBanner.title }}</AlertTitle>
        <AlertDescription class="text-foreground/80">
          <p v-if="attributionBanner.kind === 'unmatched'">
            {{ money(data.insights.executive.totalSpend) }} in ad spend is synced, but none of the
            <strong>{{ n(data.summary.totalCrmLeads) }} CRM leads carries paid-platform evidence</strong>.
            This is the selected-period result, not a disconnected integration.
          </p>
          <p v-else>Paid campaign data is not connected to this dealer yet. Connect an ad platform before assessing paid attribution.</p>
          <Button variant="link" class="mt-1 h-auto p-0 text-destructive" @click="openExplainer('unmatched-banner')">What does this mean?</Button>
        </AlertDescription>
      </div>
      <Button variant="outline" size="sm" class="col-span-2 min-[701px]:col-span-1" as-child>
        <NuxtLink :to="attributionBanner.to">{{ attributionBanner.action }} <ArrowRight class="ml-1 h-4 w-4" /></NuxtLink>
      </Button>
    </Alert>

    <Card v-if="pending">
      <CardContent class="flex min-h-48 items-center justify-center gap-2 text-muted-foreground">
        <RefreshCw class="h-5 w-5 animate-spin" /> Loading marketing report…
      </CardContent>
    </Card>

    <Alert v-else-if="error || !data" variant="destructive">
      <TriangleAlert class="h-4 w-4" />
      <AlertTitle>Could not load the marketing report</AlertTitle>
      <AlertDescription><Button variant="outline" size="sm" class="mt-3" @click="refresh()">Try again</Button></AlertDescription>
    </Alert>

    <template v-else>
      <section aria-label="Headline metrics" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card v-for="item in summaryCards" :key="item.label" :class="item.alert ? 'border-destructive/40' : ''">
          <CardHeader class="grid grid-cols-[1fr_auto] gap-2 pb-2">
            <CardDescription class="text-[11px] font-bold uppercase tracking-[.05em]">{{ item.label }}</CardDescription>
            <div class="flex items-center gap-1 text-muted-foreground">
              <Button variant="ghost" size="icon" class="h-6 w-6" :aria-label="'Explain ' + item.label" @click="openExplainer(item.topic)">
                <CircleHelp class="h-3.5 w-3.5" />
              </Button>
              <component :is="item.icon" class="h-4 w-4" />
            </div>
            <CardTitle class="col-span-2 text-[26px] font-bold leading-none tracking-[-.02em]" :class="item.alert ? 'text-destructive' : ''">{{ item.value }}</CardTitle>
          </CardHeader>
          <CardContent class="text-xs text-muted-foreground">{{ item.caption }}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div class="flex flex-wrap items-center gap-2">
            <ChartNoAxesCombined class="h-5 w-5 text-primary" />
            <CardTitle id="executive-title">Executive Readout</CardTitle>
            <Badge :variant="data.insights.executive.dataQualityScore >= 80 ? 'default' : data.insights.executive.dataQualityScore >= 50 ? 'secondary' : 'destructive'" class="ml-auto">
              {{ data.insights.executive.dataQualityScore }}% data quality
            </Badge>
          </div>
          <CardDescription>Commercial view of spend, lead quality, attribution and CRM capture.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <div class="grid gap-3 min-[431px]:grid-cols-2 xl:grid-cols-4">
            <div v-for="step in data.insights.funnel" :key="step.key" class="rounded-lg border bg-muted/40 p-3">
              <p class="text-xs font-medium text-muted-foreground">{{ step.label }}</p>
              <strong class="mt-1 block text-2xl">{{ n(step.value) }}</strong>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-primary transition-[width]" :style="{ width: barPercent(step.value, maxInsightFunnelValue) + '%' }" />
              </div>
            </div>
          </div>

          <div class="grid gap-6 lg:grid-cols-2">
            <div class="space-y-3">
              <p class="text-[11px] font-bold uppercase tracking-[.09em] text-muted-foreground">Data health</p>
              <div v-for="check in data.insights.dataQuality" :key="check.key" class="space-y-1.5">
                <div class="flex items-center justify-between text-sm">
                  <strong>{{ check.label }}</strong>
                  <Badge :variant="check.status === 'poor' ? 'destructive' : check.status === 'watch' ? 'secondary' : 'default'">{{ pct(check.value) }}</Badge>
                </div>
                <div class="relative h-2 overflow-hidden rounded-full bg-muted">
                  <div class="h-full rounded-full" :class="check.status === 'poor' ? 'bg-destructive' : check.status === 'watch' ? 'bg-amber-500' : 'bg-emerald-500'" :style="{ width: Math.min(100, check.value) + '%' }" />
                </div>
                <small class="text-muted-foreground">Target {{ pct(check.target) }}</small>
              </div>
            </div>

            <div class="space-y-3">
              <p class="text-[11px] font-bold uppercase tracking-[.09em] text-muted-foreground">Campaign opportunities</p>
              <div v-if="data.insights.campaignDiagnostics.opportunities.length" class="space-y-2">
                <div v-for="item in data.insights.campaignDiagnostics.opportunities.slice(0, 3)" :key="item.platform + ':' + item.campaignName" class="rounded-lg border bg-muted/40 p-3">
                  <h3 class="truncate text-sm font-semibold">{{ item.campaignName }}</h3>
                  <p class="mt-1 text-xs text-muted-foreground">{{ platformLabel(item.platform) }} · {{ money(item.spend) }} · {{ n(item.clicks) }} clicks · {{ n(item.crmLeads) }} CRM leads</p>
                  <Badge variant="outline" class="mt-2">{{ item.issue }}</Badge>
                </div>
              </div>
              <p v-else class="text-sm text-muted-foreground">No high-spend campaign issues detected for this period.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section class="grid gap-4 lg:grid-cols-3" aria-label="Connections and lead mix">
        <Card>
          <CardHeader><CardTitle>Connections</CardTitle><CardDescription>Platform ingestion and sync state.</CardDescription></CardHeader>
          <CardContent class="space-y-2">
            <div v-for="connection in connections" :key="connection.label" class="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm font-medium">
              {{ connection.label }}
              <Badge :variant="connection.status === 'Not connected' ? 'destructive' : connection.status === 'Synced data' ? 'secondary' : 'default'">{{ connection.status }}</Badge>
            </div>
            <div class="rounded-lg border border-dashed bg-muted/40 p-3">
              <small class="text-muted-foreground">External feeds (marketplace / email)</small>
              <strong class="mt-1 block text-lg">{{ n(data.summary.externalMarketplaceLeads) }} leads</strong>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lead Types</CardTitle><CardDescription>CRM enquiry mix for the period.</CardDescription></CardHeader>
          <CardContent class="space-y-3">
            <div v-for="row in data.crm.typeBreakdown.slice(0, 6)" :key="row.key" class="space-y-1.5">
              <div class="flex justify-between text-sm"><span class="font-medium">{{ formatLabel(row.key) }}</span><strong>{{ n(row.total) }}</strong></div>
              <div class="h-2 overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full bg-primary" :style="{ width: barPercent(row.total, maxTypeTotal) + '%' }" /></div>
            </div>
            <p v-if="!data.crm.typeBreakdown.length" class="text-sm text-muted-foreground">No leads in this range.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lead Status</CardTitle><CardDescription>Pipeline state of period leads.</CardDescription></CardHeader>
          <CardContent class="space-y-3">
            <div v-for="row in data.crm.statusBreakdown.slice(0, 6)" :key="row.key" class="space-y-1.5">
              <div class="flex justify-between text-sm"><span class="font-medium">{{ formatLabel(row.key) }}</span><strong>{{ n(row.total) }}</strong></div>
              <div class="h-2 overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full bg-primary" :style="{ width: barPercent(row.total, maxStatusTotal) + '%' }" /></div>
            </div>
            <p v-if="!data.crm.statusBreakdown.length" class="text-sm text-muted-foreground">No lead statuses in this range.</p>
          </CardContent>
        </Card>
      </section>

      <section class="space-y-3" aria-labelledby="campaign-title">
        <div class="flex flex-wrap items-center gap-3">
          <h2 id="campaign-title" class="text-base font-semibold">Campaign CPL Reconciliation</h2>
          <Button variant="ghost" size="icon" class="h-7 w-7" aria-label="Explain CPL reconciliation" @click="openExplainer('cpl-reconciliation')"><CircleHelp class="h-4 w-4" /></Button>
          <Separator class="min-w-8 flex-1" />
          <p class="text-xs text-muted-foreground">Ad rows matched to CRM leads by UTM campaign, ID or name</p>
        </div>
        <Card class="overflow-hidden">
          <div class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead><TableHead>Platform</TableHead><TableHead class="text-right">Spend</TableHead><TableHead class="text-right">Impr.</TableHead><TableHead class="text-right">Clicks</TableHead><TableHead class="text-right">CTR</TableHead><TableHead class="text-right">CPC</TableHead><TableHead class="text-right">Plat. leads</TableHead><TableHead class="text-right">Lead rate</TableHead><TableHead class="text-right">CRM leads</TableHead><TableHead class="text-right">CPL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="campaign in data.campaigns" :key="campaign.platform + ':' + campaign.campaignId">
                  <TableCell><span class="block max-w-[300px] truncate font-mono text-xs font-semibold">{{ campaign.campaignName || campaign.campaignId }}</span></TableCell>
                  <TableCell><Badge variant="outline">{{ platformLabel(campaign.platform) }}</Badge></TableCell>
                  <TableCell class="text-right">{{ money(campaign.spend) }}</TableCell><TableCell class="text-right">{{ n(campaign.impressions) }}</TableCell><TableCell class="text-right">{{ n(campaign.clicks) }}</TableCell><TableCell class="text-right">{{ pctOrDash(campaign.ctr) }}</TableCell><TableCell class="text-right">{{ campaign.clicks ? money(campaign.spend / campaign.clicks) : '—' }}</TableCell><TableCell class="text-right">{{ n(campaign.platformLeads) }}</TableCell><TableCell class="text-right">{{ pctOrDash(campaign.platformLeadRate) }}</TableCell><TableCell class="text-right" :class="campaign.crmLeads === 0 ? 'font-bold text-destructive' : ''">{{ n(campaign.crmLeads) }}</TableCell><TableCell class="text-right" :class="campaign.cpl == null ? 'text-muted-foreground' : ''">{{ moneyOrDash(campaign.cpl) }}</TableCell>
                </TableRow>
                <TableRow v-if="!data.campaigns.length"><TableCell colspan="11" class="h-28 text-center text-muted-foreground">No campaign data in this range.</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>

      <section class="grid gap-4 lg:grid-cols-3" aria-label="Platform depth">
        <Card v-for="panel in platformMetricPanels" :key="panel.title">
          <CardHeader><CardTitle>{{ panel.title }}</CardTitle><CardDescription>{{ panel.description }}</CardDescription></CardHeader>
          <CardContent class="grid grid-cols-2 gap-x-5 gap-y-3">
            <div v-for="item in panel.items" :key="item.label">
              <small class="block text-xs font-medium text-muted-foreground">{{ item.label }}</small>
              <strong class="mt-1 block text-lg">{{ item.value }}</strong>
            </div>
          </CardContent>
        </Card>
        <p v-if="!avgSaleValueSet && data.professionalMetrics.paidMedia.roas == null" class="text-xs text-muted-foreground lg:col-span-3">
          <NuxtLink to="/admin/settings" class="font-medium text-primary underline">Set an average sale value</NuxtLink> to see modeled ROAS.
        </p>
      </section>

      <section class="space-y-3" aria-labelledby="website-title">
        <div class="flex items-center gap-3">
          <h2 id="website-title" class="text-base font-semibold">Website Analytics</h2>
          <Separator class="flex-1" />
          <Badge :variant="data.websiteAnalytics.status === 'connected' ? 'default' : 'secondary'">{{ websiteAnalyticsStatusLabel }}</Badge>
        </div>

        <template v-if="websiteAnalyticsAvailable">
          <Card>
            <CardHeader class="gap-3">
              <div>
                <CardTitle>{{ activeAnalyticsChart.title }}</CardTitle>
                <CardDescription>{{ activeAnalyticsChart.description }}</CardDescription>
              </div>
              <Tabs :model-value="activeAnalyticsTab" @update:model-value="selectAnalyticsTab(String($event) as AnalyticsTabId)">
                <TabsList class="w-full justify-start overflow-x-auto min-[701px]:w-auto">
                  <TabsTrigger v-for="tab in analyticsChartTabs" :key="tab.id" :value="tab.id">{{ tab.label }}</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-2 overflow-hidden rounded-lg border lg:grid-cols-4">
                <div v-for="item in activeAnalyticsChart.kpis" :key="item.label" class="border-b border-r bg-muted/30 p-3">
                  <small class="block text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">{{ item.label }}</small>
                  <strong class="my-1 block text-xl">{{ item.value }}</strong>
                  <span class="text-[10.5px] text-muted-foreground">{{ item.caption }}</span>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-1">
                <Button
                  v-for="series in activeAnalyticsChart.series"
                  :key="series.key"
                  variant="ghost"
                  size="sm"
                  :class="hiddenChartSeries.has(series.key) ? 'opacity-40 line-through' : ''"
                  :aria-pressed="!hiddenChartSeries.has(series.key)"
                  @click="toggleChartSeries(series.key)"
                >
                  <span class="mr-2 h-1 w-3 rounded-full" :class="chartSeriesClass(series.className, 'background')" />{{ series.label }}
                </Button>
                <span class="ml-auto hidden text-xs text-muted-foreground min-[701px]:inline">Daily · absolute values</span>
              </div>

              <div
                v-if="activeTrendHasData"
                class="relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                tabindex="0"
                :aria-label="activeAnalyticsChart.title + '. Use left and right arrow keys to inspect daily values.'"
                @focus="showLatestChartPoint"
                @blur="activeChartPoint = null"
                @keydown.left.prevent="moveActiveChartPoint(-1)"
                @keydown.right.prevent="moveActiveChartPoint(1)"
              >
                <svg class="block h-[220px] w-full overflow-visible min-[701px]:h-[250px] [&_line]:stroke-border [&_path]:fill-none [&_text]:fill-muted-foreground [&_text]:text-[9px]" viewBox="0 0 720 220" preserveAspectRatio="none" aria-hidden="true">
                  <g v-for="tick in chartAxisTicks" :key="tick.y">
                    <line x1="54" :y1.attr="tick.y" x2="686" :y2.attr="tick.y" />
                    <text x="48" :y.attr="tick.y + 4" text-anchor="end">{{ formatChartAxis(tick.left, 'left') }}</text>
                    <text v-if="activeChartRightMax" x="692" :y.attr="tick.y + 4">{{ formatChartAxis(tick.right, 'right') }}</text>
                  </g>
                  <path v-for="series in visibleChartSeries" :key="series.key" :d.attr="chartLinePath(series)" stroke-width="2.4" :class="chartSeriesClass(series.className, 'stroke')" />
                  <g v-for="(row, index) in websiteTrendRows" :key="row.date" @mouseenter="activeChartPoint = index" @mouseleave="activeChartPoint = null">
                    <rect class="fill-transparent pointer-events-auto" :x.attr="chartHitX(index)" y="18" :width.attr="chartHitWidth" height="164" />
                  </g>
                  <line v-if="activeChartPoint != null" class="stroke-muted-foreground opacity-50 [stroke-dasharray:3_3]" :x1.attr="chartPointX(activeChartPoint)" y1="18" :x2.attr="chartPointX(activeChartPoint)" y2="182" />
                  <circle v-for="point in activeChartDots" :key="point.key" :cx.attr="point.x" :cy.attr="point.y" r="4" :class="chartSeriesClass(point.className, 'fill')" />
                </svg>
                <div class="-mt-4 flex justify-between px-[4.6%] text-[10px] text-muted-foreground"><span>{{ chartStartLabel }}</span><span>{{ chartEndLabel }}</span></div>
                <div v-if="activeChartTooltip" class="pointer-events-none absolute top-9 z-10 grid min-w-[178px] -translate-x-1/2 gap-1 rounded-lg border bg-popover p-2.5 text-popover-foreground shadow-xl" role="status" :style="{ left: activeChartTooltip.left + '%' }">
                  <strong class="text-xs">{{ activeChartTooltip.date }}</strong>
                  <span v-for="item in activeChartTooltip.items" :key="item.label" class="grid grid-cols-[11px_1fr_auto] items-center gap-1.5 text-[10.5px] text-muted-foreground">
                    <i class="h-1 w-3 rounded-full" :class="chartSeriesClass(item.className, 'background')" />{{ item.label }} <b class="text-foreground">{{ item.value }}</b>
                  </span>
                </div>
              </div>
              <p v-else class="grid min-h-52 place-items-center text-sm text-muted-foreground">No daily {{ activeAnalyticsChart.emptyLabel }} data in this range.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Website to lead funnel</CardTitle><CardDescription>High-level path from visits to this admin CRM.</CardDescription></CardHeader>
            <CardContent>
              <ol class="grid list-none gap-3 p-0 lg:grid-cols-3" aria-label="Website to admin CRM stages">
                <li v-for="(stage, index) in websiteLeadFunnelRows" :key="stage.label" class="rounded-lg border bg-muted/30 p-3">
                  <small class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Stage {{ index + 1 }}</small>
                  <strong class="mt-1 block text-2xl">{{ n(stage.value) }}</strong>
                  <span class="mb-2 block text-xs font-semibold">{{ stage.label }}</span>
                  <div class="h-2 overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full bg-primary" :style="{ width: stage.width + '%' }" /></div>
                  <p class="mt-1.5 text-[10.5px] text-muted-foreground">{{ stage.caption }}</p>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Alert v-if="data.websiteAnalytics.status === 'stored_data'">
            <Database class="h-4 w-4" />
            <AlertDescription>{{ hasCachedWebsiteBreakdowns ? 'Daily GA4 totals and acquisition breakdowns are available from the production sync cache.' : 'Daily GA4 totals are available from the existing sync. Live landing-page, channel and event breakdowns require the GA4 reporting credential.' }}</AlertDescription>
          </Alert>

          <div class="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Top landing pages</CardTitle><CardDescription>Pages that started website sessions.</CardDescription></CardHeader>
              <div v-if="data.websiteAnalytics.topLandingPages.length" class="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Landing page</TableHead><TableHead class="text-right">Sessions</TableHead><TableHead class="text-right">Users</TableHead><TableHead class="text-right">Engaged</TableHead><TableHead class="text-right">Key events</TableHead></TableRow></TableHeader>
                  <TableBody><TableRow v-for="row in data.websiteAnalytics.topLandingPages.slice(0, 8)" :key="dimension(row, 'landingPagePlusQueryString')"><TableCell>{{ cleanLandingPage(dimension(row, 'landingPagePlusQueryString')) }}</TableCell><TableCell class="text-right">{{ n(metric(row, 'sessions')) }}</TableCell><TableCell class="text-right">{{ n(metric(row, 'totalUsers')) }}</TableCell><TableCell class="text-right">{{ fractionPct(metric(row, 'engagementRate')) }}</TableCell><TableCell class="text-right">{{ n(metric(row, 'keyEvents')) }}</TableCell></TableRow></TableBody>
                </Table>
              </div>
              <CardContent v-else class="grid min-h-28 place-items-center text-sm text-muted-foreground">{{ websiteBreakdownEmptyMessage('landing-page') }}</CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Traffic channels</CardTitle><CardDescription>How website sessions were acquired.</CardDescription></CardHeader>
              <CardContent v-if="data.websiteAnalytics.trafficChannels.length" class="space-y-3">
                <div v-for="row in data.websiteAnalytics.trafficChannels.slice(0, 8)" :key="dimension(row, 'sessionDefaultChannelGroup')" class="space-y-1.5">
                  <div class="flex justify-between text-sm"><span>{{ dimension(row, 'sessionDefaultChannelGroup') || '(not set)' }}</span><strong>{{ n(metric(row, 'sessions')) }}</strong></div>
                  <div class="h-2 overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full bg-primary" :style="{ width: barPercent(metric(row, 'sessions'), maxChannelSessions) + '%' }" /></div>
                </div>
              </CardContent>
              <CardContent v-else class="grid min-h-28 place-items-center text-sm text-muted-foreground">{{ websiteBreakdownEmptyMessage('traffic-channel') }}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Source / medium</CardTitle><CardDescription>Where website sessions came from.</CardDescription></CardHeader>
            <div v-if="data.websiteAnalytics.sourceMedium.length" class="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Source / medium</TableHead><TableHead class="text-right">Sessions</TableHead><TableHead class="text-right">Users</TableHead><TableHead class="text-right">Key events</TableHead></TableRow></TableHeader>
                <TableBody><TableRow v-for="row in data.websiteAnalytics.sourceMedium.slice(0, 8)" :key="dimension(row, 'sessionSourceMedium')"><TableCell>{{ dimension(row, 'sessionSourceMedium') || '(not set)' }}</TableCell><TableCell class="text-right">{{ n(metric(row, 'sessions')) }}</TableCell><TableCell class="text-right">{{ n(metric(row, 'totalUsers')) }}</TableCell><TableCell class="text-right">{{ n(metric(row, 'keyEvents')) }}</TableCell></TableRow></TableBody>
              </Table>
            </div>
            <CardContent v-else class="grid min-h-28 place-items-center text-sm text-muted-foreground">{{ websiteBreakdownEmptyMessage('source / medium') }}</CardContent>
          </Card>
        </template>
        <Card v-else><CardContent class="grid min-h-40 place-items-center text-sm text-muted-foreground">{{ websiteAnalyticsUnavailableMessage }}</CardContent></Card>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div class="flex flex-wrap items-center gap-2"><Code2 class="h-5 w-5" /><CardTitle>Data Layer Audit</CardTitle><Badge variant="secondary">{{ dataLayerLabel }}</Badge><Button variant="ghost" size="icon" class="h-7 w-7" aria-label="Explain the Data Layer Audit" @click="openExplainer('data-layer-audit')"><CircleHelp class="h-4 w-4" /></Button></div>
            <CardDescription>Lead-tracking contract and CRM field coverage.</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid gap-3 sm:grid-cols-2">
              <div v-for="item in coverageMetrics" :key="item.label" class="rounded-lg border bg-muted/30 p-3">
                <small class="text-xs font-medium text-muted-foreground">{{ item.label }}</small>
                <strong class="mt-1 block text-xl" :class="item.ok ? 'text-emerald-500' : 'text-destructive'">{{ pct(item.value) }}</strong>
              </div>
            </div>
            <p class="mt-3 text-xs text-muted-foreground">{{ dataLayerHelpText }}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div class="flex flex-wrap items-center gap-2"><ListFilter class="h-5 w-5" /><CardTitle>Lead Source Setup</CardTitle><Badge>{{ inboundEmailData?.configured ? 'Email domain active' : 'Domain not configured' }}</Badge></div>
            <CardDescription>External lead inboxes used for attribution and lead-quality checks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-lg border border-dashed bg-muted/30 p-3"><small class="text-muted-foreground">Configured sources</small><strong class="mt-1 block text-lg">{{ n(inboundEmailData?.addresses?.length || 0) }}</strong></div>
              <div class="rounded-lg border border-dashed bg-muted/30 p-3"><small class="text-muted-foreground">Active sources</small><strong class="mt-1 block text-lg">{{ n(activeInboundLeadSourceCount) }}</strong></div>
              <div class="rounded-lg border border-dashed bg-muted/30 p-3"><small class="text-muted-foreground">Inbound domain</small><strong class="mt-1 block break-all font-mono text-sm">{{ inboundEmailData?.domain || 'Not configured' }}</strong></div>
            </div>
            <p class="mt-3 text-xs text-muted-foreground">{{ inboundSourceLabels || 'No inbound sources configured' }} — currently <strong>{{ n(data.summary.externalMarketplaceLeads) }} leads</strong> ingested this period.</p>
          </CardContent>
        </Card>
      </section>

      <section class="space-y-3" aria-labelledby="breakdowns-title">
        <div class="flex flex-wrap items-center gap-3"><h2 id="breakdowns-title" class="text-base font-semibold">Audience and delivery breakdowns</h2><Badge variant="secondary">{{ hasAudienceBreakdowns ? 'Synced provider data' : 'Awaiting sync' }}</Badge><Separator class="min-w-8 flex-1" /></div>
        <Alert>
          <Database class="h-4 w-4" />
          <AlertDescription class="flex flex-col items-start justify-between gap-3 min-[701px]:flex-row min-[701px]:items-center">
            <span>{{ hasAudienceBreakdowns ? 'Spend is grouped from Meta and Google Ads breakdown data stored during platform syncs.' : 'No audience breakdown data is stored for this period. Sync Meta and Google Ads to request age, device and area data.' }}</span>
            <Button v-if="!hasAudienceBreakdowns" variant="outline" size="sm" :disabled="syncing" @click="syncAndRefresh"><RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': syncing }" />{{ syncing ? 'Syncing platforms…' : 'Sync provider data' }}</Button>
          </AlertDescription>
        </Alert>
        <div class="grid gap-4 lg:grid-cols-3">
          <Card v-for="card in audienceBreakdownCards" :key="card.key">
            <CardHeader><CardTitle>{{ card.title }}</CardTitle><CardDescription>Provider-reported spend for this period.</CardDescription></CardHeader>
            <CardContent v-if="card.rows.length" class="space-y-3">
              <div v-for="row in card.rows" :key="row.platform + ':' + row.value" class="space-y-1.5">
                <div class="flex justify-between gap-3 text-sm"><span class="truncate font-medium">{{ row.value }}</span><strong>{{ money(row.spend) }}</strong></div>
                <small class="text-muted-foreground">{{ platformLabel(row.platform) }} · {{ n(row.impressions) }} impressions</small>
                <div class="h-2 overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full bg-primary" :style="{ width: barPercent(row.spend, card.maxSpend) + '%' }" /></div>
              </div>
            </CardContent>
            <CardContent v-else class="grid min-h-28 place-items-center text-sm text-muted-foreground">Awaiting provider breakdown sync.</CardContent>
          </Card>
        </div>
      </section>

      <section class="space-y-3" aria-labelledby="creative-title">
        <div class="flex items-center gap-3"><h2 id="creative-title" class="text-base font-semibold">Ad creative</h2><Badge variant="secondary">Synced media</Badge><Separator class="flex-1" /></div>
        <p class="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">Actual images and video thumbnails from Meta and Google, matched to campaign spend and CTR for this report period.</p>
        <div v-if="data.creativeMedia.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card v-for="creative in data.creativeMedia.slice(0, 12)" :key="creative.platform + ':' + creative.id" class="overflow-hidden">
            <button type="button" class="relative grid aspect-[1.5/1] w-full place-items-center overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" :aria-label="'Preview ad: ' + creative.title" @click="openCreative(creative)">
              <img :src="creative.imageUrl" :alt="creative.title" class="h-full w-full object-cover" loading="lazy" referrerpolicy="no-referrer" @error="hideBrokenCreativeImage">
              <Badge class="absolute left-2 top-2">{{ platformLabel(creative.platform) }}</Badge>
              <span v-if="creative.videoUrl" class="absolute grid size-10 place-items-center rounded-full bg-background/75" aria-hidden="true">▶</span>
            </button>
            <CardContent class="p-3">
              <h3 class="truncate text-sm font-semibold" :title="creative.title">{{ creative.title }}</h3>
              <small v-if="creative.performanceLabel" class="mt-1 block text-muted-foreground">{{ formatLabel(creative.performanceLabel) }} asset</small>
              <div class="mt-2 flex justify-between text-xs text-muted-foreground"><span>Spend <strong class="text-foreground">{{ money(creative.spend) }}</strong></span><span>CTR <strong class="text-foreground">{{ pctOrDash(creative.ctr) }}</strong></span></div>
            </CardContent>
          </Card>
        </div>
        <Card v-else>
          <CardContent class="grid min-h-40 place-items-center gap-2 p-7 text-center text-muted-foreground">
            <strong class="text-foreground">No creative media has been synced for this period.</strong>
            <span class="text-xs">Sync Meta and Google Ads to refresh active image and video assets.</span>
            <Button variant="outline" size="sm" :disabled="syncing" @click="syncAndRefresh"><RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': syncing }" />{{ syncing ? 'Syncing platforms…' : 'Sync provider data' }}</Button>
          </CardContent>
        </Card>
      </section>

      <section class="space-y-3" aria-labelledby="builder-title">
        <div class="flex flex-wrap items-center gap-3"><h2 id="builder-title" class="text-base font-semibold">Report builder</h2><Badge variant="secondary">Live report data</Badge><Separator class="min-w-8 flex-1" /><p class="text-xs text-muted-foreground">Build a table from the selected report period</p></div>
        <Card class="grid overflow-hidden lg:grid-cols-[230px_1fr]">
          <aside class="border-b bg-muted/30 p-4 lg:border-b-0 lg:border-r">
            <p class="text-[11px] font-bold uppercase tracking-[.09em] text-muted-foreground">Dimensions</p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <Button v-for="dimensionOption in REPORT_BUILDER_DIMENSIONS" :key="dimensionOption.id" variant="outline" size="sm" :class="builderDimensions.includes(dimensionOption.id) ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''" :aria-pressed="builderDimensions.includes(dimensionOption.id)" :title="dimensionOption.description" @click="toggleBuilderDimension(dimensionOption.id)">{{ dimensionOption.label }}</Button>
            </div>
            <p class="mt-4 text-[11px] font-bold uppercase tracking-[.09em] text-muted-foreground">Metrics</p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <Button v-for="metricOption in REPORT_BUILDER_METRICS" :key="metricOption.id" variant="outline" size="sm" :class="builderMetrics.includes(metricOption.id) ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''" :aria-pressed="builderMetrics.includes(metricOption.id)" :disabled="!builderAvailableMetrics.includes(metricOption.id)" :title="builderMetricTitle(metricOption.id)" @click="toggleBuilderMetric(metricOption.id)">{{ metricOption.label }}</Button>
            </div>
          </aside>

          <div class="min-w-0 p-4">
            <div class="mb-3 grid gap-2 sm:grid-cols-2">
              <div class="rounded-lg border border-dashed bg-muted/30 p-3">
                <p class="mb-2 text-[11px] font-bold uppercase tracking-[.09em] text-muted-foreground">Rows</p>
                <Button v-for="dimensionId in builderDimensions" :key="dimensionId" variant="outline" size="sm" class="mr-1.5 mt-1" :aria-label="'Remove ' + builderDimensionLabel(dimensionId)" @click="removeBuilderDimension(dimensionId)">{{ builderDimensionLabel(dimensionId) }} <span class="ml-1 text-muted-foreground">×</span></Button>
              </div>
              <div class="rounded-lg border border-dashed bg-muted/30 p-3">
                <p class="mb-2 text-[11px] font-bold uppercase tracking-[.09em] text-muted-foreground">Values</p>
                <Button v-for="metricId in builderMetrics" :key="metricId" variant="outline" size="sm" class="mr-1.5 mt-1" :aria-label="'Remove ' + builderMetricLabel(metricId)" @click="removeBuilderMetric(metricId)">{{ builderMetricLabel(metricId) }} <span class="ml-1 text-muted-foreground">×</span></Button>
              </div>
            </div>

            <div class="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader><TableRow>
                  <TableHead v-for="dimensionId in builderDimensions" :key="dimensionId" :aria-sort="builderAriaSort(dimensionId)"><Button variant="ghost" size="sm" class="-ml-3" @click="sortBuilderBy(dimensionId)">{{ builderDimensionLabel(dimensionId) }} {{ builderSortIndicator(dimensionId) }}</Button></TableHead>
                  <TableHead v-for="metricId in builderMetrics" :key="metricId" class="text-right" :aria-sort="builderAriaSort(metricId)"><Button variant="ghost" size="sm" class="-mr-3 float-right" @click="sortBuilderBy(metricId)">{{ builderMetricLabel(metricId) }} {{ builderSortIndicator(metricId) }}</Button></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  <TableRow v-for="row in builderRows" :key="row.key">
                    <TableCell v-for="dimensionId in builderDimensions" :key="dimensionId">{{ formatBuilderDimension(dimensionId, row.dimensions[dimensionId]) }}</TableCell>
                    <TableCell v-for="metricId in builderMetrics" :key="metricId" class="text-right">{{ formatBuilderMetric(metricId, row.metrics[metricId]) }}</TableCell>
                  </TableRow>
                  <TableRow v-if="!builderRows.length"><TableCell :colspan="builderDimensions.length + builderMetrics.length" class="h-28 text-center text-muted-foreground">No real report data is available for this breakdown in {{ rangeLabel }}.</TableCell></TableRow>
                </TableBody>
              </Table>
            </div>
            <p class="mt-2.5 text-xs text-muted-foreground" role="status" aria-live="polite">{{ n(builderRows.length) }} {{ builderRows.length === 1 ? 'row' : 'rows' }} from the current report data. Metrics unavailable at the selected grain are disabled.<span v-if="builderDimensions.includes('campaign') && builderMetrics.includes('crm_leads')"> Leads without exact campaign details appear as labelled reconciliation rows.</span></p>
          </div>
        </Card>
      </section>

      <footer class="border-t pt-4 text-xs leading-relaxed text-muted-foreground">
        <strong class="text-foreground">About this report.</strong> Results reflect the website, advertising and CRM data available for {{ rangeLabel }}.
        Panels waiting for a platform sync are clearly marked, and unavailable metrics display as “—”.
      </footer>
    </template>

    <ExplainerDialog v-model:open="explainerOpen" :topic="explainerTopic" :from="from" :to="to" />
    <CreativePreviewDialog v-model:open="creativeDialogOpen" :creative="selectedCreative" :platform-label="selectedCreative ? platformLabel(selectedCreative.platform) : ''" :spend-label="selectedCreative ? money(selectedCreative.spend) : '—'" :ctr-label="selectedCreative ? pctOrDash(selectedCreative.ctr) : '—'" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ArrowRight,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  Code2,
  Database,
  ListFilter,
  RefreshCw,
  TriangleAlert,
  UserCheck,
  WalletCards,
} from 'lucide-vue-next';
import { formatCurrency } from '~/utils';
import {
  defaultMarketingDateRange,
  formatReportDate as displayDate,
  formatReportShortDate as displayShortDate,
  formatReportTimestamp as shortDateTime,
  reportDateInTimeZone,
} from '~/utils/marketingReportFormat';
import {
  REPORT_BUILDER_DIMENSIONS,
  REPORT_BUILDER_METRICS,
  availableMetricsForDimensions,
  buildReportBuilderRows,
  normalizeReportBuilderSelection,
  sortReportBuilderRows,
  type ReportBuilderDimension,
  type ReportBuilderMetric,
  type ReportBuilderSortDirection,
  type ReportBuilderSortKey,
} from '~/utils/marketingReportBuilder';
import ExplainerDialog from '~/components/admin/marketing/ExplainerDialog.vue';
import CreativePreviewDialog from '~/components/admin/marketing/CreativePreviewDialog.vue';
import type { ExplainerTopicKey } from '~/components/admin/marketing/explainerContent';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';

definePageMeta({ layout: 'admin', middleware: 'auth' });

type PresetId = 'mtd' | '7d' | '30d' | '90d';
type BreakdownRow = { dimensions: Record<string, string>; metrics: Record<string, number> };
type AudienceBreakdownRow = { platform: 'meta_ads' | 'google_ads'; value: string; spend: number; impressions: number; clicks: number };
type ReportCreative = { id: string; platform: 'meta_ads' | 'google_ads'; campaignId: string; campaignName: string | null; title: string; mediaType: 'image' | 'video'; imageUrl: string; videoUrl: string | null; performanceLabel: string | null; spend: number; ctr: number | null };
type SyncPlatformResult = { platform: 'ga4' | 'meta_ads' | 'google_ads'; status: 'success' | 'error' | 'skipped'; rows?: number; error?: string };
type AnalyticsTabId = 'website' | 'paid' | 'leads';
type TrendRow = {
  date: string; sessions: number; users: number; keyEvents: number; crmLeads: number; paidSpend: number;
  paidClicks: number; platformConversions: number; paidCrmLeads: number; crmCpl: number | null;
};
type TrendKey = Exclude<keyof TrendRow, 'date'>;
type MetricItem = { label: string; value: string };
type ChartSeries = { key: TrendKey; label: string; className: string; axis: 'left' | 'right'; format: 'number' | 'money' };
type AnalyticsChartTab = {
  id: AnalyticsTabId; label: string; title: string; description: string; emptyLabel: string;
  series: ChartSeries[]; kpis: Array<{ label: string; value: string; caption: string }>;
};

interface ReportResponse {
  period: { from: string; to: string };
  connected: Record<'ga4' | 'meta_ads' | 'google_ads', boolean>;
  dataStatus: Record<'ga4' | 'meta_ads' | 'google_ads', 'connected' | 'stored_data' | 'not_connected'>;
  avgSaleValue: number | null;
  summary: Record<'totalCrmLeads' | 'paidCrmLeads' | 'externalMarketplaceLeads' | 'utmCoverage' | 'campaignCoverage' | 'paidAttributionCoverage' | 'sourceCoverage' | 'clickIdCoverage' | 'backfilledAttributionCoverage', number>;
  platformMetrics: {
    ga4: { sessions: number; conversions: number };
    meta_ads: { crmLeads: number };
    google_ads: { crmLeads: number };
  };
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
  audienceBreakdowns: Record<'age' | 'device' | 'area', AudienceBreakdownRow[]>;
  creativeMedia: ReportCreative[];
  websiteAnalytics: { status: 'connected' | 'stored_data' | 'not_configured' | 'error'; error: string | null; dailyTrend: TrendRow[]; topLandingPages: BreakdownRow[]; trafficChannels: BreakdownRow[]; sourceMedium: BreakdownRow[]; deviceCategories: BreakdownRow[]; formEvents: BreakdownRow[]; topEvents: BreakdownRow[] };
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

interface SyncResponse {
  results: SyncPlatformResult[];
}

const today = reportDateInTimeZone();
const defaultDateRange = defaultMarketingDateRange(today);
const from = ref(defaultDateRange.from);
const to = ref(defaultDateRange.to);
const customRangeOpen = ref(false);
const activeAnalyticsTab = ref<AnalyticsTabId>('website');
const activeChartPoint = ref<number | null>(null);
const hiddenChartSeries = ref(new Set<TrendKey>());
const query = computed(() => ({ from: from.value, to: to.value }));
const { data, pending, error, refresh } = await useFetch<ReportResponse>('/api/admin/analytics/marketing-report', { query });
const { data: inboundEmailData } = await useFetch<InboundResponse>('/api/admin/lead-ingestion/email-addresses');
const syncing = ref(false);
const syncError = ref<string | null>(null);
const builderDimensions = ref<ReportBuilderDimension[]>(['platform', 'campaign']);
const builderMetrics = ref<ReportBuilderMetric[]>(['spend', 'crm_leads', 'cpl']);
const builderSortKey = ref<ReportBuilderSortKey>('spend');
const builderSortDirection = ref<ReportBuilderSortDirection>('desc');
const builderAvailableMetrics = computed(() => availableMetricsForDimensions(builderDimensions.value));
const builderRows = computed(() => {
  if (!data.value) return [];
  const rows = buildReportBuilderRows(data.value, builderDimensions.value, builderMetrics.value);
  return sortReportBuilderRows(rows, builderSortKey.value, builderSortDirection.value);
});

function applyBuilderSelection(dimensions: ReportBuilderDimension[], metrics: ReportBuilderMetric[]) {
  const normalized = normalizeReportBuilderSelection(dimensions, metrics);
  builderDimensions.value = normalized.dimensions;
  builderMetrics.value = normalized.metrics;
  if (![...normalized.dimensions, ...normalized.metrics].includes(builderSortKey.value)) {
    builderSortKey.value = normalized.metrics[0]!;
    builderSortDirection.value = 'desc';
  }
}

function toggleBuilderDimension(dimension: ReportBuilderDimension) {
  const selected = builderDimensions.value.includes(dimension);
  const next: ReportBuilderDimension[] = selected
    ? builderDimensions.value.filter(item => item !== dimension)
    : dimension === 'platform'
      ? ['platform', ...builderDimensions.value]
      : [...builderDimensions.value.filter(item => item === 'platform'), dimension];
  applyBuilderSelection(next, builderMetrics.value);
}

function removeBuilderDimension(dimension: ReportBuilderDimension) {
  applyBuilderSelection(builderDimensions.value.filter(item => item !== dimension), builderMetrics.value);
}

function toggleBuilderMetric(metric: ReportBuilderMetric) {
  if (!builderAvailableMetrics.value.includes(metric)) return;
  const next = builderMetrics.value.includes(metric)
    ? builderMetrics.value.filter(item => item !== metric)
    : [...builderMetrics.value, metric];
  applyBuilderSelection(builderDimensions.value, next);
}

function removeBuilderMetric(metric: ReportBuilderMetric) {
  applyBuilderSelection(builderDimensions.value, builderMetrics.value.filter(item => item !== metric));
}

function sortBuilderBy(key: ReportBuilderSortKey) {
  if (builderSortKey.value === key) {
    builderSortDirection.value = builderSortDirection.value === 'asc' ? 'desc' : 'asc';
    return;
  }
  builderSortKey.value = key;
  builderSortDirection.value = builderDimensions.value.includes(key as ReportBuilderDimension) ? 'asc' : 'desc';
}

function builderAriaSort(key: ReportBuilderSortKey) {
  if (builderSortKey.value !== key) return undefined;
  return builderSortDirection.value === 'asc' ? 'ascending' as const : 'descending' as const;
}

function builderSortIndicator(key: ReportBuilderSortKey) {
  if (builderSortKey.value !== key) return '';
  return builderSortDirection.value === 'asc' ? '↑' : '↓';
}

function builderDimensionLabel(dimension: ReportBuilderDimension) {
  return REPORT_BUILDER_DIMENSIONS.find(option => option.id === dimension)?.label || dimension;
}

function builderMetricLabel(metric: ReportBuilderMetric) {
  return REPORT_BUILDER_METRICS.find(option => option.id === metric)?.label || metric;
}

function builderMetricTitle(metric: ReportBuilderMetric) {
  return builderAvailableMetrics.value.includes(metric)
    ? `${builderMetricLabel(metric)} from current report data`
    : `${builderMetricLabel(metric)} is unavailable for the selected row breakdown`;
}

function formatBuilderDimension(dimension: ReportBuilderDimension, value?: string) {
  if (!value) return 'Unknown';
  return dimension === 'platform' ? platformLabel(value) : value;
}

function formatBuilderMetric(metric: ReportBuilderMetric, value?: number | null) {
  if (value == null) return '—';
  const format = REPORT_BUILDER_METRICS.find(option => option.id === metric)?.format;
  if (format === 'money') return money(value);
  if (format === 'percent') return pct(value);
  return n(value);
}

async function syncAndRefresh() {
  if (syncing.value) return;

  syncing.value = true;
  syncError.value = null;
  try {
    const response = await $fetch<SyncResponse>('/api/admin/metrics/sync', { method: 'POST' });
    await refresh();

    const failures = response.results.filter(result => result.status === 'error');
    const successes = response.results.filter(result => result.status === 'success');
    if (failures.length) {
      const failureDetails = failures.map(result => `${platformLabel(result.platform)}: ${result.error || 'sync failed'}`).join(' · ');
      const successDetails = successes.length ? ` ${successes.map(result => platformLabel(result.platform)).join(' and ')} refreshed.` : '';
      syncError.value = `${failureDetails}.${successDetails}`;
    } else if (!response.results.some(result => result.platform === 'meta_ads' || result.platform === 'google_ads')) {
      syncError.value = 'No ad-provider integration is configured for this dealer.';
    } else if (response.results.length && response.results.every(result => result.status === 'skipped')) {
      syncError.value = 'A platform sync is already running. Refresh again when it finishes.';
    }
  } catch {
    syncError.value = 'Platform sync failed. Try again.';
  } finally {
    syncing.value = false;
  }
}

const explainerOpen = ref(false);
const explainerTopic = ref<ExplainerTopicKey | null>(null);
const creativeDialogOpen = ref(false);
const selectedCreative = ref<ReportCreative | null>(null);
function openExplainer(topic: ExplainerTopicKey | null = null) {
  explainerTopic.value = topic;
  explainerOpen.value = true;
}
function openCreative(creative: ReportCreative) {
  selectedCreative.value = creative;
  creativeDialogOpen.value = true;
}

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
const syncStatusText = computed(() => {
  if (syncing.value) return 'Syncing platforms…';
  if (syncError.value) return syncError.value;
  return latestSuccessfulSync.value ? `Platforms synced · ${shortDateTime(latestSuccessfulSync.value.startedAt)}` : 'Waiting for platform sync';
});
const attributionBanner = computed(() => {
  const report = data.value;
  if (!report || report.insights.executive.totalSpend <= 0 || report.summary.totalCrmLeads <= 0 || report.summary.paidCrmLeads > 0) return null;
  const hasPaidPlatformData = report.dataStatus.meta_ads !== 'not_connected' || report.dataStatus.google_ads !== 'not_connected';
  return hasPaidPlatformData
    ? { kind: 'unmatched' as const, title: 'No CRM leads are matched to paid media for this period', action: 'Review enquiries', to: '/admin/enquiries' }
    : { kind: 'disconnected' as const, title: 'Paid media attribution needs setup', action: 'Connect ad platforms', to: '/admin/settings' };
});
const avgSaleValueSet = computed(() => data.value?.avgSaleValue != null);
const connections = computed(() => [
  { label: 'GA4 Website', status: connectionStatusLabel(data.value?.dataStatus.ga4) },
  { label: 'Meta Ads', status: connectionStatusLabel(data.value?.dataStatus.meta_ads) },
  { label: 'Google Ads', status: connectionStatusLabel(data.value?.dataStatus.google_ads) },
]);
const summaryCards = computed(() => [
  { label: 'Admin CRM leads', value: n(data.value?.summary.totalCrmLeads || 0), caption: `${n(data.value?.summary.paidCrmLeads || 0)} matched to paid media`, icon: UserCheck, alert: false, topic: 'crm-leads' as const },
  { label: 'Ad spend', value: money(data.value?.insights.executive.totalSpend || 0), caption: `blended CPL ${moneyOrDash(data.value?.professionalMetrics.paidMedia.cpl)}`, icon: WalletCards, alert: false, topic: 'ad-spend' as const },
  { label: 'Website activity', value: n(data.value?.platformMetrics.ga4.sessions || 0), caption: `${n(data.value?.platformMetrics.ga4.conversions || 0)} GA4 key events`, icon: Database, alert: false, topic: 'website-activity' as const },
  { label: 'UTM coverage', value: pct(data.value?.summary.utmCoverage || 0), caption: `${pct(data.value?.summary.campaignCoverage || 0)} campaign tagged`, icon: Code2, alert: (data.value?.summary.utmCoverage || 0) < 50, topic: 'utm-coverage' as const },
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

const platformMetricPanels = computed(() => [
  { title: 'GA4 Website', description: 'Engagement quality for the period.', items: ga4Metrics.value },
  { title: 'Paid Media Efficiency', description: 'Meta and Google blended delivery.', items: paidMediaMetrics.value },
  { title: 'Google Ads Depth', description: 'Campaign-level metrics from API sync.', items: googleAdsMetrics.value },
]);

function chartSeriesClass(className: string, mode: 'stroke' | 'fill' | 'background') {
  const colourKey = ['users', 'conversions'].includes(className)
    ? 'green'
    : ['events', 'spend'].includes(className)
      ? 'orange'
      : className === 'leads'
        ? 'violet'
        : className === 'cpl'
          ? 'amber'
          : 'primary';
  const classes = {
    stroke: { primary: 'stroke-primary', green: 'stroke-emerald-500', orange: 'stroke-orange-500', violet: 'stroke-violet-500', amber: 'stroke-amber-500' },
    fill: { primary: 'fill-primary', green: 'fill-emerald-500', orange: 'fill-orange-500', violet: 'fill-violet-500', amber: 'fill-amber-500' },
    background: { primary: 'bg-primary', green: 'bg-emerald-500', orange: 'bg-orange-500', violet: 'bg-violet-500', amber: 'bg-amber-500' },
  } as const;
  return classes[mode][colourKey];
}

const maxChannelSessions = computed(() => maxBreakdown(data.value?.websiteAnalytics.trafficChannels));
const websiteTrendRows = computed(() => data.value?.websiteAnalytics.dailyTrend || []);
const chartStartLabel = computed(() => websiteTrendRows.value[0]?.date ? displayShortDate(websiteTrendRows.value[0].date) : '');
const chartEndLabel = computed(() => websiteTrendRows.value.at(-1)?.date ? displayShortDate(websiteTrendRows.value.at(-1)!.date) : '');
const analyticsChartTabs = computed<AnalyticsChartTab[]>(() => {
  const website = data.value?.professionalMetrics.ga4Website;
  const paid = data.value?.professionalMetrics.paidMedia;
  const totalCrmLeads = data.value?.summary.totalCrmLeads || 0;
  const paidCrmLeads = data.value?.summary.paidCrmLeads || 0;
  const sessions = website?.sessions || 0;
  return [
    {
      id: 'website', label: 'Website', title: 'Website performance', emptyLabel: 'website',
      description: 'Daily traffic and GA4 outcomes using absolute values.',
      series: [
        { key: 'sessions', label: 'Sessions', className: 'sessions', axis: 'left', format: 'number' },
        { key: 'users', label: 'Users', className: 'users', axis: 'left', format: 'number' },
        { key: 'keyEvents', label: 'Key events', className: 'events', axis: 'left', format: 'number' },
      ],
      kpis: [
        { label: 'Sessions', value: n(sessions), caption: 'Website visits' },
        { label: 'Users', value: n(website?.users || 0), caption: 'Website audience' },
        { label: 'Key events', value: n(website?.keyEvents || 0), caption: 'GA4 outcomes' },
        { label: 'Visit → CRM lead', value: sessions ? pct((totalCrmLeads / sessions) * 100) : '—', caption: 'Stored enquiries / sessions' },
      ],
    },
    {
      id: 'paid', label: 'Paid media', title: 'Paid media performance', emptyLabel: 'paid media',
      description: 'Daily spend, clicks and platform-reported conversions.',
      series: [
        { key: 'paidClicks', label: 'Clicks', className: 'clicks', axis: 'left', format: 'number' },
        { key: 'platformConversions', label: 'Platform conversions', className: 'conversions', axis: 'left', format: 'number' },
        { key: 'paidSpend', label: 'Spend', className: 'spend', axis: 'right', format: 'money' },
      ],
      kpis: [
        { label: 'Spend', value: money(paid?.spend || 0), caption: 'Meta + Google' },
        { label: 'Clicks', value: n(paid?.clicks || 0), caption: 'Paid traffic' },
        { label: 'Platform conversions', value: n(paid?.platformLeads || 0), caption: 'Reported by ad platforms' },
        { label: 'Average CPC', value: moneyOrDash(paid?.averageCpc), caption: 'Spend / clicks' },
      ],
    },
    {
      id: 'leads', label: 'Leads', title: 'Lead performance', emptyLabel: 'lead',
      description: 'Daily CRM capture, paid attribution and cost per matched lead.',
      series: [
        { key: 'crmLeads', label: 'CRM leads', className: 'leads', axis: 'left', format: 'number' },
        { key: 'paidCrmLeads', label: 'Paid-attributed leads', className: 'paid-leads', axis: 'left', format: 'number' },
        { key: 'crmCpl', label: 'CRM CPL', className: 'cpl', axis: 'right', format: 'money' },
      ],
      kpis: [
        { label: 'CRM leads', value: n(totalCrmLeads), caption: 'All stored enquiries' },
        { label: 'Paid-attributed', value: n(paidCrmLeads), caption: 'Matched to Meta or Google' },
        { label: 'Paid attribution', value: totalCrmLeads ? pct((paidCrmLeads / totalCrmLeads) * 100) : '—', caption: 'Share of CRM leads' },
        { label: 'CRM CPL', value: moneyOrDash(paid?.cpl), caption: 'Spend / paid CRM leads' },
      ],
    },
  ];
});
const activeAnalyticsChart = computed(() => analyticsChartTabs.value.find(tab => tab.id === activeAnalyticsTab.value) || analyticsChartTabs.value[0]!);
const visibleChartSeries = computed(() => activeAnalyticsChart.value.series.filter(series => !hiddenChartSeries.value.has(series.key)));
const activeChartLeftMax = computed(() => chartAxisMax('left'));
const activeChartRightMax = computed(() => visibleChartSeries.value.some(series => series.axis === 'right') ? chartAxisMax('right') : 0);
const chartAxisTicks = computed(() => [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
  y: 18 + ratio * 164,
  left: activeChartLeftMax.value * (1 - ratio),
  right: activeChartRightMax.value * (1 - ratio),
})));
const activeTrendHasData = computed(() => visibleChartSeries.value.some(series => websiteTrendRows.value.some(row => Number(row[series.key] || 0) > 0)));
const chartHitWidth = computed(() => websiteTrendRows.value.length > 1 ? 632 / (websiteTrendRows.value.length - 1) : 632);
const activeChartDots = computed(() => {
  if (activeChartPoint.value == null) return [];
  return visibleChartSeries.value.flatMap((series) => {
    const point = chartSeriesPoint(series, activeChartPoint.value!);
    return point ? [{ key: series.key, className: series.className, ...point }] : [];
  });
});
const activeChartTooltip = computed(() => {
  const index = activeChartPoint.value;
  const row = index == null ? null : websiteTrendRows.value[index];
  if (!row) return null;
  const pointIndex = index as number;
  return {
    date: displayDate(row.date),
    left: Math.max(14, Math.min(86, (chartPointX(pointIndex) / 720) * 100)),
    items: visibleChartSeries.value.map(series => ({
      label: series.label,
      className: series.className,
      value: formatChartValue(row[series.key], series.format),
    })),
  };
});
const websiteLeadFunnelRows = computed(() => {
  const sessions = data.value?.professionalMetrics.ga4Website.sessions || 0;
  const keyEvents = data.value?.professionalMetrics.ga4Website.keyEvents || 0;
  const crmLeads = data.value?.summary.totalCrmLeads || 0;
  return [
    { label: 'Website sessions', value: sessions, width: 100, caption: 'Entry point' },
    { label: 'GA4 key events', value: keyEvents, width: barPercent(keyEvents, sessions), caption: sessions ? `${pct((keyEvents / sessions) * 100)} of sessions` : 'No sessions in range' },
    { label: 'Admin CRM leads', value: crmLeads, width: barPercent(crmLeads, sessions), caption: sessions ? `${pct((crmLeads / sessions) * 100)} of sessions` : 'No sessions in range' },
  ];
});
const websiteAnalyticsAvailable = computed(() => data.value?.websiteAnalytics.status === 'connected' || data.value?.websiteAnalytics.status === 'stored_data');
const hasCachedWebsiteBreakdowns = computed(() => Boolean(
  data.value?.websiteAnalytics.topLandingPages.length
  || data.value?.websiteAnalytics.trafficChannels.length
  || data.value?.websiteAnalytics.sourceMedium.length,
));
const websiteAnalyticsStatusLabel = computed(() => data.value?.websiteAnalytics.status === 'connected' ? 'GA4 connected' : data.value?.websiteAnalytics.status === 'stored_data' ? 'GA4 synced data' : data.value?.websiteAnalytics.status === 'error' ? 'GA4 error' : 'Not connected');
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

const audienceBreakdownCards = computed(() => ([
  { key: 'age' as const, title: 'Spend by age', rows: data.value?.audienceBreakdowns.age.slice(0, 6) || [] },
  { key: 'device' as const, title: 'Spend by device', rows: data.value?.audienceBreakdowns.device.slice(0, 6) || [] },
  { key: 'area' as const, title: 'Spend by area', rows: data.value?.audienceBreakdowns.area.slice(0, 6) || [] },
].map(card => ({ ...card, maxSpend: Math.max(...card.rows.map(row => row.spend), 1) }))));
const hasAudienceBreakdowns = computed(() => audienceBreakdownCards.value.some(card => card.rows.length));

function applyPreset(id: PresetId) {
  to.value = today;
  from.value = id === 'mtd' ? `${today.slice(0, 8)}01` : daysAgo(id === '7d' ? 6 : id === '30d' ? 29 : 89);
  customRangeOpen.value = false;
}
function qualityClass(score: number) { return score >= 80 ? 'ok' : score >= 60 ? 'mid' : 'bad'; }
function connectionStatusLabel(status?: 'connected' | 'stored_data' | 'not_connected') {
  return status === 'connected' ? 'Connected' : status === 'stored_data' ? 'Synced data' : 'Not connected';
}
function platformLabel(value: string) { return value === 'meta_ads' ? 'Meta' : value === 'google_ads' ? 'Google Ads' : value === 'ga4' ? 'GA4' : value === 'crm' ? 'Admin CRM' : value; }
function formatLabel(value: string) { return value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase()); }
function hideBrokenCreativeImage(event: Event) { (event.currentTarget as HTMLImageElement).hidden = true; }
function cleanLandingPage(value: string) { return !value || value === '(not set)' ? '/' : value; }
function websiteBreakdownEmptyMessage(label: string) {
  return data.value?.websiteAnalytics.status === 'connected'
    ? `No ${label} data in this range.`
    : 'Available after the GA4 reporting credential is connected.';
}
function dimension(row: BreakdownRow, key: string) { return row.dimensions[key] || ''; }
function metric(row: BreakdownRow, key: string): number {
  const value = row.metrics[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
function maxBreakdown(rows?: BreakdownRow[]) { return Math.max(...(rows?.map(row => metric(row, 'sessions')) || [1]), 1); }
function barPercent(value: number, max: number) { return max ? Math.max(value > 0 ? 3 : 0, Math.min(100, (value / max) * 100)) : 0; }
function selectAnalyticsTab(id: AnalyticsTabId) {
  activeAnalyticsTab.value = id;
  hiddenChartSeries.value = new Set();
  activeChartPoint.value = null;
}
function selectRelativeAnalyticsTab(direction: -1 | 1) {
  const ids = analyticsChartTabs.value.map(tab => tab.id);
  const current = ids.indexOf(activeAnalyticsTab.value);
  selectAnalyticsTab(ids[(current + direction + ids.length) % ids.length]!);
}
function toggleChartSeries(key: TrendKey) {
  const next = new Set(hiddenChartSeries.value);
  if (next.has(key)) next.delete(key);
  else if (visibleChartSeries.value.length > 1) next.add(key);
  hiddenChartSeries.value = next;
}
function chartAxisMax(axis: 'left' | 'right') {
  const keys = visibleChartSeries.value.filter(series => series.axis === axis).map(series => series.key);
  return Math.max(...websiteTrendRows.value.flatMap(row => keys.map(key => Number(row[key] || 0))), 1);
}
function chartPointX(index: number) {
  const count = websiteTrendRows.value.length;
  return count <= 1 ? 370 : 54 + (index / (count - 1)) * 632;
}
function chartHitX(index: number) {
  return Math.max(54, chartPointX(index) - chartHitWidth.value / 2);
}
function chartSeriesPoint(series: ChartSeries, index: number) {
  const rawValue = websiteTrendRows.value[index]?.[series.key];
  if (rawValue == null) return null;
  const max = series.axis === 'right' ? activeChartRightMax.value : activeChartLeftMax.value;
  return { x: chartPointX(index), y: 182 - (Number(rawValue) / Math.max(max, 1)) * 164 };
}
function chartLinePath(series: ChartSeries) {
  let drawing = false;
  return websiteTrendRows.value.map((row, index) => {
    if (row[series.key] == null) { drawing = false; return ''; }
    const point = chartSeriesPoint(series, index)!;
    const command = drawing ? 'L' : 'M';
    drawing = true;
    return `${command}${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }).filter(Boolean).join(' ');
}
function showLatestChartPoint() {
  if (websiteTrendRows.value.length) activeChartPoint.value = websiteTrendRows.value.length - 1;
}
function moveActiveChartPoint(direction: -1 | 1) {
  const last = websiteTrendRows.value.length - 1;
  if (last < 0) return;
  activeChartPoint.value = Math.max(0, Math.min(last, (activeChartPoint.value ?? last) + direction));
}
function formatChartAxis(value: number, axis: 'left' | 'right') {
  const series = visibleChartSeries.value.find(item => item.axis === axis);
  return series?.format === 'money' ? `$${compactNumber(value)}` : compactNumber(value);
}
function formatChartValue(value: number | null, format: 'number' | 'money') {
  if (value == null) return '—';
  return format === 'money' ? money(value) : n(value);
}
function compactNumber(value: number) {
  return new Intl.NumberFormat('en-AU', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);
}
function daysAgo(days: number) { const date = new Date(`${today}T00:00:00Z`); date.setUTCDate(date.getUTCDate() - days); return isoDate(date); }
function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function duration(value: number | null | undefined) { if (value == null) return '—'; return `${Math.floor(value / 60)}:${Math.round(value % 60).toString().padStart(2, '0')}`; }
const n = (value: number) => new Intl.NumberFormat('en-AU').format(value || 0);
const pct = (value: number) => `${new Intl.NumberFormat('en-AU', { maximumFractionDigits: 1 }).format(value || 0)}%`;
const money = (value: number) => formatCurrency(value || 0, true);
const moneyOrDash = (value?: number | null) => value == null ? '—' : money(value);
const pctOrDash = (value?: number | null) => value == null ? '—' : pct(value);
const fractionPct = (value?: number | null) => value == null ? '—' : pct(value * 100);
const decimal = (value?: number | null) => value == null ? '—' : new Intl.NumberFormat('en-AU', { maximumFractionDigits: 1 }).format(value);
const roas = (value: number) => `${new Intl.NumberFormat('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}×`;
</script>
