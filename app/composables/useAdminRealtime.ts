import { onMounted, onUnmounted, ref } from 'vue';

type TokenResponse =
  | { enabled: false; reason?: string }
  | {
      enabled: true;
      dealerId: string;
      wsUrl: string;
      timestamp: string;
      token: string;
    };

type RealtimeOptions = {
  onEvent?: (event: any) => void;
};

let sharedSocket: WebSocket | null = null;
let sharedReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let listenerCount = 0;
const sharedListeners = new Set<(event: any) => void>();

export function useAdminRealtime(options: RealtimeOptions = {}) {
  const isConnected = ref(false);
  const isEnabled = ref(false);
  const lastEvent = ref<any>(null);
  const lastError = ref<string | null>(null);

  const handleEvent = (event: any) => {
    lastEvent.value = event;
    options.onEvent?.(event);
  };

  async function connect() {
    if (!import.meta.client) return;
    if (sharedSocket && sharedSocket.readyState <= WebSocket.OPEN) return;

    try {
      const token = await $fetch<TokenResponse>('/api/admin/realtime/token');
      if (!token.enabled) {
        isEnabled.value = false;
        lastError.value = token.reason || 'Realtime disabled';
        return;
      }

      isEnabled.value = true;
      const url = new URL(token.wsUrl);
      url.searchParams.set('dealerId', token.dealerId);
      url.searchParams.set('ts', token.timestamp);
      url.searchParams.set('token', token.token);

      sharedSocket = new WebSocket(url.toString());
      sharedSocket.addEventListener('open', () => {
        isConnected.value = true;
        lastError.value = null;
      });
      sharedSocket.addEventListener('close', () => {
        isConnected.value = false;
        scheduleReconnect();
      });
      sharedSocket.addEventListener('error', () => {
        isConnected.value = false;
        lastError.value = 'Realtime socket error';
      });
      sharedSocket.addEventListener('message', (message) => {
        try {
          const event = JSON.parse(message.data);
          sharedListeners.forEach(listener => listener(event));
          window.dispatchEvent(new CustomEvent('admin:realtime-event', { detail: event }));
        } catch {
          // Ignore non-JSON protocol messages such as pong.
        }
      });
    } catch (error: any) {
      isConnected.value = false;
      lastError.value = error?.data?.message || error?.message || 'Realtime connection failed';
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (!import.meta.client || sharedReconnectTimer || listenerCount === 0) return;
    sharedReconnectTimer = setTimeout(() => {
      sharedReconnectTimer = null;
      connect();
    }, 5000);
  }

  function disconnectIfUnused() {
    if (listenerCount > 0) return;
    if (sharedReconnectTimer) {
      clearTimeout(sharedReconnectTimer);
      sharedReconnectTimer = null;
    }
    if (sharedSocket) {
      sharedSocket.close();
      sharedSocket = null;
    }
  }

  onMounted(() => {
    listenerCount += 1;
    sharedListeners.add(handleEvent);
    connect();
  });

  onUnmounted(() => {
    listenerCount = Math.max(0, listenerCount - 1);
    sharedListeners.delete(handleEvent);
    disconnectIfUnused();
  });

  return {
    isConnected,
    isEnabled,
    lastEvent,
    lastError,
    connect,
  };
}
