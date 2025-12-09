import { a as useRoute, b as useRuntimeConfig, c as useHead } from './server.mjs';
import { computed } from 'vue';

const useSiteMeta = (options = {}) => {
  const config = useRuntimeConfig();
  const route = useRoute();
  const siteName = config.public.siteName || "Sale Hyundai";
  const fullTitle = computed(() => {
    if (options.title) {
      return `${options.title} - ${siteName}`;
    }
    return siteName;
  });
  useHead({
    title: fullTitle,
    meta: [
      {
        name: "description",
        content: options.description || ""
      },
      {
        property: "og:title",
        content: fullTitle.value
      },
      {
        property: "og:description",
        content: options.description || ""
      },
      {
        property: "og:site_name",
        content: siteName
      },
      {
        property: "og:type",
        content: options.type || "website"
      },
      {
        property: "og:url",
        content: `${config.public.apiUrl}${route.fullPath}`
      },
      ...options.image ? [
        {
          property: "og:image",
          content: options.image
        }
      ] : [],
      {
        name: "robots",
        content: "index,follow"
      }
    ]
  });
  return {
    fullTitle,
    siteName
  };
};

export { useSiteMeta as u };
//# sourceMappingURL=useSiteMeta-CKVCOIy3.mjs.map
