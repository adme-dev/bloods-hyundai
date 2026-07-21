<template>
  <div class="mx-auto flex w-full max-w-[1200px] flex-col gap-[26px] text-foreground tabular-nums">
    <!-- Header -->
    <AdminPageHeader
      title="Dashboard"
      :description="`Welcome back, ${greetingName}. Your dealership operations at a glance.`"
    >
      <template #actions>
        <Button variant="outline" size="sm" @click="refresh">
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': pending }" />
          Refresh
        </Button>
        <Button as-child>
          <NuxtLink to="/admin/enquiries">
            <MailPlus class="mr-2 h-4 w-4" /> View enquiries
          </NuxtLink>
        </Button>
      </template>
    </AdminPageHeader>

    <!-- Alert Banner for Urgent Items -->
    <Alert v-if="alerts && alerts.totalAlerts > 0" variant="destructive" class="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 border-l-[3px] p-3.5 shadow-sm min-[701px]:grid-cols-[auto_minmax(0,1fr)_auto] min-[701px]:items-center min-[701px]:p-4">
        <div class="grid size-8 place-items-center rounded-lg bg-destructive/10 min-[701px]:size-[34px]" aria-hidden="true">
          <AlertTriangle class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <AlertTitle class="text-sm">Action Required</AlertTitle>
          <AlertDescription class="text-[12.5px] leading-[1.45] min-[701px]:text-sm">
            {{ alerts.overdue }} leads awaiting response
            <span v-if="alerts.criticalOverdue > 0" class="font-semibold">
              ({{ alerts.criticalOverdue }} critical - over 48 hours)
            </span>
          </AlertDescription>
        </div>
        <Button variant="destructive" size="sm" class="col-span-2 min-h-10 w-full whitespace-nowrap min-[701px]:col-span-1 min-[701px]:ml-auto min-[701px]:min-h-9 min-[701px]:w-auto" as-child>
          <NuxtLink to="/admin/enquiries?status=new_lead&sort=oldest">
            View Overdue <ArrowRight class="ml-1 h-4 w-4" />
          </NuxtLink>
        </Button>
    </Alert>

    <!-- Today: the actionable numbers -->
    <section class="flex min-w-0 flex-col gap-[13px]" aria-labelledby="today-title">
      <div class="flex flex-col items-start gap-[5px] border-b pb-2.5 min-[701px]:flex-row min-[701px]:items-end min-[701px]:justify-between min-[701px]:gap-[18px]">
        <div>
          <p class="mb-[3px] text-[10.5px] font-bold uppercase tracking-[.08em] text-primary">Live operations</p>
          <h2 id="today-title" class="text-[15px] font-bold tracking-[-.01em]">Today’s workload</h2>
        </div>
        <p class="max-w-lg text-left text-xs text-muted-foreground min-[701px]:text-right">Current queues and follow-up pressure across the dealership.</p>
      </div>
      <TodayKpiStrip :data="data" />
    </section>

    <!-- Action zone: daily work -->
    <section class="flex min-w-0 flex-col gap-[13px]" aria-labelledby="priority-title">
      <div class="flex flex-col items-start gap-[5px] border-b pb-2.5 min-[701px]:flex-row min-[701px]:items-end min-[701px]:justify-between min-[701px]:gap-[18px]">
        <div>
          <p class="mb-[3px] text-[10.5px] font-bold uppercase tracking-[.08em] text-primary">CRM workspace</p>
          <h2 id="priority-title" class="text-[15px] font-bold tracking-[-.01em]">Priority queue</h2>
        </div>
        <p class="max-w-lg text-left text-xs text-muted-foreground min-[701px]:text-right">Leads, overdue responses, and the next actions your team should take.</p>
      </div>
      <ActionZone :data="data" />
    </section>

    <!-- Analytics tabs -->
    <section class="flex min-w-0 flex-col gap-[13px]" aria-labelledby="performance-title">
      <div class="flex flex-col items-start gap-[5px] border-b pb-2.5 min-[701px]:flex-row min-[701px]:items-end min-[701px]:justify-between min-[701px]:gap-[18px]">
        <div>
          <p class="mb-[3px] text-[10.5px] font-bold uppercase tracking-[.08em] text-primary">Reporting</p>
          <h2 id="performance-title" class="text-[15px] font-bold tracking-[-.01em]">Performance workspace</h2>
        </div>
        <p class="max-w-lg text-left text-xs text-muted-foreground min-[701px]:text-right">Switch between pipeline, customer, inventory, marketing, and team views.</p>
      </div>
    <Tabs :model-value="activeTab" @update:model-value="onTabChange">
      <TabsList class="flex h-auto w-full max-w-full justify-start gap-[3px] overflow-x-auto rounded-[10px] border p-1 [scrollbar-width:none] min-[701px]:grid min-[701px]:grid-cols-5 [&::-webkit-scrollbar]:hidden">
        <TabsTrigger class="min-h-10 min-w-max flex-none rounded-[7px] px-4 text-xs font-semibold min-[701px]:min-h-9 min-[701px]:min-w-0" value="sales">Sales &amp; Pipeline</TabsTrigger>
        <TabsTrigger class="min-h-10 min-w-max flex-none rounded-[7px] px-4 text-xs font-semibold min-[701px]:min-h-9 min-[701px]:min-w-0" value="marketing">Marketing</TabsTrigger>
        <TabsTrigger class="min-h-10 min-w-max flex-none rounded-[7px] px-4 text-xs font-semibold min-[701px]:min-h-9 min-[701px]:min-w-0" value="customers">Customers</TabsTrigger>
        <TabsTrigger class="min-h-10 min-w-max flex-none rounded-[7px] px-4 text-xs font-semibold min-[701px]:min-h-9 min-[701px]:min-w-0" value="inventory">Inventory</TabsTrigger>
        <TabsTrigger class="min-h-10 min-w-max flex-none rounded-[7px] px-4 text-xs font-semibold min-[701px]:min-h-9 min-[701px]:min-w-0" value="team">Team</TabsTrigger>
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
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, onUnmounted } from 'vue';
import { RefreshCw, MailPlus, AlertTriangle, ArrowRight } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
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

// Auto-refresh active dashboards without waking hidden browser tabs.
let refreshInterval: ReturnType<typeof setInterval>;
let realtimeRefreshTimer: ReturnType<typeof setTimeout> | null = null;
let realtimeHandler: ((event: Event) => void) | null = null;
onMounted(() => {
  refreshInterval = setInterval(() => {
    if (document.visibilityState === 'visible') refresh();
  }, 60000);
  realtimeHandler = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (!detail?.invalidate?.includes?.('dashboard')) return;
    if (realtimeRefreshTimer) return;
    realtimeRefreshTimer = setTimeout(() => {
      realtimeRefreshTimer = null;
      if (document.visibilityState === 'visible') refresh();
    }, 1000);
  };
  window.addEventListener('admin:realtime-event', realtimeHandler);
});
onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
  if (realtimeRefreshTimer) clearTimeout(realtimeRefreshTimer);
  if (realtimeHandler) window.removeEventListener('admin:realtime-event', realtimeHandler);
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
