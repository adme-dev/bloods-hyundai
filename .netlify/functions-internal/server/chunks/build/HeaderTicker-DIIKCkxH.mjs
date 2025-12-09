import { _ as _export_sfc, u as useMainStore, d as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, computed, unref, mergeProps, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderAttr, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import { i as isDateInRange } from './date-Bw6Y8X9p.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "HeaderTicker",
  __ssrInlineRender: true,
  setup(__props) {
    const mainStore = useMainStore();
    const activeTicker = computed(() => {
      const tickers = mainStore.site?.ticker || [];
      const active = tickers.find((ticker) => {
        if (!ticker.enabled) return false;
        return isDateInRange(ticker.start_date, ticker.end_date);
      });
      return active || null;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      if (unref(activeTicker)) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: "header-ticker",
          style: { backgroundColor: unref(activeTicker).background_color || "#002c5f" }
        }, _attrs))} data-v-2019208a><div class="uk-container" data-v-2019208a><div class="ticker-content" style="${ssrRenderStyle({ color: unref(activeTicker).text_color || "#ffffff" })}" data-v-2019208a>`);
        if (unref(activeTicker).icon) {
          _push(`<span class="ticker-icon"${ssrRenderAttr("uk-icon", unref(activeTicker).icon)} data-v-2019208a></span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<span class="ticker-text" data-v-2019208a>${unref(activeTicker).message ?? ""}</span>`);
        if (unref(activeTicker).link) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: unref(activeTicker).link,
            class: "ticker-link",
            style: { color: unref(activeTicker).link_color || "#00aad2" }
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(unref(activeTicker).link_text || "Learn More")}`);
              } else {
                return [
                  createTextVNode(toDisplayString(unref(activeTicker).link_text || "Learn More"), 1)
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/page-elements/HeaderTicker.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const HeaderTicker = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-2019208a"]]), { __name: "HeaderTicker" });

export { HeaderTicker as default };
//# sourceMappingURL=HeaderTicker-DIIKCkxH.mjs.map
