<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        class="relative h-10 w-10 text-foreground hover:text-foreground data-[state=open]:text-primary [&_svg]:size-[18px]"
        :aria-label="`Notifications${totalCount > 0 ? `, ${totalCount} unread` : ''}`"
        title="Notifications"
      >
        <Bell class="h-5 w-5" />
        <span
          v-if="totalCount > 0"
          class="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm"
        >
          {{ totalCount > 9 ? '9+' : totalCount }}
        </span>
        <span
          v-if="isConnected"
          class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500"
          title="Real-time updates active"
        />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      :side-offset="8"
      :collision-padding="8"
      class="w-[min(24rem,calc(100vw-1rem))] overflow-hidden p-0 shadow-xl"
    >
      <div class="flex items-center justify-between border-b border-border px-3 py-2">
        <DropdownMenuLabel class="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
        <Button
          v-if="totalCount > 0"
          variant="ghost"
          size="sm"
          class="h-7 px-2 text-xs"
          @click.stop="markAllAsRead"
        >
          Mark all read
        </Button>
      </div>

      <div class="max-h-[23rem] overflow-y-auto">
        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center py-8">
          <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
        </div>

        <!-- Empty state -->
        <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-8 text-center">
          <BellOff class="h-10 w-10 text-muted-foreground/50 mb-2" />
          <div class="text-sm text-muted-foreground">No notifications</div>
          <div class="mt-1 text-xs text-muted-foreground/70">You're all caught up!</div>
        </div>

        <!-- Notifications list -->
        <div v-else class="space-y-1.5 bg-muted/40 p-2">
          <button
            v-for="notification in notifications"
            :key="notification.id"
            type="button"
            class="grid min-h-0 w-full grid-cols-[2rem_minmax(0,1fr)] items-start gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2 text-left shadow-sm outline-none transition-colors hover:border-primary/30 hover:bg-muted/50 focus:border-primary/40 focus:bg-muted/50 focus:ring-2 focus:ring-ring/20"
            :class="{ 'border-primary/25 bg-primary/10': !notification.read }"
            @click="handleNotificationClick(notification)"
          >
            <div
              class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              :class="getNotificationIconClass(notification.subType || notification.type)"
            >
              <component :is="getNotificationIcon(notification.subType || notification.type)" class="h-3.5 w-3.5" />
            </div>
            <div class="min-w-0 space-y-1">
              <div class="flex min-w-0 items-start justify-between gap-2">
                <span class="truncate text-[13px] font-semibold leading-4" :class="{ 'text-foreground': !notification.read, 'text-muted-foreground': notification.read }">
                  {{ notification.title }}
                </span>
                <span v-if="!notification.read" class="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              </div>
              <div class="truncate text-xs leading-4 text-muted-foreground">
                {{ notification.message }}
              </div>
              <div class="text-[11px] leading-3 text-muted-foreground/70">
                {{ formatRelativeTime(notification.createdAt) }}
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <DropdownMenuSeparator v-if="notifications.length > 0" class="m-0" />
      <button
        v-if="notifications.length > 0"
        type="button"
        class="flex w-full items-center justify-center gap-1 border-0 bg-background px-3 py-2 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted/50 hover:text-foreground focus:bg-muted/50 focus:text-foreground"
        @click="viewAllNotifications"
      >
        View all enquiries
        <ArrowRight class="h-3 w-3" />
      </button>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, markRaw, watch, type Component } from 'vue';
import {
  Bell,
  BellOff,
  Loader2,
  ArrowRight,
  MessageSquare,
  Car,
  Calculator,
  Wrench,
  Package,
  UserPlus,
  Clock,
  AlertCircle
} from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

interface Notification {
  id: string;
  type: 'enquiry' | 'assignment' | 'snooze_expired' | 'system';
  subType?: string; // contact, vehicle, finance, service, parts, test_drive
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: Record<string, any>;
}

const loading = ref(false);
const notifications = ref<Notification[]>([]);
const isConnected = ref(false);
const lastSeenAt = ref<string | null>(null);

let pollTimer: ReturnType<typeof setInterval> | null = null;
let visibilityHandler: (() => void) | null = null;
let realtimeHandler: ((event: Event) => void) | null = null;
const realtime = useAdminRealtime();

const totalCount = computed(() =>
  notifications.value.filter(n => !n.read).length
);

const iconMap: Record<string, Component> = {
  contact: markRaw(MessageSquare),
  vehicle: markRaw(Car),
  finance: markRaw(Calculator),
  service: markRaw(Wrench),
  parts: markRaw(Package),
  test_drive: markRaw(Car),
  assignment: markRaw(UserPlus),
  snooze_expired: markRaw(Clock),
  system: markRaw(AlertCircle),
  default: markRaw(Bell),
};

const iconClassMap: Record<string, string> = {
  contact: 'bg-primary/10 text-primary',
  vehicle: 'bg-primary/10 text-primary',
  finance: 'bg-primary/10 text-primary',
  service: 'bg-primary/10 text-primary',
  parts: 'bg-primary/10 text-primary',
  test_drive: 'bg-primary/10 text-primary',
  assignment: 'bg-primary/10 text-primary',
  snooze_expired: 'bg-destructive/10 text-destructive',
  system: 'bg-muted text-muted-foreground',
  default: 'bg-muted text-muted-foreground',
};

function getNotificationIcon(type: string): Component {
  return iconMap[type] ?? iconMap.default ?? Bell;
}

