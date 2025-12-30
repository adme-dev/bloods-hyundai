import { ref, onMounted, onUnmounted } from 'vue';

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
    pollInterval = 5000, // Poll every 5 seconds
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
    if (pollTimer) return;
    
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
        // Tab became visible - fetch immediately and resume polling
        fetchLatest();
        startPolling();
      } else {
        // Tab hidden - reduce polling frequency
        stopPolling();
        // Poll less frequently when hidden
        pollTimer = setInterval(fetchLatest, 30000); // Every 30 seconds when hidden
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
  };

  onMounted(() => {
    if (enabled && process.client) {
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

  return {
    newEnquiries,
    updatedEnquiries,
    newCount,
    isConnected,
    clearNewCount,
    refresh: fetchLatest,
    requestNotificationPermission,
  };
}










