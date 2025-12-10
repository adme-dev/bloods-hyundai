/**
 * SSR-safe localStorage composable
 * Handles hydration mismatches and provides reactive localStorage
 */
export const useLocalStorage = <T>(
  key: string,
  defaultValue: T
): Ref<T> => {
  const data = ref<T>(defaultValue) as Ref<T>;

  if (process.client) {
    // Load from localStorage on client
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        data.value = JSON.parse(stored);
      } catch {
        data.value = defaultValue;
      }
    }

    // Watch for changes and sync to localStorage
    watch(
      data,
      (newValue) => {
        if (newValue === null || newValue === undefined) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(newValue));
        }
      },
      { deep: true }
    );

    // Listen for changes from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === key && event.newValue) {
        try {
          data.value = JSON.parse(event.newValue);
        } catch {
          // Ignore parse errors
        }
      }
    });
  }

  return data;
};





