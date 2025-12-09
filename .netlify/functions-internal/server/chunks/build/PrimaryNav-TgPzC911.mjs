import { _ as _export_sfc, u as useMainStore, j as __nuxt_component_1$1 } from './server.mjs';
import { defineComponent, computed, withCtx, createVNode, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderStyle } from 'vue/server-renderer';
import { p as publicAssetsURL } from '../routes/renderer.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'consola';
import 'vue-router';
import 'lodash-es';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';

publicAssetsURL("/assets/logos/logo-black.svg");
publicAssetsURL("/assets/logos/logo-black-sm.svg");
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PrimaryNav",
  __ssrInlineRender: true,
  setup(__props) {
    const mainStore = useMainStore();
    computed(() => mainStore.site?.name || "Sale Hyundai");
    const phoneSales = computed(() => mainStore.site?.departments?.sales?.phone || "(03) 5144 2133");
    const phoneService = computed(() => mainStore.site?.departments?.service?.phone || "(03) 5144 2133");
    computed(() => phoneSales.value.replace(/[^0-9]/g, ""));
    computed(() => phoneService.value.replace(/[^0-9]/g, ""));
    computed(() => mainStore.site?.showroom_address || "36/38 Foster St, Sale VIC 3850");
    computed(() => mainStore.site?.map_directions || "#");
    computed(() => mainStore.loading);
    computed(
      () => mainStore.site?.service_booking_url || "https://consumer.xtime.net.au/scheduling/?&webKey=ahy20140925h3222v&bx=470928&VARIANT=HYUNDAIAUSTRALIA&WMODE=true&bx1=470928#/"
    );
    computed(() => mainStore.site?.sitelinks?.mainnav || []);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_1$1;
      _push(ssrRenderComponent(_component_ClientOnly, _attrs, {
        fallback: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="nav-placeholder" style="${ssrRenderStyle({ "height": "100px", "background": "#fff" })}" data-v-485393b2${_scopeId}></div>`);
          } else {
            return [
              createVNode("div", {
                class: "nav-placeholder",
                style: { "height": "100px", "background": "#fff" }
              })
            ];
          }
        })
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/menus/PrimaryNav.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const PrimaryNav = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-485393b2"]]), { __name: "PrimaryNav" });

export { PrimaryNav as default };
//# sourceMappingURL=PrimaryNav-TgPzC911.mjs.map
