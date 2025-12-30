<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-muted-foreground">Welcome back, {{ greetingName }}</p>
        <h1 class="text-3xl font-semibold tracking-tight">Dashboard</h1>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <Select v-model="dateRange">
          <SelectTrigger class="w-[160px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" @click="refresh">
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': pending }" />
          Refresh
        </Button>
        <Button as-child>
          <NuxtLink to="/admin/enquiries">
            <MailPlus class="mr-2 h-4 w-4" /> View enquiries
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Overview Stats -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Enquiries</CardTitle>
          <Inbox class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data?.overview?.total || 0 }}</div>
          <p class="text-xs text-muted-foreground">All-time recorded</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">New Today</CardTitle>
          <Activity class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data?.overview?.newToday || 0 }}</div>
          <div class="flex items-center gap-1 text-xs">
            <TrendingUp v-if="(data?.overview?.dailyChange || 0) > 0" class="h-3 w-3 text-green-500" />
            <TrendingDown v-else-if="(data?.overview?.dailyChange || 0) < 0" class="h-3 w-3 text-red-500" />
            <Minus v-else class="h-3 w-3 text-muted-foreground" />
            <span :class="getTrendClass(data?.overview?.dailyChange)">
              {{ formatTrend(data?.overview?.dailyChange) }} vs yesterday
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">This Week</CardTitle>
          <Calendar class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data?.overview?.thisWeek || 0 }}</div>
          <div class="flex items-center gap-1 text-xs">
            <TrendingUp v-if="(data?.overview?.weeklyChange || 0) > 0" class="h-3 w-3 text-green-500" />
            <TrendingDown v-else-if="(data?.overview?.weeklyChange || 0) < 0" class="h-3 w-3 text-red-500" />
            <Minus v-else class="h-3 w-3 text-muted-foreground" />
            <span :class="getTrendClass(data?.overview?.weeklyChange)">
              {{ formatTrend(data?.overview?.weeklyChange) }} vs last week
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Needs Attention</CardTitle>
          <AlertCircle class="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data?.overview?.pipeline?.unassigned || 0 }}</div>
          <p class="text-xs text-muted-foreground">Unassigned enquiries</p>
        </CardContent>
      </Card>
    </div>

    <!-- ===================== SALES COMMAND CENTER ===================== -->
    <!-- Alert Banner for Urgent Items -->
    <div v-if="data?.followUpAlerts?.totalAlerts > 0" class="rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 p-4">
      <div class="flex items-start gap-3">
        <AlertTriangle class="h-5 w-5 text-red-500 mt-0.5" />
        <div class="flex-1">
          <h3 class="font-semibold text-red-800 dark:text-red-200">Action Required</h3>
          <p class="text-sm text-red-700 dark:text-red-300">
            {{ data.followUpAlerts.overdue }} leads awaiting response
            <span v-if="data.followUpAlerts.criticalOverdue > 0" class="font-semibold">
              ({{ data.followUpAlerts.criticalOverdue }} critical - over 48 hours)
            </span>
          </p>
        </div>
        <Button variant="destructive" size="sm" as-child>
          <NuxtLink to="/admin/enquiries?status=new&sort=oldest">
            View Overdue <ArrowRight class="ml-1 h-4 w-4" />
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Sales Performance & Targets -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card class="border-l-4 border-l-blue-500">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Monthly Leads</CardTitle>
          <Target class="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data?.salesPerformance?.thisMonth?.leads || 0 }}</div>
          <div class="mt-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted-foreground">Target: {{ data?.salesPerformance?.targets?.monthlyLeads || 50 }}</span>
              <span :class="getTargetProgressClass(data?.salesPerformance?.thisMonth?.leads, data?.salesPerformance?.targets?.monthlyLeads)">
                {{ getTargetProgress(data?.salesPerformance?.thisMonth?.leads, data?.salesPerformance?.targets?.monthlyLeads) }}%
              </span>
            </div>
            <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-blue-500 transition-all"
                :style="{ width: `${Math.min(getTargetProgress(data?.salesPerformance?.thisMonth?.leads, data?.salesPerformance?.targets?.monthlyLeads), 100)}%` }"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-green-500">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Conversions</CardTitle>
          <CheckCircle class="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data?.salesPerformance?.thisMonth?.conversions || 0 }}</div>
          <div class="mt-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted-foreground">Target: {{ data?.salesPerformance?.targets?.monthlyConversions || 15 }}</span>
              <span :class="getTargetProgressClass(data?.salesPerformance?.thisMonth?.conversions, data?.salesPerformance?.targets?.monthlyConversions)">
                {{ getTargetProgress(data?.salesPerformance?.thisMonth?.conversions, data?.salesPerformance?.targets?.monthlyConversions) }}%
              </span>
            </div>
            <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-green-500 transition-all"
                :style="{ width: `${Math.min(getTargetProgress(data?.salesPerformance?.thisMonth?.conversions, data?.salesPerformance?.targets?.monthlyConversions), 100)}%` }"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-purple-500">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Conversion Rate</CardTitle>
          <Percent class="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data?.salesPerformance?.thisMonth?.conversionRate || 0 }}%</div>
          <div class="flex items-center gap-1 text-xs mt-1">
            <TrendingUp v-if="(data?.salesPerformance?.monthOverMonthChange || 0) > 0" class="h-3 w-3 text-green-500" />
            <TrendingDown v-else-if="(data?.salesPerformance?.monthOverMonthChange || 0) < 0" class="h-3 w-3 text-red-500" />
            <Minus v-else class="h-3 w-3 text-muted-foreground" />
            <span :class="getTrendClass(data?.salesPerformance?.monthOverMonthChange)">
              {{ formatTrend(data?.salesPerformance?.monthOverMonthChange) }} vs last month
            </span>
          </div>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-pink-500">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Accessories Revenue</CardTitle>
          <ShoppingCart class="h-4 w-4 text-pink-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">${{ formatCurrency(data?.salesPerformance?.thisMonth?.accessoriesValue) }}</div>
          <p class="text-xs text-muted-foreground mt-1">
            {{ data?.salesPerformance?.thisMonth?.withAccessories || 0 }} enquiries with add-ons
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Marketing Channel Performance -->
    <div v-if="data?.marketingPerformance" class="grid gap-6 lg:grid-cols-3">
      <!-- Channel Summary Cards -->
      <Card class="lg:col-span-2">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="flex items-center gap-2">
                <Megaphone class="h-5 w-5 text-indigo-500" />
                Marketing Channels
              </CardTitle>
              <CardDescription>Lead sources and conversion rates this month</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <!-- Channel Summary Grid -->
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-6">
            <div class="rounded-lg border bg-green-50 dark:bg-green-950/30 p-3 text-center">
              <Search class="h-4 w-4 mx-auto text-green-600 mb-1" />
              <div class="text-xl font-bold text-green-600">{{ data.marketingPerformance.channelSummary.organic.total }}</div>
              <div class="text-[10px] text-muted-foreground">Organic</div>
              <div v-if="data.marketingPerformance.channelSummary.organic.total > 0" class="text-[10px] text-green-600 font-medium">
                {{ data.marketingPerformance.channelSummary.organic.rate }}% conv
              </div>
            </div>
            <div class="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-3 text-center">
              <MousePointerClick class="h-4 w-4 mx-auto text-blue-600 mb-1" />
              <div class="text-xl font-bold text-blue-600">{{ data.marketingPerformance.channelSummary.paid.total }}</div>
              <div class="text-[10px] text-muted-foreground">Paid</div>
              <div v-if="data.marketingPerformance.channelSummary.paid.total > 0" class="text-[10px] text-blue-600 font-medium">
                {{ data.marketingPerformance.channelSummary.paid.rate }}% conv
              </div>
            </div>
            <div class="rounded-lg border bg-gray-50 dark:bg-gray-800 p-3 text-center">
              <Globe class="h-4 w-4 mx-auto text-gray-600 mb-1" />
              <div class="text-xl font-bold text-gray-600">{{ data.marketingPerformance.channelSummary.direct.total }}</div>
              <div class="text-[10px] text-muted-foreground">Direct</div>
              <div v-if="data.marketingPerformance.channelSummary.direct.total > 0" class="text-[10px] text-gray-600 font-medium">
                {{ data.marketingPerformance.channelSummary.direct.rate }}% conv
              </div>
            </div>
            <div class="rounded-lg border bg-purple-50 dark:bg-purple-950/30 p-3 text-center">
              <Share2 class="h-4 w-4 mx-auto text-purple-600 mb-1" />
              <div class="text-xl font-bold text-purple-600">{{ data.marketingPerformance.channelSummary.referral.total }}</div>
              <div class="text-[10px] text-muted-foreground">Social/Ref</div>
              <div v-if="data.marketingPerformance.channelSummary.referral.total > 0" class="text-[10px] text-purple-600 font-medium">
                {{ data.marketingPerformance.channelSummary.referral.rate }}% conv
              </div>
            </div>
            <div class="rounded-lg border bg-amber-50 dark:bg-amber-950/30 p-3 text-center">
              <Mail class="h-4 w-4 mx-auto text-amber-600 mb-1" />
              <div class="text-xl font-bold text-amber-600">{{ data.marketingPerformance.channelSummary.email.total }}</div>
              <div class="text-[10px] text-muted-foreground">Email</div>
              <div v-if="data.marketingPerformance.channelSummary.email.total > 0" class="text-[10px] text-amber-600 font-medium">
                {{ data.marketingPerformance.channelSummary.email.rate }}% conv
              </div>
            </div>
          </div>

          <!-- Source/Medium Breakdown -->
          <div v-if="data.marketingPerformance.channels.length > 0">
            <h4 class="text-sm font-medium mb-3">Top Sources</h4>
            <div class="space-y-2">
              <div
                v-for="(channel, index) in data.marketingPerformance.channels.slice(0, 5)"
                :key="`${channel.source}-${channel.medium}`"
                class="flex items-center gap-3"
              >
                <span class="w-5 text-sm font-bold text-muted-foreground">{{ index + 1 }}</span>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                      <span class="font-medium capitalize">{{ channel.source }}</span>
                      <Badge v-if="channel.medium !== 'none'" variant="outline" class="text-[10px]">{{ channel.medium }}</Badge>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-sm">{{ channel.total }} leads</span>
                      <Badge
                        :variant="channel.conversionRate >= 30 ? 'default' : channel.conversionRate >= 15 ? 'secondary' : 'outline'"
                        class="text-[10px]"
                      >
                        {{ channel.conversionRate }}% conv
                      </Badge>
                    </div>
                  </div>
                  <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      class="h-full rounded-full bg-indigo-500 transition-all"
                      :style="{ width: `${getChannelWidth(channel.total)}%` }"
                    />
                  </div>
                  <div class="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span v-if="channel.withTestDrive > 0">
                      <CalendarCheck class="inline h-3 w-3" /> {{ channel.withTestDrive }} test drives
                    </span>
                    <span v-if="channel.withFinance > 0">
                      <DollarSign class="inline h-3 w-3" /> {{ channel.withFinance }} finance
                    </span>
                    <span v-if="channel.qualityScore > 0" class="ml-auto">
                      Quality: {{ channel.qualityScore }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="py-4 text-center text-sm text-muted-foreground">
            No channel data available yet
          </div>
        </CardContent>
      </Card>

      <!-- Top Campaigns -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Zap class="h-5 w-5 text-yellow-500" />
            Top Campaigns
          </CardTitle>
          <CardDescription>Best performing UTM campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="data.marketingPerformance.topCampaigns.length > 0" class="space-y-3">
            <div
              v-for="campaign in data.marketingPerformance.topCampaigns"
              :key="campaign.campaign"
              class="rounded-lg border p-3"
            >
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-medium text-sm">{{ campaign.campaign }}</div>
                  <div class="text-[10px] text-muted-foreground capitalize">
                    {{ campaign.source }} / {{ campaign.medium }}
                  </div>
                </div>
                <Badge
                  :variant="campaign.conversionRate >= 30 ? 'default' : campaign.conversionRate >= 15 ? 'secondary' : 'outline'"
                >
                  {{ campaign.conversionRate }}%
                </Badge>
              </div>
              <div class="mt-2 flex items-center justify-between text-xs">
                <span class="text-muted-foreground">{{ campaign.total }} leads</span>
                <span class="text-green-600 font-medium">{{ campaign.converted }} converted</span>
              </div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full transition-all"
                  :class="campaign.conversionRate >= 30 ? 'bg-green-500' : campaign.conversionRate >= 15 ? 'bg-yellow-500' : 'bg-gray-400'"
                  :style="{ width: `${Math.min(campaign.conversionRate, 100)}%` }"
                />
              </div>
            </div>
          </div>
          <div v-else class="py-8 text-center">
            <Zap class="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p class="mt-2 text-sm text-muted-foreground">No campaign data yet</p>
            <p class="text-xs text-muted-foreground mt-1">Add UTM parameters to track campaigns</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Customer Retention Quick Stats -->
    <div v-if="data?.customerRetention" class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card class="border-l-4 border-l-teal-500 cursor-pointer hover:border-teal-600 transition-colors" @click="navigateTo('/admin/customers')">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Customers</CardTitle>
          <UserCheck class="h-4 w-4 text-teal-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ data.customerRetention.totalCustomers }}</div>
          <p class="text-xs text-muted-foreground">
            +{{ data.customerRetention.newThisMonth }} this month
          </p>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-red-500 cursor-pointer hover:border-red-600 transition-colors" @click="navigateTo('/admin/customers?view=at_risk')">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">At-Risk Customers</CardTitle>
          <HeartCrack class="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold text-red-600">{{ data.customerRetention.atRisk }}</div>
          <p class="text-xs text-muted-foreground">
            <span v-if="data.customerRetention.critical > 0" class="text-red-600 font-semibold">
              {{ data.customerRetention.critical }} critical
            </span>
            <span v-else>Need attention</span>
          </p>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-amber-500 cursor-pointer hover:border-amber-600 transition-colors" @click="navigateTo('/admin/customers?view=due_followup')">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Due Follow-ups</CardTitle>
          <ClipboardCheck class="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold text-amber-600">
            {{ data.customerRetention.tasksDueToday + data.customerRetention.overdueTasks }}
          </div>
          <p class="text-xs text-muted-foreground">
            <span v-if="data.customerRetention.overdueTasks > 0" class="text-red-600 font-semibold">
              {{ data.customerRetention.overdueTasks }} overdue
            </span>
            <span v-else>{{ data.customerRetention.tasksDueToday }} due today</span>
          </p>
        </CardContent>
      </Card>

      <Card class="border-l-4 border-l-orange-500 cursor-pointer hover:border-orange-600 transition-colors" @click="navigateTo('/admin/customers')">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">No Contact 30+ Days</CardTitle>
          <UserMinus class="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold text-orange-600">{{ data.customerRetention.noContactIn30Days }}</div>
          <p class="text-xs text-muted-foreground">Need re-engagement</p>
        </CardContent>
      </Card>
    </div>

    <!-- Customer Retention Deep Dive Row -->
    <div v-if="data?.customerRetention" class="grid gap-6 lg:grid-cols-3">
      <!-- Lifecycle Funnel -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="flex items-center gap-2">
                <GitMerge class="h-5 w-5 text-teal-500" />
                Customer Lifecycle
              </CardTitle>
              <CardDescription>Journey stage distribution</CardDescription>
            </div>
            <Button variant="ghost" size="sm" as-child>
              <NuxtLink to="/admin/customers">View All</NuxtLink>
            </Button>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-for="stage in lifecycleStagesOrdered"
            :key="stage.key"
            class="space-y-1"
          >
            <div class="flex items-center justify-between text-sm">
              <span class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :class="getLifecycleColor(stage.key)" />
                {{ stage.label }}
              </span>
              <span class="font-semibold">{{ getLifecycleCount(stage.key) }}</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full transition-all"
                :class="getLifecycleBarColor(stage.key)"
                :style="{ width: `${getLifecyclePercent(stage.key)}%` }"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Risk Segmentation -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="flex items-center gap-2">
                <ShieldAlert class="h-5 w-5 text-red-500" />
                Risk Analysis
              </CardTitle>
              <CardDescription>Customer health breakdown</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Risk Level Distribution -->
          <div class="space-y-2">
            <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Risk Level</h4>
            <div class="grid grid-cols-4 gap-2">
              <div class="rounded-lg border bg-green-50 dark:bg-green-950/30 p-2 text-center cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors" @click="navigateTo('/admin/customers?riskLevel=low')">
                <div class="text-lg font-bold text-green-600">{{ data.customerRetention.riskSegmentation?.byRiskLevel?.low || 0 }}</div>
                <div class="text-[10px] text-muted-foreground">Low</div>
              </div>
              <div class="rounded-lg border bg-yellow-50 dark:bg-yellow-950/30 p-2 text-center cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-950/50 transition-colors" @click="navigateTo('/admin/customers?riskLevel=medium')">
                <div class="text-lg font-bold text-yellow-600">{{ data.customerRetention.riskSegmentation?.byRiskLevel?.medium || 0 }}</div>
                <div class="text-[10px] text-muted-foreground">Medium</div>
              </div>
              <div class="rounded-lg border bg-orange-50 dark:bg-orange-950/30 p-2 text-center cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors" @click="navigateTo('/admin/customers?riskLevel=high')">
                <div class="text-lg font-bold text-orange-600">{{ data.customerRetention.riskSegmentation?.byRiskLevel?.high || 0 }}</div>
                <div class="text-[10px] text-muted-foreground">High</div>
              </div>
              <div class="rounded-lg border bg-red-50 dark:bg-red-950/30 p-2 text-center cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors" @click="navigateTo('/admin/customers?riskLevel=critical')">
                <div class="text-lg font-bold text-red-600">{{ data.customerRetention.riskSegmentation?.byRiskLevel?.critical || 0 }}</div>
                <div class="text-[10px] text-muted-foreground">Critical</div>
              </div>
            </div>
          </div>

          <!-- Contact Gap Breakdown -->
          <div class="space-y-2">
            <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Contact Gap</h4>
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">90+ days (critical)</span>
                <Badge variant="destructive">{{ data.customerRetention.riskSegmentation?.byContactGap?.noContact90Plus || 0 }}</Badge>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">60-90 days</span>
                <Badge variant="default">{{ data.customerRetention.riskSegmentation?.byContactGap?.noContact60to90 || 0 }}</Badge>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">30-60 days</span>
                <Badge variant="secondary">{{ data.customerRetention.riskSegmentation?.byContactGap?.noContact30to60 || 0 }}</Badge>
              </div>
            </div>
          </div>

          <!-- Average Scores -->
          <div class="rounded-lg border border-dashed p-3">
            <div class="flex items-center justify-between">
              <div class="text-center flex-1">
                <div class="text-2xl font-bold" :class="getEngagementScoreColor(data.customerRetention.riskSegmentation?.averages?.engagementScore)">
                  {{ data.customerRetention.riskSegmentation?.averages?.engagementScore || 0 }}
                </div>
                <div class="text-xs text-muted-foreground">Avg Engagement</div>
              </div>
              <Separator orientation="vertical" class="h-10" />
              <div class="text-center flex-1">
                <div class="text-2xl font-bold" :class="getRiskScoreColor(data.customerRetention.riskSegmentation?.averages?.riskScore)">
                  {{ data.customerRetention.riskSegmentation?.averages?.riskScore || 0 }}
                </div>
                <div class="text-xs text-muted-foreground">Avg Risk Score</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Task Breakdown & Priority Customers -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="flex items-center gap-2">
                <ListTodo class="h-5 w-5 text-amber-500" />
                Follow-up Tasks
              </CardTitle>
              <CardDescription>Task breakdown by type</CardDescription>
            </div>
            <Button variant="ghost" size="sm" as-child>
              <NuxtLink to="/admin/customers?view=due_followup">View All</NuxtLink>
            </Button>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Task Type Breakdown -->
          <div class="space-y-2">
            <div
              v-for="task in (data.customerRetention.taskBreakdown?.byType || []).slice(0, 5)"
              :key="task.type"
              class="flex items-center justify-between text-sm"
            >
              <span class="flex items-center gap-2">
                <component :is="getTaskTypeIcon(task.type)" class="h-4 w-4 text-muted-foreground" />
                {{ task.label }}
              </span>
              <div class="flex items-center gap-2">
                <Badge v-if="task.overdue > 0" variant="destructive" class="text-[10px]">
                  {{ task.overdue }} overdue
                </Badge>
                <Badge variant="outline">{{ task.pending + task.inProgress }}</Badge>
              </div>
            </div>
            <div v-if="!data.customerRetention.taskBreakdown?.byType?.length" class="text-center text-sm text-muted-foreground py-4">
              No tasks scheduled
            </div>
          </div>

          <!-- Priority Breakdown -->
          <Separator />
          <div class="space-y-2">
            <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Priority</h4>
            <div class="grid grid-cols-4 gap-2">
              <div class="rounded bg-red-100 dark:bg-red-950/30 p-2 text-center">
                <div class="text-lg font-bold text-red-600">{{ data.customerRetention.taskBreakdown?.byPriority?.urgent || 0 }}</div>
                <div class="text-[10px] text-muted-foreground">Urgent</div>
              </div>
              <div class="rounded bg-orange-100 dark:bg-orange-950/30 p-2 text-center">
                <div class="text-lg font-bold text-orange-600">{{ data.customerRetention.taskBreakdown?.byPriority?.high || 0 }}</div>
                <div class="text-[10px] text-muted-foreground">High</div>
              </div>
              <div class="rounded bg-yellow-100 dark:bg-yellow-950/30 p-2 text-center">
                <div class="text-lg font-bold text-yellow-600">{{ data.customerRetention.taskBreakdown?.byPriority?.medium || 0 }}</div>
                <div class="text-[10px] text-muted-foreground">Medium</div>
              </div>
              <div class="rounded bg-gray-100 dark:bg-gray-800 p-2 text-center">
                <div class="text-lg font-bold text-gray-600">{{ data.customerRetention.taskBreakdown?.byPriority?.low || 0 }}</div>
                <div class="text-[10px] text-muted-foreground">Low</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- At-Risk Customers List & Vehicle Interest -->
    <div v-if="data?.customerRetention?.atRiskCustomers?.length || data?.customerRetention?.topVehicleInterests?.length" class="grid gap-6 lg:grid-cols-2">
      <!-- At-Risk Customer Quick List -->
      <Card v-if="data.customerRetention.atRiskCustomers?.length" class="border-red-200 dark:border-red-900">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="flex items-center gap-2 text-red-600">
                <AlertOctagon class="h-5 w-5" />
                Priority At-Risk Customers
              </CardTitle>
              <CardDescription>Highest risk customers needing immediate attention</CardDescription>
            </div>
            <Button variant="outline" size="sm" as-child>
              <NuxtLink to="/admin/customers?view=at_risk">View All</NuxtLink>
            </Button>
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <div class="divide-y">
            <div
              v-for="customer in data.customerRetention.atRiskCustomers"
              :key="customer.id"
              class="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div class="relative">
                  <Avatar class="h-9 w-9">
                    <AvatarImage :src="getGravatarUrl(customer.email)" :alt="customer.name" />
                    <AvatarFallback>{{ getInitials(customer.name) }}</AvatarFallback>
                  </Avatar>
                  <div
                    class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    :class="customer.riskLevel === 'critical' ? 'bg-red-500' : 'bg-orange-500'"
                  >
                    {{ customer.riskScore }}
                  </div>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ customer.name }}</span>
                    <Badge :variant="customer.riskLevel === 'critical' ? 'destructive' : 'default'" class="text-[10px]">
                      {{ customer.riskLevel }}
                    </Badge>
                  </div>
                  <div class="text-xs text-muted-foreground">
                    <span v-if="customer.daysSinceContact !== null">
                      Last contact: {{ customer.daysSinceContact }} days ago
                    </span>
                    <span v-else>Never contacted</span>
                    <span class="mx-1">•</span>
                    <span class="capitalize">{{ customer.lifecycleStage?.replace('_', ' ') }}</span>
                  </div>
                </div>
              </div>
              <Button variant="destructive" size="sm" as-child>
                <NuxtLink :to="`/admin/customers/${customer.id}`">
                  <Phone class="mr-1 h-3 w-3" /> Contact
                </NuxtLink>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Vehicle Interest & Engagement -->
      <Card v-if="data.customerRetention.topVehicleInterests?.length">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="flex items-center gap-2">
                <Car class="h-5 w-5 text-blue-500" />
                Customer Vehicle Interest
              </CardTitle>
              <CardDescription>Top models customers are interested in</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-3">
            <div
              v-for="(interest, index) in data.customerRetention.topVehicleInterests"
              :key="interest.model"
              class="flex items-center gap-3"
            >
              <span class="w-5 text-sm font-bold text-muted-foreground">{{ index + 1 }}</span>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium">{{ interest.model }}</span>
                  <Badge variant="secondary">{{ interest.count }} customers</Badge>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    class="h-full rounded-full bg-blue-500 transition-all"
                    :style="{ width: `${getVehicleInterestPercent(interest.count)}%` }"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Engagement Distribution -->
          <Separator />
          <div class="space-y-2">
            <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Engagement Distribution</h4>
            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-lg border bg-green-50 dark:bg-green-950/30 p-3 text-center">
                <div class="text-xl font-bold text-green-600">{{ data.customerRetention.riskSegmentation?.byEngagement?.high || 0 }}</div>
                <div class="text-xs text-muted-foreground">High (70+)</div>
              </div>
              <div class="rounded-lg border bg-yellow-50 dark:bg-yellow-950/30 p-3 text-center">
                <div class="text-xl font-bold text-yellow-600">{{ data.customerRetention.riskSegmentation?.byEngagement?.medium || 0 }}</div>
                <div class="text-xs text-muted-foreground">Medium (40-69)</div>
              </div>
              <div class="rounded-lg border bg-red-50 dark:bg-red-950/30 p-3 text-center">
                <div class="text-xl font-bold text-red-600">{{ data.customerRetention.riskSegmentation?.byEngagement?.low || 0 }}</div>
                <div class="text-xs text-muted-foreground">Low (&lt;40)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Hot Leads & Conversion Funnel Row -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Hot Leads -->
      <Card class="lg:col-span-2">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="flex items-center gap-2">
                <Flame class="h-5 w-5 text-orange-500" />
                Hot Leads
              </CardTitle>
              <CardDescription>High-priority leads with buying signals</CardDescription>
            </div>
            <Button variant="outline" size="sm" as-child>
              <NuxtLink to="/admin/enquiries?priority=high,urgent">View All</NuxtLink>
            </Button>
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <div v-if="data?.hotLeads?.length" class="divide-y">
            <div
              v-for="lead in data.hotLeads.slice(0, 5)"
              :key="lead.id"
              class="flex items-center justify-between px-6 py-3 transition-colors hover:bg-muted/50"
            >
              <div class="flex items-center gap-3">
                <div class="relative">
                  <Avatar class="h-9 w-9">
                    <AvatarImage :src="getGravatarUrl(lead.email)" :alt="lead.customer" />
                    <AvatarFallback>{{ getInitials(lead.customer) }}</AvatarFallback>
                  </Avatar>
                  <div
                    class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    :class="getLeadScoreClass(lead.score)"
                  >
                    {{ lead.score }}
                  </div>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ lead.customer }}</span>
                    <Badge v-if="lead.priority === 'urgent'" variant="destructive" class="text-[10px]">Urgent</Badge>
                    <Badge v-else-if="lead.priority === 'high'" variant="default" class="text-[10px]">High</Badge>
                  </div>
                  <div class="flex items-center gap-2 text-xs text-muted-foreground">
                    <span v-if="lead.vehicle">{{ lead.vehicle }}</span>
                    <span v-if="lead.variant" class="text-muted-foreground/70">{{ lead.variant }}</span>
                  </div>
                  <div class="flex gap-2 mt-1">
                    <Badge v-if="lead.signals?.testDrive" variant="outline" class="text-[10px] gap-1">
                      <CalendarCheck class="h-3 w-3" /> Test Drive
                    </Badge>
                    <Badge v-if="lead.signals?.financeInterest" variant="outline" class="text-[10px] gap-1">
                      <DollarSign class="h-3 w-3" /> Finance
                    </Badge>
                    <Badge v-if="lead.signals?.hasAccessories" variant="outline" class="text-[10px] gap-1">
                      <Package class="h-3 w-3" /> +${{ formatCurrency(lead.signals?.accessoriesValue) }}
                    </Badge>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-muted-foreground">{{ formatTimeAgo(lead.createdAt) }}</span>
                <Button variant="default" size="sm" as-child>
                  <NuxtLink :to="`/admin/enquiries/${lead.id}`">
                    <Phone class="mr-1 h-3 w-3" /> Contact
                  </NuxtLink>
                </Button>
              </div>
            </div>
          </div>
          <div v-else class="px-6 py-8 text-center text-sm text-muted-foreground">
            No hot leads at the moment
          </div>
        </CardContent>
      </Card>

      <!-- Conversion Funnel -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Filter class="h-5 w-5" />
            Sales Funnel
          </CardTitle>
          <CardDescription>This month's conversion pipeline</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span>Total Leads</span>
              <span class="font-semibold">{{ data?.conversionFunnel?.totalLeads || 0 }}</span>
            </div>
            <div class="h-3 w-full rounded-full bg-blue-500" />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span>Contacted</span>
              <span class="font-semibold">{{ data?.conversionFunnel?.contacted || 0 }} ({{ data?.conversionFunnel?.contactedRate || 0 }}%)</span>
            </div>
            <div class="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full bg-cyan-500 transition-all"
                :style="{ width: `${data?.conversionFunnel?.contactedRate || 0}%` }"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span>Test Drive Booked</span>
              <span class="font-semibold">{{ data?.conversionFunnel?.testDriveBooked || 0 }} ({{ data?.conversionFunnel?.testDriveRate || 0 }}%)</span>
            </div>
            <div class="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full bg-purple-500 transition-all"
                :style="{ width: `${data?.conversionFunnel?.testDriveRate || 0}%` }"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span>Finance Applied</span>
              <span class="font-semibold">{{ data?.conversionFunnel?.financeApplied || 0 }} ({{ data?.conversionFunnel?.financeRate || 0 }}%)</span>
            </div>
            <div class="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full bg-yellow-500 transition-all"
                :style="{ width: `${data?.conversionFunnel?.financeRate || 0}%` }"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="font-semibold">Converted</span>
              <span class="font-bold text-green-600">{{ data?.conversionFunnel?.converted || 0 }} ({{ data?.conversionFunnel?.conversionRate || 0 }}%)</span>
            </div>
            <div class="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full bg-green-500 transition-all"
                :style="{ width: `${data?.conversionFunnel?.conversionRate || 0}%` }"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Overdue Follow-ups -->
    <div v-if="data?.followUpAlerts?.overdueEnquiries?.length" class="grid gap-6">
      <Card class="border-red-200 dark:border-red-900">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="flex items-center gap-2 text-red-600">
                <Clock class="h-5 w-5" />
                Overdue Responses
              </CardTitle>
              <CardDescription>These leads have been waiting over 24 hours</CardDescription>
            </div>
            <Badge variant="destructive">{{ data.followUpAlerts.overdue }} overdue</Badge>
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <div class="divide-y">
            <div
              v-for="enquiry in data.followUpAlerts.overdueEnquiries"
              :key="enquiry.id"
              class="flex items-center justify-between px-6 py-3 bg-red-50/50 dark:bg-red-950/20"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                  <Clock class="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ enquiry.customer }}</span>
                    <Badge variant="outline" class="text-[10px]">{{ enquiry.typeLabel }}</Badge>
                  </div>
                  <div class="text-xs text-muted-foreground">
                    <span v-if="enquiry.vehicle">{{ enquiry.vehicle }} • </span>
                    <span class="text-red-600 font-semibold">Waiting {{ enquiry.hoursWaiting }}h</span>
                  </div>
                </div>
              </div>
              <Button variant="destructive" size="sm" as-child>
                <NuxtLink :to="`/admin/enquiries/${enquiry.id}`">
                  Respond Now
                </NuxtLink>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Department Cards -->
    <div>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">Department Overview</h2>
        <Button variant="ghost" size="sm" as-child>
          <NuxtLink to="/admin/forms">View all forms <ArrowRight class="ml-2 h-4 w-4" /></NuxtLink>
        </Button>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          v-for="dept in sortedDepartments"
          :key="dept.type"
          class="cursor-pointer transition-colors hover:border-primary/50"
          @click="navigateToEnquiries(dept.type)"
        >
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <div class="flex items-center gap-2">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg"
                :class="getDeptBgClass(dept.color)"
              >
                <component :is="getDeptIcon(dept.icon)" class="h-4 w-4" :class="getDeptTextClass(dept.color)" />
              </div>
              <CardTitle class="text-sm font-medium">{{ dept.label }}</CardTitle>
            </div>
            <Badge v-if="dept.new > 0" variant="destructive" class="h-5 px-1.5 text-[10px]">
              {{ dept.new }} new
            </Badge>
          </CardHeader>
          <CardContent>
            <div class="flex items-baseline justify-between">
              <div class="text-2xl font-bold">{{ dept.total }}</div>
              <div class="flex items-center gap-1 text-xs">
                <TrendingUp v-if="dept.weeklyChange > 0" class="h-3 w-3 text-green-500" />
                <TrendingDown v-else-if="dept.weeklyChange < 0" class="h-3 w-3 text-red-500" />
                <span :class="getTrendClass(dept.weeklyChange)">
                  {{ formatTrend(dept.weeklyChange) }}
                </span>
              </div>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>This week: {{ dept.thisWeek }}</span>
              <span v-if="dept.avgResponseHours !== null">
                Avg: {{ formatResponseTime(dept.avgResponseHours) }}
              </span>
            </div>
            <div v-if="dept.conversionRate > 0" class="mt-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-muted-foreground">Conversion</span>
                <span class="font-medium">{{ dept.conversionRate }}%</span>
              </div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full transition-all"
                  :class="getConversionBarClass(dept.conversionRate)"
                  :style="{ width: `${Math.min(dept.conversionRate, 100)}%` }"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Pipeline & Trend Chart -->
      <Card class="lg:col-span-2">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Enquiry Trends</CardTitle>
              <CardDescription>Last 14 days activity</CardDescription>
            </div>
            <div class="flex gap-1">
              <Button
                v-for="chartType in chartTypes"
                :key="chartType.value"
                variant="ghost"
                size="sm"
                :class="{ 'bg-muted': selectedChartType === chartType.value }"
                @click="selectedChartType = chartType.value"
              >
                {{ chartType.label }}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="h-[280px]">
            <div v-if="data?.dailyTrend?.length" class="flex h-full items-end gap-1">
              <div
                v-for="day in data.dailyTrend"
                :key="day.date"
                class="group relative flex-1"
              >
                <div
                  class="w-full rounded-t bg-primary/80 transition-colors hover:bg-primary"
                  :style="{ height: `${getBarHeight(day)}%`, minHeight: day.total > 0 ? '4px' : '0' }"
                />
                <div class="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block">
                  {{ day.total }} enquiries
                </div>
                <div class="mt-1 text-center text-[10px] text-muted-foreground">
                  {{ formatChartDate(day.date) }}
                </div>
              </div>
            </div>
            <div v-else class="flex h-full items-center justify-center text-sm text-muted-foreground">
              No trend data available yet
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Response Metrics -->
      <Card>
        <CardHeader>
          <CardTitle>Response Performance</CardTitle>
          <CardDescription>This month's metrics</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Avg Response Time</span>
              <span class="font-semibold">
                {{ data?.responseMetrics?.avgHours ? formatResponseTime(data.responseMetrics.avgHours) : 'N/A' }}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Median Response</span>
              <span class="font-semibold">
                {{ data?.responseMetrics?.medianHours ? formatResponseTime(data.responseMetrics.medianHours) : 'N/A' }}
              </span>
            </div>
          </div>

          <Separator />

          <div class="space-y-3">
            <div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Responded within 1 hour</span>
                <span class="font-semibold">{{ data?.responseMetrics?.within1hRate || 0 }}%</span>
              </div>
              <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full bg-green-500 transition-all"
                  :style="{ width: `${data?.responseMetrics?.within1hRate || 0}%` }"
                />
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Responded within 24 hours</span>
                <span class="font-semibold">{{ data?.responseMetrics?.within24hRate || 0 }}%</span>
              </div>
              <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full bg-blue-500 transition-all"
                  :style="{ width: `${data?.responseMetrics?.within24hRate || 0}%` }"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 class="mb-2 text-sm font-medium">Traffic Sources</h4>
            <div class="space-y-2">
              <div
                v-for="source in data?.sources || []"
                :key="source.source"
                class="flex items-center justify-between text-sm"
              >
                <span class="capitalize text-muted-foreground">{{ source.source }}</span>
                <Badge variant="secondary">{{ source.count }}</Badge>
              </div>
              <p v-if="!data?.sources?.length" class="text-xs text-muted-foreground">
                No source data available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Second Row -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Pipeline Status -->
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Status</CardTitle>
          <CardDescription>Current enquiry distribution</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-for="status in pipelineStatuses"
            :key="status.key"
            class="flex items-center justify-between rounded-lg border border-dashed px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <Badge :variant="status.variant">{{ status.label }}</Badge>
              <span class="text-sm text-muted-foreground">{{ status.description }}</span>
            </div>
            <div class="text-lg font-semibold">{{ data?.overview?.pipeline?.[status.key] || 0 }}</div>
          </div>
        </CardContent>
      </Card>

      <!-- Recent Activity -->
      <Card class="lg:col-span-2">
        <CardHeader class="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest enquiries across all departments</CardDescription>
          </div>
          <Button variant="outline" size="sm" as-child>
            <NuxtLink to="/admin/enquiries">View all</NuxtLink>
          </Button>
        </CardHeader>
        <CardContent class="p-0">
          <div class="divide-y">
            <div
              v-for="enquiry in data?.recentEnquiries || []"
              :key="enquiry.id"
              class="flex items-center justify-between px-6 py-3 transition-colors hover:bg-muted/50"
            >
              <div class="flex items-center gap-3">
                <Avatar class="h-9 w-9">
                  <AvatarImage :src="getGravatarUrl(enquiry.email)" :alt="enquiry.customer" />
                  <AvatarFallback>{{ getInitials(enquiry.customer) }}</AvatarFallback>
                </Avatar>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ enquiry.customer }}</span>
                    <Badge variant="outline" class="text-[10px]">{{ enquiry.typeLabel }}</Badge>
                  </div>
                  <div class="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{{ enquiry.email }}</span>
                    <span v-if="enquiry.vehicle">• {{ enquiry.vehicle }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <Badge :variant="getStatusVariant(enquiry.status)">
                  {{ formatStatus(enquiry.status) }}
                </Badge>
                <span class="text-xs text-muted-foreground">
                  {{ formatTimeAgo(enquiry.createdAt) }}
                </span>
                <Button variant="ghost" size="icon" as-child>
                  <NuxtLink :to="`/admin/enquiries/${enquiry.id}`">
                    <ArrowRight class="h-4 w-4" />
                  </NuxtLink>
                </Button>
              </div>
            </div>
            <div v-if="!data?.recentEnquiries?.length" class="px-6 py-8 text-center text-sm text-muted-foreground">
              No recent enquiries
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Staff Performance & Quick Actions -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Staff Leaderboard -->
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>This month's enquiry handling metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table v-if="data?.staffPerformance?.length">
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead class="text-center">Assigned</TableHead>
                <TableHead class="text-center">Closed</TableHead>
                <TableHead class="text-center">Closure Rate</TableHead>
                <TableHead class="text-right">Avg Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="staff in data.staffPerformance" :key="staff.id">
                <TableCell class="font-medium">{{ staff.name }}</TableCell>
                <TableCell class="text-center">{{ staff.assigned }}</TableCell>
                <TableCell class="text-center">{{ staff.closed }}</TableCell>
                <TableCell class="text-center">
                  <Badge :variant="staff.closureRate >= 70 ? 'default' : staff.closureRate >= 40 ? 'secondary' : 'outline'">
                    {{ staff.closureRate }}%
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  {{ staff.avgResponseHours ? formatResponseTime(staff.avgResponseHours) : 'N/A' }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div v-else class="py-8 text-center text-sm text-muted-foreground">
            No staff performance data available yet
          </div>
        </CardContent>
      </Card>

      <!-- Quick Actions -->
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common admin tasks</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2">
          <Button variant="secondary" class="w-full justify-start" as-child>
            <NuxtLink to="/admin/enquiries?status=new">
              <Inbox class="mr-2 h-4 w-4" />
              Review new enquiries
              <Badge v-if="data?.overview?.pipeline?.new" variant="destructive" class="ml-auto">
                {{ data.overview.pipeline.new }}
              </Badge>
            </NuxtLink>
          </Button>
          <Button variant="secondary" class="w-full justify-start" as-child>
            <NuxtLink to="/admin/enquiries?assigned=unassigned">
              <UserPlus class="mr-2 h-4 w-4" />
              Assign pending enquiries
              <Badge v-if="data?.overview?.pipeline?.unassigned" variant="outline" class="ml-auto">
                {{ data.overview.pipeline.unassigned }}
              </Badge>
            </NuxtLink>
          </Button>
          <Button variant="secondary" class="w-full justify-start" as-child>
            <NuxtLink to="/admin/customers?view=at_risk">
              <HeartCrack class="mr-2 h-4 w-4" />
              At-risk customers
              <Badge v-if="data?.customerRetention?.atRisk" variant="destructive" class="ml-auto">
                {{ data.customerRetention.atRisk }}
              </Badge>
            </NuxtLink>
          </Button>
          <Button variant="secondary" class="w-full justify-start" as-child>
            <NuxtLink to="/admin/staff">
              <Users class="mr-2 h-4 w-4" /> Manage team roster
            </NuxtLink>
          </Button>
          <Button variant="secondary" class="w-full justify-start" as-child>
            <NuxtLink to="/admin/settings/routing">
              <GitBranch class="mr-2 h-4 w-4" /> Routing rules
            </NuxtLink>
          </Button>
          <Separator class="my-2" />
          <Button variant="outline" class="w-full justify-start" as-child>
            <NuxtLink to="/admin/settings">
              <Settings class="mr-2 h-4 w-4" /> Account settings
            </NuxtLink>
          </Button>
          <Button variant="outline" class="w-full justify-start" as-child>
            <NuxtLink to="/admin/settings/targets">
              <Target class="mr-2 h-4 w-4" /> Sales targets
            </NuxtLink>
          </Button>
          <Button variant="outline" class="w-full justify-start" as-child>
            <NuxtLink to="/admin/settings/email">
              <Mail class="mr-2 h-4 w-4" /> Email configuration
            </NuxtLink>
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Staff Workload Distribution -->
    <div v-if="data?.staffWorkload?.length" class="grid gap-6">
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="flex items-center gap-2">
                <Users class="h-5 w-5" />
                Staff Workload Distribution
              </CardTitle>
              <CardDescription>Current open assignments by team member</CardDescription>
            </div>
            <Button variant="outline" size="sm" as-child>
              <NuxtLink to="/admin/staff">Manage Staff</NuxtLink>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="staff in data.staffWorkload"
              :key="staff.id"
              class="rounded-lg border p-4"
              :class="getWorkloadBorderClass(staff.workloadLevel)"
            >
              <div class="flex items-start justify-between">
                <div>
                  <h4 class="font-semibold">{{ staff.name }}</h4>
                  <p class="text-sm text-muted-foreground">{{ staff.openEnquiries }} open enquiries</p>
                </div>
                <Badge :variant="getWorkloadBadgeVariant(staff.workloadLevel)">
                  {{ staff.workloadLevel }}
                </Badge>
              </div>

              <div class="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div class="rounded bg-blue-50 dark:bg-blue-950/30 p-2">
                  <div class="font-semibold text-blue-600">{{ staff.breakdown.new }}</div>
                  <div class="text-muted-foreground">New</div>
                </div>
                <div class="rounded bg-yellow-50 dark:bg-yellow-950/30 p-2">
                  <div class="font-semibold text-yellow-600">{{ staff.breakdown.inProgress }}</div>
                  <div class="text-muted-foreground">In Progress</div>
                </div>
                <div class="rounded bg-cyan-50 dark:bg-cyan-950/30 p-2">
                  <div class="font-semibold text-cyan-600">{{ staff.breakdown.contacted }}</div>
                  <div class="text-muted-foreground">Contacted</div>
                </div>
              </div>

              <div v-if="staff.highPriority > 0" class="mt-3 flex items-center gap-2 text-xs text-red-600">
                <AlertCircle class="h-3 w-3" />
                {{ staff.highPriority }} high priority
              </div>

              <div v-if="staff.oldestEnquiryHours" class="mt-2 text-xs text-muted-foreground">
                Oldest: {{ formatResponseTime(staff.oldestEnquiryHours) }} ago
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Vehicle Catalog & Test Drives Section -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Vehicle Catalog Overview -->
      <Card class="lg:col-span-2">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="flex items-center gap-2">
                <Car class="h-5 w-5" />
                New Vehicle Lineup
              </CardTitle>
              <CardDescription>Hyundai model range and customer interest</CardDescription>
            </div>
            <Button variant="outline" size="sm" as-child>
              <NuxtLink to="/test-drive">View Catalog</NuxtLink>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="data?.vehicleCatalog" class="space-y-4">
            <!-- Catalog Stats -->
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div class="rounded-lg border bg-muted/30 p-3 text-center">
                <div class="text-2xl font-bold">{{ data.vehicleCatalog.totalModels }}</div>
                <div class="text-xs text-muted-foreground">Total Models</div>
              </div>
              <div class="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-3 text-center">
                <div class="text-2xl font-bold text-blue-600">{{ data.vehicleCatalog.highlights?.electric || 0 }}</div>
                <div class="text-xs text-muted-foreground">Electric</div>
              </div>
              <div class="rounded-lg border bg-green-50 dark:bg-green-950/30 p-3 text-center">
                <div class="text-2xl font-bold text-green-600">{{ data.vehicleCatalog.highlights?.hybrid || 0 }}</div>
                <div class="text-xs text-muted-foreground">Hybrid</div>
              </div>
              <div class="rounded-lg border bg-orange-50 dark:bg-orange-950/30 p-3 text-center">
                <div class="text-2xl font-bold text-orange-600">{{ data.vehicleCatalog.highlights?.suv || 0 }}</div>
                <div class="text-xs text-muted-foreground">SUVs</div>
              </div>
            </div>

            <!-- New Models Badge -->
            <div v-if="data.vehicleCatalog.newModels > 0" class="flex items-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-4 py-2">
              <Sparkles class="h-4 w-4 text-primary" />
              <span class="text-sm">
                <span class="font-semibold">{{ data.vehicleCatalog.newModels }}</span> new 2025 models available
              </span>
              <Badge v-if="data.vehicleCatalog.withOffers > 0" variant="secondary" class="ml-auto">
                {{ data.vehicleCatalog.withOffers }} with offers
              </Badge>
            </div>

            <!-- Top Models by Interest -->
            <div v-if="data?.vehicleInterest?.length">
              <h4 class="mb-3 text-sm font-medium">Customer Interest by Model</h4>
              <div class="space-y-2">
                <div
                  v-for="(model, index) in data.vehicleInterest.slice(0, 5)"
                  :key="model.model"
                  class="flex items-center gap-3"
                >
                  <span class="w-4 text-xs text-muted-foreground">{{ index + 1 }}</span>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <span class="font-medium">{{ model.model }}</span>
                      <span class="text-sm text-muted-foreground">{{ model.enquiries }} enquiries</span>
                    </div>
                    <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        class="h-full rounded-full bg-primary transition-all"
                        :style="{ width: `${getModelInterestWidth(model.enquiries)}%` }"
                      />
                    </div>
                    <div class="mt-1 flex gap-3 text-xs text-muted-foreground">
                      <span v-if="model.testDrives > 0">
                        <CalendarCheck class="inline h-3 w-3" /> {{ model.testDrives }} test drives
                      </span>
                      <span v-if="model.withFinance > 0">
                        <DollarSign class="inline h-3 w-3" /> {{ model.withFinance }} finance interest
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="py-4 text-center text-sm text-muted-foreground">
              No vehicle interest data yet
            </div>
          </div>
          <div v-else class="py-8 text-center text-sm text-muted-foreground">
            Loading vehicle catalog...
          </div>
        </CardContent>
      </Card>

      <!-- Test Drive Requests -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <CalendarCheck class="h-5 w-5" />
            Test Drives
          </CardTitle>
          <CardDescription>This month's booking requests</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Test Drive Stats -->
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg border p-3 text-center">
              <div class="text-2xl font-bold">{{ data?.testDrives?.total || 0 }}</div>
              <div class="text-xs text-muted-foreground">Total Requests</div>
            </div>
            <div class="rounded-lg border p-3 text-center">
              <div class="text-2xl font-bold text-cyan-600">{{ data?.testDrives?.thisWeek || 0 }}</div>
              <div class="text-xs text-muted-foreground">This Week</div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Pending</span>
              <Badge variant="default">{{ data?.testDrives?.pending || 0 }}</Badge>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Confirmed</span>
              <Badge variant="secondary">{{ data?.testDrives?.confirmed || 0 }}</Badge>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Completed</span>
              <Badge variant="outline">{{ data?.testDrives?.completed || 0 }}</Badge>
            </div>
          </div>

          <Separator />

          <!-- Upcoming Test Drives -->
          <div>
            <h4 class="mb-2 text-sm font-medium">Recent Requests</h4>
            <div v-if="data?.testDrives?.upcoming?.length" class="space-y-2">
              <div
                v-for="td in data.testDrives.upcoming"
                :key="td.id"
                class="flex items-center justify-between rounded-lg border p-2 text-sm"
              >
                <div>
                  <div class="font-medium">{{ td.customer }}</div>
                  <div class="text-xs text-muted-foreground">{{ td.vehicle }} {{ td.variant }}</div>
                </div>
                <Button variant="ghost" size="icon" as-child>
                  <NuxtLink :to="`/admin/enquiries/${td.id}`">
                    <ArrowRight class="h-4 w-4" />
                  </NuxtLink>
                </Button>
              </div>
            </div>
            <div v-else class="py-4 text-center text-xs text-muted-foreground">
              No pending test drive requests
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Accessories & Offers Section -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Accessories Analytics -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Sparkles class="h-5 w-5" />
            Accessories Interest
          </CardTitle>
          <CardDescription>Accessory purchases with vehicle enquiries</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <div class="rounded-lg border bg-pink-50 dark:bg-pink-950/30 p-3 text-center">
              <div class="text-2xl font-bold text-pink-600">{{ data?.accessoriesAnalytics?.enquiriesWithAccessories || 0 }}</div>
              <div class="text-xs text-muted-foreground">With Accessories</div>
            </div>
            <div class="rounded-lg border p-3 text-center">
              <div class="text-2xl font-bold">${{ formatCurrency(data?.accessoriesAnalytics?.avgCartValue) }}</div>
              <div class="text-xs text-muted-foreground">Avg Cart Value</div>
            </div>
            <div class="rounded-lg border p-3 text-center">
              <div class="text-2xl font-bold">{{ data?.accessoriesAnalytics?.avgItemCount || 0 }}</div>
              <div class="text-xs text-muted-foreground">Avg Items</div>
            </div>
          </div>

          <div class="rounded-lg border border-dashed p-4">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-950">
                <Package class="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <h4 class="font-medium">Popular Categories</h4>
                <p class="text-sm text-muted-foreground">
                  Roof racks, protection packs, cargo solutions, and towing accessories are commonly requested.
                </p>
                <Button variant="link" size="sm" class="mt-2 h-auto p-0" as-child>
                  <NuxtLink to="/admin/enquiries?type=accessories">
                    View accessory enquiries <ArrowRight class="ml-1 h-3 w-3" />
                  </NuxtLink>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Current Offers -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Tag class="h-5 w-5" />
            Current Offers
          </CardTitle>
          <CardDescription>Active OEM promotions and deals</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="data?.currentOffers?.hasActiveOffers" class="space-y-4">
            <div class="flex items-center gap-4 rounded-lg border bg-green-50 dark:bg-green-950/30 p-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Tag class="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600">
                  {{ data.currentOffers.totalOffers || data.currentOffers.modelsWithOffers?.length || 0 }}
                </div>
                <div class="text-sm text-muted-foreground">Active Offers</div>
              </div>
            </div>

            <div v-if="data.currentOffers.modelsWithOffers?.length">
              <h4 class="mb-2 text-sm font-medium">Models with Offers</h4>
              <div class="flex flex-wrap gap-2">
                <Badge
                  v-for="model in data.currentOffers.modelsWithOffers.slice(0, 8)"
                  :key="model"
                  variant="secondary"
                >
                  {{ model }}
                </Badge>
              </div>
            </div>

            <Button variant="outline" class="w-full" as-child>
              <NuxtLink to="/special-offers">
                View All Offers
              </NuxtLink>
            </Button>
          </div>
          <div v-else class="py-8 text-center">
            <Tag class="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p class="mt-2 text-sm text-muted-foreground">No active offers at the moment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import {
  RefreshCw,
  MailPlus,
  Inbox,
  Activity,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Users,
  UserPlus,
  GitBranch,
  Settings,
  Mail,
  Car,
  MessageSquare,
  DollarSign,
  Wrench,
  Package,
  CalendarCheck,
  ArrowLeftRight,
  Sparkles,
  Truck,
  Tag,
  // Sales Command Center icons
  AlertTriangle,
  Target,
  CheckCircle,
  Percent,
  ShoppingCart,
  Flame,
  Phone,
  Filter,
  Clock,
  // Customer Retention icons
  UserCheck,
  HeartCrack,
  ClipboardCheck,
  UserMinus,
  // Enhanced Retention icons
  GitMerge,
  ShieldAlert,
  ListTodo,
  AlertOctagon,
  PhoneCall,
  Mail as MailIcon,
  MessageSquareText,
  CalendarClock,
  Handshake,
  Bell,
  // Marketing Performance icons
  Megaphone,
  Search,
  MousePointerClick,
  Globe,
  Share2,
  Zap,
} from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { getGravatarUrl } from '~/utils/gravatar';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

const userState = useState<any>('auth-user');
const greetingName = computed(() => {
  if (!userState.value) return 'team';
  return `${userState.value.firstName || ''} ${userState.value.lastName || ''}`.trim() || 'team';
});

const dateRange = ref('week');
const selectedChartType = ref('total');

const chartTypes = [
  { value: 'total', label: 'All' },
  { value: 'sales', label: 'Sales' },
  { value: 'service', label: 'Service' },
];

const { data, pending, refresh } = await useFetch('/api/admin/analytics/dashboard');

// Auto-refresh every 30 seconds
let refreshInterval: ReturnType<typeof setInterval>;
onMounted(() => {
  refreshInterval = setInterval(() => refresh(), 30000);
});
onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});

