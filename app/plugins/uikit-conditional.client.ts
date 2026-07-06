/**
 * Conditional UIkit Plugin
 * 
 * UIkit CSS is bundled globally for existing uk-* classes. The JS/runtime and
 * icon bundle are delayed so non-vehicle routes do not pay for them up front.
 */
import { runWhenIdleOrInteraction } from '~/utils/deferThirdParty';

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return;

  const route = useRoute();
  const router = useRouter();
  let loadPromise: Promise<any> | null = null;

  // Define which routes need UIkit (vehicle-related pages)
  const uikitRoutes = [
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

  const needsUIkit = (path: string) => uikitRoutes.some(routePath => path.startsWith(routePath));

  const loadScript = (src: string, runtimeName: string): Promise<void> => {
    return new Promise((resolve) => {
      if (document.querySelector(`script[data-uikit-runtime="${runtimeName}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.uikitRuntime = runtimeName;
      script.onload = () => resolve();
      script.onerror = () => {
        console.error(`Failed to load ${src}`);
        resolve();
      };
      document.head.appendChild(script);
    });
  };

  const loadUIkitJS = () => {
    if ((window as any).UIkit?.icon) {
      return Promise.resolve((window as any).UIkit);
    }

    if (!loadPromise) {
      loadPromise = loadScript(
        'https://cdn.jsdelivr.net/npm/uikit@3.25.1/dist/js/uikit.min.js',
        'uikit-core'
      )
        .then(() => loadScript(
          'https://cdn.jsdelivr.net/npm/uikit@3.25.1/dist/js/uikit-icons.min.js',
          'uikit-icons'
        ))
        .then(() => (window as any).UIkit || null);
    }

    return loadPromise;
  };

  const scheduleUIkit = (path: string) => {
    if (needsUIkit(path)) {
      runWhenIdleOrInteraction(loadUIkitJS, { delay: 5000 });
      return;
    }

    runWhenIdleOrInteraction(loadUIkitJS, { delay: 60000 });
  };

  nuxtApp.hook('app:mounted', () => {
    scheduleUIkit(route.path);
  });

  router.afterEach((to) => {
    if (needsUIkit(to.path)) {
      loadUIkitJS();
    }
  });

  const uikitProxy = new Proxy({}, {
    get(_target, property) {
      return (...args: any[]) => {
        const uikit = (window as any).UIkit;
        const method = uikit?.[property as keyof typeof uikit];
        if (typeof method === 'function') {
          return method.apply(uikit, args);
        }
      }
    },
  });

  return {
    provide: {
      uikit: uikitProxy,
    },
  };
});





