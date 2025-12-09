import { _ as _export_sfc, u as useMainStore, j as __nuxt_component_1$1 } from './server.mjs';
import { defineComponent, computed, mergeProps, withCtx, createVNode, defineAsyncComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
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

const __nuxt_component_1_lazy = defineAsyncComponent(() => import('./MultiSelectSearch-DDPfD_6w.mjs').then((c) => c.default || c));
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "FrontSearch",
  __ssrInlineRender: true,
  setup(__props) {
    const mainStore = useMainStore();
    computed(() => mainStore.site?.name || "Sale Hyundai");
    computed(() => mainStore.site?.showroom_address || "");
    computed(() => mainStore.site?.departments?.sales?.phone || mainStore.site?.phone || "");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_1$1;
      const _component_LazyMultiSelectSearch = __nuxt_component_1_lazy;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "front-search" }, _attrs))} data-v-19580ba4><div class="uk-container uk-container-large s-wp uk-background-secondary uk-light" data-v-19580ba4>`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {
        fallback: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="uk-flex uk-flex-center uk-padding" data-v-19580ba4${_scopeId}><div uk-spinner data-v-19580ba4${_scopeId}></div></div>`);
          } else {
            return [
              createVNode("div", { class: "uk-flex uk-flex-center uk-padding" }, [
                createVNode("div", { "uk-spinner": "" })
              ])
            ];
          }
        })
      }, _parent));
      _push(`</div><div class="uk-margin-medium-top" data-v-19580ba4>`);
      _push(ssrRenderComponent(_component_LazyMultiSelectSearch, null, null, _parent));
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/search/FrontSearch.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const FrontSearch = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-19580ba4"]]), { __name: "FrontSearch" });

export { FrontSearch as default };
//# sourceMappingURL=FrontSearch-ByTzeIPP.mjs.map
