import { ref, onMounted, onUnmounted, watch } from 'vue';
import type { DealerRealtimeEvent } from '~~/shared/realtime/events';

interface Enquiry {
  id: string;
  type: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface RealtimeOptions {
  pollInterval?: number; // milliseconds
  onNewEnquiry?: (enquiry: Enquiry) => void;
  onUpdatedEnquiry?: (enquiry: Enquiry) => void;
  enabled?: boolean;
}

/**
 * Composable for real-time enquiry updates
 * Uses polling with smart intervals for near real-time updates
 */
export function useRealtimeEnquiries(options: RealtimeOptions = {}) {
  const {
    pollInterval = 30000,
    onNewEnquiry,
    onUpdatedEnquiry,
    enabled = true,
  } = options;

  const lastCheck = ref<string>(new Date().toISOString());
  const newEnquiries = ref<Enquiry[]>([]);
  const updatedEnquiries = ref<Enquiry[]>([]);
  const isConnected = ref(false);
  const newCount = ref(0);
  
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let visibilityHandler: (() => void) | null = null;

  const realtime = useAdminRealtime({
    onEvent: (event: DealerRealtimeEvent) => {
      if (!event.invalidate?.includes('enquiries')) return;
      if (event.type === 'enquiry.created') onNewEnquiry?.(event as unknown as Enquiry);
      else onUpdatedEnquiry?.(event as unknown as Enquiry);
    },
  });

  const fetchLatest = async () => {
    if (!enabled) return;
    
    try {
      const response = await $fetch<{
        new: Enquiry[];
        updated: Enquiry[];
        timestamp: string;
      }>('/api/admin/enquiries/latest', {
        query: { since: lastCheck.value },
      });

      // Process new enquiries
      if (response.new.length > 0) {
        newEnquiries.value = response.new;
        newCount.value += response.new.length;
        
        // Call callback for each new enquiry
        response.new.forEach(enquiry => {
          onNewEnquiry?.(enquiry);
          
          // Show browser notification if permitted
          showNotification(enquiry);
        });
      }

      // Process updated enquiries
      if (response.updated.length > 0) {
        updatedEnquiries.value = response.updated;
        response.updated.forEach(enquiry => {
          onUpdatedEnquiry?.(enquiry);
        });
      }

      lastCheck.value = response.timestamp;
      isConnected.value = true;
    } catch (error) {
      console.error('Failed to fetch latest enquiries:', error);
      isConnected.value = false;
    }
  };

  const showNotification = (enquiry: Enquiry) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return; // Don't notify if tab is active

    const typeLabels: Record<string, string> = {
      contact: 'Contact',
      vehicle: 'Vehicle',
      finance: 'Finance',
      service: 'Service',
      test_drive: 'Test Drive',
      parts: 'Parts',
    };

    new Notification(`New ${typeLabels[enquiry.type] || 'Enquiry'}`, {
      body: `${enquiry.firstName} ${enquiry.lastName} - ${enquiry.email}`,
      icon: '/favicon.ico',
      tag: enquiry.id,
    });
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const startPolling = () => {
    if (pollTimer || realtime.isConnected.value) return;
    
    // Initial fetch
    fetchLatest();
    
    // Set up polling interval
    pollTimer = setInterval(fetchLatest, pollInterval);
  };

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const clearNewCount = () => {
    newCount.value = 0;
  };

  // Handle visibility changes - pause polling when tab is hidden
  const setupVisibilityHandler = () => {
    visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        // Reconcile after returning to the tab, then use the socket or fallback poll.
        fetchLatest();
        startPolling();
      } else {
        // Tab hidden - reduce polling frequency
        stopPolling();
        if (!realtime.isConnected.value) {
          pollTimer = setInterval(fetchLatest, 60000);
        }
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
  };

  onMounted(() => {
    if (enabled && process.client) {
      fetchLatest();
      if (!realtime.isConnected.value) startPolling();
      setupVisibilityHandler();
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
  });

  return {
    newEnquiries,
    updatedEnquiries,
    newCount,
    isConnected: realtime.isConnected,
    clearNewCount,
    refresh: fetchLatest,
    requestNotificationPermission,
  };
}








