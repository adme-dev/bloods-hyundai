import { defineComponent, computed, useSSRContext } from 'vue';
import { a as useRoute, u as useMainStore, b as useRuntimeConfig, c as useHead } from './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'consola';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'vue/server-renderer';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';
import 'lodash-es';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PageSchema",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const mainStore = useMainStore();
    const config = useRuntimeConfig();
    const siteName = computed(() => mainStore.site?.name || "Sale Hyundai");
    const siteUrl = computed(() => config.public.apiUrl || "");
    const logo = computed(() => mainStore.site?.logo || "");
    const phone = computed(() => mainStore.site?.phone || "");
    const address = computed(() => mainStore.site?.address || "");
    const organizationSchema = computed(() => ({
      "@context": "https://schema.org",
      "@type": "AutoDealer",
      name: siteName.value,
      url: siteUrl.value,
      logo: logo.value,
      telephone: phone.value,
      address: {
        "@type": "PostalAddress",
        streetAddress: address.value,
        addressCountry: "AU"
      },
      openingHoursSpecification: mainStore.site?.trading_hours ? Object.entries(mainStore.site.trading_hours).map(([day, hours]) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: day,
        opens: typeof hours === "string" ? hours.split("-")[0]?.trim() : "",
        closes: typeof hours === "string" ? hours.split("-")[1]?.trim() : ""
      })) : []
    }));
    const breadcrumbSchema = computed(() => {
      const items = [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl.value
        }
      ];
      const pathSegments = route.path.split("/").filter(Boolean);
      let currentPath = siteUrl.value;
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        items.push({
          "@type": "ListItem",
          position: index + 2,
          name: segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          item: currentPath
        });
      });
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items
      };
    });
    useHead({
      script: [
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify(organizationSchema.value)
        },
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify(breadcrumbSchema.value)
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/page-elements/PageSchema.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const PageSchema = Object.assign(_sfc_main, { __name: "PageSchema" });

export { PageSchema as default };
//# sourceMappingURL=PageSchema-G9WhHOpc.mjs.map
