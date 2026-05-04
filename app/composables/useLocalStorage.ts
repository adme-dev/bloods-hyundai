/**
 * SSR-safe localStorage composable
 * Handles hydration mismatches by deferring localStorage read until AFTER hydration
 * Properly cleans up event listeners to prevent memory leaks
 *
 * IMPORTANT: Reading from localStorage is deferred to onMounted to prevent
 * hydration mismatches. During SSR and initial client hydration, the default
 * value is used. Only after Vue hydration completes does localStorage get read.
 */
export const useLocalStorage = <T>(
  key: string,
  defaultValue: T
): Ref<T> => {
  const data = ref<T>(defaultValue) as Ref<T>;

  if (import.meta.client) {
    // Track if we've initialized from localStorage
    let isInitialized = false;

    // CRITICAL: Defer localStorage read to onMounted to prevent hydration mismatch
    // During SSR: returns defaultValue
    // During client hydration: still returns defaultValue (matches SSR)
    // After hydration (onMounted): reads from localStorage and updates
    onMounted(() => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          data.value = JSON.parse(stored);
        } catch {
          data.value = defaultValue;
        }
      }
      isInitialized = true;
    });

    // Watch for changes and sync to localStorage
    // Only start syncing AFTER initial load to avoid overwriting stored value
    const stopWatch = watch(
      data,
      (newValue) => {
        // Don't write back until we've read the initial value
        if (!isInitialized) return;

        if (newValue === null || newValue === undefined) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(newValue));
        }
      },
      { deep: true }
    );

    // Listen for changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          data.value = JSON.parse(event.newValue);
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Clean up event listeners on scope disposal
    onScopeDispose(() => {
      stopWatch();
      window.removeEventListener('storage', handleStorageChange);
    });
  }

  return data;
};









