<template>
  <div class="space-y-6">
    <!-- Team Performance -->
    <Card>
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
        <p v-else class="py-6 text-center text-sm text-muted-foreground">
          No staff performance data available yet
        </p>
      </CardContent>
    </Card>

    <!-- Staff Workload Distribution -->
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
        <div v-if="data?.staffWorkload?.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <p v-else class="py-6 text-center text-sm text-muted-foreground">No open assignments right now</p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Users, AlertCircle } from 'lucide-vue-next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { formatResponseTime, getWorkloadBorderClass, getWorkloadBadgeVariant } from '~/utils/dashboardFormat';
import type { DashboardData } from './types';

defineProps<{ data: DashboardData }>();
</script>
