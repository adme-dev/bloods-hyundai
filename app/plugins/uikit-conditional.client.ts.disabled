/**
 * Conditional UIkit Plugin
 * 
 * Loads UIkit CSS and JS only on vehicle-related pages.
 * For other pages, only UnoCSS/Tailwind utilities are available.
 */

export default defineNuxtPlugin(() => {
  if (!process.client) return;

  const route = useRoute();

  // Define which routes need UIkit (vehicle-related pages)
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
  const needsUIkit = vehicleRoutes.some(routePath => route.path.startsWith(routePath));

  if (!needsUIkit) {
    return; // Don't load UIkit on non-vehicle pages
  }

  // Load UIkit CSS dynamically
  const loadUIkitCSS = () => {
    if (document.querySelector('link[href*="uikit"]')) {
      return; // Already loaded
    }

    // Load UIkit CSS via link tag
    // Note: In production, you could optimize this by copying UIkit CSS to public folder
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/uikit@3.25.1/dist/css/uikit.min.css';
    document.head.appendChild(link);
  };

  // Load UIkit JS dynamically
  const loadUIkitJS = (): Promise<any> => {
    return new Promise((resolve) => {
      if ((window as any).UIkit) {
        resolve((window as any).UIkit);
        return;
      }

      // Load UIkit JS from CDN
      // Note: In production, you could optimize this by bundling UIkit JS
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/uikit@3.25.1/dist/js/uikit.min.js';
      script.onload = () => {
        resolve((window as any).UIkit);
      };
      script.onerror = () => {
        console.error('Failed to load UIkit');
        resolve(null);
      };
      document.head.appendChild(script);
    });
  };

  // Load UIkit immediately
  loadUIkitCSS();
  loadUIkitJS();

  // Watch for route changes and load/unload UIkit
  watch(() => route.path, (newPath) => {
    const needs = vehicleRoutes.some(routePath => newPath.startsWith(routePath));
    
    if (needs) {
      loadUIkitCSS();
      loadUIkitJS();
    } else {
      // Optionally remove UIkit CSS when leaving vehicle pages
      // (keeping JS loaded is fine, it won't interfere)
      const uikitLink = document.querySelector('link[href*="uikit"]');
      if (uikitLink) {
        // Keep CSS loaded for smoother transitions
        // uikitLink.remove();
      }
    }
  });
});