function getNotificationIconClass(type: string): string {
  return iconClassMap[type] ?? iconClassMap.default ?? 'bg-muted text-muted-foreground';
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

async function fetchNotifications() {
  try {
    loading.value = true;
    const response = await $fetch<{
      notifications: Notification[];
      lastSeenAt: string | null;
    }>('/api/admin/notifications', {
      query: { limit: 50 },
    });

    notifications.value = sortNotifications(response.notifications);
    lastSeenAt.value = response.lastSeenAt;
    isConnected.value = true;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    isConnected.value = false;
  } finally {
    loading.value = false;
  }
}

async function fetchLatestNotifications() {
  if (!lastSeenAt.value) {
    await fetchNotifications();
    return;
  }

  try {
    const response = await $fetch<{
      new: any[];
      updated: any[];
      timestamp: string;
    }>('/api/admin/enquiries/latest', {
      query: { since: lastSeenAt.value },
    });

    // Convert new enquiries to notifications
    if (response.new.length > 0) {
      const newNotifications: Notification[] = response.new.map(enquiry => ({
        id: enquiry.id,
        type: 'enquiry',
        subType: enquiry.type,
        title: getEnquiryTitle(enquiry.type),
        message: `${enquiry.firstName} ${enquiry.lastName} - ${enquiry.email}`,
        read: false,
        createdAt: enquiry.createdAt,
        link: `/admin/enquiries/${enquiry.id}`,
        metadata: { enquiryId: enquiry.id },
      }));

      // Prepend new notifications and dedupe
      const existingIds = new Set(notifications.value.map(n => n.id));
      const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
      notifications.value = sortNotifications([...uniqueNew, ...notifications.value]).slice(0, 50);

      // Show browser notification if tab is hidden
      if (document.visibilityState !== 'visible') {
        uniqueNew.forEach(showBrowserNotification);
      }
    }

    isConnected.value = true;
  } catch (error) {
    console.error('Failed to fetch latest notifications:', error);
    isConnected.value = false;
  }
}

function getEnquiryTitle(type: string): string {
  const titles: Record<string, string> = {
    contact: 'New contact enquiry',
    vehicle: 'New vehicle enquiry',
    finance: 'New finance enquiry',
    service: 'New service booking',
    parts: 'New parts enquiry',
    test_drive: 'New test drive request',
  };
  return titles[type] || 'New enquiry';
}

function showBrowserNotification(notification: Notification) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  new Notification(notification.title, {
    body: notification.message,
    icon: '/favicon.ico',
    tag: notification.id,
  });
}

function handleRealtimeEvent(event: Event) {
  const detail = (event as CustomEvent).detail;
  if (!detail || detail.type !== 'enquiry.created' || detail.entity?.type !== 'enquiry') return;

  const notification: Notification = {
    id: detail.entity.id,
    type: 'enquiry',
    subType: detail.summary?.enquiryType,
    title: detail.summary?.title || getEnquiryTitle(detail.summary?.enquiryType || 'contact'),
    message: detail.summary?.message || 'New enquiry received',
    read: false,
    createdAt: detail.occurredAt || new Date().toISOString(),
    link: `/admin/enquiries/${detail.entity.id}`,
    metadata: { enquiryId: detail.entity.id },
  };

  notifications.value = sortNotifications([
    notification,
    ...notifications.value.filter(existing => existing.id !== notification.id && existing.metadata?.enquiryId !== notification.id),
  ]).slice(0, 50);

  isConnected.value = true;
  if (document.visibilityState !== 'visible') {
    showBrowserNotification(notification);
  }
}

async function markAllAsRead() {
  try {
    await $fetch('/api/admin/notifications/read', {
      method: 'POST',
      body: { all: true },
    });
    notifications.value = notifications.value.map(n => ({ ...n, read: true }));
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
  }
}

async function markAsRead(notificationId: string) {
  try {
    await $fetch('/api/admin/notifications/read', {
      method: 'POST',
      body: { ids: [notificationId] },
    });
    const notification = notifications.value.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
}

function handleNotificationClick(notification: Notification) {
  if (!notification.read) {
    markAsRead(notification.id);
  }

  if (notification.link) {
    navigateTo(notification.link);
  } else if (notification.metadata?.enquiryId) {
    navigateTo(`/admin/enquiries/${notification.metadata.enquiryId}`);
  }
}

function sortNotifications(items: Notification[]) {
  return [...items].sort((a, b) => {
    const bTime = new Date(b.createdAt).getTime();
    const aTime = new Date(a.createdAt).getTime();
    return bTime - aTime;
  });
}

function viewAllNotifications() {
  navigateTo('/admin/enquiries');
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

function startPolling() {
  if (pollTimer || realtime.isConnected.value) return;

  pollTimer = setInterval(fetchLatestNotifications, 30000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function setupVisibilityHandler() {
  visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      fetchLatestNotifications();
      startPolling();
    } else {
      stopPolling();
      if (!realtime.isConnected.value) {
        pollTimer = setInterval(fetchLatestNotifications, 60000);
      }
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);
}

onMounted(() => {
  if (import.meta.client) {
    fetchNotifications();
    if (!realtime.isConnected.value) startPolling();
    setupVisibilityHandler();
    realtimeHandler = handleRealtimeEvent;
    window.addEventListener('admin:realtime-event', realtimeHandler);
    requestNotificationPermission();
  }
});

const stopConnectionWatch = watch(realtime.isConnected, (connected) => {
  isConnected.value = connected;
  if (connected) stopPolling();
  else if (document.visibilityState === 'visible') startPolling();
});

onUnmounted(() => {
  stopPolling();
  stopConnectionWatch();
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
  }
  if (realtimeHandler) {
    window.removeEventListener('admin:realtime-event', realtimeHandler);
  }
});

// Expose for parent components
defineExpose({
  totalCount,
  isConnected,
  refresh: fetchNotifications,
});
</script>
