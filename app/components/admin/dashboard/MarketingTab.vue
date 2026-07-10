<template>
  <div class="space-y-6">
    <MarketingSummaryCard />
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
    <p v-else class="py-6 text-center text-sm text-muted-foreground">No marketing data available yet</p>
  </div>
</template>

<script setup lang="ts">
import {
  Megaphone, Search, MousePointerClick, Globe, Share2, Mail, Zap,
  CalendarCheck, DollarSign,
} from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import MarketingSummaryCard from './MarketingSummaryCard.vue';
import type { DashboardData } from './types';

const props = defineProps<{ data: DashboardData }>();

function getChannelWidth(total: number): number {
  if (!props.data?.marketingPerformance?.channels?.length) return 0;
  const maxTotal = Math.max(...props.data.marketingPerformance.channels.map((c: any) => c.total), 1);
  return (total / maxTotal) * 100;
}
</script>
