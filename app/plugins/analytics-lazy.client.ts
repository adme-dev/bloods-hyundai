import { runWhenIdleOrInteraction } from '~/utils/deferThirdParty';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const { initialize } = useGtag();
  const gtagOptions = config.public.gtag as any;
  const googleTagManagerId = config.public.gtmId as string | undefined;

  const hasGoogleTag = Boolean(gtagOptions?.id || gtagOptions?.tags?.length);
  let loaded = false;

  const loadGoogleTagManager = () => {
    if (!googleTagManagerId) return;
    if (document.querySelector(`script[data-gtm-id="${googleTagManagerId}"]`)) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': Date.now(),
      event: 'gtm.js',
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(googleTagManagerId)}`;
    script.dataset.gtmId = googleTagManagerId;
    document.head.appendChild(script);
  };

  const loadAnalytics = () => {
    if (loaded) return;
    loaded = true;

    if (hasGoogleTag) {
      initialize();
    }

    loadGoogleTagManager();
  };

  runWhenIdleOrInteraction(loadAnalytics, { delay: 60000 });
});