const sortedDepartments = computed(() => {
  if (!data.value?.departments) return [];
  return [...data.value.departments].sort((a, b) => b.total - a.total);
});

// Sales funnel pipeline stages (Cold → Warm → Hot → Closed)
const pipelineStatuses = [
  // Cold Leads
  { key: 'newLead', label: 'New Lead', description: 'Fresh enquiry', variant: 'default' as const, stage: 'cold' },
  { key: 'qualified', label: 'Qualified', description: 'Budget confirmed', variant: 'secondary' as const, stage: 'cold' },
  { key: 'attemptedContact', label: 'Attempted', description: 'No response yet', variant: 'outline' as const, stage: 'cold' },
  // Warm Leads
  { key: 'appointmentSet', label: 'Appt Set', description: 'Visit scheduled', variant: 'default' as const, stage: 'warm' },
  { key: 'showed', label: 'Showed', description: 'Visited showroom', variant: 'secondary' as const, stage: 'warm' },
  { key: 'testDrive', label: 'Test Drive', description: 'Completed TD', variant: 'outline' as const, stage: 'warm' },
  // Hot Leads
  { key: 'negotiating', label: 'Negotiating', description: 'Pricing discussion', variant: 'default' as const, stage: 'hot' },
  { key: 'pendingFinance', label: 'Pending Finance', description: 'Awaiting approval', variant: 'secondary' as const, stage: 'hot' },
  { key: 'depositTaken', label: 'Deposit', description: 'Holding deposit', variant: 'outline' as const, stage: 'hot' },
  // Closed
  { key: 'sold', label: 'Sold', description: 'Deal won', variant: 'default' as const, stage: 'closed' },
  { key: 'lost', label: 'Lost', description: 'Deal lost', variant: 'destructive' as const, stage: 'closed' },
];

