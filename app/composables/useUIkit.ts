/**
 * UIkit composable for accessing UIkit instance
 * Works with @fedorae/nuxt-uikit module
 */
export const useUIkit = () => {
  const nuxtApp = useNuxtApp();

  // UIkit is only available on client side
  // The @fedorae/nuxt-uikit module provides UIkit via nuxtApp.$uikit
  const uikit = computed(() => {
    if (import.meta.client) {
      return (nuxtApp.$uikit as any) || (typeof window !== 'undefined' ? (window as any).UIkit : null);
    }
    return null;
  });

  // Helper methods for common UIkit operations
  const modal = (selector: string | Element) => {
    return uikit.value?.modal(selector);
  };

  const notification = (options: {
    message: string;
    status?: 'primary' | 'success' | 'warning' | 'danger';
    pos?: string;
    timeout?: number;
  }) => {
    return uikit.value?.notification(options);
  };

  const drop = (selector: string | Element) => {
    return uikit.value?.drop(selector);
  };

  const dropdown = (selector: string | Element) => {
    return uikit.value?.dropdown(selector);
  };

  const offcanvas = (selector: string | Element) => {
    return uikit.value?.offcanvas(selector);
  };

  const slider = (selector: string | Element) => {
    return uikit.value?.slider(selector);
  };

  const slideshow = (selector: string | Element) => {
    return uikit.value?.slideshow(selector);
  };

  return {
    uikit,
    modal,
    notification,
    drop,
    dropdown,
    offcanvas,
    slider,
    slideshow,
  };
};








