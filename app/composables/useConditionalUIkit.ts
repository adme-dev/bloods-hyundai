/**
 * Conditional UIkit Loading Composable
 * 
 * Loads UIkit CSS and JS only on pages that need it (vehicle pages).
 * For other pages, only UnoCSS/Tailwind utilities are available.
 */

export const useConditionalUIkit = () => {
  const route = useRoute();
  
  // Define which routes need UIkit
  const vehicleRoutes = [
    '/vehicle/',
    '/vehicle-for-sale/',
    '/variant/',
    '/car-sales',
    '/cars-for-sale',
    '/calculator/',
    '/vehicle-enquire/',
    '/build-and-price',
    '/build/',
    '/compare-vehicles-for-sale',
    '/test-drive',
  ];

  // Check if current route needs UIkit
  const needsUIkit = computed(() => {
    return vehicleRoutes.some(routePath => route.path.startsWith(routePath));
  });

  // Load UIkit CSS and JS dynamically
  const loadUIkit = async () => {
    if (!process.client) return;
    
    // Check if UIkit is already loaded
    if ((window as any).UIkit) {
      return (window as any).UIkit;
    }

    // Load UIkit CSS
    if (!document.querySelector('link[href*="uikit"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/uikit@3.25.1/dist/css/uikit.min.css';
      document.head.appendChild(link);
    }

    // Load UIkit JS
    return new Promise((resolve) => {
      if ((window as any).UIkit) {
        resolve((window as any).UIkit);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/uikit@3.25.1/dist/js/uikit.min.js';
      script.onload = () => {
        resolve((window as any).UIkit);
      };
      document.head.appendChild(script);
    });
  };

  // Auto-load UIkit if route needs it
  watch(needsUIkit, (needs) => {
    if (needs && process.client) {
      loadUIkit();
    }
  }, { immediate: true });

  return {
    needsUIkit,
    loadUIkit,
    uikit: computed(() => process.client ? (window as any).UIkit : null),
  };
};