const iconMap: Record<string, any> = {
  Car,
  MessageSquare,
  DollarSign,
  Wrench,
  Package,
  CalendarCheck,
  ArrowLeftRight,
  Sparkles,
  Truck,
  Mail: Inbox,
};

function getDeptIcon(icon: string) {
  return iconMap[icon] || Inbox;
}

function getDeptBgClass(color: string): string {
  const classes: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-950',
    gray: 'bg-gray-100 dark:bg-gray-800',
    green: 'bg-green-100 dark:bg-green-950',
    orange: 'bg-orange-100 dark:bg-orange-950',
    purple: 'bg-purple-100 dark:bg-purple-950',
    cyan: 'bg-cyan-100 dark:bg-cyan-950',
    yellow: 'bg-yellow-100 dark:bg-yellow-950',
    pink: 'bg-pink-100 dark:bg-pink-950',
    indigo: 'bg-indigo-100 dark:bg-indigo-950',
  };
  return classes[color] || 'bg-muted';
}

function getDeptTextClass(color: string): string {
  const classes: Record<string, string> = {
    blue: 'text-blue-600 dark:text-blue-400',
    gray: 'text-gray-600 dark:text-gray-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400',
    purple: 'text-purple-600 dark:text-purple-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    pink: 'text-pink-600 dark:text-pink-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
  };
  return classes[color] || 'text-muted-foreground';
}

