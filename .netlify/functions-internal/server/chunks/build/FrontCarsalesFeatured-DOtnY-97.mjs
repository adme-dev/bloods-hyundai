import { _ as _export_sfc, d as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, ref, mergeProps, unref, withCtx, createVNode, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderComponent, ssrRenderAttr, ssrRenderClass, ssrInterpolate } from 'vue/server-renderer';
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
  __name: "FrontCarsalesFeatured",
  __ssrInlineRender: true,
  setup(__props) {
    const loading = ref(true);
    const vehicles = ref([]);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "featured-vehicles" }, _attrs))} data-v-a0a5dd05><h2 class="uk-text-center uk-margin-medium-bottom" data-v-a0a5dd05>Featured Vehicles</h2>`);
      if (unref(loading)) {
        _push(`<div class="uk-text-center uk-padding" data-v-a0a5dd05><div uk-spinner data-v-a0a5dd05></div></div>`);
      } else if (unref(vehicles).length) {
        _push(`<div uk-slider="finite: true" data-v-a0a5dd05><div class="uk-position-relative uk-visible-toggle" tabindex="-1" data-v-a0a5dd05><ul class="uk-slider-items uk-child-width-1-1 uk-child-width-1-2@s uk-child-width-1-3@m uk-child-width-1-4@l uk-grid uk-grid-medium" data-v-a0a5dd05><!--[-->`);
        ssrRenderList(unref(vehicles), (vehicle) => {
          _push(`<li data-v-a0a5dd05><div class="uk-card uk-card-default uk-card-hover" data-v-a0a5dd05><div class="uk-card-media-top uk-position-relative" data-v-a0a5dd05>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/vehicle-for-sale/${vehicle.id}/${vehicle.slug}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<img${ssrRenderAttr("src", vehicle.images?.[0] || vehicle.image)}${ssrRenderAttr("alt", vehicle.title)} class="uk-width-1-1" loading="lazy" data-v-a0a5dd05${_scopeId}>`);
              } else {
                return [
                  createVNode("img", {
                    src: vehicle.images?.[0] || vehicle.image,
                    alt: vehicle.title,
                    class: "uk-width-1-1",
                    loading: "lazy"
                  }, null, 8, ["src", "alt"])
                ];
              }
            }),
            _: 2
          }, _parent));
          if (vehicle.condition) {
            _push(`<span class="${ssrRenderClass([vehicle.condition.toLowerCase(), "condition-badge"])}" data-v-a0a5dd05>${ssrInterpolate(vehicle.condition)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="uk-card-body uk-padding-small" data-v-a0a5dd05><h3 class="uk-card-title uk-margin-small-bottom" data-v-a0a5dd05>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/vehicle-for-sale/${vehicle.id}/${vehicle.slug}`,
            class: "uk-link-reset"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</h3><div class="uk-h4 uk-text-primary uk-margin-remove" data-v-a0a5dd05>${ssrInterpolate(vehicle.price ? `$${vehicle.price.toLocaleString()}` : "POA")}</div><ul class="uk-list uk-text-small uk-text-muted uk-margin-small-top" data-v-a0a5dd05>`);
          if (vehicle.year) {
            _push(`<li data-v-a0a5dd05>${ssrInterpolate(vehicle.year)}</li>`);
          } else {
            _push(`<!---->`);
          }
          if (vehicle.odometer) {
            _push(`<li data-v-a0a5dd05>${ssrInterpolate(vehicle.odometer.toLocaleString())} km</li>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</ul></div></div></li>`);
        });
        _push(`<!--]--></ul><a class="uk-position-center-left uk-position-small uk-hidden-hover" href="#" uk-slidenav-previous uk-slider-item="previous" data-v-a0a5dd05></a><a class="uk-position-center-right uk-position-small uk-hidden-hover" href="#" uk-slidenav-next uk-slider-item="next" data-v-a0a5dd05></a></div><ul class="uk-slider-nav uk-dotnav uk-flex-center uk-margin" data-v-a0a5dd05></ul></div>`);
      } else {
        _push(`<div class="uk-text-center uk-text-muted" data-v-a0a5dd05><p data-v-a0a5dd05>No featured vehicles at this time.</p></div>`);
      }
      _push(`<div class="uk-text-center uk-margin-medium-top" data-v-a0a5dd05>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/car-sales",
        class: "uk-button uk-button-primary"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` View All Vehicles `);
          } else {
            return [
              createTextVNode(" View All Vehicles ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/search/FrontCarsalesFeatured.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const FrontCarsalesFeatured = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-a0a5dd05"]]), { __name: "FrontCarsalesFeatured" });

export { FrontCarsalesFeatured as default };
//# sourceMappingURL=FrontCarsalesFeatured-DOtnY-97.mjs.map
