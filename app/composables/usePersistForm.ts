import { pick } from 'lodash-es';

/**
 * Composable for persisting form data to localStorage (replaces persistorMixin)
 * Used in 3 components in the Vue 2 app
 */
export const usePersistForm = <T extends Record<string, any>>(
  fields: (keyof T)[],
  storageKey: string = 'persistedForm'
) => {
  const formData = reactive<Partial<T>>({});

  // Only run on client side
  if (process.client) {
    // Load saved data on init
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        Object.assign(formData, pick(parsed, fields as string[]));
      } catch (e) {
        console.warn('Failed to parse persisted form data:', e);
      }
    }

    // Watch for changes and persist
    watch(
      () => formData,
      (newValue) => {
        const filtered = pick(newValue, fields as string[]);
        localStorage.setItem(storageKey, JSON.stringify(filtered));
      },
      { deep: true }
    );
  }

  // Clear persisted data
  const clearPersistedData = () => {
    if (process.client) {
      localStorage.removeItem(storageKey);
      fields.forEach((field) => {
        (formData as any)[field] = '';
      });
    }
  };

  return {
    formData,
    clearPersistedData,
  };
};





