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
let sharedConnecting = false;
let listenerCount = 0;
const sharedListeners = new Set<(event: any) => void>();
const sharedConnected = ref(false);
const sharedEnabled = ref(false);
const sharedLastEvent = ref<any>(null);
const sharedLastError = ref<string | null>(null);

export function useAdminRealtime(options: RealtimeOptions = {}) {
  const handleEvent = (event: any) => {
    sharedLastEvent.value = event;
    options.onEvent?.(event);
  };

  async function connect() {
    if (!import.meta.client) return;
    if (sharedConnecting || (sharedSocket && sharedSocket.readyState <= WebSocket.OPEN)) return;

    sharedConnecting = true;
    try {
      const token = await $fetch<TokenResponse>('/api/admin/realtime/token');
      if (!token.enabled) {
        sharedEnabled.value = false;
        sharedConnected.value = false;
        sharedLastError.value = token.reason || 'Realtime disabled';
        return;
      }

      sharedEnabled.value = true;
      const url = new URL(token.wsUrl);
      url.searchParams.set('dealerId', token.dealerId);
      url.searchParams.set('ts', token.timestamp);
      url.searchParams.set('token', token.token);

      sharedSocket = new WebSocket(url.toString());
      sharedSocket.addEventListener('open', () => {
        sharedConnected.value = true;
        sharedLastError.value = null;
      });
      sharedSocket.addEventListener('close', () => {
        sharedConnected.value = false;
        scheduleReconnect();
      });
      sharedSocket.addEventListener('error', () => {
        sharedConnected.value = false;
        sharedLastError.value = 'Realtime socket error';
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
      sharedConnected.value = false;
      sharedLastError.value = error?.data?.message || error?.message || 'Realtime connection failed';
      scheduleReconnect();
    } finally {
      sharedConnecting = false;
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
    isConnected: sharedConnected,
    isEnabled: sharedEnabled,
    lastEvent: sharedLastEvent,
    lastError: sharedLastError,
    connect,
  };
}
