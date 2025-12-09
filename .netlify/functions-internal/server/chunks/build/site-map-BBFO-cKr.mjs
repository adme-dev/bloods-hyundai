import { defineComponent, computed, mergeProps, defineAsyncComponent, withCtx, createTextVNode, unref, toDisplayString, useSSRContext } from 'vue';
import { _ as _export_sfc, u as useMainStore, d as __nuxt_component_0$1 } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate } from 'vue/server-renderer';
import { u as useSiteMeta } from './useSiteMeta-CKVCOIy3.mjs';
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
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "site-map",
  __ssrInlineRender: true,
  setup(__props) {
    useSiteMeta({
      title: "Site Map",
      description: "Navigate the Sale Hyundai website with our complete site map."
    });
    const mainStore = useMainStore();
    const models = computed(() => mainStore.models || []);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LazyPageSchema = __nuxt_component_0_lazy;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "site-map-page" }, _attrs))} data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_LazyPageSchema, null, null, _parent));
      _push(`<div class="uk-section uk-section-primary uk-light uk-text-center" data-v-46e3bd25><div class="uk-container" data-v-46e3bd25><h1 class="uk-heading-medium" data-v-46e3bd25>Site Map</h1><p class="uk-text-lead" data-v-46e3bd25>Find what you&#39;re looking for</p></div></div><div class="uk-section" data-v-46e3bd25><div class="uk-container" data-v-46e3bd25><div class="uk-grid uk-grid-medium uk-child-width-1-2@s uk-child-width-1-3@m" uk-grid data-v-46e3bd25><div data-v-46e3bd25><div class="uk-card uk-card-default uk-card-body" data-v-46e3bd25><h3 class="uk-card-title" data-v-46e3bd25><span uk-icon="car" class="uk-margin-small-right" data-v-46e3bd25></span> New Vehicles </h3><ul class="uk-list uk-list-divider" data-v-46e3bd25><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/build-and-price" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Build &amp; Price`);
          } else {
            return [
              createTextVNode("Build & Price")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><!--[-->`);
      ssrRenderList(unref(models), (model) => {
        _push(`<li data-v-46e3bd25>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/vehicle/${model.slug}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(model.name)}`);
            } else {
              return [
                createTextVNode(toDisplayString(model.name), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul></div></div><div data-v-46e3bd25><div class="uk-card uk-card-default uk-card-body" data-v-46e3bd25><h3 class="uk-card-title" data-v-46e3bd25><span uk-icon="tag" class="uk-margin-small-right" data-v-46e3bd25></span> Used Vehicles </h3><ul class="uk-list uk-list-divider" data-v-46e3bd25><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/car-sales" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`All Used Cars`);
          } else {
            return [
              createTextVNode("All Used Cars")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/car-sales?condition=new" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`New Cars`);
          } else {
            return [
              createTextVNode("New Cars")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/car-sales?condition=demo" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Demo Cars`);
          } else {
            return [
              createTextVNode("Demo Cars")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/car-sales?condition=used" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Used Cars`);
          } else {
            return [
              createTextVNode("Used Cars")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li></ul></div></div><div data-v-46e3bd25><div class="uk-card uk-card-default uk-card-body" data-v-46e3bd25><h3 class="uk-card-title" data-v-46e3bd25><span uk-icon="bolt" class="uk-margin-small-right" data-v-46e3bd25></span> Special Offers </h3><ul class="uk-list uk-list-divider" data-v-46e3bd25><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/special-offers" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Current Offers`);
          } else {
            return [
              createTextVNode("Current Offers")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li></ul></div></div><div data-v-46e3bd25><div class="uk-card uk-card-default uk-card-body" data-v-46e3bd25><h3 class="uk-card-title" data-v-46e3bd25><span uk-icon="settings" class="uk-margin-small-right" data-v-46e3bd25></span> Services </h3><ul class="uk-list uk-list-divider" data-v-46e3bd25><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/service" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Service Centre`);
          } else {
            return [
              createTextVNode("Service Centre")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/parts" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Parts`);
          } else {
            return [
              createTextVNode("Parts")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/finance" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Finance`);
          } else {
            return [
              createTextVNode("Finance")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/insurance" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Insurance`);
          } else {
            return [
              createTextVNode("Insurance")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li></ul></div></div><div data-v-46e3bd25><div class="uk-card uk-card-default uk-card-body" data-v-46e3bd25><h3 class="uk-card-title" data-v-46e3bd25><span uk-icon="play-circle" class="uk-margin-small-right" data-v-46e3bd25></span> Quick Actions </h3><ul class="uk-list uk-list-divider" data-v-46e3bd25><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/test-drive" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Book Test Drive`);
          } else {
            return [
              createTextVNode("Book Test Drive")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/sell-my-car" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Sell My Car`);
          } else {
            return [
              createTextVNode("Sell My Car")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/service-booking" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Book Service`);
          } else {
            return [
              createTextVNode("Book Service")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li></ul></div></div><div data-v-46e3bd25><div class="uk-card uk-card-default uk-card-body" data-v-46e3bd25><h3 class="uk-card-title" data-v-46e3bd25><span uk-icon="receiver" class="uk-margin-small-right" data-v-46e3bd25></span> Contact </h3><ul class="uk-list uk-list-divider" data-v-46e3bd25><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/contact" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Contact Us`);
          } else {
            return [
              createTextVNode("Contact Us")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/about" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`About Us`);
          } else {
            return [
              createTextVNode("About Us")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/privacy-policy" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Privacy Policy`);
          } else {
            return [
              createTextVNode("Privacy Policy")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li data-v-46e3bd25>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/terms-conditions" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Terms &amp; Conditions`);
          } else {
            return [
              createTextVNode("Terms & Conditions")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li></ul></div></div></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/site-map.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const siteMap = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-46e3bd25"]]);

export { siteMap as default };
//# sourceMappingURL=site-map-BBFO-cKr.mjs.map
