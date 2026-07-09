<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p class="text-sm text-muted-foreground">CRM attribution, platform sync, and data-layer coverage</p>
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
            <MetricCell label="CRM CPL" :value="moneyOrDash(data.professionalMetrics.paidMedia.cpl)" />
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
                    <TableCell class="max-w-[420px] truncate font-medium">{{ cleanLandingPage(dimension(row, 'landingPagePlusQueryString')) }}</TableCell>
                    <TableCell class="text-right">{{ n(metric(row, 'sessions')) }}</TableCell>
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
              CRM Lead Sources
            </CardTitle>
            <CardDescription>{{ rangeLabel }}. Includes website forms and external marketplace/email leads stored in CRM.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead class="text-right">Leads</TableHead>
                  <TableHead class="text-right">Synced</TableHead>
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
                  <TableCell class="text-right">{{ n(source.crmSynced) }}</TableCell>
                  <TableCell class="text-right">{{ n(source.withCampaign) }}</TableCell>
                </TableRow>
                <TableRow v-if="!data.crm.leadSources.length">
                  <TableCell colspan="5" class="py-8 text-center text-muted-foreground">No CRM leads in this range.</TableCell>
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
            <CardDescription>Lead tracking contract and CRM field coverage.</CardDescription>
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
                <MetricCell label="Campaign coverage" :value="pct(data.summary.campaignCoverage)" />
                <MetricCell label="Paid attribution" :value="pct(data.summary.paidAttributionCoverage)" />
                <MetricCell label="Click ID coverage" :value="pct(data.summary.clickIdCoverage)" />
                <MetricCell label="Backfilled" :value="pct(data.summary.backfilledAttributionCoverage)" />
              </div>
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
            <CardDescription>Configured platform and CRM sync state.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div v-for="connection in connections" :key="connection.label" class="flex items-center justify-between rounded-md border px-3 py-2">
              <span class="text-sm font-medium">{{ connection.label }}</span>
              <Badge :variant="connection.connected ? 'default' : 'outline'">{{ connection.connected ? 'Connected' : 'Not connected' }}</Badge>
            </div>
            <div class="grid grid-cols-2 gap-3 pt-2">
              <MetricCell label="CRM synced" :value="`${n(data.summary.syncedToCrm)} leads`" />
              <MetricCell label="External feeds" :value="`${n(data.summary.externalMarketplaceLeads)} leads`" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-xl">Lead Types</CardTitle>
            <CardDescription>CRM enquiry mix for the selected period.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-2">
            <BreakdownRow v-for="row in data.crm.typeBreakdown.slice(0, 8)" :key="row.key" :label="formatLabel(row.key)" :value="row.total" :max="maxTypeTotal" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-xl">Lead Status</CardTitle>
            <CardDescription>Pipeline state of report-period CRM leads.</CardDescription>
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
          <CardDescription>Ad-platform rows matched to CRM leads by UTM campaign, campaign ID, or campaign name.</CardDescription>
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
                <TableHead class="text-right">CRM leads</TableHead>
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

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle class="text-xl">Recent CRM Leads</CardTitle>
            <CardDescription>Latest leads with source, UTM and sync indicators.</CardDescription>
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
                      <Badge v-if="lead.syncedToCrm" variant="outline">CRM</Badge>
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
          <CardContent class="space-y-5">
            <div class="space-y-2">
              <div
                v-for="run in latestSyncRuns"
                :key="`latest:${run.platform}`"
                class="rounded-lg border bg-background p-3"
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

            <div v-if="recentSyncRuns.length" class="space-y-2 border-t pt-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold">Recent runs</div>
                  <div class="text-xs text-muted-foreground">Older failures are kept for audit, but resolved by newer successful syncs.</div>
                </div>
                <Badge variant="outline">{{ recentSyncRuns.length }} shown</Badge>
              </div>

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
    clickIdCoverage: number;
    backfilledAttributionCoverage: number;
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
  websiteAnalytics: {
    status: 'connected' | 'not_configured' | 'error';
    error: string | null;
    topLandingPages: Ga4BreakdownRow[];
    trafficChannels: Ga4BreakdownRow[];
    sourceMedium: Ga4BreakdownRow[];
    deviceCategories: Ga4BreakdownRow[];
    topEvents: Ga4BreakdownRow[];
    formEvents: Ga4BreakdownRow[];
  };
  campaigns: Array<{
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
  }>;
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
    status: 'healthy' | 'needs_attention' | 'poor_coverage';
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

type Ga4BreakdownRow = {
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
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
      label: 'CRM leads',
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
const totalWebsiteSessions = computed(() => data.value?.professionalMetrics.ga4Website.sessions || 0);
const maxChannelSessions = computed(() => Math.max(...(data.value?.websiteAnalytics.trafficChannels.map(row => metric(row, 'sessions')) || [1]), 1));
const maxDeviceSessions = computed(() => Math.max(...(data.value?.websiteAnalytics.deviceCategories.map(row => metric(row, 'sessions')) || [1]), 1));
const websiteEventRows = computed(() => {
  const analytics = data.value?.websiteAnalytics;
  if (!analytics) return [];
  return analytics.formEvents.length ? analytics.formEvents : analytics.topEvents.slice(0, 8);
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
  if (data.value?.dataLayer.status === 'healthy') return 'Healthy';
  if (data.value?.dataLayer.status === 'needs_attention') return 'Needs attention';
  return 'Poor coverage';
});

const dataLayerVariant = computed(() => data.value?.dataLayer.status === 'poor_coverage' ? 'destructive' : data.value?.dataLayer.status === 'healthy' ? 'default' : 'secondary');

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
  return Number.isFinite(value) ? value : 0;
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
