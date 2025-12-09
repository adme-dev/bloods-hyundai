import { defineComponent, defineAsyncComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderSlot } from 'vue/server-renderer';
import { _ as _export_sfc } from './server.mjs';
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

const __nuxt_component_0_lazy = defineAsyncComponent(() => import('./HeaderTicker-DIIKCkxH.mjs').then((c) => c.default || c));
const __nuxt_component_1_lazy = defineAsyncComponent(() => import('./PrimaryNav-TgPzC911.mjs').then((c) => c.default || c));
const __nuxt_component_2_lazy = defineAsyncComponent(() => import('./FooterLinks-BBMus-Uy.mjs').then((c) => c.default || c));
const __nuxt_component_3_lazy = defineAsyncComponent(() => import('./VehicleModels-udRLvdBw.mjs').then((c) => c.default || c));
const __nuxt_component_4_lazy = defineAsyncComponent(() => import('./GlobalSearch-vywqn1bX.mjs').then((c) => c.default || c));
const __nuxt_component_5_lazy = defineAsyncComponent(() => import('./MobileNavNew-D8a1BjWd.mjs').then((c) => c.default || c));
const __nuxt_component_6_lazy = defineAsyncComponent(() => import('./NavModels-CfrzW5LW.mjs').then((c) => c.default || c));
const __nuxt_component_7_lazy = defineAsyncComponent(() => import('./CallQuickLinks-B2iRZsSp.mjs').then((c) => c.default || c));
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "default",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyHeaderTicker = __nuxt_component_0_lazy;
      const _component_LazyPrimaryNav = __nuxt_component_1_lazy;
      const _component_LazyFooterLinks = __nuxt_component_2_lazy;
      const _component_LazyVehicleModels = __nuxt_component_3_lazy;
      const _component_LazyGlobalSearch = __nuxt_component_4_lazy;
      const _component_LazyMobileNavNew = __nuxt_component_5_lazy;
      const _component_LazyNavModels = __nuxt_component_6_lazy;
      const _component_LazyCallQuickLinks = __nuxt_component_7_lazy;
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-58e90abd>`);
      _push(ssrRenderComponent(_component_LazyHeaderTicker, null, null, _parent));
      _push(`<div class="uk-position-relative" data-v-58e90abd><header data-v-58e90abd>`);
      _push(ssrRenderComponent(_component_LazyPrimaryNav, null, null, _parent));
      _push(`</header></div><main class="uk-flex" data-v-58e90abd><div class="uk-width-1-1 main-body" data-v-58e90abd>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div></main><footer data-v-58e90abd>`);
      _push(ssrRenderComponent(_component_LazyFooterLinks, null, null, _parent));
      _push(ssrRenderComponent(_component_LazyVehicleModels, null, null, _parent));
      _push(ssrRenderComponent(_component_LazyGlobalSearch, null, null, _parent));
      _push(ssrRenderComponent(_component_LazyMobileNavNew, null, null, _parent));
      _push(ssrRenderComponent(_component_LazyNavModels, null, null, _parent));
      _push(`</footer>`);
      _push(ssrRenderComponent(_component_LazyCallQuickLinks, null, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _default = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-58e90abd"]]);

export { _default as default };
//# sourceMappingURL=default-CJxKj2JA.mjs.map
