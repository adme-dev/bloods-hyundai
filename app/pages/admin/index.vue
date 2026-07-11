<template>
  <div class="dashboard-shell">
    <!-- Header -->
    <header class="dashboard-page-header">
      <div>
        <p class="dashboard-eyebrow">Bloods Hyundai · Admin</p>
        <h1>Dashboard</h1>
        <p class="dashboard-subtitle">Welcome back, {{ greetingName }}. Your dealership operations at a glance.</p>
      </div>
      <div class="dashboard-header-actions">
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
    </header>

    <!-- Alert Banner for Urgent Items -->
    <div v-if="alerts && alerts.totalAlerts > 0" class="dashboard-alert" role="alert">
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
        <Button variant="destructive" size="sm" as-child>
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
    <Tabs class="dashboard-tabs" :model-value="activeTab" @update:model-value="onTabChange">
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

<style scoped>
.dashboard-shell {
  --dashboard-ground: #eaeef3;
  --dashboard-surface: #fff;
  --dashboard-surface-2: #f5f8fb;
  --dashboard-ink: #0b1a2b;
  --dashboard-ink-2: #39506a;
  --dashboard-muted: #6b7d90;
  --dashboard-line: #dfe6ee;
  --dashboard-brand: #001e50;
  --dashboard-accent: #0091b8;
  --dashboard-crit: #d13b22;
  --dashboard-shadow: 0 1px 2px rgb(11 26 43 / 5%), 0 8px 24px -14px rgb(11 26 43 / 18%);
  display: flex;
  flex-direction: column;
  gap: 26px;
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  color: var(--dashboard-ink);
  font-variant-numeric: tabular-nums;
}

.dashboard-shell::before {
  position: fixed;
  z-index: -1;
  inset: 4rem 0 0;
  background: var(--dashboard-ground);
  content: "";
}

.dashboard-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.dashboard-eyebrow {
  margin: 0 0 7px;
  color: var(--dashboard-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .09em;
  text-transform: uppercase;
}

.dashboard-page-header h1 {
  margin: 0;
  color: var(--dashboard-ink);
  font-size: 29px;
  font-weight: 750;
  letter-spacing: -.01em;
  line-height: 1.15;
}

.dashboard-subtitle {
  margin: 5px 0 0;
  color: var(--dashboard-ink-2);
  font-size: 13px;
}

.dashboard-header-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 9px;
}

.dashboard-alert {
  display: flex;
  border: 1px solid var(--dashboard-line);
  border-left: 3px solid var(--dashboard-crit);
  border-radius: 14px;
  padding: 15px 17px;
  background: var(--dashboard-surface);
  box-shadow: var(--dashboard-shadow);
}

.dashboard-alert > div {
  width: 100%;
}

.dashboard-alert :deep(.ui-button) {
  margin-left: auto;
}

.dashboard-tabs :deep([role="tablist"]) {
  height: auto;
  gap: 3px;
  border: 1px solid var(--dashboard-line);
  border-radius: 10px;
  padding: 4px;
  background: var(--dashboard-surface-2);
}

.dashboard-tabs :deep([role="tab"]) {
  min-height: 36px;
  border-radius: 7px;
  color: var(--dashboard-muted);
  font-size: 12px;
  font-weight: 650;
}

.dashboard-tabs :deep([role="tab"][data-state="active"]) {
  background: var(--dashboard-brand);
  color: #fff;
  box-shadow: 0 1px 3px rgb(11 26 43 / 14%);
}

.dashboard-shell :deep(.rounded-xl.border) {
  min-width: 0;
  max-width: 100%;
  border-color: var(--dashboard-line);
  border-radius: 14px;
  background: var(--dashboard-surface);
  box-shadow: var(--dashboard-shadow);
}

.dashboard-shell :deep(.text-muted-foreground) {
  color: var(--dashboard-muted);
}

.dashboard-shell :deep(h2),
.dashboard-shell :deep(h3) {
  color: var(--dashboard-ink);
  letter-spacing: -.01em;
}

@media (prefers-color-scheme: dark) {
  .dashboard-shell {
    --dashboard-ground: #080f18;
    --dashboard-surface: #101b28;
    --dashboard-surface-2: #152232;
    --dashboard-ink: #e7eef6;
    --dashboard-ink-2: #aebdce;
    --dashboard-muted: #7c8ea0;
    --dashboard-line: #213042;
    --dashboard-brand: #4d88cc;
    --dashboard-accent: #37c4e6;
    --dashboard-crit: #f4674c;
    --dashboard-shadow: 0 1px 2px rgb(0 0 0 / 22%), 0 8px 24px -14px rgb(0 0 0 / 65%);
  }
}

:global(.dark) .dashboard-shell {
  --dashboard-ground: #080f18;
  --dashboard-surface: #101b28;
  --dashboard-surface-2: #152232;
  --dashboard-ink: #e7eef6;
  --dashboard-ink-2: #aebdce;
  --dashboard-muted: #7c8ea0;
  --dashboard-line: #213042;
  --dashboard-brand: #4d88cc;
  --dashboard-accent: #37c4e6;
  --dashboard-crit: #f4674c;
}

@media (max-width: 700px) {
  .dashboard-page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .dashboard-header-actions {
    justify-content: flex-start;
    width: 100%;
  }

  .dashboard-alert > div {
    flex-wrap: wrap;
  }

  .dashboard-alert :deep(.ui-button) {
    margin-left: 2rem;
  }
}
</style>
