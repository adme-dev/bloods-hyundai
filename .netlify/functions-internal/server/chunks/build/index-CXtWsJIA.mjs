import { defineComponent, computed, ref, mergeProps, defineAsyncComponent, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { u as useSiteMeta } from './useSiteMeta-CKVCOIy3.mjs';
import { _ as _export_sfc, u as useMainStore } from './server.mjs';
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
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';
import 'lodash-es';

const __nuxt_component_0_lazy = defineAsyncComponent(() => import('./PageSchema-G9WhHOpc.mjs').then((c) => c.default || c));
const __nuxt_component_1_lazy = defineAsyncComponent(() => import('./FrontSlider-Deu-rbp5.mjs').then((c) => c.default || c));
const __nuxt_component_2_lazy = defineAsyncComponent(() => import('./FrontSearch-ByTzeIPP.mjs').then((c) => c.default || c));
const __nuxt_component_3_lazy = defineAsyncComponent(() => import('./FrontCarsalesFeatured-DOtnY-97.mjs').then((c) => c.default || c));
const __nuxt_component_4_lazy = defineAsyncComponent(() => import('./PostContent-ViI540rn.mjs').then((c) => c.default || c));
const __nuxt_component_5_lazy = defineAsyncComponent(() => import('./ModelSliderNew-DyPS4c0Y.mjs').then((c) => c.default || c));
const __nuxt_component_6_lazy = defineAsyncComponent(() => import('./DealershipReviews-B_SDXNkr.mjs').then((c) => c.default || c));
const __nuxt_component_7_lazy = defineAsyncComponent(() => import('./GoogleReviews-cXzTGU_F.mjs').then((c) => c.default || c));
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useSiteMeta({
      title: "Home",
      description: "Welcome to Sale Hyundai - Your trusted Hyundai dealer in Sale, Victoria. Browse new and used Hyundai vehicles, special offers, and book a service."
    });
    const mainStore = useMainStore();
    const site = computed(() => mainStore.site);
    const pageContent = ref(null);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_LazyFrontSlider = __nuxt_component_1_lazy;
      const _component_LazyFrontSearch = __nuxt_component_2_lazy;
      const _component_LazyFrontCarsalesFeatured = __nuxt_component_3_lazy;
      const _component_LazyPostContent = __nuxt_component_4_lazy;
      const _component_LazyModelSliderNew = __nuxt_component_5_lazy;
      const _component_LazyDealershipReviews = __nuxt_component_6_lazy;
      const _component_LazyGoogleReviews = __nuxt_component_7_lazy;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "home-page" }, _attrs))} data-v-722e87de>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      if (unref(site)?.promotional) {
        _push(ssrRenderComponent(_component_LazyFrontSlider, {
          slides: unref(site).promotional
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_LazyFrontSearch, null, null, _parent));
      _push(`<section class="uk-section uk-background-secondary uk-light" data-v-722e87de><div class="uk-container" data-v-722e87de><h2 class="uk-text-center uk-h1 uk-margin-medium-bottom" data-v-722e87de><span class="uk-text-bold" data-v-722e87de>Featured</span> Vehicles </h2>`);
      _push(ssrRenderComponent(_component_LazyFrontCarsalesFeatured, null, null, _parent));
      _push(`</div></section>`);
      if (unref(pageContent)) {
        _push(`<section class="uk-section" data-v-722e87de><div class="uk-container" data-v-722e87de>`);
        _push(ssrRenderComponent(_component_LazyPostContent, { content: unref(pageContent) }, null, _parent));
        _push(`</div></section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<section class="uk-section uk-section-muted" data-v-722e87de><div class="uk-container" data-v-722e87de><h2 class="uk-text-center uk-h1 uk-margin-medium-bottom" data-v-722e87de> Explore <span class="uk-text-bold" data-v-722e87de>Hyundai Models</span></h2>`);
      _push(ssrRenderComponent(_component_LazyModelSliderNew, null, null, _parent));
      _push(`</div></section><section class="uk-section" data-v-722e87de>`);
      _push(ssrRenderComponent(_component_LazyDealershipReviews, null, null, _parent));
      _push(`</section><section class="uk-section uk-section-muted" id="google_review" data-v-722e87de><div class="uk-container" data-v-722e87de>`);
      _push(ssrRenderComponent(_component_LazyGoogleReviews, null, null, _parent));
      _push(`</div></section></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-722e87de"]]);

export { index as default };
//# sourceMappingURL=index-CXtWsJIA.mjs.map
