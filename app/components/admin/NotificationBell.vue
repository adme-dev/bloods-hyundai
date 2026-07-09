<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        class="relative"
        :aria-label="`Notifications${totalCount > 0 ? `, ${totalCount} unread` : ''}`"
      >
        <Bell class="h-5 w-5" />
        <span
          v-if="totalCount > 0"
          class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse"
        >
          {{ totalCount > 9 ? '9+' : totalCount }}
        </span>
        <span
          v-if="isConnected"
          class="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500"
          title="Real-time updates active"
        />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[22rem] overflow-hidden p-0 shadow-xl">
      <div class="flex items-center justify-between border-b border-slate-200 px-3 py-2">
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

      <div class="max-h-[22rem] overflow-y-auto">
        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center py-8">
          <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
        </div>

        <!-- Empty state -->
        <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-8 text-center">
          <BellOff class="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p class="text-sm text-muted-foreground">No notifications</p>
          <p class="text-xs text-muted-foreground/70 mt-1">You're all caught up!</p>
        </div>

        <!-- Notifications list -->
        <div v-else class="divide-y divide-slate-200">
          <button
            v-for="notification in notifications"
            :key="notification.id"
            type="button"
            class="grid w-full grid-cols-[1.75rem_minmax(0,1fr)_0.5rem] items-center gap-2 border-0 bg-white px-3 py-2 text-left outline-none transition-colors hover:bg-slate-50 focus:bg-slate-50 dark:bg-background dark:hover:bg-muted/50 dark:focus:bg-muted/50"
            :class="{ 'bg-blue-50/60 dark:bg-blue-950/20': !notification.read }"
            @click="handleNotificationClick(notification)"
          >
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              :class="getNotificationIconClass(notification.subType || notification.type)"
            >
              <component :is="getNotificationIcon(notification.subType || notification.type)" class="h-3.5 w-3.5" />
            </div>
            <div class="min-w-0">
              <p class="truncate text-[13px] font-semibold leading-4" :class="{ 'text-foreground': !notification.read, 'text-muted-foreground': notification.read }">
                {{ notification.title }}
              </p>
              <p class="mt-0.5 truncate text-xs leading-4 text-muted-foreground">
                {{ notification.message }}
              </p>
              <p class="mt-0.5 text-[11px] leading-3 text-muted-foreground/70">
                {{ formatRelativeTime(notification.createdAt) }}
              </p>
            </div>
            <div v-if="!notification.read" class="justify-self-end">
              <span class="block h-1.5 w-1.5 rounded-full bg-blue-500" />
            </div>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <DropdownMenuSeparator v-if="notifications.length > 0" class="m-0" />
      <button
        v-if="notifications.length > 0"
        type="button"
        class="flex w-full items-center justify-center gap-1 border-0 bg-white px-3 py-2 text-xs text-muted-foreground outline-none transition-colors hover:bg-slate-50 hover:text-foreground focus:bg-slate-50 focus:text-foreground dark:bg-background dark:hover:bg-muted/50 dark:focus:bg-muted/50"
        @click="viewAllNotifications"
      >
        View all enquiries
        <ArrowRight class="h-3 w-3" />
      </button>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, markRaw, type Component } from 'vue';
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
  contact: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  vehicle: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  finance: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  service: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  parts: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  test_drive: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  assignment: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  snooze_expired: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  system: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function getNotificationIcon(type: string): Component {
  return iconMap[type] ?? iconMap.default ?? Bell;
}

function getNotificationIconClass(type: string): string {
  return iconClassMap[type] ?? iconClassMap.default ?? 'bg-gray-100 text-gray-600';
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
      query: { limit: 20 },
    });

    notifications.value = response.notifications;
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
      notifications.value = [...uniqueNew, ...notifications.value].slice(0, 50);

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
  if (pollTimer) return;

  fetchNotifications();
  pollTimer = setInterval(fetchLatestNotifications, 5000);
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
      pollTimer = setInterval(fetchLatestNotifications, 30000);
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);
}

onMounted(() => {
  if (import.meta.client) {
    startPolling();
    setupVisibilityHandler();
    requestNotificationPermission();
  }
});

onUnmounted(() => {
  stopPolling();
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
  }
});

// Expose for parent components
defineExpose({
  totalCount,
  isConnected,
  refresh: fetchNotifications,
});
</script>
