/**
 * Composable for managing site meta tags (replaces MetaMixin)
 * Supports both static values and reactive getters for dynamic content
 * Used across pages for SEO optimization
 * 
 * Uses site config from mainStore for vendor-agnostic implementation
 */
interface SiteMetaOptions {
  title?: string | (() => string);
  description?: string | (() => string);
  image?: string | (() => string | undefined);
  type?: string;
  noIndex?: boolean;
  keywords?: string | (() => string);
}

// Helper to resolve value or getter
const resolveValue = <T>(value: T | (() => T) | undefined): T | undefined => {
  if (typeof value === 'function') {
    return (value as () => T)();
  }
  return value;
};

export const useSiteMeta = (options: SiteMetaOptions = {}) => {
  const config = useRuntimeConfig();
  const route = useRoute();
  const mainStore = useMainStore();
  
  // Use site config from store, fallback to runtime config
  const siteName = computed(() => mainStore.site?.name || config.public.siteName || 'Dealership');
  const siteUrl = computed(() => config.public.siteUrl || '');

  // Resolve title (supports reactive getters)
  const resolvedTitle = computed(() => resolveValue(options.title) || '');
  
  const fullTitle = computed(() => {
    const title = resolvedTitle.value;
    if (title) {
      return `${title} - ${siteName.value}`;
    }
    return siteName.value;
  });

  // Resolve description (supports reactive getters)
  // Default description uses site name dynamically
  const resolvedDescription = computed(() => 
    resolveValue(options.description) || 
    `${siteName.value} - Your trusted dealer. Browse new and used vehicles, special offers, and book a service.`
  );

  // Resolve image (supports reactive getters)
  const resolvedImage = computed(() => resolveValue(options.image));

  // Resolve keywords (supports reactive getters)
  // Default keywords use site name dynamically
  const resolvedKeywords = computed(() => 
    resolveValue(options.keywords) || 
    `${siteName.value}, dealer, new cars, used cars`
  );

  // Canonical URL
  const canonicalUrl = computed(() => `${siteUrl.value}${route.path}`);

  // Use Nuxt SEO's useSeoMeta for optimal meta tag management
  useSeoMeta({
    title: fullTitle,
    description: resolvedDescription,
    keywords: resolvedKeywords,
    
    // Open Graph
    ogTitle: fullTitle,
    ogDescription: resolvedDescription,
    ogSiteName: siteName,
    ogType: options.type || 'website',
    ogUrl: canonicalUrl,
    ogImage: resolvedImage,
    ogLocale: 'en_AU',
    
    // Twitter Card
    twitterCard: 'summary_large_image',
    twitterTitle: fullTitle,
    twitterDescription: resolvedDescription,
    twitterImage: resolvedImage,
    
    // Robots
    robots: options.noIndex ? 'noindex,nofollow' : 'index,follow',
  });

  // Add canonical link
  useHead({
    link: [
      {
        rel: 'canonical',
        href: canonicalUrl,
      },
    ],
  });

  return {
    fullTitle,
    siteName,
    siteUrl,
    canonicalUrl,
    resolvedDescription,
    resolvedImage,
  };
};



