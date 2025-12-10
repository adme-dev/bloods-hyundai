<template>
  <div class="space-y-8">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-muted-foreground">Welcome back, {{ greetingName }}</p>
        <h1 class="text-3xl font-semibold tracking-tight">Dashboard</h1>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" @click="refresh">
          <RefreshCw class="mr-2 h-4 w-4" /> Refresh stats
        </Button>
        <Button as-child>
          <NuxtLink to="/admin/enquiries">
            <MailPlus class="mr-2 h-4 w-4" /> View enquiries
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card v-for="card in statCards" :key="card.label">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">{{ card.label }}</CardTitle>
          <component :is="card.icon" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ card.value }}</div>
          <p class="text-xs text-muted-foreground">{{ card.helper }}</p>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <Card class="lg:col-span-2">
        <CardHeader class="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pipeline overview</CardTitle>
            <CardDescription>How enquiries are distributed by status</CardDescription>
          </div>
          <Badge variant="outline">{{ statusBreakdown.length }} statuses</Badge>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div
              v-for="status in statusBreakdown"
              :key="status.status"
              class="flex items-center justify-between rounded-lg border border-dashed border-muted px-4 py-3"
            >
              <div class="flex items-center gap-3">
                <Badge :variant="status.badge">{{ status.label }}</Badge>
                <span class="text-sm text-muted-foreground">{{ status.description }}</span>
              </div>
              <div class="text-lg font-semibold">{{ status.count }}</div>
            </div>
            <p v-if="statusBreakdown.length === 0" class="text-sm text-muted-foreground">
              No status data available yet. Once enquiries start flowing in, you’ll see them here.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Shortcuts to common admin tasks</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <Button variant="secondary" class="w-full justify-start" as-child>
            <NuxtLink to="/admin/enquiries">
              <Inbox class="mr-2 h-4 w-4" /> Review incoming enquiries
            </NuxtLink>
          </Button>
          <Button variant="secondary" class="w-full justify-start" as-child>
            <NuxtLink to="/admin/staff">
              <Users class="mr-2 h-4 w-4" /> Manage team roster
            </NuxtLink>
          </Button>
          <Button variant="secondary" class="w-full justify-start" as-child>
            <NuxtLink to="/admin/settings/routing">
              <GitBranch class="mr-2 h-4 w-4" /> Adjust routing rules
            </NuxtLink>
          </Button>
          <Button variant="outline" class="w-full justify-start" as-child>
            <NuxtLink to="/admin/settings">
              <Settings class="mr-2 h-4 w-4" /> Update account settings
            </NuxtLink>
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { RefreshCw, MailPlus, Inbox, Users, GitBranch, Settings, Clock3, CheckCircle2, BarChart3, Activity } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

const userState = useState<any>('auth-user');
const greetingName = computed(() => {
  if (!userState.value) return 'team';
  return `${userState.value.firstName || ''} ${userState.value.lastName || ''}`.trim();
});

const { data: stats, refresh } = await useFetch('/api/admin/analytics/overview');

const total = computed(() => stats.value?.total || 0);
const newToday = computed(() => stats.value?.newToday || 0);
const pendingCount = computed(() => {
  if (!stats.value?.byStatus) return 0;
  const pending = stats.value.byStatus.find((s: any) => ['new', 'pending', 'in_progress'].includes(s.status));
  return pending ? Number(pending.count) : 0;
});
const closedCount = computed(() => {
  if (!stats.value?.byStatus) return 0;
  const closed = stats.value.byStatus.find((s: any) => s.status === 'closed');
  return closed ? Number(closed.count) : 0;
});

const statCards = computed(() => [
  {
    label: 'Total enquiries',
    value: total.value,
    helper: 'All-time recorded enquiries',
    icon: Inbox,
  },
  {
    label: 'New today',
    value: newToday.value,
    helper: 'Submissions in the last 24h',
    icon: Activity,
  },
  {
    label: 'In progress',
    value: pendingCount.value,
    helper: 'Awaiting action',
    icon: Clock3,
  },
  {
    label: 'Closed',
    value: closedCount.value,
    helper: 'Successfully resolved',
    icon: CheckCircle2,
  },
]);

const statusBreakdown = computed(() => {
  if (!stats.value?.byStatus) return [];
  const badgeMap: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    new: 'default',
    pending: 'outline',
    in_progress: 'secondary',
    contacted: 'outline',
    closed: 'default',
  };
  const labelMap: Record<string, string> = {
    new: 'New',
    pending: 'Pending',
    in_progress: 'In progress',
    contacted: 'Contacted',
    closed: 'Closed',
  };
  const descriptionMap: Record<string, string> = {
    new: 'Just arrived',
    pending: 'Waiting on response',
    in_progress: 'Actively handled',
    contacted: 'Customer contacted',
    closed: 'Completed workflow',
  };
  return stats.value.byStatus.map((item: any) => ({
    status: item.status,
    count: Number(item.count),
    badge: badgeMap[item.status] || 'outline',
    label: labelMap[item.status] || item.status,
    description: descriptionMap[item.status] || 'Status update',
  }));
});

// Refresh stats every 30 seconds
onMounted(() => {
  const interval = setInterval(() => {
    refresh();
  }, 30000);
  
  onUnmounted(() => {
    clearInterval(interval);
  });
});
</script>

