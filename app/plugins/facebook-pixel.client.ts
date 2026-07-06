/**
 * Facebook Pixel Client Plugin
 * Initializes the Facebook Pixel for conversion tracking
 *
 * Standard Events tracked:
 * - PageView: Automatic on route change
 * - Lead: Form submissions
 * - Contact: Contact form submissions
 * - Schedule: Test drive/service bookings
 * - ViewContent: Vehicle detail views
 * - AddToCart: Vehicle enquiry initiated
 * - InitiateCheckout: High-intent actions (test drive booking)
 *
 * Custom Events:
 * - VehicleEnquiry, TestDriveBooking, ServiceBooking, etc.
 */
import { runWhenIdleOrInteraction } from '~/utils/deferThirdParty';

declare global {
  interface Window {
    fbq: FacebookPixel;
    _fbq: FacebookPixel;
  }
}

type FacebookPixel = {
  (action: 'init', pixelId: string, advancedMatching?: AdvancedMatchingParams): void;
  (action: 'track', event: string, params?: Record<string, any>): void;
  (action: 'trackCustom', event: string, params?: Record<string, any>): void;
  callMethod?: (...args: any[]) => void;
  queue: any[];
  push: (...args: any[]) => void;
  loaded: boolean;
  version: string;
};

interface AdvancedMatchingParams {
  em?: string; // Email (hashed)
  ph?: string; // Phone (hashed)
  fn?: string; // First name (hashed)
  ln?: string; // Last name (hashed)
  ct?: string; // City
  st?: string; // State
  zp?: string; // Zip/Postcode
  country?: string;
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const pixelId = config.public.facebookPixelId;

  // Only initialize if pixel ID is configured and we're in production (or explicitly enabled)
  if (!pixelId) {
    console.log('[Facebook Pixel] No pixel ID configured, skipping initialization');
    return {
      provide: {
        fbq: {
          track: () => {},
          trackCustom: () => {},
          init: () => {},
          pageView: () => {},
          setUserData: () => {},
        },
      },
    };
  }

  let pixelScriptRequested = false;
  let initialPageViewQueued = false;

  const ensurePixelQueue = () => {
    if (typeof window.fbq === 'function') return window.fbq;

    const fbq = function (...args: any[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
        return;
      }
      fbq.queue.push(args);
    } as FacebookPixel;

    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;

    return fbq;
  };

  const queueInitialPageView = () => {
    if (initialPageViewQueued) return;
    const fbq = ensurePixelQueue();
    fbq('init', pixelId);
    fbq('track', 'PageView');
    initialPageViewQueued = true;
  };

  const loadPixelScript = () => {
    queueInitialPageView();
    if (pixelScriptRequested) return;
    pixelScriptRequested = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  };

  // Queue pixel commands immediately, but defer the third-party script until
  // after first paint or first user interaction.
  if (import.meta.client) {
    queueInitialPageView();
    runWhenIdleOrInteraction(loadPixelScript, { delay: 60000 });
  }

  // Track page views on route change
  nuxtApp.hook('page:finish', () => {
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  });

  // Provide helper methods
  return {
    provide: {
      fbq: {
        /**
         * Track a standard Facebook event
         */
        track: (event: string, params?: Record<string, any>) => {
          if (window.fbq) {
            window.fbq('track', event, params);
          }
        },

        /**
         * Track a custom Facebook event
         */
        trackCustom: (event: string, params?: Record<string, any>) => {
          if (window.fbq) {
            window.fbq('trackCustom', event, params);
          }
        },

        /**
         * Initialize/reinitialize pixel (useful for advanced matching after form submission)
         */
        init: (advancedMatching?: AdvancedMatchingParams) => {
          if (window.fbq && pixelId) {
            window.fbq('init', pixelId, advancedMatching);
          }
        },

        /**
         * Track page view manually
         */
        pageView: () => {
          if (window.fbq) {
            window.fbq('track', 'PageView');
          }
        },

        /**
         * Set user data for advanced matching
         */
        setUserData: (userData: AdvancedMatchingParams) => {
          if (window.fbq && pixelId) {
            // Reinitialize with advanced matching data
            window.fbq('init', pixelId, userData);
          }
        },
      },
    },
  };
});
