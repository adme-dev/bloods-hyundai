<template>
  <div class="space-y-6">
    <!-- Vehicle Catalog & Test Drives -->
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

    <!-- Accessories & Offers -->
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
import {
  Car, Sparkles, CalendarCheck, DollarSign, ArrowRight, Package, Tag,
} from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { formatCurrency } from '~/utils/dashboardFormat';
import type { DashboardData } from './types';

const props = defineProps<{ data: DashboardData }>();

function getModelInterestWidth(enquiries: number): number {
  if (!props.data?.vehicleInterest?.length) return 0;
  const maxEnquiries = Math.max(...props.data.vehicleInterest.map((m: any) => m.enquiries), 1);
  return (enquiries / maxEnquiries) * 100;
}
</script>