function getTrendClass(change: number | undefined): string {
  if (!change) return 'text-muted-foreground';
  return change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground';
}

function formatTrend(change: number | undefined): string {
  if (!change) return '0%';
  return `${change > 0 ? '+' : ''}${change}%`;
}

function formatResponseTime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  if (hours < 24) {
    return `${Math.round(hours)}h`;
  }
  return `${Math.round(hours / 24)}d`;
}

function getConversionBarClass(rate: number): string {
  if (rate >= 70) return 'bg-green-500';
  if (rate >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getBarHeight(day: { total: number }): number {
  if (!data.value?.dailyTrend) return 0;
  const maxTotal = Math.max(...data.value.dailyTrend.map((d: any) => d.total), 1);
  return (day.total / maxTotal) * 100;
}

function formatChartDate(date: string): string {
  return new Date(date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function formatTimeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  const map: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    new: 'default',
    in_progress: 'secondary',
    contacted: 'outline',
    closed: 'outline',
  };
  return map[status] || 'outline';
}

function formatStatus(status: string): string {
  const statuses: Record<string, string> = {
    new: 'New',
    in_progress: 'In Progress',
    contacted: 'Contacted',
    closed: 'Closed',
  };
  return statuses[status] || status;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function navigateToEnquiries(type: string) {
  navigateTo(`/admin/enquiries?type=${type}`);
}

function formatCurrency(value: number | undefined): string {
  if (!value || isNaN(value)) return '0';
  return value.toLocaleString('en-AU', { maximumFractionDigits: 0 });
}

function getModelInterestWidth(enquiries: number): number {
  if (!data.value?.vehicleInterest?.length) return 0;
  const maxEnquiries = Math.max(...data.value.vehicleInterest.map((m: any) => m.enquiries), 1);
  return (enquiries / maxEnquiries) * 100;
}

// Sales Command Center helpers
function getTargetProgress(current: number | undefined, target: number | undefined): number {
  if (!current || !target) return 0;
  return Math.round((current / target) * 100);
}

function getTargetProgressClass(current: number | undefined, target: number | undefined): string {
  const progress = getTargetProgress(current, target);
  if (progress >= 100) return 'text-green-600 font-semibold';
  if (progress >= 75) return 'text-blue-600';
  if (progress >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function getLeadScoreClass(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-gray-400';
}

// Marketing Performance helpers
function getChannelWidth(total: number): number {
  if (!data.value?.marketingPerformance?.channels?.length) return 0;
  const maxTotal = Math.max(...data.value.marketingPerformance.channels.map((c: any) => c.total), 1);
  return (total / maxTotal) * 100;
}

// Staff Workload helpers
function getWorkloadBorderClass(level: string): string {
  const classes: Record<string, string> = {
    low: 'border-green-200 dark:border-green-900',
    moderate: 'border-blue-200 dark:border-blue-900',
    high: 'border-yellow-200 dark:border-yellow-900',
    overloaded: 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20',
  };
  return classes[level] || '';
}

function getWorkloadBadgeVariant(level: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    low: 'outline',
    moderate: 'secondary',
    high: 'default',
    overloaded: 'destructive',
  };
  return variants[level] || 'outline';
}

// ============================================================================
// CUSTOMER RETENTION HELPERS
// ============================================================================

// Lifecycle stages in order
const lifecycleStagesOrdered = [
  { key: 'prospect', label: 'Prospect' },
  { key: 'lead', label: 'Lead' },
  { key: 'test_drive', label: 'Test Drive' },
  { key: 'negotiating', label: 'Negotiating' },
  { key: 'purchased', label: 'Purchased' },
  { key: 'service_customer', label: 'Service Customer' },
  { key: 'at_risk', label: 'At Risk' },
  { key: 'inactive', label: 'Inactive' },
];

function getLifecycleCount(stage: string): number {
  if (!data.value?.customerRetention?.lifecycleDistribution) return 0;
  const found = data.value.customerRetention.lifecycleDistribution.find((d: any) => d.stage === stage);
  return found?.count || 0;
}

function getLifecyclePercent(stage: string): number {
  if (!data.value?.customerRetention?.totalCustomers) return 0;
  const count = getLifecycleCount(stage);
  return Math.round((count / data.value.customerRetention.totalCustomers) * 100);
}

function getLifecycleColor(stage: string): string {
  const colors: Record<string, string> = {
    prospect: 'bg-blue-500',
    lead: 'bg-cyan-500',
    test_drive: 'bg-purple-500',
    negotiating: 'bg-yellow-500',
    purchased: 'bg-green-500',
    service_customer: 'bg-teal-500',
    at_risk: 'bg-orange-500',
    inactive: 'bg-gray-400',
  };
  return colors[stage] || 'bg-gray-400';
}

function getLifecycleBarColor(stage: string): string {
  const colors: Record<string, string> = {
    prospect: 'bg-blue-500',
    lead: 'bg-cyan-500',
    test_drive: 'bg-purple-500',
    negotiating: 'bg-yellow-500',
    purchased: 'bg-green-500',
    service_customer: 'bg-teal-500',
    at_risk: 'bg-orange-500',
    inactive: 'bg-gray-400',
  };
  return colors[stage] || 'bg-gray-400';
}

function getEngagementScoreColor(score: number | undefined): string {
  if (!score) return 'text-gray-600';
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getRiskScoreColor(score: number | undefined): string {
  if (!score) return 'text-gray-600';
  if (score >= 70) return 'text-red-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-green-600';
}

function getTaskTypeIcon(type: string | null) {
  const icons: Record<string, any> = {
    follow_up: PhoneCall,
    call: PhoneCall,
    email: MailIcon,
    sms: MessageSquareText,
    meeting: Handshake,
    service_reminder: CalendarClock,
    trade_in_offer: Car,
    other: Bell,
  };
  return icons[type || 'other'] || Bell;
}

function getVehicleInterestPercent(count: number): number {
  if (!data.value?.customerRetention?.topVehicleInterests?.length) return 0;
  const maxCount = Math.max(...data.value.customerRetention.topVehicleInterests.map((i: any) => i.count), 1);
  return Math.round((count / maxCount) * 100);
}
</script>









