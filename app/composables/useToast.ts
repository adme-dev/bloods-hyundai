import { ref } from 'vue';

export interface Toast {
  id: string;
  title?: string;
  description: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

const toasts = ref<Toast[]>([]);

export const useToast = () => {
  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      type: 'info',
      duration: 3000,
      ...toast,
    };

    toasts.value.push(newToast);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const toast = {
    success: (description: string, title?: string) =>
      addToast({ description, title, type: 'success' }),
    error: (description: string, title?: string) =>
      addToast({ description, title, type: 'error' }),
    warning: (description: string, title?: string) =>
      addToast({ description, title, type: 'warning' }),
    info: (description: string, title?: string) =>
      addToast({ description, title, type: 'info' }),
  };

  return {
    toasts,
    toast,
    addToast,
    removeToast,
  };
};






