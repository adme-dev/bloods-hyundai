<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-muted-foreground">Welcome back, {{ greetingName }}</p>
        <h1 class="text-3xl font-semibold tracking-tight">Dashboard</h1>
      </div>
      <div class="flex flex-wrap items-center gap-3">
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

    <!-- Alert Banner for Urgent Items -->
    <div v-if="alerts && alerts.totalAlerts > 0" class="rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 p-4">
      <div class="flex items-start gap-3">
        <AlertTriangle class="h-5 w-5 text-red-500 mt-0.5" />
        <div class="flex-1">
          <h3 class="font-semibold text-red-800 dark:text-red-200">Action Required</h3>
          <p class="text-sm text-red-700 dark:text-red-300">
            {{ alerts.overdue }} leads awaiting response
            <span v-if="alerts.criticalOverdue > 0" class="font-semibold">
              ({{ alerts.criticalOverdue }} critical - over 48 hours)
            </span>
          </p>
        </div>
        <Button variant="destructive" size="sm" class="bg-red-600 text-white no-underline hover:bg-red-700 hover:text-white" as-child>
          <NuxtLink to="/admin/enquiries?status=new_lead&sort=oldest">
            View Overdue <ArrowRight class="ml-1 h-4 w-4" />
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Today: the actionable numbers -->
    <TodayKpiStrip :data="data" />

    <!-- Action zone: daily work -->
    <ActionZone :data="data" />

    <!-- Analytics tabs -->
    <Tabs :model-value="activeTab" @update:model-value="onTabChange">
      <TabsList class="grid h-auto w-full grid-cols-2 sm:grid-cols-5">
        <TabsTrigger value="sales">Sales &amp; Pipeline</TabsTrigger>
        <TabsTrigger value="marketing">Marketing</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>
      <TabsContent value="sales" class="mt-6">
        <SalesTab v-if="visited.sales" :data="data" />
      </TabsContent>
      <TabsContent value="marketing" class="mt-6">
        <MarketingTab v-if="visited.marketing" :data="data" />
      </TabsContent>
      <TabsContent value="customers" class="mt-6">
        <CustomersTab v-if="visited.customers" :data="data" />
      </TabsContent>
      <TabsContent value="inventory" class="mt-6">
        <InventoryTab v-if="visited.inventory" :data="data" />
      </TabsContent>
      <TabsContent value="team" class="mt-6">
        <TeamTab v-if="visited.team" :data="data" />
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, onUnmounted } from 'vue';
import { RefreshCw, MailPlus, AlertTriangle, ArrowRight } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs';
import TodayKpiStrip from '~/components/admin/dashboard/TodayKpiStrip.vue';
import ActionZone from '~/components/admin/dashboard/ActionZone.vue';
import SalesTab from '~/components/admin/dashboard/SalesTab.vue';
import MarketingTab from '~/components/admin/dashboard/MarketingTab.vue';
import CustomersTab from '~/components/admin/dashboard/CustomersTab.vue';
import InventoryTab from '~/components/admin/dashboard/InventoryTab.vue';
import TeamTab from '~/components/admin/dashboard/TeamTab.vue';

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
});

const userState = useState<any>('auth-user');
const greetingName = computed(() => {
  if (!userState.value) return 'team';
  return `${userState.value.firstName || ''} ${userState.value.lastName || ''}`.trim() || 'team';
});

const { data, pending, refresh } = await useFetch('/api/admin/analytics/dashboard');

const alerts = computed(() => data.value?.followUpAlerts);

// Auto-refresh every 30 seconds
let refreshInterval: ReturnType<typeof setInterval>;
onMounted(() => {
  refreshInterval = setInterval(() => refresh(), 30000);
});
onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});

// Tab state, synced to the URL (?tab=) so views are bookmarkable. Tab content
// renders lazily on first visit.
const TAB_VALUES = ['sales', 'marketing', 'customers', 'inventory', 'team'] as const;
type TabValue = typeof TAB_VALUES[number];

const route = useRoute();
const router = useRouter();

const initialTab: TabValue = TAB_VALUES.includes(route.query.tab as TabValue)
  ? (route.query.tab as TabValue)
  : 'sales';
const activeTab = ref<TabValue>(initialTab);
const visited = reactive<Record<TabValue, boolean>>({
  sales: false, marketing: false, customers: false, inventory: false, team: false,
});
visited[initialTab] = true;

function onTabChange(value: string | number | null) {
  const tab = String(value) as TabValue;
  if (!TAB_VALUES.includes(tab)) return;
  activeTab.value = tab;
  visited[tab] = true;
  router.replace({ query: { ...route.query, tab } });
}
</script>
