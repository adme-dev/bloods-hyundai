import mitt, { type Emitter } from 'mitt';

/**
 * Event bus composable (replaces Vue 2 EventBus pattern)
 * Used in 7 components in the Vue 2 app
 */

// Define event types for type safety
type Events = {
  'search:open': void;
  'search:close': void;
  'mobile-nav:open': void;
  'mobile-nav:close': void;
  'mobile-nav:toggle': boolean;
  'filter:change': { key: string; value: any };
  'filter:reset': void;
  'vehicle:select': { id: string | number };
  'modal:open': { name: string; data?: any };
  'modal:close': { name: string };
};

// Create singleton emitter
const emitter: Emitter<Events> = mitt<Events>();

export const useEventBus = () => {
  const emit = <K extends keyof Events>(event: K, payload?: Events[K]) => {
    emitter.emit(event, payload as Events[K]);
  };

  const on = <K extends keyof Events>(
    event: K,
    handler: (payload: Events[K]) => void
  ) => {
    emitter.on(event, handler);
  };

  const off = <K extends keyof Events>(
    event: K,
    handler?: (payload: Events[K]) => void
  ) => {
    emitter.off(event, handler);
  };

  // Auto-cleanup on component unmount
  const useEvent = <K extends keyof Events>(
    event: K,
    handler: (payload: Events[K]) => void
  ) => {
    onMounted(() => {
      on(event, handler);
    });

    onUnmounted(() => {
      off(event, handler);
    });
  };

  return {
    emit,
    on,
    off,
    useEvent,
  };
};







