/**
 * Composable for capturing and storing UTM parameters
 * UTM parameters are stored in sessionStorage to persist across page navigations
 * within the same session, ensuring attribution is preserved even if the user
 * navigates away from the original landing page.
 */

interface UtmParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

const UTM_STORAGE_KEY = 'sale_utm_params';

export function useUtmParams() {
  const route = useRoute();

  /**
   * Get UTM params from URL query string
   */
  const getUtmFromUrl = (): UtmParams => {
    return {
      utmSource: (route.query.utm_source as string) || undefined,
      utmMedium: (route.query.utm_medium as string) || undefined,
      utmCampaign: (route.query.utm_campaign as string) || undefined,
      utmTerm: (route.query.utm_term as string) || undefined,
      utmContent: (route.query.utm_content as string) || undefined,
    };
  };

  /**
   * Get stored UTM params from sessionStorage
   */
  const getStoredUtm = (): UtmParams | null => {
    if (!import.meta.client) return null;
    try {
      const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  /**
   * Store UTM params in sessionStorage
   */
  const storeUtm = (params: UtmParams): void => {
    if (!import.meta.client) return;
    try {
      // Only store if we have at least one UTM parameter
      if (params.utmSource || params.utmMedium || params.utmCampaign) {
        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(params));
      }
    } catch {
      // sessionStorage not available
    }
  };

  /**
   * Get UTM params - checks URL first, then falls back to stored values
   * This ensures we capture UTM from landing page even if user navigates
   */
  const getUtmParams = (): UtmParams => {
    const urlParams = getUtmFromUrl();

    // If we have UTM params in the URL, store them and return
    if (urlParams.utmSource || urlParams.utmMedium || urlParams.utmCampaign) {
      storeUtm(urlParams);
      return urlParams;
    }

    // Otherwise, return stored params (from original landing)
    return getStoredUtm() || {};
  };

  /**
   * Initialize UTM tracking - call this on app mount or page load
   * to capture UTM params from the landing URL
   */
  const initUtmTracking = (): void => {
    const urlParams = getUtmFromUrl();
    if (urlParams.utmSource || urlParams.utmMedium || urlParams.utmCampaign) {
      storeUtm(urlParams);
    }
  };

  /**
   * Clear stored UTM params (e.g., after successful conversion)
   */
  const clearUtm = (): void => {
    if (!import.meta.client) return;
    try {
      sessionStorage.removeItem(UTM_STORAGE_KEY);
    } catch {
      // sessionStorage not available
    }
  };

  // Auto-initialize on client side
  if (import.meta.client) {
    initUtmTracking();
  }

  return {
    getUtmParams,
    getUtmFromUrl,
    getStoredUtm,
    initUtmTracking,
    clearUtm,
  };
}
